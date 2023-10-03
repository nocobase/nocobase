FROM nocobase/nocobase:main
ARG LOCAL_STORAGE_BASE_URL=/storage/uploads

ENV DB_DIALECT=sqlite
ENV DB_STORAGE=/mnt/auto/nocobase/storage/db/nocobase.sqlite

COPY . .

EXPOSE 80 13000