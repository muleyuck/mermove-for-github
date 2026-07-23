.PHONY: test
test:
	pnpm run ci
	pnpm run typecheck
	pnpm run test
	pnpm run build
