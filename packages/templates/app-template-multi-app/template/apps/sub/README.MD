# Sub application

Sub is an independent reagent-management application. Main consumes its immutable deployment archive, never this source or npm package. Read the [project README](../../README.MD) for commercial requirements, distinct configuration and ports, building and platform initialization. Install once at the workspace root.

From this directory, initialize local configuration with `pnpm nocobase config init`, set a distinct server port and public origin, replace initial administrator credentials, and run `pnpm nocobase config check`. Develop with `APP_VITE_DEV_PORT=5174 pnpm dev` after configuring a server port distinct from Main and the managed Host. HTTP uses local accounts; real platform SSO requires trusted HTTPS.

`pnpm build --tar` writes `storage/exports/dist.tar.gz` using this App's actual manifest version and current platform by default. Use supported target options for a different runtime, and verify the extracted build away from source. Supply the archive and matching version in Main's explicit demo plan. A single version is enough; prepare a second real version only when testing upgrades.

The commercial platform-sso plugin owns its integration Skill. Preserve least-privilege business roles, denied direct API access, local recovery login, existing migration ownership/checksums and `PLATFORM_SSO_IDENTITY_NAMESPACE`. Source template changes do not migrate databases, volumes or existing users. Run this App's lint, typecheck, tests and build after source changes; root `pnpm build` builds Main, while `pnpm check:structure` only audits source structure; neither substitutes for child runtime acceptance.
