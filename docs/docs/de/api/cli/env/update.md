---
title: "nb env update"
description: "Referenz zum Befehl nb env update: gespeicherte API-, Authentifizierungs-, Quellcode-, Anwendungs- und Datenbankkonfiguration aktualisieren."
keywords: "nb env update,NocoBase CLI,Env-Konfiguration,Authentifizierung,Datenbank,Quellcode"
---

# nb env update

`nb env update` aktualisiert die Konfiguration eines gespeicherten Env. Du kannst damit API-Adresse, Authentifizierungsmethode, Quellherkunft, lokalen App-Pfad, Public Path, Port, Datenbankparameter und mehr anpassen. Nach dem Abschluss verarbeitet die CLI die nötigen Folgeschritte automatisch entsprechend der Änderungen.

Wenn du keine Konfigurationsparameter übergibst, führt die CLI trotzdem eine erneute Synchronisierung auf Basis des aktuellen Env-Status aus.

## Verwendung

```bash
nb env update [name] [flags]
```

## Allgemeine Optionen

| Option | Typ | Beschreibung |
| --- | --- | --- |
| `[name]` | string | Name des konfigurierten Env, das aktualisiert werden soll. Wenn weggelassen, wird das aktuelle Env verwendet |
| `--verbose` | boolean | Detaillierten Fortschritt anzeigen |

## API- und Authentifizierungsoptionen

| Option | Typ | Beschreibung |
| --- | --- | --- |
| `--api-base-url`, `-u` | string | NocoBase-API-URL einschließlich des Präfixes `/api` |
| `--auth-type` | string | Authentifizierungsmethode: `basic`, `token` oder `oauth` |
| `--access-token`, `--token`, `-t` | string | API-Key oder Access Token für `token`-Authentifizierung. Beim Speichern wird der Auth-Typ ebenfalls auf `token` gesetzt |
| `--username` | string | Für `basic`-Authentifizierung gespeicherter Benutzername. Verwende ihn nur, wenn das aktuelle Env bereits `basic` nutzt oder zusammen mit `--auth-type basic` |

## Quell- und Download-Optionen

| Option | Typ | Beschreibung |
| --- | --- | --- |
| `--source` | string | Gespeicherte App-Quelle: `docker`, `git`, `local` oder `npm` |
| `--download-version`, `--version` | string | Gespeicherte Versionsangabe: Docker-Tag, npm-Paketversion oder Git-Ref |
| `--docker-registry` | string | Docker-Image-Registry ohne Tag |
| `--docker-platform` | string | Docker-Image-Plattform: `auto`, `linux/amd64` oder `linux/arm64` |
| `--git-url` | string | Git-Repository-URL |
| `--npm-registry` | string | Registry für npm- oder Git-Downloads und die Installation von Abhängigkeiten |
| `--dev-dependencies` / `--no-dev-dependencies` | boolean | Ob `devDependencies` für npm- oder Git-Quellen installiert werden sollen |
| `--build` / `--no-build` | boolean | Ob nach einem npm- oder Git-Download automatisch gebaut werden soll |
| `--build-dts` / `--no-build-dts` | boolean | Ob beim Build TypeScript-Declaration-Files erzeugt werden sollen |

## Anwendungsoptionen

| Option | Typ | Beschreibung |
| --- | --- | --- |
| `--app-path` | string | Anwendungsverzeichnis. Das ist jetzt die bevorzugte Methode, um den lokalen App-Pfad zu verwalten |
| `--app-public-path` | string | Öffentlicher Anwendungspfad (`APP_PUBLIC_PATH`), etwa `/` oder `/nocobase/` |
| `--app-port` | string | HTTP-Port der Anwendung |
| `--cdn-base-url` | string | CDN-Basis-URL für statische Client-Ressourcen (`CDN_BASE_URL`) |
| `--app-key` | string | Anwendungsschlüssel (`APP_KEY`) |
| `--timezone` | string | Zeitzone der Anwendung (`TZ`) |

## Datenbankoptionen

| Option | Typ | Beschreibung |
| --- | --- | --- |
| `--builtin-db` / `--no-builtin-db` | boolean | Ob die von der CLI verwaltete eingebaute Datenbank verwendet werden soll |
| `--db-dialect` | string | Datenbanktyp: `postgres`, `mysql`, `mariadb` oder `kingbase` |
| `--builtin-db-image` | string | Container-Image für die eingebaute Datenbank |
| `--db-host` | string | Datenbank-Host |
| `--db-port` | string | Datenbank-Port |
| `--db-database` | string | Datenbankname |
| `--db-user` | string | Datenbank-Benutzername |
| `--db-password` | string | Datenbank-Passwort |
| `--db-schema` | string | Datenbankschema. Das wird normalerweise nur bei PostgreSQL verwendet |
| `--db-table-prefix` | string | Tabellenpräfix |
| `--db-underscored` / `--no-db-underscored` | boolean | Ob Tabellen- und Feldnamen das Unterstrich-Namensschema verwenden |

## Konfigurationsbereinigung

| Option | Typ | Beschreibung |
| --- | --- | --- |
| `--unset` | string[] | Ein oder mehrere gespeicherte Felder anhand des Flag-Namens leeren. Du kannst die Option wiederholen oder eine kommagetrennte Liste übergeben, etwa `--unset git-url,username` |

## Hinweise

:::tip

Wenn du nur möchtest, dass die CLI anhand des neuesten Status des aktuellen Env erneut synchronisiert, führe einfach `nb env update` oder `nb env update <name>` ohne zusätzliche Optionen aus.

:::

- Nach Abschluss der Aktualisierung verarbeitet die CLI erforderliche Folgesynchronisationen automatisch auf Basis der diesmal vorgenommenen Änderungen
- Andere Optionen aktualisieren nur die gespeicherte Env-Konfiguration. Sie starten die Anwendung nicht automatisch neu und ersetzen auch keinen lokalen Quellcode oder Docker-Images
- Nach Änderungen an Einstellungen wie `app-path`, `app-port`, `timezone` oder `db-*` fordert dich die CLI in der Regel auf, `nb app restart --env <name>` auszuführen. Wenn die Änderung die von der CLI verwaltete eingebaute Datenbank betrifft, lautet die Empfehlung `nb app restart --env <name> --with-db`
- Nach Änderungen an Einstellungen wie `app-port`, `app-public-path` oder `cdn-base-url`, die das Reverse-Proxy-Ergebnis beeinflussen, führe `nb proxy nginx generate` oder `nb proxy caddy generate` erneut aus, wenn du bereits eine generierte Proxy-Konfiguration verwendest
- Wenn du Quell-Einstellungen wie `source`, `download-version`, `docker-registry`, `git-url` oder `npm-registry` aktualisierst, werden nur die gespeicherten Werte geändert. Bereits vorhandener lokaler Quellcode, Abhängigkeiten und Images werden nicht automatisch ersetzt
- `--access-token` kann nicht zusammen mit `--auth-type basic` oder `--auth-type oauth` verwendet werden
- Dasselbe Feld darf nicht gleichzeitig mit `--unset` und einem expliziten Wert verwendet werden. Verwende zum Beispiel nicht `--unset git-url` zusammen mit `--git-url ...`
- Wenn du die Authentifizierungsmethode auf `basic` oder `oauth` umstellst oder den Token leerst, musst du danach in der Regel `nb env auth <name>` ausführen

## Beispiele

```bash
# Aktuelles Env anhand des zuletzt gespeicherten Status erneut synchronisieren
nb env update

# Ein bestimmtes Env erneut synchronisieren
nb env update prod

# API-URL aktualisieren
nb env update prod --api-base-url http://localhost:13000/api

# Token aktualisieren und Auth-Typ auf token umstellen
nb env update prod --access-token <token>

# Auf basic-Authentifizierung umstellen, Benutzernamen speichern und später nb env auth ausführen
nb env update prod --auth-type basic --username admin

# Gespeicherte Quelle und Version aktualisieren, ohne lokalen Code sofort zu ersetzen
nb env update local --source git --git-url git@github.com:nocobase/nocobase.git --download-version next

# App-Port und Zeitzone anpassen und später neu starten
nb env update local --app-port 13080 --timezone Asia/Shanghai

# Public Path anpassen und danach bei Bedarf den Proxy neu erzeugen
nb env update local --app-public-path /nocobase/

# CDN-Basis-URL für Client-Ressourcen speichern
nb env update local --cdn-base-url https://cdn.example.com/nocobase/

# Gespeicherte Felder leeren
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
