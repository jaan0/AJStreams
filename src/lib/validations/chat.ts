import { z } from 'zod';

// Send message schema
export const sendMessageSchema = z.object({
    channel: z.string().min(1, 'Channel is required'),
    message: z.object({
        text: z.string()
            .min(1, 'Message cannot be empty')
            .max(500, 'Message must be less than 500 characters')
            .trim(),
    }),
});

// Toggle chat schema
export const toggleChatSchema = z.object({
    partyId: z.string().min(1, 'Party ID is required'),
    isDisabled: z.boolean(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ToggleChatInput = z.infer<typeof toggleChatSchema>;
