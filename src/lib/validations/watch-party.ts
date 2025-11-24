import { z } from 'zod';

// Create watch party schema
export const createPartySchema = z.object({
  movieId: z.string().min(1, 'Movie ID is required'),
  movieTitle: z.string().min(1, 'Movie title is required').max(200, 'Movie title too long'),
  partyName: z.string().min(1, 'Party name is required').max(100, 'Party name too long'),
  isPrivate: z.boolean().optional(),
  password: z.string().min(4, 'Password must be at least 4 characters').max(50, 'Password too long').optional(),
}).refine(
  (data) => {
    // If private, password is required
    if (data.isPrivate && !data.password) {
      return false;
    }
    return true;
  },
  {
    message: 'Password is required for private parties',
    path: ['password'],
  }
);

// Join watch party schema
export const joinPartySchema = z.object({
  partyId: z.string().optional(),
  shareCode: z.string().optional(),
  password: z.string().max(50).optional(),
  action: z.literal('join'),
}).refine(
  (data) => data.partyId || data.shareCode,
  {
    message: 'Either partyId or shareCode is required',
    path: ['partyId'],
  }
);

// Update party schema
export const updatePartySchema = z.object({
  partyId: z.string().optional(),
  shareCode: z.string().optional(),
  action: z.enum(['join', 'leave', 'sync', 'end']),
  currentTime: z.number().min(0, 'Current time must be positive').optional(),
  isPlaying: z.boolean().optional(),
  password: z.string().max(50).optional(),
}).refine(
  (data) => data.partyId || data.shareCode,
  {
    message: 'Either partyId or shareCode is required',
    path: ['partyId'],
  }
);

export type CreatePartyInput = z.infer<typeof createPartySchema>;
export type JoinPartyInput = z.infer<typeof joinPartySchema>;
export type UpdatePartyInput = z.infer<typeof updatePartySchema>;
