'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle } from 'react-feather';
import { cn } from '@/lib/utils';

interface Request {
    _id: string;
    movieTitle: string;
    releaseYear?: number;
    status: 'pending' | 'fulfilled' | 'rejected';
    userName: string;
    createdAt: string;
}

export default function RequestsTab() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/movie-requests');
            const data = await res.json();
            setRequests(data);
        } catch (error) {
            console.error('Failed to fetch requests', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'fulfilled':
                return 'text-green-400 bg-green-400/10';
            case 'rejected':
                return 'text-red-400 bg-red-400/10';
            default:
                return 'text-yellow-400 bg-yellow-400/10';
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold text-white mb-6">Movie Requests</h2>

            <div className="space-y-4">
                {requests.map((request) => (
                    <div
                        key={request._id}
                        className="bg-zinc-900 rounded-lg p-4 flex items-center justify-between border border-white/5"
                    >
                        <div>
                            <h3 className="font-bold text-white text-lg">{request.movieTitle}</h3>
                            <div className="flex items-center gap-4 text-sm text-zinc-400 mt-1">
                                <span>Requested by {request.userName}</span>
                                {request.releaseYear && <span>• {request.releaseYear}</span>}
                                <span>• {new Date(request.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className={cn("px-3 py-1 rounded-full text-xs font-medium capitalize flex items-center gap-2", getStatusColor(request.status))}>
                            {request.status === 'pending' && <Clock size={14} />}
                            {request.status === 'fulfilled' && <CheckCircle size={14} />}
                            {request.status === 'rejected' && <XCircle size={14} />}
                            {request.status}
                        </div>
                    </div>
                ))}

                {requests.length === 0 && !isLoading && (
                    <div className="text-center py-12 text-zinc-500">
                        No requests found.
                    </div>
                )}
            </div>
        </div>
    );
}
