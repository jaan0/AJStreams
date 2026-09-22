import { z } from 'zod';

// Video sync schema
export const videoSyncSchema = z.object({
    partyId: z.string().min(1, 'Party ID is required'),
    action: z.enum(['play', 'pause', 'seek']),
    currentTime: z.number().min(0, 'Current time must be positive'),
    isPlaying: z.boolean(),
});

// Party end schema
export const partyEndSchema = z.object({
    partyId: z.string().min(1, 'Party ID is required'),
});

export type VideoSyncInput = z.infer<typeof videoSyncSchema>;
export type PartyEndInput = z.infer<typeof partyEndSchema>;
