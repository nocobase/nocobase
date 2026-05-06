---
title: "nb license activate"
description: "Справочник по команде nb license activate: активация коммерческой лицензии NocoBase для выбранного env."
keywords: "nb license activate,NocoBase CLI,commercial licensing"
---

# nb license activate

Активирует коммерческую лицензию для выбранного env. Можно напрямую передать существующий license key или запросить и активировать лицензию онлайн.

## Использование

```bash
nb license activate [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Имя CLI env; если не указано, используется текущий env |
| `--key` | string | Передать существующий license key напрямую |
| `--key-file` | string | Считать license key из файла |
| `--online` | boolean | Запросить лицензию онлайн и активировать её |
| `--account` | string | Аккаунт сервиса лицензирования для онлайн-активации |
| `--password` | string | Пароль сервиса лицензирования для онлайн-активации |
| `--desc` | string | Имя приложения для онлайн-активации |
| `--yes` | boolean | Подтвердить, что отправленные данные верны и точны |
| `--json` | boolean | Вывод JSON |

## Примеры

```bash
nb license activate --env app1 --key <licenseKey>
nb license activate --env app1 --key-file ./license.txt
nb license activate --env app1 --online
nb license activate --env app1 --online --account aa --password bb --desc test24 --yes
nb license activate --env app1 --json --key-file ./license.txt
```

## Примечания

При онлайн-активации CLI запрашивает license key у сервиса лицензирования, используя instance ID и URL приложения текущего env.

## Связанные команды

- [`nb license id`](./id.md)
- [`nb license status`](./status.md)
