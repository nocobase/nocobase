# syntax=docker/dockerfile:1
#
# Builds this application into a production image, either from its sources or from a `dist/` already built.
#
# From source, in a generated application, run from the project root:
#
#   docker build -t my-app .
#
# From source in the nocobase3 repository, the build context has to be the repository root, because the template
# resolves its `workspace:` dependencies from there:
#
#   docker build -f packages/templates/app-template-hub/Dockerfile \
#     --build-arg APP_DIR=packages/templates/app-template-hub -t my-app .
#
# From a prebuilt `dist/`, which works in the template's own directory too. Build it for the image's platform first:
#
#   pnpm build --target linux-x64
#   docker build --platform linux/amd64 --build-arg DIST=prebuilt -t my-app .
#
# The image holds code and production dependencies only. Mount the runtime configuration at /app/config.yml and
# persistent data at /app/storage; neither belongs in the image.

ARG NODE_VERSION=24.15.0
# `source` builds `dist/` inside the image; `prebuilt` takes the one in the build context.
ARG DIST=source

# The build runs on the builder's own architecture and cross-targets the image platform through `pnpm build --target`,
# which fetches the matching native binaries. Building under emulation would compile every TypeScript package and the
# client bundle there too, many times slower, while only the `.node` files actually differ between platforms.
FROM --platform=$BUILDPLATFORM node:${NODE_VERSION}-bookworm AS dist-source
ARG PNPM_VERSION=11.7.0
RUN npm install --global pnpm@${PNPM_VERSION} \
    && pnpm config set store-dir /pnpm/store

# `.` in a generated application; the template's directory when building inside the nocobase3 repository.
ARG APP_DIR=.
WORKDIR /src
# A local `dist/` is in the context for DIST=prebuilt; a source build replaces it, so it is not copied here.
COPY --exclude=dist --exclude=packages/templates/*/dist . .
RUN test -f pnpm-lock.yaml || { \
      echo 'No pnpm-lock.yaml in the build context. Inside the nocobase3 repository, build from the repository root' \
        'with -f <template>/Dockerfile --build-arg APP_DIR=<template>, or build dist/ first and pass' \
        '--build-arg DIST=prebuilt.' >&2; \
      exit 1; \
    }
# Installs this application and the workspace packages it depends on, and nothing else in the repository. The
# application is selected by its package name, which in a generated application is simply the root project.
RUN --mount=type=cache,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter "$(node -p "require('./${APP_DIR}/package.json').name")..."
# `pnpm build` typechecks and bundles the client before it builds the workspace packages the server needs, so on a
# clean checkout their `dist` has to exist first. In a generated application nothing matches and this does nothing.
RUN pnpm --filter "$(node -p "require('./${APP_DIR}/package.json').name")^..." build

WORKDIR /src/${APP_DIR}
ARG TARGETARCH
# Only source builds consume this; prebuilt assets already contain their base URL.
ARG CDN_BASE_URL
RUN --mount=type=cache,target=/pnpm/store \
    case "${TARGETARCH}" in \
      amd64) target=linux-x64 ;; \
      arm64) target=linux-arm64 ;; \
      *) echo "Unsupported TARGETARCH: ${TARGETARCH}" >&2; exit 1 ;; \
    esac \
    && NOCOBASE_SKIP_WORKSPACE_DEPENDENCY_BUILD=1 \
      pnpm build --target "${target}" --node-version "$(node -p "process.versions.node.split('.')[0]")"

# A `dist/` built outside the image was built for whatever `--target` it was given, so it is checked against the
# image before anything is copied: a darwin or musl binary would build a working image that fails only when the
# database driver loads. `dist/.env` never reaches this stage — see Dockerfile.dockerignore.
FROM --platform=$BUILDPLATFORM node:${NODE_VERSION}-bookworm-slim AS dist-prebuilt
ARG APP_DIR=.
ARG TARGETARCH
WORKDIR /src/${APP_DIR}
COPY ${APP_DIR}/dist/ ./dist/
COPY ${APP_DIR}/config.example.yml ./config.example.yml
RUN node <<'EOF'
const fs = require('node:fs');
const fail = (message) => {
  console.error(message);
  process.exit(1);
};
if (!fs.existsSync('dist/package.json') || !fs.existsSync('dist/node_modules')) {
  fail('dist/ is not a complete production build. Run pnpm build --target <platform> first.');
}
const target = JSON.parse(fs.readFileSync('dist/package.json', 'utf8')).nocobase?.buildTarget ?? {};
const arch = { amd64: 'x64', arm64: 'arm64' }[process.env.TARGETARCH];
const nodeMajor = Number(process.versions.node.split('.')[0]);
if (target.platform !== 'linux' || target.arch !== arch || target.libc !== 'glibc' || target.nodeMajor !== nodeMajor) {
  // Docker picks the image platform before this stage runs and defaults to the builder's own architecture, so a
  // dist/ built for a deployment server usually just needs the image to say the same thing.
  const platform = { x64: 'linux/amd64', arm64: 'linux/arm64' }[target.arch];
  const imageFix =
    target.platform === 'linux' && target.libc === 'glibc' && target.nodeMajor === nodeMajor && platform
      ? `To build a ${platform} image from this dist/, add --platform ${platform} to docker build. `
      : '';
  fail(
    `dist/ was built for ${JSON.stringify(target)}, but this image is linux/${arch} glibc with Node ${nodeMajor}. ` +
      imageFix +
      `To keep this image's platform, rebuild with pnpm build --target linux-${arch} --node-version ${nodeMajor}.`,
  );
}
// The container chooses its mount path at run time, so the client must not be tied to one. A dist/ from an
// @nocobase/app-cli that predates relocatable builds has its build-time path compiled in.
if (JSON.parse(fs.readFileSync('dist/package.json', 'utf8')).nocobase?.relocatable !== true) {
  fail('dist/ was built by an @nocobase/app-cli that ties the client to one mount path. Upgrade it and rebuild dist/.');
}
EOF

FROM dist-${DIST} AS dist

FROM node:${NODE_VERSION}-bookworm-slim AS runtime
ARG APP_DIR=.
# The client is not tied to a mount path; the container picks one at run time with -e APP_BASE_PATH=<path>. The default
# is spelled out rather than left to the server because the health check below has to probe the same path.
ENV NODE_ENV=production \
    APP_BASE_PATH=/hub \
    APP_SERVER_HOST=0.0.0.0 \
    APP_SERVER_PORT=13000 \
    APP_CONFIG_FILE=/app/config.yml

# The runtime takes the directory above `dist` as its deployment root, so storage resolves to /app/storage.
WORKDIR /app
COPY --from=dist --chown=node:node /src/${APP_DIR}/dist/ ./dist/
# Kept as a starting point for config.yml; the real file, with its secrets, is supplied at runtime.
COPY --from=dist /src/${APP_DIR}/config.example.yml ./config.example.yml
RUN mkdir -p storage && chown node:node storage
USER node
EXPOSE 13000
# The image has no curl, so the check uses Node's fetch against the application's health endpoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD ["node", "-e", "fetch(`http://127.0.0.1:${process.env.APP_SERVER_PORT}${(process.env.APP_BASE_PATH || '').replace(/\\/+$/, '')}/api/healthz`, { signal: AbortSignal.timeout(3000) }).then(async (r) => process.exit(r.ok && (await r.json()).ok === true ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["node", "dist/server/standalone.js"]
