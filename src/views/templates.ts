/**
 * HTML templates for the web gallery (SSR, no framework)
 */

export function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(title)}</title>
  <link rel="stylesheet" href="/css/style.css">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>👀</text></svg>">
</head>
<body>
  <nav class="nav">
    <div class="nav-inner">
      <a href="/" class="nav-brand">👀 <strong>Glint</strong> Community</a>
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
      <p>Glint Community — Express yourself in 64×32 pixels</p>
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
        <h1>Glint Style Gallery</h1>
        <p>Community-created emotion styles for your Tidbyt display. Browse, install, and share.</p>
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
            <span class="emotion-label">${escHtml(e.emotion)}</span>
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

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
