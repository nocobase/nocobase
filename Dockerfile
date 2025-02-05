FROM node:20-bookworm as builder
ARG VERDACCIO_URL=http://host.docker.internal:10104/
ARG COMMIT_HASH
ARG APPEND_PRESET_LOCAL_PLUGINS
ARG BEFORE_PACK_NOCOBASE="ls -l"
ARG PLUGINS_DIRS

ENV PLUGINS_DIRS=${PLUGINS_DIRS}

RUN apt-get update && apt-get install -y jq expect

RUN expect <<EOD
spawn npm adduser --registry $VERDACCIO_URL
expect {
  "Username:" {send "test\r"; exp_continue}
  "Password:" {send "test\r"; exp_continue}
  "Email: (this IS public)" {send "test@nocobase.com\r"; exp_continue}
}
EOD

WORKDIR /tmp
COPY . /tmp
RUN  yarn install && yarn build --no-dts

SHELL ["/bin/bash", "-c"]

RUN CURRENTVERSION="$(jq -r '.version' lerna.json)" && \
  IFS='.-' read -r major minor patch label <<< "$CURRENTVERSION" && \
  if [ -z "$label" ]; then CURRENTVERSION="$CURRENTVERSION-rc"; fi && \
  cd /tmp && \
  NEWVERSION="$(echo $CURRENTVERSION).$(date +'%Y%m%d%H%M%S')" \
  &&  git checkout -b release-$(date +'%Y%m%d%H%M%S') \
  && yarn lerna version ${NEWVERSION} -y --no-git-tag-version

RUN git config user.email "test@mail.com"  \
    && git config user.name "test" && git add .  \
    && git commit -m "chore(versions): test publish packages"
RUN yarn release:force --registry $VERDACCIO_URL

RUN yarn config set registry $VERDACCIO_URL
WORKDIR /app
RUN cd /app \
  && yarn config set network-timeout 600000 -g \
  && yarn create nocobase-app my-nocobase-app -a -e APP_ENV=production -e APPEND_PRESET_LOCAL_PLUGINS=$APPEND_PRESET_LOCAL_PLUGINS \
  && cd /app/my-nocobase-app \
  && yarn install --production

WORKDIR /app/my-nocobase-app
RUN $BEFORE_PACK_NOCOBASE

RUN cd /app \
  && rm -rf my-nocobase-app/packages/app/client/src/.umi \
  && rm -rf nocobase.tar.gz \
  && tar -zcf ./nocobase.tar.gz -C /app/my-nocobase-app .


FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends wget gnupg \
  && rm -rf /var/lib/apt/lists/*

RUN sh -c 'echo "deb http://mirrors.ustc.edu.cn/postgresql/repos/apt bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
RUN wget --quiet -O - http://mirrors.ustc.edu.cn/postgresql/repos/apt/ACCC4CF8.asc | apt-key add -

RUN apt-get update && apt-get install -y --no-install-recommends \
  nginx \
  libaio1 \
  postgresql-client-16 \
  postgresql-client-17 \
  libfreetype6 \
  fontconfig \
  libgssapi-krb5-2 \
  fonts-liberation \
  fonts-noto-cjk \
  && rm -rf /var/lib/apt/lists/*

RUN rm -rf /etc/nginx/sites-enabled/default
COPY ./docker/nocobase/nocobase.conf /etc/nginx/sites-enabled/nocobase.conf
COPY --from=builder /app/nocobase.tar.gz /app/nocobase.tar.gz

WORKDIR /app/nocobase

RUN mkdir -p /app/nocobase/storage/uploads/ && echo "$COMMIT_HASH" >> /app/nocobase/storage/uploads/COMMIT_HASH

COPY ./docker/nocobase/docker-entrypoint.sh /app/

CMD ["/app/docker-entrypoint.sh"]
