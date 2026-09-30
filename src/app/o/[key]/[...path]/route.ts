// Jalur pendek untuk endpoint yang sama: /o/{key}/{alias}
// Contoh: /o/MVAL-XXXX/gempa -> /api/info/gempa
import { openHandler, openOptions } from '@/lib/openHandler';

export const OPTIONS = openOptions;
export const GET = openHandler;
export const POST = openHandler;
export const PUT = openHandler;
export const PATCH = openHandler;
export const DELETE = openHandler;
