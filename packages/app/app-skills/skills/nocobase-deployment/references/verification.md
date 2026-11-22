# Deployment verification details

## Browser API compatibility

Use the intended public origin for browser checks, including its scheme, host and base path. Follow [browser API compatibility](../../nocobase-app-development/references/frontend/frontend-dev.md#browser-api-compatibility): UUID generation and copying text must work on ordinary HTTP, while other HTTPS-only capabilities must explain their requirements to users when unavailable. Verify those HTTP-compatible actions and unavailable-feature messages on an origin where `window.isSecureContext` is `false`; localhost and HTTPS can mask incompatibilities. Exercise actions through completion and inspect browser errors; a loaded page or healthy server is insufficient.

When the application offers copy buttons, include [copy and clipboard verification](../../nocobase-app-development/references/frontend/frontend-dev.md#copy-and-clipboard-actions): copy from a representative page or dialog and paste into a normal input on HTTP. A success toast alone is not evidence that the clipboard changed.

## API documentation in production

A deployed application serves its OpenAPI document at `<APP_BASE_PATH>/api/swagger` and Swagger UI at `<APP_BASE_PATH>/api/swagger/docs`, with the Swagger UI files bundled in the application; nothing is fetched from a CDN, so it works without outbound network access. Only a signed-in session or a valid API key may read them, and anything else gets `401` with reason `API_DOCS_UNAUTHENTICATED`; an application without the authentication plugin registers no access check and answers `404`. Verify with `curl -H "x-api-key: <key>" https://<host><APP_BASE_PATH>/api/swagger` using a key the user supplies, and expect `401` without it.

There is no setting that makes the documentation public, and none that turns it off. It describes the endpoints' shape, not data, and every reader is already someone who can call those endpoints. Where policy requires that only some users see it, block `<APP_BASE_PATH>/api/swagger` and everything below it at the reverse proxy for the users or networks that should not reach it; do not change the application or its plugins for this.
