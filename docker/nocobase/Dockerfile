FROM node:22-bookworm-slim AS builder

ARG CNA_VERSION
ARG VERDACCIO_URL=https://registry.npmjs.org/

WORKDIR /app

RUN npm config set registry "$VERDACCIO_URL" \
  && yarn config set registry "$VERDACCIO_URL" \
  && yarn config set network-timeout 600000 -g \
  && npx -y create-nocobase-app@${CNA_VERSION} my-nocobase-app --empty-key --skip-dev-dependencies -a -e APP_ENV=production \
  && cd /app/my-nocobase-app \
  && yarn install --production

COPY cleanup-node-modules.sh /usr/local/bin/cleanup-node-modules.sh

RUN chmod +x /usr/local/bin/cleanup-node-modules.sh \
  && cleanup-node-modules.sh /app/my-nocobase-app

FROM node:22-bookworm-slim

ENV NOCOBASE_RUNNING_IN_DOCKER=true

ENV NB_SKIP_STARTUP_UPDATE=1

RUN set -eux; \
  apt-get update; \
  apt-get install -y --no-install-recommends nginx libaio1; \
  rm -rf /etc/nginx/sites-enabled/default /var/lib/apt/lists/*

WORKDIR /app/nocobase

COPY --from=builder /app/my-nocobase-app/ /app/nocobase/
COPY docker-entrypoint.sh /app/

RUN ln -sf /app/nocobase/node_modules/.bin/nb /usr/local/bin/nb

EXPOSE 80/tcp

CMD ["/app/docker-entrypoint.sh"]
