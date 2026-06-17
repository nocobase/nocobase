FROM node:22-bookworm-slim AS builder

ARG CNA_VERSION
ARG VERDACCIO_URL=https://registry.npmjs.org/

WORKDIR /app

RUN corepack enable pnpm \
  && npm config set registry "$VERDACCIO_URL" \
  && pnpm config set registry "$VERDACCIO_URL" \
  && cd /app \
  && npx -y create-nocobase-app@${CNA_VERSION} my-nocobase-app --empty-key --skip-dev-dependencies -a -e APP_ENV=production \
  && cd /app/my-nocobase-app \
  && pnpm install --prod --ignore-scripts

COPY cleanup-node-modules.sh /usr/local/bin/cleanup-node-modules.sh

RUN chmod +x /usr/local/bin/cleanup-node-modules.sh \
  && cleanup-node-modules.sh /app/my-nocobase-app

FROM node:22-bookworm-slim

ARG NGINX_VERSION=1.30.1-1~bookworm

ENV NOCOBASE_RUNNING_IN_DOCKER=true

ENV NB_SKIP_STARTUP_UPDATE=1

RUN set -eux; \
  apt-get update; \
  apt-get install -y --no-install-recommends ca-certificates gnupg wget; \
  wget -qO /tmp/nginx_signing.key https://nginx.org/keys/nginx_signing.key; \
  gpg --batch --yes --dearmor -o /usr/share/keyrings/nginx-archive-keyring.gpg /tmp/nginx_signing.key; \
  printf '%s\n' \
    'deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] https://nginx.org/packages/debian bookworm nginx' \
    > /etc/apt/sources.list.d/nginx.list; \
  apt-get update; \
  apt-get install -y --no-install-recommends "nginx=${NGINX_VERSION}" libaio1; \
  nginx -v; \
  apt-get purge -y --auto-remove wget gnupg; \
  rm -rf /etc/nginx/conf.d/default.conf; \
  rm -rf \
    /etc/apt/sources.list.d/nginx.list \
    /tmp/nginx_signing.key \
    /usr/share/keyrings/nginx-archive-keyring.gpg \
    /var/lib/apt/lists/*

WORKDIR /app/nocobase

COPY --from=builder /app/my-nocobase-app/ /app/nocobase/
COPY docker-entrypoint.sh /app/

RUN ln -sf /app/nocobase/node_modules/.bin/nb /usr/local/bin/nb

EXPOSE 80/tcp

CMD ["/app/docker-entrypoint.sh"]
