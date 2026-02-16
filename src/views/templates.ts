/**
 * HTML templates for the web gallery (SSR, no framework)
 */

export function layout(title: string, body: string, meta?: { description?: string; url?: string; image?: string }, user?: any): string {
  const desc = meta?.description || 'Expressive SVG eye styles for any display — Tidbyt, TRMNL, desktop widgets, and more.';
  const url = meta?.url || 'https://glint.sethgholson.com';
  const ogImage = meta?.image || 'https://glint.sethgholson.com/img/og-image.png';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(title)}</title>
  <meta name="description" content="${escHtml(desc)}">

  <!-- OpenGraph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escHtml(title)}">
  <meta property="og:description" content="${escHtml(desc)}">
  <meta property="og:url" content="${escHtml(url)}">
  <meta property="og:image" content="${escHtml(ogImage)}">
  <meta property="og:site_name" content="Glint Community">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escHtml(title)}">
  <meta name="twitter:description" content="${escHtml(desc)}">
  <meta name="twitter:image" content="${escHtml(ogImage)}">

  <!-- Favicons -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="32x32" href="/img/favicon-32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/img/favicon-16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/img/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/img/icon-192.png">

  <link rel="stylesheet" href="/css/style.css?v=${Date.now()}">
</head>
<body>
  <nav class="nav">
    <div class="nav-inner">
      <a href="/" class="nav-brand">${logoSvg('nav-logo')} <strong>Glint</strong> <span class="nav-hide-mobile">Community</span></a>
      <div class="nav-links">
        <a href="/" class="nav-hide-mobile">Gallery</a>
        <a href="/contribute" class="nav-hide-mobile">Contribute</a>
        <a href="https://github.com/sethgho/glint" target="_blank" title="GitHub" class="nav-icon-link"><svg class="nav-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg></a>
        ${user ? `
          <a href="/dashboard">Dashboard</a>
          <a href="/api/auth/logout" class="nav-user">
            ${user.avatar_url ? `<img src="${escHtml(user.avatar_url)}" class="nav-avatar" alt="${escHtml(user.username)}">` : ''}
            <span>${escHtml(user.username)}</span>
          </a>
        ` : `
          <a href="/api/auth/login" class="btn btn-sm">Sign in</a>
        `}
      </div>
    </div>
  </nav>
  <main>${body}</main>
  <footer class="footer">
    <div class="container">
      <p>Glint — expressive eyes for any display</p>
    </div>
  </footer>
</body>
</html>`;
}

export function homePage(styles: any[], total: number, page: number, search: string): string {
  const hasStyles = styles.length > 0;
  
  return `
    <div class="hero">
      <div class="container">
        ${heroLogoSvg()}
        <p id="tilt-hint" style="display:none;font-size:0.8rem;color:var(--text-muted);margin-bottom:0.5rem;">Tap the eyes to enable tilt tracking 👆</p>
        <h1>Expressive eyes for any display.</h1>
        <p>SVG emotion styles that scale from 64×32 to 4K. Pick a style, install it in one command.</p>
        <form class="search-form" action="/" method="get">
          <input type="text" name="search" placeholder="Search styles..." value="${escHtml(search)}" class="search-input">
          <button type="submit" class="btn">Search</button>
        </form>
      </div>
    </div>
    <div class="container">
      ${!hasStyles ? `
        <div class="empty-state">
          <p class="empty-icon">🎨</p>
          <h2>No styles yet</h2>
          <p>Be the first to publish a style!</p>
          <a href="/contribute" class="btn btn-primary">Learn How</a>
        </div>
      ` : `
        <div class="stats">
          <span>${total} style${total !== 1 ? 's' : ''} available</span>
        </div>
        <div class="grid">
          ${styles.map(s => styleCard(s)).join('')}
        </div>
        ${total > 24 ? pagination(page, Math.ceil(total / 24), search) : ''}
      `}
    </div>`;
}

export function styleCard(style: any): string {
  const previewUrl = `/api/styles/${escHtml(style.author)}/${escHtml(style.slug)}/emotions/happy?version=${escHtml(style.version)}`;
  const animatedBadge = style.animated ? '<span class="badge badge-animated">✨ Animated</span>' : '';

  return `
    <a href="/styles/${escHtml(style.author)}/${escHtml(style.slug)}" class="card">
      <div class="card-preview">
        ${previewUrl ? `<img src="${previewUrl}" alt="${escHtml(style.name)} preview" loading="lazy">` : '<div class="card-placeholder">👀</div>'}
      </div>
      <div class="card-body">
        <h3 class="card-title">@${escHtml(style.author)}/${escHtml(style.slug)}</h3>
        ${animatedBadge ? `<div class="card-tags">${animatedBadge}</div>` : ''}
        <p class="card-desc">${escHtml(style.description || '')}</p>
        <div class="card-meta">
          <span>v${escHtml(style.version)}</span>
          <span>⬇ ${style.download_count || 0}</span>
        </div>
      </div>
    </a>`;
}

export function stylePage(style: any, versions: any[]): string {
  const emotions = style.emotions || [];
  const animatedBadge = style.animated ? '<span class="badge badge-animated">✨ Animated</span>' : '';
  
  return `
    <div class="container style-detail">
      <div class="breadcrumb">
        <a href="/">Gallery</a> / <strong>@${escHtml(style.author)}/${escHtml(style.slug)}</strong>
      </div>
      
      <div class="style-header">
        <div>
          <h1>@${escHtml(style.author)}/${escHtml(style.slug)}</h1>
          <p class="style-desc">${escHtml(style.description || '')}</p>
          <div class="style-meta">
            <span class="badge">v${escHtml(style.version)}</span>
            ${animatedBadge}
            <span>⬇ ${style.download_count || 0} downloads</span>
            <span>Published ${escHtml((style.published_at || '').split(/[T ]/)[0])}</span>
          </div>
        </div>
        ${style.author_avatar ? `<img src="${escHtml(style.author_avatar)}" class="author-avatar" alt="${escHtml(style.author)}">` : ''}
      </div>

      <div class="install-box">
        <h3>Install</h3>
        <code class="install-cmd">glint style install @${escHtml(style.author)}/${escHtml(style.slug)}</code>
        <button onclick="navigator.clipboard.writeText('glint style install @${escHtml(style.author)}/${escHtml(style.slug)}')" class="btn btn-sm">Copy</button>
      </div>

      <h2>Emotions</h2>
      <div class="emotion-grid">
        ${sortEmotions(emotions).map((e: any) => {
          const imgUrl = `/api/styles/${escHtml(style.author)}/${escHtml(style.slug)}/emotions/${escHtml(e.emotion)}?version=${escHtml(style.version)}`;
          return `
            <div class="emotion-card">
              <img src="${imgUrl}" alt="${escHtml(e.emotion)}" class="emotion-img">
              <code class="emotion-label">${escHtml(e.emotion)}</code>
            </div>
          `;
        }).join('')}
      </div>

      ${style.readme ? `<div class="readme"><h2>README</h2><pre>${escHtml(style.readme)}</pre></div>` : ''}

      ${versions.length > 1 ? `
        <h2>Versions</h2>
        <table class="versions-table">
          <thead><tr><th>Version</th><th>Published</th><th>Downloads</th><th>Status</th></tr></thead>
          <tbody>
            ${versions.map((v: any) => `
              <tr>
                <td>${escHtml(v.version)}</td>
                <td>${escHtml(v.published_at?.split('T')[0] || '')}</td>
                <td>${v.download_count}</td>
                <td>${v.yanked_at ? '<span class="badge badge-warn">Yanked</span>' : '<span class="badge badge-ok">Active</span>'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}

      <div class="report-section">
        <a href="#" class="report-link" onclick="document.getElementById('report-modal').showModal();return false">🚩 Report this style</a>
        <dialog id="report-modal" class="report-modal">
          <form method="POST" action="/styles/${escHtml(style.author)}/${escHtml(style.slug)}/report" class="report-form">
            <h3>Report @${escHtml(style.author)}/${escHtml(style.slug)}</h3>
            <label>Reason</label>
            <select name="reason" required>
              <option value="">Select a reason…</option>
              <option value="offensive">Offensive content</option>
              <option value="copyright">Copyright violation</option>
              <option value="spam">Spam</option>
              <option value="other">Other</option>
            </select>
            <label>Details <span style="color:var(--text-muted);font-weight:normal">(optional)</span></label>
            <textarea name="details" placeholder="Tell us more…" rows="3"></textarea>
            <div class="report-actions">
              <button type="button" class="btn btn-sm" onclick="document.getElementById('report-modal').close()">Cancel</button>
              <button type="submit" class="btn btn-sm btn-danger">Submit Report</button>
            </div>
          </form>
        </dialog>
      </div>
    </div>`;
}

export function contributePage(): string {
  return `
    <div class="container contribute">
      <h1>Create & Share Glint Styles</h1>
      <p>Glint styles are SVG emotion packs — 10 expressive eye designs that scale to any display. Here's how to create and publish your own.</p>

      <h2>1. Set Up</h2>
      <pre><code># Install glint CLI
bun install -g glint

# Authenticate with GitHub
glint auth login</code></pre>

      <h2>2. Create a Style</h2>
      <pre><code># Generate using AI (recommended)
glint generate my-cool-eyes --aesthetic "cyberpunk neon glow"

# Or scaffold manually
glint style init my-cool-eyes

# This creates:
# ~/.config/glint/styles/my-cool-eyes/
#   glint-style.json    (manifest)
#   neutral.svg, happy.svg, sad.svg, angry.svg,
#   surprised.svg, worried.svg, sleepy.svg,
#   excited.svg, confused.svg, focused.svg</code></pre>

      <h2>3. Design Your Emotions</h2>
      <p>Each emotion is an <strong>SVG file</strong> with a <code>viewBox</code> attribute (e.g., <code>viewBox="0 0 64 32"</code>). Use any tool:</p>
      <ul>
        <li><strong>AI generation:</strong> <code>glint generate my-style --aesthetic "watercolor soft pastels"</code></li>
        <li><strong>Vector editors:</strong> Figma, Illustrator, Inkscape</li>
        <li><strong>Hand-coded:</strong> SVGs are just XML — keep them simple for best results at small sizes</li>
      </ul>
      <p>Required emotions: neutral, happy, sad, angry, surprised, worried, sleepy, excited, confused, focused.</p>

      <h2>4. Validate</h2>
      <pre><code># Check your style meets the spec
glint validate my-cool-eyes

# Preview on your display
glint show happy --style my-cool-eyes</code></pre>

      <h2>5. Publish</h2>
      <pre><code># Upload to the community gallery
glint style publish my-cool-eyes</code></pre>
      <p>Your style will be available at <code>@your-username/my-cool-eyes</code> and installable by anyone.</p>

      <h2>Style Package Spec (glint-style.json)</h2>
      <pre><code>{
  "specVersion": "1.0",
  "name": "my-cool-eyes",
  "version": "1.0.0",
  "description": "Cyberpunk robot eyes with neon glow",
  "emotions": [
    "neutral", "happy", "sad", "angry", "surprised",
    "worried", "sleepy", "excited", "confused", "focused"
  ],
  "files": {},
  "tags": ["cyberpunk", "robot", "neon"],
  "license": "MIT"
}</code></pre>

      <h2>SVG Requirements</h2>
      <ul>
        <li>Must include a <code>viewBox</code> attribute</li>
        <li>2:1 aspect ratio recommended (e.g., <code>viewBox="0 0 64 32"</code>)</li>
        <li>Max 100KB per file (typical SVGs are 1-2KB)</li>
        <li>Simpler = better — clean geometric paths render best at small sizes</li>
      </ul>

      <h2>Rules</h2>
      <ul>
        <li>All 10 required emotions must be present as SVG files</li>
        <li>Published versions are immutable — bump version to update</li>
        <li>You can yank (soft-delete) a version, but not overwrite it</li>
        <li>Be kind. No offensive content.</li>
      </ul>

      <h2>Agent / Automation Auth</h2>
      <p>For CI/CD or AI agents, use API tokens instead of the browser flow:</p>
      <pre><code># Create a machine token
glint auth token create --name "my-ci"

# Use it in scripts
GLINT_TOKEN=glint_xxx glint style publish my-style</code></pre>
    </div>`;
}

export function dashboardPage(user: any, styles: any[]): string {
  return `
    <div class="container" style="padding-top:2rem;">
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:2rem;">
        ${user.avatar_url ? `<img src="${escHtml(user.avatar_url)}" style="width:64px;height:64px;border-radius:50%;" alt="">` : ''}
        <div>
          <h1 style="margin:0;">Dashboard</h1>
          <p style="margin:0;color:var(--text-muted);">@${escHtml(user.username)}</p>
        </div>
      </div>

      <div style="display:flex;gap:1rem;margin-bottom:2rem;">
        <a href="/dashboard" class="btn btn-primary">My Styles</a>
        <a href="/dashboard/tokens" class="btn">API Tokens</a>
      </div>

      <h2>Your Published Styles</h2>
      ${styles.length === 0 ? `
        <div class="empty-state">
          <p class="empty-icon">📦</p>
          <h3>No styles published yet</h3>
          <p>Use the CLI to publish your first style!</p>
          <a href="/contribute" class="btn btn-primary">Learn How</a>
        </div>
      ` : `
        <div class="grid">
          ${styles.map((s: any) => styleCard(s)).join('')}
        </div>
      `}
    </div>`;
}

export function tokensPage(user: any, tokens: any[], newToken?: string): string {
  return `
    <div class="container" style="padding-top:2rem;">
      <h1>API Tokens</h1>
      <p style="color:var(--text-muted);">Use API tokens to authenticate the Glint CLI or automation scripts.</p>

      <div style="display:flex;gap:1rem;margin-bottom:2rem;">
        <a href="/dashboard" class="btn">My Styles</a>
        <a href="/dashboard/tokens" class="btn btn-primary">API Tokens</a>
      </div>

      ${newToken ? `
        <div style="background:var(--surface);border:1px solid var(--accent);border-radius:8px;padding:1rem;margin-bottom:1.5rem;">
          <strong>🔑 New token created!</strong> Copy it now — it won't be shown again.
          <div style="margin-top:0.5rem;">
            <code style="word-break:break-all;font-size:0.85rem;">${escHtml(newToken)}</code>
            <button onclick="navigator.clipboard.writeText('${escHtml(newToken)}')" class="btn btn-sm" style="margin-left:0.5rem;">Copy</button>
          </div>
        </div>
      ` : ''}

      <h2>Create Token</h2>
      <form method="POST" action="/dashboard/tokens" style="display:flex;gap:0.5rem;margin-bottom:2rem;">
        <input type="text" name="name" placeholder="Token name (e.g. my-laptop)" class="search-input" style="max-width:300px;" required>
        <button type="submit" class="btn btn-primary">Create</button>
      </form>

      <h2>Active Tokens</h2>
      ${tokens.length === 0 ? `
        <p style="color:var(--text-muted);">No tokens yet.</p>
      ` : `
        <table class="versions-table">
          <thead><tr><th>Name</th><th>Created</th><th>Last Used</th><th></th></tr></thead>
          <tbody>
            ${tokens.map((t: any) => `
              <tr>
                <td>${escHtml(t.name)}</td>
                <td>${escHtml(t.created_at?.split('T')[0] || '')}</td>
                <td>${t.last_used_at ? escHtml(t.last_used_at.split('T')[0]) : 'Never'}</td>
                <td>
                  <form method="POST" action="/dashboard/tokens/${escHtml(t.id)}/revoke" style="display:inline;" onsubmit="return confirm('Revoke this token?')">
                    <button type="submit" class="btn btn-sm" style="color:var(--danger,#ef4444);">Revoke</button>
                  </form>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}
    </div>`;
}

function pagination(page: number, totalPages: number, search: string): string {
  const params = search ? `&search=${encodeURIComponent(search)}` : '';
  let html = '<div class="pagination">';
  if (page > 1) html += `<a href="/?page=${page - 1}${params}" class="btn">← Previous</a>`;
  html += `<span>Page ${page} of ${totalPages}</span>`;
  if (page < totalPages) html += `<a href="/?page=${page + 1}${params}" class="btn">Next →</a>`;
  html += '</div>';
  return html;
}

function heroLogoSvg(): string {
  // Eye outer shapes only (no pupil sub-paths). Pupils are separate <g> elements for animation.
  // Pupil paths converted to absolute coords: left center ~(1677,1325), right center ~(3859,1312)
  return `<svg id="hero-logo" class="hero-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 534 275">
  <defs>
    <linearGradient id="sparkle-grad-hero" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fde68a"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#fbbf24"/>
    </linearGradient>
    <!-- Clip pupils to eye outlines -->
    <clipPath id="left-eye-clip">
      <path d="M735 2126 c-319 -60 -584 -289 -698 -603 l-32 -88 0 -360 c0 -354 0 -361 24 -430 105 -309 352 -538 662 -614 84 -21 104 -22 670 -19 l584 3 69 33 c94 44 204 155 249 249 l32 68 0 530 c0 528 0 530 -23 605 -48 153 -121 268 -244 386 -110 106 -210 167 -365 221 l-78 28 -390 2 c-286 1 -409 -2 -460 -11z" transform="translate(0,275) scale(0.1,-0.1)"/>
    </clipPath>
    <clipPath id="right-eye-clip">
      <path d="M3761 2129 c-281 -55 -553 -282 -659 -549 -57 -144 -57 -144 -57 -690 0 -505 0 -505 23 -562 50 -124 166 -240 290 -290 l57 -23 595 0 c550 0 600 1 665 19 302 81 541 312 637 616 22 73 23 86 23 430 0 346 -1 357 -23 425 -51 152 -105 240 -221 358 -90 93 -163 145 -278 199 -150 70 -213 78 -638 77 -203 -1 -390 -5 -414 -10z" transform="translate(0,275) scale(0.1,-0.1)"/>
    </clipPath>
  </defs>
  <g transform="translate(0,275) scale(0.1,-0.1)">
    <!-- Eye outlines only (no pupil holes) -->
    <g class="glint-eyes" fill="currentColor">
      <path d="M735 2126 c-319 -60 -584 -289 -698 -603 l-32 -88 0 -360 c0 -354 0 -361 24 -430 105 -309 352 -538 662 -614 84 -21 104 -22 670 -19 l584 3 69 33 c94 44 204 155 249 249 l32 68 0 530 c0 528 0 530 -23 605 -48 153 -121 268 -244 386 -110 106 -210 167 -365 221 l-78 28 -390 2 c-286 1 -409 -2 -460 -11z"/>
      <path d="M3761 2129 c-281 -55 -553 -282 -659 -549 -57 -144 -57 -144 -57 -690 0 -505 0 -505 23 -562 50 -124 166 -240 290 -290 l57 -23 595 0 c550 0 600 1 665 19 302 81 541 312 637 616 22 73 23 86 23 430 0 346 -1 357 -23 425 -51 152 -105 240 -221 358 -90 93 -163 145 -278 199 -150 70 -213 78 -638 77 -203 -1 -390 -5 -414 -10z"/>
    </g>
    <!-- Sparkle -->
    <path class="glint-sparkle" fill="url(#sparkle-grad-hero)" d="M2651 2698 c-6 -29 -22 -116 -36 -193 -29 -166 -46 -219 -69 -223 -10 -2 -40 6 -68 18 -27 12 -53 19 -56 15 -3 -3 4 -26 16 -50 43 -88 33 -96 -164 -145 -141 -35 -154 -39 -154 -50 0 -6 10 -12 23 -14 217 -46 317 -80 317 -109 0 -8 -11 -40 -25 -71 -14 -31 -25 -59 -25 -61 0 -2 21 5 47 16 26 11 58 19 72 17 35 -4 51 -54 92 -298 43 -256 51 -266 83 -93 40 220 67 347 81 373 16 31 26 31 109 -4 21 -9 40 -16 41 -16 2 0 -10 30 -26 68 l-29 67 21 18 c23 19 178 69 272 87 36 7 57 16 54 23 -2 7 -58 26 -125 43 -145 37 -212 61 -218 79 -3 7 2 27 10 44 9 17 21 42 26 56 l9 25 -52 -20 c-29 -11 -60 -20 -70 -20 -27 0 -44 51 -83 253 -19 100 -37 190 -40 200 -10 31 -22 18 -33 -35z"/>
  </g>
  <!-- Animated pupils clipped to eye shapes -->
  <g clip-path="url(#left-eye-clip)">
    <g id="pupil-left">
      <circle cx="168" cy="142" r="42" fill="var(--bg, #0a0a0b)"/>
    </g>
  </g>
  <g clip-path="url(#right-eye-clip)">
    <g id="pupil-right">
      <circle cx="386" cy="142" r="42" fill="var(--bg, #0a0a0b)"/>
    </g>
  </g>
</svg>
<script>
(function() {
  var svg = document.getElementById('hero-logo');
  var pL = document.getElementById('pupil-left');
  var pR = document.getElementById('pupil-right');
  if (!svg || !pL || !pR) return;

  var maxDrift = 10;
  var cur = { x: 0, y: 0 };
  var tgt = { x: 0, y: 0 };
  var raf = 0;

  function animate() {
    cur.x += (tgt.x - cur.x) * 0.07;
    cur.y += (tgt.y - cur.y) * 0.07;
    var tx = 'translate(' + cur.x + 'px,' + cur.y + 'px)';
    pL.style.transform = tx;
    pR.style.transform = tx;
    if (Math.abs(cur.x - tgt.x) > 0.05 || Math.abs(cur.y - tgt.y) > 0.05) {
      raf = requestAnimationFrame(animate);
    } else { raf = 0; }
  }

  function kick() { if (!raf) raf = requestAnimationFrame(animate); }

  document.addEventListener('mousemove', function(e) {
    var r = svg.getBoundingClientRect();
    var dx = e.clientX - (r.left + r.width / 2);
    var dy = e.clientY - (r.top + r.height / 2);
    var d = Math.sqrt(dx * dx + dy * dy) || 1;
    var s = Math.min(d / 300, 1);
    tgt.x = (dx / d) * maxDrift * s;
    // Asymmetric Y: 4x more movement downward than upward
    var yDrift = dy > 0 ? maxDrift * 4 : maxDrift;
    tgt.y = (dy / d) * yDrift * s;
    kick();
  });

  document.addEventListener('mouseleave', function() {
    tgt.x = 0; tgt.y = 0; kick();
  });

  // Mobile: use device orientation (accelerometer/gyro) for tilt tracking
  function handleOrientation(e) {
    if (e.gamma === null || e.beta === null) return;
    var nx = Math.max(-1, Math.min(1, e.gamma / 30));
    var ny = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
    tgt.x = nx * maxDrift;
    var yDrift = ny > 0 ? maxDrift * 4 : maxDrift;
    tgt.y = ny * yDrift;
    kick();
    // Hide the hint once it's working
    var hint = document.getElementById('tilt-hint');
    if (hint) hint.style.display = 'none';
  }

  function startListening() {
    window.addEventListener('deviceorientation', handleOrientation);
  }

  // Detect touch device
  var isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (isTouchDevice && typeof DeviceOrientationEvent !== 'undefined') {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+ — needs click handler (not touchstart) on HTTPS
      var hint = document.getElementById('tilt-hint');
      if (hint) hint.style.display = 'block';
      svg.addEventListener('click', function iosTap() {
        DeviceOrientationEvent.requestPermission().then(function(state) {
          if (state === 'granted') startListening();
          if (hint) hint.style.display = 'none';
        }).catch(function(err) {
          console.log('Orientation permission error:', err);
          if (hint) hint.style.display = 'none';
        });
        svg.removeEventListener('click', iosTap);
      });
    } else {
      // Android — just listen
      startListening();
    }
  }
})();
</script>`;
}

function logoSvg(cssClass: string): string {
  return `<svg class="${cssClass}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 534 275">
  <defs>
    <linearGradient id="sparkle-grad-${cssClass}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fde68a"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#fbbf24"/>
    </linearGradient>
  </defs>
  <g transform="translate(0,275) scale(0.1,-0.1)">
    <g class="glint-eyes" fill="currentColor">
      <path d="M735 2126 c-319 -60 -584 -289 -698 -603 l-32 -88 0 -360 c0 -354 0 -361 24 -430 105 -309 352 -538 662 -614 84 -21 104 -22 670 -19 l584 3 69 33 c94 44 204 155 249 249 l32 68 0 530 c0 528 0 530 -23 605 -48 153 -121 268 -244 386 -110 106 -210 167 -365 221 l-78 28 -390 2 c-286 1 -409 -2 -460 -11z m942 -801 c106 -31 183 -134 183 -242 -1 -226 -274 -348 -434 -195 -110 106 -105 280 12 382 44 39 111 68 163 69 14 1 48 -6 76 -14z"/>
      <path d="M3761 2129 c-281 -55 -553 -282 -659 -549 -57 -144 -57 -144 -57 -690 0 -505 0 -505 23 -562 50 -124 166 -240 290 -290 l57 -23 595 0 c550 0 600 1 665 19 302 81 541 312 637 616 22 73 23 86 23 430 0 346 -1 357 -23 425 -51 152 -105 240 -221 358 -90 93 -163 145 -278 199 -150 70 -213 78 -638 77 -203 -1 -390 -5 -414 -10z m98 -817 c62 -29 118 -94 136 -157 48 -164 -59 -319 -231 -333 -191 -15 -332 190 -250 363 62 132 216 188 345 127z"/>
    </g>
    <path class="glint-sparkle" fill="url(#sparkle-grad-${cssClass})" d="M2651 2698 c-6 -29 -22 -116 -36 -193 -29 -166 -46 -219 -69 -223 -10 -2 -40 6 -68 18 -27 12 -53 19 -56 15 -3 -3 4 -26 16 -50 43 -88 33 -96 -164 -145 -141 -35 -154 -39 -154 -50 0 -6 10 -12 23 -14 217 -46 317 -80 317 -109 0 -8 -11 -40 -25 -71 -14 -31 -25 -59 -25 -61 0 -2 21 5 47 16 26 11 58 19 72 17 35 -4 51 -54 92 -298 43 -256 51 -266 83 -93 40 220 67 347 81 373 16 31 26 31 109 -4 21 -9 40 -16 41 -16 2 0 -10 30 -26 68 l-29 67 21 18 c23 19 178 69 272 87 36 7 57 16 54 23 -2 7 -58 26 -125 43 -145 37 -212 61 -218 79 -3 7 2 27 10 44 9 17 21 42 26 56 l9 25 -52 -20 c-29 -11 -60 -20 -70 -20 -27 0 -44 51 -83 253 -19 100 -37 190 -40 200 -10 31 -22 18 -33 -35z"/>
  </g>
</svg>`;
}

const EMOTION_ORDER = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'worried', 'sleepy', 'excited', 'confused', 'focused'];

function sortEmotions(emotions: any[]): any[] {
  return [...emotions].sort((a, b) => {
    const ai = EMOTION_ORDER.indexOf(a.emotion);
    const bi = EMOTION_ORDER.indexOf(b.emotion);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
