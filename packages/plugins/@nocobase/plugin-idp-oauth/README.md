# @nocobase/plugin-idp-oauth

OIDC / OAuth provider scaffold for NocoBase.

Implementation direction:

- Use `oidc-provider` as the protocol engine
- Let NocoBase own user session, storage, and admin configuration
- Expose a provider instance that resource-server plugins such as `@nocobase/plugin-mcp-server` can integrate with

Notes:

- `oidc-provider` v9 is the current supported line and the project recommends pinning with `~`
- Recent `oidc-provider` versions are ESM-oriented, so integration in the NocoBase server should prefer dynamic import / wrapper loading instead of assuming plain CommonJS `require`
