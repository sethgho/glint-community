<div align="center">

# glint-community

### The community gallery and registry for [glint](https://github.com/sethgho/glint) emotion styles.

**[glint.sethgholson.com](https://glint.sethgholson.com)**

</div>

---

## What is this?

This is the backend and web frontend for the Glint Community Gallery — a place to browse, publish, and install SVG emotion styles for [glint](https://github.com/sethgho/glint).

- 🖼️ **Gallery** — Browse community-created emotion packs
- 📦 **Registry** — `glint style install @user/style` pulls from here
- 🔐 **Auth** — GitHub OAuth for publishing
- 🎨 **SVG-native** — Everything is crisp vector art, no rasterization

## Stack

- **[Hono](https://hono.dev)** — Fast, lightweight web framework
- **[Bun](https://bun.sh)** — Runtime and package manager
- **SQLite** — Style metadata, users, tokens, downloads
- **[resvg](https://github.com/nicolo-ribaudo/resvg-js)** — SVG → PNG rasterization (only for Tidbyt/OG images)
- **Cloudflare Tunnel** — Hosting and caching

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.3+
- A GitHub OAuth app (for auth features)

### Install & Run

```bash
git clone https://github.com/sethgho/glint-community.git
cd glint-community
bun install
```

### Configuration

Set environment variables or create a `.env` file:

```bash
# Required
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
SESSION_SECRET=a_random_secret_string

# Optional
PORT=3000                          # Default: 3000
GLINT_UPLOADS_DIR=./data/uploads   # Where SVG files are stored
BASE_URL=http://localhost:3000     # Public URL
```

### Run

```bash
# Development
bun run src/index.ts

# Production (systemd, pm2, etc.)
bun run src/index.ts
```

## API

### Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/styles` | List all styles (paginated, searchable) |
| `GET` | `/api/styles/:author/:slug` | Get style details |
| `GET` | `/api/styles/:author/:slug/emotions/:emotion` | Get emotion SVG or PNG |
| `GET` | `/api/styles/:author/:slug/download` | Download full style package |

### Authenticated Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/styles` | Publish a new style (multipart upload) |
| `POST` | `/api/styles/:author/:slug/yank` | Yank a version |
| `GET` | `/api/auth/login` | GitHub OAuth login |
| `GET` | `/api/auth/callback` | OAuth callback |

### Query Parameters

- `?format=svg` — Serve native SVG (default: `png` for backward compat)
- `?width=128&height=64` — Rasterized PNG dimensions
- `?version=1.0.0` — Specific version (default: latest)
- `?search=keyword` — Search styles
- `?page=1` — Pagination

## Project Structure

```
src/
  index.ts          — App entrypoint, middleware, static serving
  routes/
    api-auth.ts     — GitHub OAuth + API token auth
    api-styles.ts   — Style CRUD, emotion serving, downloads
    web.ts          — SSR HTML pages (gallery, detail, contribute)
  views/
    templates.ts    — HTML templates (layout, cards, pages)
  db/
    schema.ts       — SQLite schema and migrations
  lib/
    registry.ts     — Style validation and packaging
  middleware/
    rate-limit.ts   — Rate limiting
public/
  css/style.css     — Terminal/Catppuccin Mocha theme
  img/              — Favicons, OG images
data/
  uploads/          — Published SVG files (author/slug/version/)
  cache/            — Rasterized PNG cache
  glint.db          — SQLite database
```

## Deploying

The site runs on a lightweight LXC container behind a Cloudflare Tunnel. Any setup that can run Bun works:

```bash
# Build isn't required — Bun runs TypeScript directly
# Just ensure dependencies are installed
bun install --production

# Run with your process manager of choice
bun run src/index.ts
```

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b feature/cool-thing`)
3. Commit your changes (`git commit -m 'Add cool thing'`)
4. Push to the branch (`git push origin feature/cool-thing`)
5. Open a Pull Request

## Related

- **[glint](https://github.com/sethgho/glint)** — The CLI tool for displaying emotions
- **[Tidbyt](https://tidbyt.com)** — The original 64×32 LED display

## License

MIT
