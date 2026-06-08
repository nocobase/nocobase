---
title: 'nb env update'
description: 'Referenz für den Befehl nb env update: Aktualisiert die gespeicherte API-, Authentifizierungs-, Quellcode-, Anwendungs- und Datenbankkonfiguration.'
keywords: 'nb env update,NocoBase CLI,env-Konfiguration,Authentifizierung,Datenbank,Quellcode'
---

# nb env update

`nb env update` wird verwendet, um die Konfiguration eines gespeicherten env zu aktualisieren. Damit kannst du die API-Adresse, die Authentifizierungsmethode, die Quelle des Quellcodes, den lokalen Anwendungspfad, den Port, Datenbankparameter und mehr anpassen. Nach Abschluss der Aktualisierung verarbeitet die CLI die erforderlichen Folgeschritte automatisch anhand der Änderungen.

Wenn du keine Konfigurationsparameter angibst, führt die CLI ebenfalls eine erneute Synchronisierung anhand des aktuellen env-Status durch.

## Verwendung

```bash
nb env update [name] [flags]
```

## Allgemeine Optionen

| Option      | Typ     | Beschreibung                                                                                                       |
| ----------- | ------- | ------------------------------------------------------------------------------------------------------------------ |
| `[name]`    | string  | Name der konfigurierten Umgebung, die aktualisiert werden soll; wenn ausgelassen, wird das aktuelle env verwendet. |
| `--verbose` | boolean | Zeigt detaillierten Fortschritt an.                                                                                |

## API- und Authentifizierungsoptionen

| Option                            | Typ    | Beschreibung                                                                                                                                                                                             |
| --------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--api-base-url`, `-u`            | string | NocoBase-API-Adresse einschließlich des Präfixes `/api`.                                                                                                                                                 |
| `--auth-type`                     | string | Authentifizierungsmethode: `basic`, `token`, `oauth`.                                                                                                                                                    |
| `--access-token`, `--token`, `-t` | string | API key oder access token für die `token`-Authentifizierung. Nach dem Speichern wird die Authentifizierungsmethode auf `token` umgestellt.                                                               |
| `--username`                      | string | Für die `basic`-Authentifizierung gespeicherter Benutzername. Kann nur verwendet werden, wenn das aktuelle env `basic`-Authentifizierung verwendet oder gleichzeitig `--auth-type basic` übergeben wird. |

## Quellcode- und Download-Optionen

| Option                                         | Typ     | Beschreibung                                                                                |
| ---------------------------------------------- | ------- | ------------------------------------------------------------------------------------------- |
| `--source`                                     | string  | Gespeicherte Anwendungsquelle: `docker`, `git`, `local`, `npm`.                             |
| `--download-version`, `--version`              | string  | Gespeicherter Versionsparameter: Docker-Tag, npm-Paketversion oder Git-Ref.                 |
| `--docker-registry`                            | string  | Name der Docker-Image-Registry ohne Tag.                                                    |
| `--docker-platform`                            | string  | Docker-Image-Plattform: `auto`, `linux/amd64`, `linux/arm64`.                               |
| `--git-url`                                    | string  | Git-Repository-URL.                                                                         |
| `--npm-registry`                               | string  | Registry, die für npm/Git-Downloads und die Installation von Abhängigkeiten verwendet wird. |
| `--dev-dependencies` / `--no-dev-dependencies` | boolean | Ob bei Installationen über npm/Git devDependencies installiert werden sollen.               |
| `--build` / `--no-build`                       | boolean | Ob nach Downloads über npm/Git automatisch gebaut werden soll.                              |
| `--build-dts` / `--no-build-dts`               | boolean | Ob beim Build TypeScript-Deklarationsdateien erzeugt werden sollen.                         |

## Anwendungsoptionen

| Option       | Typ    | Beschreibung                                                                                                                             |
| ------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `--app-path` | string | Anwendungsverzeichnis. Standardmäßig wird jetzt empfohlen, diesen Parameter bevorzugt zur Verwaltung lokaler Verzeichnisse zu verwenden. |
| `--app-port` | string | HTTP-Port der Anwendung.                                                                                                                 |
| `--app-key`  | string | Anwendungsschlüssel (`APP_KEY`).                                                                                                         |
| `--timezone` | string | Zeitzone der Anwendung (`TZ`).                                                                                                           |

## Datenbankoptionen

| Option                                     | Typ     | Beschreibung                                                               |
| ------------------------------------------ | ------- | -------------------------------------------------------------------------- |
| `--builtin-db` / `--no-builtin-db`         | boolean | Ob die von der CLI verwaltete integrierte Datenbank verwendet werden soll. |
| `--db-dialect`                             | string  | Datenbanktyp: `postgres`, `mysql`, `mariadb`, `kingbase`.                  |
| `--builtin-db-image`                       | string  | Container-Image der integrierten Datenbank.                                |
| `--db-host`                                | string  | Datenbank-Hostadresse.                                                     |
| `--db-port`                                | string  | Datenbank-Port.                                                            |
| `--db-database`                            | string  | Datenbankname.                                                             |
| `--db-user`                                | string  | Datenbank-Benutzername.                                                    |
| `--db-password`                            | string  | Datenbank-Passwort.                                                        |
| `--db-schema`                              | string  | Datenbank-Schema. Wird normalerweise nur von PostgreSQL verwendet.         |
| `--db-table-prefix`                        | string  | Tabellenpräfix.                                                            |
| `--db-underscored` / `--no-db-underscored` | boolean | Ob Tabellen- und Feldnamen den Unterstrich-Stil verwenden.                 |

## Optionen zum Bereinigen der Konfiguration

| Option    | Typ      | Beschreibung                                                                                                                                                                                 |
| --------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--unset` | string[] | Löscht ein oder mehrere gespeicherte Felder anhand des kanonischen Flag-Namens. Mehrfache Verwendung wird unterstützt, ebenso kommagetrennte Werte, zum Beispiel `--unset git-url,username`. |

## Hinweise

:::tip

Wenn du nur möchtest, dass die CLI anhand des neuesten Status des aktuellen env erneut synchronisiert, reicht es aus, `nb env update` oder `nb env update <name>` auszuführen. Zusätzliche Parameter sind nicht erforderlich.

:::

- Nach Abschluss der Aktualisierung verarbeitet die CLI automatisch alle erforderlichen Folgesynchronisierungen anhand der diesmal vorgenommenen Änderungen
- Andere Optionen aktualisieren nur die gespeicherte env-Konfiguration; sie starten die Anwendung nicht automatisch neu und ersetzen auch nicht automatisch lokalen Quellcode oder Docker-Images
- Nach dem Ändern von Konfigurationen wie `app-path`, `app-port`, `timezone` oder `db-*` fordert dich die CLI in der Regel auf, anschließend `nb app restart --env <name>` auszuführen; wenn die Änderung die von der CLI verwaltete integrierte Datenbank betrifft, wird die Verwendung von `nb app restart --env <name> --with-db` empfohlen
- Beim Aktualisieren von Quellcode-Einstellungen wie `source`, `download-version`, `docker-registry`, `git-url` oder `npm-registry` werden nur die gespeicherten Werte geändert. Vorhandener lokaler Quellcode, Abhängigkeiten und Images werden nicht automatisch ersetzt
- `--access-token` kann nicht zusammen mit `--auth-type basic` oder `--auth-type oauth` verwendet werden
- Dasselbe Feld kann nicht gleichzeitig mit `--unset` und einer expliziten Wertzuweisung verwendet werden. Zum Beispiel kannst du nicht gleichzeitig `--unset git-url` und `--git-url ...` angeben
- Wenn du die Authentifizierungsmethode auf `basic` oder `oauth` umstellst oder den Token löschst, musst du anschließend in der Regel noch `nb env auth <name>` ausführen

## Beispiele

```bash
# Das aktuelle env anhand des neuesten Status erneut synchronisieren
nb env update

# Das angegebene env anhand des neuesten Status erneut synchronisieren
nb env update prod

# Die API-Adresse aktualisieren
nb env update prod --api-base-url http://localhost:13000/api

# Den Token aktualisieren und die Authentifizierungsmethode auf token umstellen
nb env update prod --access-token <token>

# Auf basic-Authentifizierung umstellen, nur den Benutzernamen speichern und später nb env auth ausführen
nb env update prod --auth-type basic --username admin

# Quellcodequelle und Version anpassen und nur die gespeicherte Konfiguration aktualisieren
nb env update local --source git --git-url git@github.com:nocobase/nocobase.git --download-version next

# Anwendungsport und Zeitzone anpassen und die Anwendung später neu starten
nb env update local --app-port 13080 --timezone Asia/Shanghai

# Gespeicherte Felder löschen
nb env update local --unset git-url --unset username
nb env update local --unset git-url,username
```

## Verwandte Befehle

- [`nb api`](../api/index.md)
- [`nb env auth`](./auth.md)
- [`nb env info`](./info.md)
- [`nb env add`](./add.md)
- [`nb app restart`](../app/restart.md)
- [`nb source download`](../source/download.md)
