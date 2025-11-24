import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import WatchParty from '@/models/WatchParty';
import crypto from 'crypto';
import { rateLimiters, checkRateLimit } from '@/lib/rate-limit';
import { validateRequest } from '@/lib/validate';
import { createPartySchema, updatePartySchema } from '@/lib/validations/watch-party';
import { pusherServer } from '@/lib/pusher';

// Generate a unique share code
function generateShareCode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// GET - Fetch all active watch parties or a specific one
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const partyId = searchParams.get('id');
        const shareCode = searchParams.get('code');

        if (partyId) {
            const party = await WatchParty.findById(partyId)
                .populate('host', 'name email')
                .populate('participants', 'name email');
            if (!party) {
                return NextResponse.json({ error: 'Watch party not found' }, { status: 404 });
            }
            return NextResponse.json(party);
        }

        if (shareCode) {
            const party = await WatchParty.findOne({ shareCode })
                .populate('host', 'name email')
                .populate('participants', 'name email');
            if (!party) {
                return NextResponse.json({ error: 'Watch party not found' }, { status: 404 });
            }
            return NextResponse.json(party);
        }

        // Get ALL active parties (public and private)
        // Exclude password field for security
        const parties = await WatchParty.find({ isActive: true })
            .select('-password')
            .populate('host', 'name email')
            .populate('participants', 'name email')
            .sort({ createdAt: -1 });

        return NextResponse.json(parties);
    } catch (error) {
        console.error('Failed to fetch watch parties', error);
        return NextResponse.json({ error: 'Failed to fetch watch parties' }, { status: 500 });
    }
}

// POST - Create a new watch party
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        if (!userId) {
            console.error('Watch Party Creation: No user ID in session');
            return NextResponse.json({ error: 'Unauthorized - Please login' }, { status: 401 });
        }

        // Rate limiting
        const rateLimitResult = await checkRateLimit(
            rateLimiters.createParty,
            session?.user?.email || userId
        );

        if (!rateLimitResult.success) {
            return NextResponse.json(
                {
                    error: 'Too many requests',
                    retryAfter: rateLimitResult.reset ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000) : 300,
                },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': rateLimitResult.limit?.toString() || '5',
                        'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
                    },
                }
            );
        }

        await connectDB();
        const body = await req.json();

        // Validate request body
        const validation = validateRequest(createPartySchema, body);
        if (!validation.success) {
            return validation.error;
        }

        const { movieId, movieTitle, partyName, isPrivate, password } = validation.data;

        console.log('Creating watch party:', { movieId, movieTitle, partyName, isPrivate, userId });

        if (!movieId || !movieTitle || !partyName) {
            console.error('Watch Party Creation: Missing required fields', { movieId, movieTitle, partyName });
            return NextResponse.json({
                error: 'Movie ID, title, and party name are required',
                received: { movieId, movieTitle, partyName }
            }, { status: 400 });
        }

        if (isPrivate && !password) {
            return NextResponse.json({ error: 'Password is required for private parties' }, { status: 400 });
        }

        // Generate unique share code
        let shareCode = generateShareCode();
        let exists = await WatchParty.findOne({ shareCode });
        while (exists) {
            shareCode = generateShareCode();
            exists = await WatchParty.findOne({ shareCode });
        }

        console.log('Generated share code:', shareCode);

        const watchPartyData = {
            host: userId,
            movieId,
            movieTitle,
            partyName,
            isPrivate: isPrivate || false,
            password: isPrivate ? password : undefined,
            shareCode,
            participants: [userId],
            isActive: true,
            currentTime: 0,
            isPlaying: false,
        };

        console.log('Creating watch party with data:', watchPartyData);

        const watchParty = await WatchParty.create(watchPartyData);

        console.log('Watch party created successfully:', watchParty._id);

        const populatedParty = await WatchParty.findById(watchParty._id)
            .populate('host', 'name email')
            .populate('participants', 'name email');
        return NextResponse.json(populatedParty, { status: 201 });
    } catch (error: any) {
        console.error('Failed to create watch party - Full error:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        return NextResponse.json({
            error: 'Failed to create watch party',
            details: error.message,
            type: error.name
        }, { status: 500 });
    }
}

// PUT - Update watch party state (join, leave, sync)
export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limiting
        const rateLimitResult = await checkRateLimit(
            rateLimiters.updateParty,
            session?.user?.email || userId
        );

        if (!rateLimitResult.success) {
            return NextResponse.json(
                {
                    error: 'Too many requests',
                    retryAfter: rateLimitResult.reset ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000) : 60,
                },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': rateLimitResult.limit?.toString() || '20',
                        'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
                    },
                }
            );
        }

        await connectDB();
        const body = await req.json();

        // Validate request body
        const validation = validateRequest(updatePartySchema, body);
        if (!validation.success) {
            return validation.error;
        }

        const { partyId, shareCode, action, currentTime, isPlaying, password } = validation.data;

        let party: any;

        if (shareCode) {
            party = await WatchParty.findOne({ shareCode });
        } else if (partyId) {
            party = await WatchParty.findById(partyId);
        }

        if (!party) {
            return NextResponse.json({ error: 'Watch party not found' }, { status: 404 });
        }

        // Check password for private parties when joining
        if (action === 'join' && party.isPrivate && party.password !== password) {
            return NextResponse.json({ error: 'Incorrect password' }, { status: 403 });
        }

        switch (action) {
            case 'join':
                if (!party.participants.includes(userId)) {
                    party.participants.push(userId);

                    // Trigger update event for participants list
                    await pusherServer.trigger(`private-watch-party-${party._id}`, 'party-update', {
                        type: 'join',
                        userId,
                        participants: party.participants
                    });
                }
                break;

            case 'leave':
                party.participants = party.participants.filter(
                    (id: any) => id.toString() !== userId
                );
                if (party.participants.length === 0) {
                    party.isActive = false;
                }
                break;

            case 'sync':
                if (party.host.toString() === userId) {
                    if (currentTime !== undefined) party.currentTime = currentTime;
                    if (isPlaying !== undefined) party.isPlaying = isPlaying;
                }
                break;

            case 'end':
                if (party.host.toString() === userId) {
                    party.isActive = false;
                }
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        await party.save();
        const updatedParty = await WatchParty.findById(party._id)
            .populate('host', 'name email')
            .populate('participants', 'name email');
        return NextResponse.json(updatedParty);
    } catch (error) {
        console.error('Failed to update watch party', error);
        return NextResponse.json({ error: 'Failed to update watch party' }, { status: 500 });
    }
}

// DELETE - Delete a watch party
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const { searchParams } = new URL(req.url);
        const partyId = searchParams.get('id');

        if (!partyId) {
            return NextResponse.json({ error: 'Party ID required' }, { status: 400 });
        }

        const party: any = await WatchParty.findById(partyId);
        if (!party) {
            return NextResponse.json({ error: 'Watch party not found' }, { status: 404 });
        }

        if (party.host.toString() !== userId) {
            return NextResponse.json({ error: 'Only the host can delete the party' }, { status: 403 });
        }

        await WatchParty.findByIdAndDelete(partyId);
        return NextResponse.json({ message: 'Watch party deleted' });
    } catch (error) {
        console.error('Failed to delete watch party', error);
        return NextResponse.json({ error: 'Failed to delete watch party' }, { status: 500 });
    }
}
