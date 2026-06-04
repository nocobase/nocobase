---
title: "nb license activate"
description: "Справочник по команде nb license activate: активация существующего коммерческого license key NocoBase для выбранного env."
keywords: "nb license activate,NocoBase CLI,commercial licensing"
---

# nb license activate

Активирует существующий коммерческий license key для выбранного env. Его можно передать напрямую, прочитать из файла или вставить в интерактивном терминале.

## Использование

```bash
nb license activate [flags]
```

## Параметры

| Параметр | Тип | Описание |
| --- | --- | --- |
| `--env`, `-e` | string | Имя CLI env; если не указано, используется текущий env |
| `--key` | string | Передать существующий коммерческий license key напрямую |
| `--key-file` | string | Считать существующий коммерческий license key из файла |
| `--yes`, `-y` | boolean | Если явно переданный `--env` указывает на env, отличающуюся от текущей env, пропускает интерактивное подтверждение |
| `--json` | boolean | Вывод JSON |

## Примеры

```bash
nb license activate
nb license activate --env app1 --key <licenseKey>
nb license activate --env app1 --key-file ./license.txt
nb license activate --env app1 --json --key-file ./license.txt
```

## Примечания

При интерактивном запуске CLI сначала показывает текущие Hostname и Instance ID, а затем предлагает вставить license key напрямую или указать путь к файлу с key. Эта информация помогает проверить, что лицензия привязывается к правильному экземпляру.

После успешной активации перезапустите приложение, чтобы лицензия и состояние коммерческих плагинов действительно вступили в силу; перед перезапуском CLI автоматически синхронизирует коммерческие плагины, разрешённые текущей лицензией:

```bash
nb app restart
```

Если вы явно передаёте `--env`, и она отличается от текущей env, CLI сначала запросит подтверждение. В неинтерактивных терминалах или сессиях AI-агента добавьте `--yes` самостоятельно либо сначала выполните `nb env use <name>`, а затем повторите попытку.

## Связанные команды

- [`nb app restart`](../app/restart.md)
- [`nb license id`](./id.md)
- [`nb license status`](./status.md)
