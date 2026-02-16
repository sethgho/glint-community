/**
 * Seed the Glint Community DB with SVG styles
 * Usage: bun run seed-svg.ts
 */
import { getDb } from './src/db/schema';
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const EMOTIONS = ['happy', 'sad', 'angry', 'surprised', 'worried', 'sleepy', 'excited', 'confused', 'focused', 'neutral'];

const db = getDb();

// Create seed users
const sethId = randomUUID();
const wilsonId = randomUUID();

db.run(`INSERT OR IGNORE INTO users (id, github_id, username, display_name, avatar_url) VALUES (?, ?, ?, ?, ?)`,
  [sethId, 1234567, 'sethgho', 'Seth', 'https://avatars.githubusercontent.com/u/1234567']);
db.run(`INSERT OR IGNORE INTO users (id, github_id, username, display_name, avatar_url) VALUES (?, ?, ?, ?, ?)`,
  [wilsonId, 7654321, 'heidihowilson', 'Wilson', 'https://avatars.githubusercontent.com/u/7654321']);

function seedStyle(userId: string, slug: string, name: string, desc: string, svgDir: string | null, generateFn?: () => Record<string, string>) {
  const styleId = randomUUID();
  const version = '1.0.0';
  const format = 'svg';
  
  db.run(`INSERT INTO styles (id, user_id, name, slug, description, version, download_count) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [styleId, userId, name, slug, desc, version, Math.floor(Math.random() * 50)]);

  const uploadDir = join(process.cwd(), 'uploads', slug, version);
  mkdirSync(uploadDir, { recursive: true });

  for (const emotion of EMOTIONS) {
    let svgContent: string;
    
    if (svgDir && existsSync(join(svgDir, `${emotion}.svg`))) {
      svgContent = readFileSync(join(svgDir, `${emotion}.svg`), 'utf-8');
    } else if (generateFn) {
      const generated = generateFn();
      svgContent = generated[emotion] || generateMinimalEyes(emotion);
    } else {
      svgContent = generateMinimalEyes(emotion);
    }

    const filePath = join(uploadDir, `${emotion}.svg`);
    writeFileSync(filePath, svgContent);
    
    const hash = createHash('sha256').update(svgContent).digest('hex');
    const emotionId = randomUUID();
    
    db.run(`INSERT INTO style_emotions (id, style_id, emotion, file_path, file_hash, file_size) VALUES (?, ?, ?, ?, ?, ?)`,
      [emotionId, styleId, emotion, filePath, hash, Buffer.byteLength(svgContent)]);
  }
  
  console.log(`  ✓ Seeded @${slug} (${format})`);
}

function generateMinimalEyes(emotion: string): string {
  const bg = '#111';
  const eye = '#fff';
  
  const base: Record<string, string> = {
    happy: `<ellipse cx="20" cy="14" rx="7" ry="8" fill="${eye}"/><circle cx="21" cy="15" r="3.5" fill="${bg}"/><circle cx="22" cy="14" r="1.2" fill="${eye}"/>
      <ellipse cx="44" cy="14" rx="7" ry="8" fill="${eye}"/><circle cx="45" cy="15" r="3.5" fill="${bg}"/><circle cx="46" cy="14" r="1.2" fill="${eye}"/>
      <path d="M26 24 Q32 30 38 24" stroke="${eye}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
    sad: `<ellipse cx="20" cy="15" rx="7" ry="7" fill="${eye}"/><circle cx="20" cy="16" r="3.5" fill="${bg}"/><circle cx="21" cy="15" r="1.2" fill="${eye}"/>
      <line x1="13" y1="6" x2="24" y2="8" stroke="${eye}" stroke-width="1.2" stroke-linecap="round"/>
      <ellipse cx="44" cy="15" rx="7" ry="7" fill="${eye}"/><circle cx="44" cy="16" r="3.5" fill="${bg}"/><circle cx="45" cy="15" r="1.2" fill="${eye}"/>
      <line x1="40" y1="8" x2="51" y2="6" stroke="${eye}" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M26 27 Q32 23 38 27" stroke="${eye}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
    angry: `<ellipse cx="20" cy="15" rx="7" ry="5" fill="${eye}"/><circle cx="21" cy="15" r="3" fill="${bg}"/>
      <line x1="12" y1="7" x2="26" y2="10" stroke="${eye}" stroke-width="1.8" stroke-linecap="round"/>
      <ellipse cx="44" cy="15" rx="7" ry="5" fill="${eye}"/><circle cx="43" cy="15" r="3" fill="${bg}"/>
      <line x1="52" y1="7" x2="38" y2="10" stroke="${eye}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M25 26 L32 24 L39 26" stroke="${eye}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
    surprised: `<ellipse cx="20" cy="13" rx="8" ry="9" fill="${eye}"/><circle cx="20" cy="14" r="4" fill="${bg}"/><circle cx="21.5" cy="12.5" r="1.5" fill="${eye}"/>
      <ellipse cx="44" cy="13" rx="8" ry="9" fill="${eye}"/><circle cx="44" cy="14" r="4" fill="${bg}"/><circle cx="45.5" cy="12.5" r="1.5" fill="${eye}"/>
      <ellipse cx="32" cy="26" rx="3" ry="3.5" fill="none" stroke="${eye}" stroke-width="1.5"/>`,
    worried: `<ellipse cx="20" cy="15" rx="7" ry="7" fill="${eye}"/><circle cx="19" cy="16" r="3" fill="${bg}"/>
      <path d="M13 7 Q18 9 25 6" stroke="${eye}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <ellipse cx="44" cy="15" rx="7" ry="7" fill="${eye}"/><circle cx="43" cy="16" r="3" fill="${bg}"/>
      <path d="M39 6 Q46 9 51 7" stroke="${eye}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <path d="M27 26 Q32 24 37 26" stroke="${eye}" stroke-width="1" fill="none" stroke-linecap="round"/>`,
    sleepy: `<path d="M13 15 Q20 10 27 15" stroke="${eye}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M37 15 Q44 10 51 15" stroke="${eye}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <text x="52" y="8" font-size="6" fill="#888" font-family="sans-serif" font-weight="bold">z</text>
      <text x="56" y="5" font-size="4" fill="#666" font-family="sans-serif" font-weight="bold">z</text>`,
    excited: `<ellipse cx="20" cy="13" rx="8" ry="9" fill="${eye}"/><circle cx="21" cy="13" r="4" fill="${bg}"/><circle cx="22.5" cy="11.5" r="1.8" fill="${eye}"/>
      <ellipse cx="44" cy="13" rx="8" ry="9" fill="${eye}"/><circle cx="45" cy="13" r="4" fill="${bg}"/><circle cx="46.5" cy="11.5" r="1.8" fill="${eye}"/>
      <path d="M24 24 Q32 30 40 24" stroke="${eye}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
    confused: `<ellipse cx="20" cy="14" rx="7" ry="8" fill="${eye}"/><circle cx="19" cy="15" r="3.5" fill="${bg}"/>
      <ellipse cx="44" cy="16" rx="6" ry="6" fill="${eye}"/><circle cx="44" cy="17" r="3" fill="${bg}"/>
      <path d="M28 25 Q32 27 36 25" stroke="${eye}" stroke-width="1" fill="none" stroke-linecap="round"/>
      <text x="50" y="8" font-size="7" fill="#888" font-family="sans-serif">?</text>`,
    focused: `<ellipse cx="20" cy="15" rx="7" ry="6" fill="${eye}"/><circle cx="21" cy="15" r="3.5" fill="${bg}"/><circle cx="22" cy="14" r="1" fill="${eye}"/>
      <ellipse cx="44" cy="15" rx="7" ry="6" fill="${eye}"/><circle cx="45" cy="15" r="3.5" fill="${bg}"/><circle cx="46" cy="14" r="1" fill="${eye}"/>
      <line x1="26" y1="25" x2="38" y2="25" stroke="${eye}" stroke-width="1" stroke-linecap="round"/>`,
    neutral: `<ellipse cx="20" cy="14" rx="7" ry="8" fill="${eye}"/><circle cx="20" cy="15" r="3.5" fill="${bg}"/><circle cx="21" cy="14" r="1.2" fill="${eye}"/>
      <ellipse cx="44" cy="14" rx="7" ry="8" fill="${eye}"/><circle cx="44" cy="15" r="3.5" fill="${bg}"/><circle cx="45" cy="14" r="1.2" fill="${eye}"/>
      <line x1="27" y1="25" x2="37" y2="25" stroke="${eye}" stroke-width="1.2" stroke-linecap="round"/>`,
  };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 32" width="64" height="32">
  <rect width="64" height="32" fill="${bg}"/>
  ${base[emotion] || base.neutral}
</svg>`;
}

console.log('Seeding Glint Community with SVG styles...\n');

// Kawaii style (from /home/loial/clawd/glint/assets/kawaii/)
const kawaiiDir = process.env.KAWAII_DIR || '/tmp/kawaii-assets';
if (existsSync(kawaiiDir)) {
  seedStyle(wilsonId, 'kawaii', 'Kawaii', 'Cute anime-inspired eyes with colored irises, sparkles, and blush marks', kawaiiDir);
} else {
  console.log('  ⚠ Kawaii assets not found at', kawaiiDir);
}

// Minimal style (generated inline)
seedStyle(sethId, 'minimal', 'Minimal', 'Clean, simple eyes — the classic glint look', null);

console.log('\n✅ Done! SVG styles seeded.');
