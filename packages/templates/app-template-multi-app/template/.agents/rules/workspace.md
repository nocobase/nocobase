# Workspace ownership

This directory is Main and the shared installation root. Root `pnpm dev`, `pnpm build`, configuration and Skills commands operate Main; use `pnpm --dir=apps/sub <command>` for the sample child. Each App owns its configuration, storage, database, development process, tests, production dependencies and deployment. Keep one root lockfile; never create a nested installation workspace for the child.

Main consumes immutable child deployment archives, not child business source. A child directory under `apps/` is a source organization choice, not an embedded runtime or a shared database. Preserve migration owners, existing business IDs, instance IDs, template IDs and identity bindings when changing package names. Moving source does not migrate running databases or volumes.

Add reusable internal packages to the root workspace's `packages` globs explicitly. Do not make either App depend on the other's business source or include child source in Main's deployment. Commercial plugins remain installed packages, never cross-repository links. Shared package Skills synchronize independently in Main and each child; their presence alone does not enable a capability.
