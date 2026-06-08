# Nginx

Если ваше приложение NocoBase уже доступно по адресу `http://127.0.0.1:13000`, следующим шагом обычно ставят перед ним Nginx. У этого решения обычно два прямых плюса: наружу открываются только стандартные порты `80/443`, и позже становится проще добавить HTTPS, сертификаты и правила кеширования.

## Минимальная рабочая конфигурация

Сначала создайте на сервере файл конфигурации, например `/etc/nginx/conf.d/nocobase.conf`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 100m;

    location / {
        proxy_pass http://127.0.0.1:13000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Здесь:

- замените `server_name` на ваш домен
- замените `127.0.0.1:13000` на фактический адрес, на котором слушает NocoBase
- `client_max_body_size` можно увеличить в зависимости от ваших требований к загрузкам

## Проверка и перезагрузка конфигурации

```bash
nginx -t
systemctl reload nginx
```

Если вы не управляете Nginx через `systemd`, используйте свой обычный способ перезагрузки.

## Как обращаться после настройки

Если DNS уже указывает на этот сервер, откройте:

```text
http://your-domain.com
```

Тогда Nginx будет проксировать запросы в NocoBase.

## Что делать с HTTPS

Если вам также нужен HTTPS, обычно есть два распространенных варианта:

- продолжить настраивать сертификаты прямо в Nginx
- сразу перейти на [Caddy](./caddy.md), чтобы он автоматически выпускал и продлевал сертификаты

## Куда идти дальше

- Если приложение еще не запущено, сначала посмотрите [Установка через Docker Compose](../../installation/docker-compose.md)
- Если вам еще нужно проверить порты или ключи, продолжайте с [Переменные окружения приложения](../../installation/env.md)
