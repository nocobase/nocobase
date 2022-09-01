FROM node:16-stretch-slim

WORKDIR /app/nocobase

# COPY ./docker/nocobase/sources.list /etc/apt/sources.list

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
COPY ./docker/nocobase-full/nocobase.conf /etc/nginx/sites-enabled/nocobase.conf
COPY . /app/nocobase
RUN cd /app/nocobase & yarn install
RUN cd /app/nocobase & yarn build

COPY ./docker/nocobase-full/docker-entrypoint.sh /app/
# COPY docker-entrypoint.sh /usr/local/bin/
# ENTRYPOINT ["docker-entrypoint.sh"]

CMD ["/app/docker-entrypoint.sh"]
