import { NextRequest } from 'next/server';
import { createApiHandler } from '@/lib/apiHandler';
const handler = createApiHandler('/downloaders/instagram');
export const GET = handler;
