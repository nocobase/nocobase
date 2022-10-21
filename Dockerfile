FROM node:16 as builder
ARG VERDACCIO_URL

WORKDIR /tmp
COPY . /tmp
RUN npx npm-cli-adduser --username test --password test -e test@nocobase.com -r $VERDACCIO_URL

RUN cd /tmp && yarn install && yarn build
RUN git checkout -b release \
    && yarn version:alpha -y  \
    && git config user.email "test@mail.com"  \
    && git config user.name "test" && git add .  \
    && git commit -m "chore(versions): test publish packages xxx" \
    && yarn release:force --registry $VERDACCIO_URL

RUN yarn config set registry $VERDACCIO_URL
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
  && tar -zcf ./nocobase.tar.gz -C /app/my-nocobase-app .


FROM node:16-stretch-slim
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
  && apt-get update && apt-get install -y nginx

RUN rm -rf /etc/nginx/sites-enabled/default
COPY ./docker/nocobase/nocobase.conf /etc/nginx/sites-enabled/nocobase.conf
COPY --from=builder /app/nocobase.tar.gz /app/nocobase.tar.gz

WORKDIR /app/nocobase

COPY ./docker/nocobase/docker-entrypoint.sh /app/

CMD ["/app/docker-entrypoint.sh"]

