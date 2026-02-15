/**
 * HTML templates for the web gallery (SSR, no framework)
 */

export function layout(title: string, body: string, meta?: { description?: string; url?: string; image?: string }): string {
  const desc = meta?.description || 'Emotion packs for your Tidbyt. Expressive eyes on a 64×32 pixel display.';
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

  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <nav class="nav">
    <div class="nav-inner">
      <a href="/" class="nav-brand">${logoSvg('nav-logo')} <strong>Glint</strong> Community</a>
      <div class="nav-links">
        <a href="/">Gallery</a>
        <a href="/contribute">Contribute</a>
        <a href="https://github.com/sethgho/glint" target="_blank">GitHub</a>
      </div>
    </div>
  </nav>
  <main>${body}</main>
  <footer class="footer">
    <div class="container">
      <p>Glint — expressive eyes for your Tidbyt display</p>
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
        <h1>Emotion packs for your Tidbyt.</h1>
        <p>Glint puts expressive eyes on your display. Pick a style, install it in one command.</p>
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

  return `
    <a href="/styles/${escHtml(style.author)}/${escHtml(style.slug)}" class="card">
      <div class="card-preview">
        ${previewUrl ? `<img src="${previewUrl}" alt="${escHtml(style.name)} preview" loading="lazy">` : '<div class="card-placeholder">👀</div>'}
      </div>
      <div class="card-body">
        <h3 class="card-title">@${escHtml(style.author)}/${escHtml(style.slug)}</h3>
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
            <span>⬇ ${style.download_count || 0} downloads</span>
            <span>Published ${escHtml(style.published_at?.split('T')[0] || '')}</span>
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
        ${emotions.map((e: any) => `
          <div class="emotion-card">
            <img src="/api/styles/${escHtml(style.author)}/${escHtml(style.slug)}/emotions/${escHtml(e.emotion)}?version=${escHtml(style.version)}" alt="${escHtml(e.emotion)}" class="emotion-img">
            <code class="emotion-label">${escHtml(e.emotion)}</code>
          </div>
        `).join('')}
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

      <div class="report-link">
        <a href="#" onclick="alert('Report functionality coming soon')">🚩 Report this style</a>
      </div>
    </div>`;
}

export function contributePage(): string {
  return `
    <div class="container contribute">
      <h1>Create & Share Glint Styles</h1>
      <p>Glint styles are sets of 64×32 pixel PNG images — one for each emotion. Here's how to create and publish your own.</p>

      <h2>1. Set Up</h2>
      <pre><code># Install glint CLI
bun install -g glint

# Authenticate with GitHub
glint auth login</code></pre>

      <h2>2. Create a Style</h2>
      <pre><code># Scaffold a new style package
glint style init my-cool-eyes

# This creates:
# ~/.config/glint/styles/my-cool-eyes/
#   glint-style.json    (manifest)
#   neutral.png         (placeholder)
#   happy.png
#   sad.png
#   angry.png
#   surprised.png
#   worried.png
#   sleepy.png
#   excited.png
#   confused.png
#   focused.png</code></pre>

      <h2>3. Design Your Emotions</h2>
      <p>Each emotion is a <strong>64×32 pixel PNG</strong>. Use any tool you like:</p>
      <ul>
        <li><strong>Pixel art editors:</strong> Aseprite, Piskel, Lospec</li>
        <li><strong>AI generation:</strong> <code>glint generate my-style --prompt "cyberpunk robot eyes"</code></li>
        <li><strong>Image editors:</strong> Photoshop, GIMP (resize to 64×32)</li>
      </ul>
      <p>Required emotions: neutral, happy, sad, angry, surprised, worried, sleepy, excited, confused, focused.</p>

      <h2>4. Validate</h2>
      <pre><code># Check your style meets the spec
glint style validate my-cool-eyes

# Preview locally on your Tidbyt
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
  "files": {
    "neutral.png": "sha256:abc123...",
    "happy.png": "sha256:def456...",
    ...
  },
  "tags": ["cyberpunk", "robot", "neon"],
  "license": "MIT"
}</code></pre>

      <h2>Rules</h2>
      <ul>
        <li>All 10 required emotions must be present</li>
        <li>Images must be exactly 64×32 pixels (PNG)</li>
        <li>Max 500KB per image, 10MB total package</li>
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
    // Asymmetric Y: 2.5x more movement downward than upward
    var yDrift = dy > 0 ? maxDrift * 2.5 : maxDrift;
    tgt.y = (dy / d) * yDrift * s;
    kick();
  });

  document.addEventListener('mouseleave', function() {
    tgt.x = 0; tgt.y = 0; kick();
  });
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

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
