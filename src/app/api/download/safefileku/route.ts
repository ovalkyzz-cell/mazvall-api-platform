import { NextRequest } from 'next/server';
import { createApiHandler } from '@/lib/apiHandler';
const handler = createApiHandler('/downloaders/safefileku');
export const GET = handler;
