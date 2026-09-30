#!/usr/bin/env node
// Bangun peta alias pendek untuk jalur tanpa key (/o/{key}/{alias}).
// Jalankan: node scripts/gen-open-aliases.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const API_DIR = path.join(ROOT, 'src', 'app', 'api');
const OUT = path.join(ROOT, 'src', 'lib', 'openAliases.ts');

// Wajib sama dengan OPEN_NAMESPACES di src/lib/openAccess.ts
const ALLOWED_NS = ['ai', 'download', 'image', 'info', 'mimo', 'r', 'random', 's', 'stalk', 'sticker', 'tempmail', 'tools'];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else if (/^route\.(ts|tsx|js)$/.test(entry)) out.push(full);
  }
  return out;
}

const routes = walk(API_DIR)
  .map(full => ({
    full,
    rel: path.relative(path.join(ROOT, 'src', 'app'), full).replace(/\\/g, '/')
      .replace(/\/route\.(ts|tsx|js)$/, ''),
  }))
  .map(r => ({ ...r, rel: r.rel.startsWith('/') ? r.rel : `/${r.rel}` }))
  .filter(r => ALLOWED_NS.includes(r.rel.split('/')[2]))
  .map(r => ({ route: r.rel, file: r.full }));

const lastCount = new Map();
for (const { route } of routes) {
  const last = route.split('/').pop();
  lastCount.set(last, (lastCount.get(last) || 0) + 1);
}

const aliases = new Map();
const methods = new Map();
const conflicts = [];
for (const { route, file } of routes) {
  const parts = route.split('/');
  const last = parts.pop();
  const ns = parts.pop();
  const alias = lastCount.get(last) === 1 ? last : `${ns}-${last}`;
  if (aliases.has(alias)) {
    conflicts.push(`${alias} -> ${route} & ${aliases.get(alias)}`);
    continue;
  }
  aliases.set(alias, route);

  const source = fs.readFileSync(file, 'utf8');
  const found = new Set();
  for (const m of source.matchAll(/export\s+(?:async\s+)?(?:function|const)\s+(GET|POST|PUT|PATCH|DELETE)/g)) {
    found.add(m[1]);
  }
  methods.set(alias, [...found].sort());
}

if (conflicts.length) {
  console.error('Alias bentrok:\n' + conflicts.join('\n'));
  process.exit(1);
}

const sorted = [...aliases.entries()].sort(([a], [b]) => a.localeCompare(b));

const body = sorted
  .map(([alias, route]) => `  '${alias}': '${route}',`)
  .join('\n');

const file = `// DIBUAT OTOMATIS oleh scripts/gen-open-aliases.mjs — jangan edit manual.
// Peta alias pendek endpoint publik: /o/{key}/{alias} -> /api/...
export const OPEN_ALIASES: Record<string, string> = {
${body}
};

export const OPEN_ALIASES_LOWER: Record<string, string> = {
${sorted.map(([alias, route]) => `  '${alias.toLowerCase()}': '${route}',`).join('\n')}
};

export const OPEN_METHODS: Record<string, string[]> = {
${sorted.map(([alias]) => `  '${alias}': [${(methods.get(alias) || []).map(m => `'${m}'`).join(', ')}],`).join('\n')}
};

export const OPEN_ALIAS_COUNT = ${sorted.length};
`;

fs.writeFileSync(OUT, file);
console.log(`OK: ${sorted.length} alias ditulis ke ${path.relative(ROOT, OUT)}`);
