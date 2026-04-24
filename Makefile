.PHONY: dev dev-bg build preview stop status lint format test test-watch test-coverage clean pages-create pages-login deploy deploy-preview

# Variables
PORT ?= 5173
PID_FILE := .dev.pid
LOG_FILE := .dev.log

dev:
	npm run dev

dev-bg:
	@if [ -f $(PID_FILE) ] && kill -0 $$(cat $(PID_FILE)) 2>/dev/null; then \
		echo "dev server already running (pid=$$(cat $(PID_FILE)))"; \
	else \
		rm -f $(PID_FILE); \
		setsid npm run dev >$(LOG_FILE) 2>&1 & echo $$! > $(PID_FILE); \
		echo "dev server started (pid=$$(cat $(PID_FILE))), log=$(LOG_FILE)"; \
	fi

build:
	npm run build

preview:
	npm run preview

stop:
	@if [ -f $(PID_FILE) ]; then \
		pid=$$(cat $(PID_FILE)); \
		if kill -0 $$pid 2>/dev/null; then \
			kill -TERM -$$pid 2>/dev/null || kill -TERM $$pid 2>/dev/null || true; \
			echo "dev server stopped (pid=$$pid)"; \
		else \
			echo "dev server not running (stale pid file)"; \
		fi; \
		rm -f $(PID_FILE); \
	else \
		echo "no tracked dev server (no $(PID_FILE))"; \
	fi

status:
	@if [ -f $(PID_FILE) ] && kill -0 $$(cat $(PID_FILE)) 2>/dev/null; then \
		echo "dev server: running (pid=$$(cat $(PID_FILE)))"; \
	else \
		echo "dev server: stopped"; \
	fi

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
	rm -rf dist node_modules coverage $(PID_FILE) $(LOG_FILE)

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
