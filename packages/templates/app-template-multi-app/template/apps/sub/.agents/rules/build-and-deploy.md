# Build and runtime boundaries

Read the installed `.agents/skills/nocobase-deployment/SKILL.md` and [the project README](../../../../README.MD) before preparing a deployment. Build from this App with `pnpm build --tar`, or use `pnpm --dir=apps/sub build --tar` from the project root. The root is Main and builds its own artifact; children build independently. Target the actual server platform and Node version. A structural audit is not a complete application build.

Each App writes its own `dist/` and `storage/exports/dist.tar.gz`. Preserve the complete build, compiled migration manifests and production dependencies when moving it away from source. Do not include local configuration, secrets or runtime data. Docker source builds use the generated workspace root as context and a BuildKit npmrc secret for commercial downloads; prebuilt images use the extracted archive and `DIST=prebuilt`. Docker execution must be verified separately for the target platform.

Main uses an explicit plan to initialize instances; ordinary startup must not repeat initialization or upgrades. HTTPS SSO requires native origin/state/PKCE validation, Secure cookies and existing operator-provided ingress. HTTP is for local-account development only. Preserve `PLATFORM_SSO_IDENTITY_NAMESPACE` when moving the same platform identity.

App Host explicit-stop unregister semantics were merged in PR #11418; the cancelled follow-up is not a prerequisite. Main's initialization guard checks the resolved built Host implementation without patching it. Also verify real explicit stop, idle wake, restart and retained data in the final deployment. Never bypass admission control or TLS to manufacture a pass.
