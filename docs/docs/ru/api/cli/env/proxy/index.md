---
title: 'nb env proxy'
description: 'Справка по группе команд nb env proxy: просмотр и выбор подкоманд прокси для Nginx и Caddy.'
keywords: 'nb env proxy,NocoBase CLI,nginx,caddy,reverse proxy,конфигурация прокси'
---

# nb env proxy

В NocoBase CLI `nb env proxy` — это точка входа для команд, связанных с reverse proxy. В основном эта группа команд нужна для того, чтобы выбрать и использовать подкоманды provider для Nginx и Caddy.

Если ваше приложение уже сохранено как CLI-managed env, а сам env относится к типу `local` или `docker`, обычно достаточно просто выбрать одну из provider-подкоманд.

## Использование

```bash
nb env proxy
```

## Какую подкоманду открыть первой

| Я хочу... | Перейти сюда |
| --- | --- |
| Продолжать использовать Nginx для сайтов, сертификатов, кэша или контроля доступа | [`nb env proxy nginx`](./nginx.md) |
| Быстро поднять HTTPS и меньше заниматься TLS-деталями | [`nb env proxy caddy`](./caddy.md) |
| Скорректировать настройки env, влияющие на результат проксирования, например `app-port` или `app-public-path` | [`nb env update`](../update.md) |

## Примечания

- У `nb env proxy` нет собственных флагов
- Если вы хотите генерировать конфигурацию, используйте `nb env proxy nginx` или `nb env proxy caddy`
- Обе подкоманды работают только для управляемых env, чей runtime доступен с текущей машины, то есть для `local` или `docker`
- Если вы меняете такие параметры, как `app-port` или `app-public-path`, через `nb env update`, после этого обычно нужно заново выполнить соответствующую proxy-подкоманду
- Сейчас эта группа команд не поддерживает env, у которых есть только удаленное API-подключение, а также SSH env

## Примеры

```bash
# Показать справку по группе команд
nb env proxy

# Сгенерировать конфигурацию Nginx для одного env
nb env proxy nginx --env demo --host demo.local.nocobase.com

# Сгенерировать конфигурацию Caddy для одного env
nb env proxy caddy --env demo --host demo.local.nocobase.com
```

## Связанные команды

- [`nb env proxy nginx`](./nginx.md)
- [`nb env proxy caddy`](./caddy.md)
- [`nb env update`](../update.md)
- [`nb env info`](../info.md)
- [`nb config`](../../config/index.md)
