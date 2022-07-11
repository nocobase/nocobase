FROM node:16-stretch-slim as builder

WORKDIR /app

RUN cd /app \
  && yarn create nocobase-app my-nocobase-app -a -e APP_ENV=production \
  && cd /app/my-nocobase-app \
  && yarn install --production

RUN cd /app \
  && rm -rf my-nocobase-app/packages/app/client/src/.umi \
  && rm -rf nocobase.tar.gz \
  && find ./my-nocobase-app/node_modules/china-division/dist -name '*.csv' -delete \
  && find ./my-nocobase-app/node_modules/china-division/dist -name '*.sqlite' -delete \
  && tar -zcvf ./nocobase.tar.gz -C /app/my-nocobase-app .

FROM node:16-stretch-slim

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
  && apt-get update && apt-get install -y nginx

RUN rm -rf /etc/nginx/sites-enabled/default
COPY ./nocobase.conf /etc/nginx/sites-enabled/nocobase.conf
COPY --from=builder /app/nocobase.tar.gz /app/nocobase.tar.gz

WORKDIR /app/nocobase

COPY docker-entrypoint.sh /app/
# COPY docker-entrypoint.sh /usr/local/bin/
# ENTRYPOINT ["docker-entrypoint.sh"]

CMD ["/app/docker-entrypoint.sh"]
