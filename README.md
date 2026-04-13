# React SPA Cloudflare

A standalone React SPA boilerplate optimized for Cloudflare Pages deployment.

## Tech Stack

| Category | Technology |
|----------|------------|
| Build | Vite |
| Language | TypeScript |
| Routing | React Router |
| UI Framework | Material UI |
| Form | React Hook Form + Zod |
| UI State | Zustand |
| Linter | ESLint |
| Formatter | Prettier |
| Testing | Vitest + Testing Library |
| Deployment | Cloudflare Pages |

## Project Structure

```
src/
├── components/    # UI components (Layout)
├── pages/         # Page components (Home, About, 404, Form)
├── schemas/       # Zod validation schemas
├── test/          # Test utilities
├── router.tsx     # React Router configuration
├── theme.ts       # MUI theme
├── App.tsx        # App entry with providers
└── main.tsx       # React entry point

public/
├── _headers       # Cloudflare security headers
└── _routes.json   # SPA routing configuration
```

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Deployment

### Prerequisites

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

### Deploy to Production

```bash
make deploy
```

### Deploy Preview

```bash
make deploy-preview
```

### Manual Deployment

```bash
# Build
npm run build

# Deploy
npx wrangler pages deploy dist --project-name=react-spa-cloudflare
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |

## Make Targets

| Target | Description |
|--------|-------------|
| `make dev` | Start development server |
| `make build` | Build for production |
| `make test` | Run tests |
| `make deploy` | Deploy to Cloudflare Pages (production) |
| `make deploy-preview` | Deploy to Cloudflare Pages (preview) |
| `make clean` | Remove build artifacts |

## Cloudflare Pages Configuration

- `wrangler.toml` - Wrangler configuration for Pages deployment
- `public/_routes.json` - SPA routing (all routes served by index.html)
- `public/_headers` - Security headers (X-Frame-Options, CSP, etc.)

## Features

- React 19 with TypeScript
- Client-side routing with React Router
- Material UI 7 for components
- Form validation with React Hook Form + Zod
- Optimized for Cloudflare Pages edge deployment
- Security headers pre-configured
- CI/CD ready with GitHub Actions
