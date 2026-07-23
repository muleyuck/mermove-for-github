.PHONY: test
test:
	pnpm run typecheck
	pnpm run test
	pnpm run build
