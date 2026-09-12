import { NextRequest } from 'next/server';
import { createApiHandler } from '@/lib/apiHandler';
const handler = createApiHandler('/info/gempa');
export const GET = handler;
