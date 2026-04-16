.PHONY: dev build preview stop status lint format test test-watch test-coverage clean pages-create pages-login deploy deploy-preview

# Variables
PORT ?= 5173

dev:
	npm run dev

build:
	npm run build

preview:
	npm run preview

stop:
	@lsof -ti :$(PORT) | xargs kill 2>/dev/null || true

status:
	@lsof -i :$(PORT) >/dev/null 2>&1 && echo "react-spa: running (:$(PORT))" || echo "react-spa: stopped"

lint:
	npm run lint

lint-fix:
	npm run lint:fix

format:
	npm run format

format-check:
	npm run format:check

test:
	npm run test

test-watch:
	npm run test:watch

test-coverage:
	npm run test:coverage

clean:
	rm -rf dist node_modules coverage

install:
	npm install

# Cloudflare Pages setup (run once)
pages-login:
	npx wrangler login

pages-create:
	npx wrangler pages project create markdown-editor --production-branch=main

# Cloudflare Pages deployment
deploy:
	npm run build
	npx wrangler pages deploy dist --project-name=markdown-editor

deploy-preview:
	npm run build
	npx wrangler pages deploy dist --project-name=markdown-editor --branch=preview
