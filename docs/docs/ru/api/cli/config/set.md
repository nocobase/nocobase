---
title: 'nb config set'
description: 'Справка по команде nb config set: задать параметр конфигурации CLI.'
keywords: 'nb config set,NocoBase CLI,задать конфигурацию'
---

# nb config set

Задаёт параметр конфигурации CLI. Поддерживаемые ключи конфигурации см. в [`nb config`](./index.md).

## Использование

```bash
nb config set <key> <value>
```

## Параметры

| Параметр  | Тип    | Описание                                                                            |
| --------- | ------ | ----------------------------------------------------------------------------------- |
| `<key>`   | string | Имя параметра конфигурации. Поддерживаемые значения см. в [`nb config`](./index.md) |
| `<value>` | string | Значение конфигурации, не может быть пустым                                         |

## Примеры

```bash
nb config set locale zh-CN
nb config set update.policy auto
nb config set license.pkg-url https://pkg.nocobase.com/
nb config set docker.network nocobase
nb config set docker.container-prefix nb
nb config set nb-image-registry dockerhub
nb config set nb-image-registry aliyun
nb config set nb-image-variant full
nb config set nb-image-variant full-no-nginx
nb config set bin.docker /usr/local/bin/docker
nb config set bin.caddy /opt/homebrew/bin/caddy
nb config set bin.git /usr/bin/git
nb config set bin.nginx /usr/sbin/nginx
nb config set bin.pnpm /usr/local/bin/pnpm
nb config set proxy.nb-cli-root /workspace
nb config set proxy.upstream-host host.docker.internal
nb config set bin.yarn yarn
```

## Примечания

- `update.policy` поддерживает `prompt`, `auto` и `off`, значение по умолчанию — `prompt`
- `nb-image-registry` поддерживает `dockerhub` и `aliyun`, значение по умолчанию — `dockerhub`
- `nb-image-variant` поддерживает `standard`, `no-nginx`, `full` и `full-no-nginx`, значение по умолчанию — `full`

## Связанные команды

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
