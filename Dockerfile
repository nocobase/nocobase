FROM node:18 as builder
ARG VERDACCIO_URL=http://host.docker.internal:10104/
ARG COMMIT_HASH
ARG APPEND_PRESET_LOCAL_PLUGINS
ARG BEFORE_PACK_NOCOBASE="ls -l"
ARG PLUGINS_DIRS

ENV PLUGINS_DIRS=${PLUGINS_DIRS}

RUN apt-get update && apt-get install -y jq
WORKDIR /tmp
COPY . /tmp
RUN npx npm-cli-adduser --username test --password test -e test@nocobase.com -r $VERDACCIO_URL
RUN cd /tmp && \
    NEWVERSION="$(cat lerna.json | jq '.version' | tr -d '"').$(date +'%Y%m%d%H%M%S')" \
        && tmp=$(mktemp) \
        && jq ".version = \"${NEWVERSION}\"" lerna.json > "$tmp" && mv "$tmp" lerna.json
RUN  yarn install && yarn build --no-dts

RUN git checkout -b release-$(date +'%Y%m%d%H%M%S') \
    && yarn version:alpha -y  \
    && git config user.email "test@mail.com"  \
    && git config user.name "test" && git add .  \
    && git commit -m "chore(versions): test publish packages xxx" \
    && yarn release:force --registry $VERDACCIO_URL

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


FROM node:18-slim
RUN apt-get update && apt-get install -y nginx
RUN rm -rf /etc/nginx/sites-enabled/default
COPY ./docker/nocobase/nocobase.conf /etc/nginx/sites-enabled/nocobase.conf
COPY --from=builder /app/nocobase.tar.gz /app/nocobase.tar.gz

WORKDIR /app/nocobase

RUN mkdir -p /app/nocobase/storage/uploads/ && echo "$COMMIT_HASH" >> /app/nocobase/storage/uploads/COMMIT_HASH

COPY ./docker/nocobase/docker-entrypoint.sh /app/

CMD ["/app/docker-entrypoint.sh"]
