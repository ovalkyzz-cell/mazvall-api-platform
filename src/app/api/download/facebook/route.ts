import { NextRequest } from 'next/server';
import { createApiHandler } from '@/lib/apiHandler';
const handler = createApiHandler('/downloaders/facebook');
export const GET = handler;
