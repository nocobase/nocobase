---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
'@nocobase/app-cli': patch
---

Ship a `Dockerfile` and `Dockerfile.dockerignore` with every application template. The image builds the application from its own sources with `pnpm build`, cross-targets native modules for multi-platform builds, and runs `node dist/server/standalone.js` as the `node` user without pnpm, with configuration at `/app/config.yml` and storage at `/app/storage`. Set the mount path with `--build-arg APP_BASE_PATH=...`; `.env` is not copied into the image. `--build-arg DIST=prebuilt` packages a `dist/` built beforehand with `pnpm build --target linux-<arch>` instead, after checking that it matches the image's platform, Node major and mount path, and without its `dist/.env`. Existing applications do not receive these files on upgrade: copy both from the new template version. The official Hub image is now built from the Hub template's Dockerfile, keeps its data in `/app/storage`, and no longer fails to start with `EACCES` when `HUB_STORAGE_DIR` is unset; a deployment that mounted `/app/dist/storage` should mount the same volume at `/app/storage` instead.
