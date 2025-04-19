FROM node:20-bookworm-slim as builder

ARG CNA_VERSION

WORKDIR /app

RUN cd /app \
  && yarn config set network-timeout 600000 -g \
  && npx -y create-nocobase-app@${CNA_VERSION} my-nocobase-app --skip-dev-dependencies -a -e APP_ENV=production \
  && cd /app/my-nocobase-app \
  && yarn install --production \
  && rm -rf yarn.lock \
  && find node_modules -type f -name "yarn.lock" -delete \
  && find node_modules -type f -name "bower.json" -delete \
  && find node_modules -type f -name "composer.json" -delete

RUN cd /app \
  && rm -rf nocobase.tar.gz \
  && tar -zcf ./nocobase.tar.gz -C /app/my-nocobase-app .

FROM node:20-bookworm-slim

# COPY ./sources.list /etc/apt/sources.list
RUN ARCH= && dpkgArch="$(dpkg --print-architecture)" \
  && case "${dpkgArch##*-}" in \
  amd64) ARCH='x64';; \
  ppc64el) ARCH='ppc64le';; \
  s390x) ARCH='s390x';; \
  arm64) ARCH='arm64';; \
  armhf) ARCH='armv7l';; \
  i386) ARCH='x86';; \
  *) echo "unsupported architecture"; exit 1 ;; \
  esac \
  && set -ex \
  # libatomic1 for arm
  && apt-get update && apt-get install -y nginx libaio1

RUN rm -rf /etc/nginx/sites-enabled/default
COPY --from=builder /app/nocobase.tar.gz /app/nocobase.tar.gz

WORKDIR /app/nocobase

COPY docker-entrypoint.sh /app/
# COPY docker-entrypoint.sh /usr/local/bin/
# ENTRYPOINT ["docker-entrypoint.sh"]

EXPOSE 80/tcp

CMD ["/app/docker-entrypoint.sh"]