const FEATURE_MAP: Record<string, string> = {
  '/api/ai/gpt': 'ai',
  '/api/ai/chatgpt': 'ai',
  '/api/ai/gemini': 'ai',
  '/api/ai/claude-opus': 'ai',
  '/api/ai/copilot': 'ai',
  '/api/ai/felo': 'ai',
  '/api/ai/apertus': 'ai',
  '/api/ai/grammar': 'ai',
  '/api/ai/image': 'ai',
  '/api/ai/anime-art': 'ai',
  '/api/ai/anime-to-real': 'ai',
  '/api/ai/anime-result': 'ai',
  '/api/ai/chibi-sticker': 'ai',
  '/api/download/youtube': 'download',
  '/api/download/youtube-mp3': 'download',
  '/api/download/tiktok': 'download',
  '/api/download/instagram': 'download',
  '/api/download/facebook': 'download',
  '/api/download/twitter': 'download',
  '/api/download/spotify': 'download',
  '/api/download/pinterest': 'download',
  '/api/download/terabox': 'download',
  '/api/download/safefileku': 'download',
  '/api/info/crypto': 'info',
  '/api/info/gempa': 'info',
  '/api/info/netflix': 'info',
  '/api/info/netflix-trending': 'info',
  '/api/info/spotify-top': 'info',
  '/api/info/cek-ewallet': 'info',
  '/api/tools/currency': 'tools',
  '/api/tools/ip-lookup': 'tools',
  '/api/tools/ssweb': 'tools',
  '/api/tools/domain-recon': 'tools',
  '/api/tools/cek-nomor': 'tools',
  '/api/tools/am-verif-send': 'tools',
  '/api/tools/am-verif-check': 'tools',
  '/api/tempmail/create': 'tempmail',
  '/api/tempmail/inbox': 'tempmail',
};

export function getFeatureCategory(path: string): string | null {
  return FEATURE_MAP[path] || null;
}

export function hasAccess(planFeatureAccess: string, endpointPath: string): boolean {
  if (planFeatureAccess === 'all') return true;

  const category = getFeatureCategory(endpointPath);
  if (!category) return true;

  const allowed: string[] = planFeatureAccess.split(',').map(s => s.trim());
  return allowed.includes(category);
}
