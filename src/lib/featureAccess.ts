const FEATURE_MAP: Record<string, string> = {
  '/ai/gpt': 'ai',
  '/ai/chatgpt': 'ai',
  '/ai/gemini': 'ai',
  '/ai/claude-opus': 'ai',
  '/ai/copilot': 'ai',
  '/ai/felo': 'ai',
  '/ai/apertus': 'ai',
  '/ai/grammar': 'ai',
  '/ai/image': 'ai',
  '/ai/anime-art': 'ai',
  '/ai/anime-to-real': 'ai',
  '/ai/anime-result': 'ai',
  '/ai/chibi-sticker': 'ai',
  '/downloaders/youtube': 'download',
  '/downloaders/youtube-mp3': 'download',
  '/downloaders/tiktok': 'download',
  '/downloaders/instagram': 'download',
  '/downloaders/facebook': 'download',
  '/downloaders/twitter': 'download',
  '/downloaders/spotify': 'download',
  '/downloaders/pinterest': 'download',
  '/downloaders/terabox': 'download',
  '/downloaders/safefileku': 'download',
  '/info/crypto': 'info',
  '/info/gempa': 'info',
  '/info/netflix': 'info',
  '/info/netflix-trending': 'info',
  '/info/spotify-top': 'info',
  '/info/cek-ewallet': 'info',
  '/tools/currency': 'tools',
  '/tools/ip-lookup': 'tools',
  '/tools/ssweb': 'tools',
  '/tools/domain-recon': 'tools',
  '/tools/cek-nomor': 'tools',
  '/tools/am-verif-send': 'tools',
  '/tools/am-verif-check': 'tools',
  '/tempmail/create': 'tempmail',
  '/tempmail/inbox': 'tempmail',
};

export function getFeatureCategory(path: string): string | null {
  const clean = path.replace(/^\/api/, '');
  return FEATURE_MAP[clean] || FEATURE_MAP[path] || null;
}

export function hasAccess(planFeatureAccess: string, endpointPath: string): boolean {
  if (planFeatureAccess === 'all') return true;

  const category = getFeatureCategory(endpointPath);
  if (!category) return true;

  const allowed: string[] = planFeatureAccess.split(',').map(s => s.trim());
  return allowed.includes(category);
}
