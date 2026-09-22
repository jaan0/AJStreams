import { NextResponse } from 'next/server';
import { z } from 'zod';

export function validateRequest<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; error: NextResponse } {
    try {
        const validated = schema.parse(data);
        return { success: true, data: validated };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const firstError = error.issues[0];
            return {
                success: false,
                error: NextResponse.json(
                    {
                        error: 'Validation failed',
                        details: {
                            field: firstError.path.join('.'),
                            message: firstError.message,
                        },
                    },
                    { status: 400 }
                ),
            };
        }

        return {
            success: false,
            error: NextResponse.json(
                { error: 'Invalid request data' },
                { status: 400 }
            ),
        };
    }
}
