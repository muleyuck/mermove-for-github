# Changelog

## [0.2.0](https://github.com/muleyuck/mermove-for-github/compare/mermove-for-github-v0.1.0...mermove-for-github-v0.2.0) (2026-08-02)


### Features

* add Chrome extension for pan and zoom on GitHub Mermaid diagrams ([0db3015](https://github.com/muleyuck/mermove-for-github/commit/0db301576fff960880063af921318c8c151fcda9))
* add extension icons and wire them into manifest.json ([1773a04](https://github.com/muleyuck/mermove-for-github/commit/1773a0483e2547f7ea452687f4075d6ae1f68d05))
* add release-please workflow for automated releases ([0910d3b](https://github.com/muleyuck/mermove-for-github/commit/0910d3b94a81cb92a6b82c6c148f5169f25358b6))
* bootstrap TypeScript/esbuild toolchain ([f4459fa](https://github.com/muleyuck/mermove-for-github/commit/f4459fab1dac1c1efe676e0f16bac9e7662c935f))
* enforce coverage thresholds on npm test ([4214fd7](https://github.com/muleyuck/mermove-for-github/commit/4214fd70094792c54c6901b28c3e745f4288470e))
* migrate content-script.js to TypeScript ([101a526](https://github.com/muleyuck/mermove-for-github/commit/101a5268b5f7bd4c887c287715438b378c59d59a))
* migrate pan-zoom.js to TypeScript ([4a6fa6b](https://github.com/muleyuck/mermove-for-github/commit/4a6fa6bcce6ebccbf3478f87b59a80e7f35dbafe))
* wire esbuild build and point manifest at dist/ ([88c5515](https://github.com/muleyuck/mermove-for-github/commit/88c55157969bc27d263dfebbbacbd4f0ecb33c10))


### Bug Fixes

* adjust logo SVG dimensions ([a03b0f7](https://github.com/muleyuck/mermove-for-github/commit/a03b0f7d67a2374beedc6d14b859d376ea624bc5))
* don't pan when dragging over diagram text/labels, and stop stale drags on pointer release outside the viewport ([41d9d8f](https://github.com/muleyuck/mermove-for-github/commit/41d9d8f3f37ca23c6c60213c505eb686faf8cab3))
* scroll the diagram into view before dispatching pointer events in compatibility e2e test ([9ab26c8](https://github.com/muleyuck/mermove-for-github/commit/9ab26c8415054e341f89541df2e890c6c8e96a0a))


### Reverts

* drop coverage thresholds from npm test ([187dd75](https://github.com/muleyuck/mermove-for-github/commit/187dd75081ee7522cc8ab18fbc8aaa9bd049fbbb))

## 0.1.0 (2026-07-23)


### Features

* add Chrome extension for pan and zoom on GitHub Mermaid diagrams ([9b60bdf](https://github.com/muleyuck/mermove-for-github/commit/9b60bdfd153f87d565ad1c4adc733d8d37169b94))
* add extension icons and wire them into manifest.json ([48bd778](https://github.com/muleyuck/mermove-for-github/commit/48bd778801546976c7b148e84bd109022f0f8b7b))
* add release-please workflow for automated releases ([7639c0a](https://github.com/muleyuck/mermove-for-github/commit/7639c0adfa1874eeef550762e55384f6006b0813))
* bootstrap TypeScript/esbuild toolchain ([8aebc45](https://github.com/muleyuck/mermove-for-github/commit/8aebc4531028a4563ca8e62710f12418f0ddebb0))
* enforce coverage thresholds on npm test ([80d6b5e](https://github.com/muleyuck/mermove-for-github/commit/80d6b5e3d3d6ec1e887612cf8f710af068868a76))
* migrate content-script.js to TypeScript ([9947d89](https://github.com/muleyuck/mermove-for-github/commit/9947d892e145ec2030f1b453f6ac99e283782fd1))
* migrate pan-zoom.js to TypeScript ([1712702](https://github.com/muleyuck/mermove-for-github/commit/171270279f0087dd3ad1460996f9fca30663fafd))
* wire esbuild build and point manifest at dist/ ([cbad245](https://github.com/muleyuck/mermove-for-github/commit/cbad245a2ffb40918e5e3232576b4b647b7fb7bb))


### Bug Fixes

* adjust logo SVG dimensions ([29af2ca](https://github.com/muleyuck/mermove-for-github/commit/29af2cac3ee9a6aaed1e033e8f2532e656cfa1e8))
* don't pan when dragging over diagram text/labels, and stop stale drags on pointer release outside the viewport ([f78416c](https://github.com/muleyuck/mermove-for-github/commit/f78416cf1d2634467b8082b611d7766a0c0ec1fb))
* scroll the diagram into view before dispatching pointer events in compatibility e2e test ([f68809f](https://github.com/muleyuck/mermove-for-github/commit/f68809f235a816d887b3ca0ab45d0d63bd637901))


### Reverts

* drop coverage thresholds from npm test ([12bcc22](https://github.com/muleyuck/mermove-for-github/commit/12bcc222f3c7e3cf66c3769941b8b1a268ba2cab))
