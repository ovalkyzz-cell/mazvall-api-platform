// GET /open/{key} -> daftar 150 alias endpoint (HTML di browser, JSON untuk client API)
import { openIndex, openOptions } from '@/lib/openHandler';

export const GET = openIndex;
export const OPTIONS = openOptions;
