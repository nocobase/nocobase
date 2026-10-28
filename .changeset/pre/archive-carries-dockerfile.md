---
'@nocobase/app-cli': minor
'@nocobase/app-skills': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

`pnpm build --tar` also packs the application's `Dockerfile` and `Dockerfile.dockerignore` when it has them, so a server builds the image from the release archive alone with `docker build --build-arg DIST=prebuilt .` in the extracted directory, without the sources or a registry.
