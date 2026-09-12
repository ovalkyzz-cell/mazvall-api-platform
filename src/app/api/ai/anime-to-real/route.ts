import { NextRequest } from 'next/server';
import { createApiHandler } from '@/lib/apiHandler';
const handler = createApiHandler('/ai/anime-to-real');
export const GET = handler;
