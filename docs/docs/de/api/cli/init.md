---
title: 'nb init'
description: 'Referenz für den Befehl nb init: Neuinstallation, Übernahme einer vorhandenen lokalen App oder Verbindung mit einer Remote-App und Speichern als CLI env.'
keywords: 'nb init,NocoBase CLI,Initialisierung,env,Docker,npm,Git,Remote-Verbindung'
---

# nb init

Initialisiert den aktuellen Workspace, damit der coding agent sich mit NocoBase verbinden und es verwenden kann.

`nb init` kann eine neue lokale NocoBase-App installieren oder die Verbindungsinformationen einer bestehenden App speichern.

Außerdem synchronisiert `nb init` standardmäßig auch die NocoBase AI coding skills. Nur wenn du skills bereits selbst verwaltest oder in CI bzw. in einer Offline-Umgebung arbeitest, musst du `--skip-skills` hinzufügen.

## Verwendung

```bash
nb init [flags]
```

## Interaktive Modi

`nb init` unterstützt drei interaktive Modi:

- `nb init`: führt die Einrichtung Schritt für Schritt im Terminal durch
- `nb init --ui`: öffnet ein Formular im lokalen Browser und führt das Setup mit einem visuellen Assistenten durch
- `nb init --yes --env app1`: überspringt Eingabeaufforderungen und verwendet direkt die Flags; nicht explizit übergebene Parameter werden mit Standardwerten behandelt

Der Modus `--yes` eignet sich für Skripte, CI/CD oder andere nicht interaktive Szenarien. In diesem Modus ist `--env <envName>` erforderlich. Üblicherweise wird standardmäßig eine neue lokale App installiert; wenn du `--source` nicht angibst, wird standardmäßig `docker` als Installationsquelle verwendet.

## Unterbrochene Initialisierung fortsetzen

Installationsabläufe speichern zuerst die env-Konfiguration und führen danach Download, Datenbank- und App-Installation aus. Wenn der Vorgang zwischendurch fehlschlägt, kannst du fortfahren:

```bash
nb init --env app1 --resume
```

`--resume` gilt nur für Initialisierungsabläufe, bei denen die env-Konfiguration bereits gespeichert wurde, und `--env` muss ausdrücklich angegeben werden.

## Zuerst das env vorbereiten und die App später installieren

`--prepare-only` ist für Abläufe gedacht, bei denen zuerst das env vorbereitet, dann die Lizenz aktiviert und erst danach die App installiert und gestartet wird.

Wenn du zuerst die env-Konfiguration speichern und die Datenbank vorbereiten möchtest, während Abhängigkeitsdownload, App-Installation und erster Start verschoben werden, kannst du Folgendes verwenden:

```bash
nb init --env app1 --prepare-only
nb init --env app1 --prepare-only --ui
nb init --env app1 --prepare-only --yes
```

Dieser Modus ist für lokale Installationsabläufe verfügbar, einschließlich des `--ui`-Assistenten. Für Remote-Verbindungsabläufe ist er nicht verfügbar. Die CLI speichert das aktuelle env im Status prepared, sodass du später mit einem Ablauf wie diesem fortfahren kannst:

```bash
nb license activate --env app1
nb app start --env app1
```

Danach schließt `nb app start` die Erstinstallation ab und wechselt das env vom prepared-Status in den normalen installed-Status.

## Hinweise zum Installationsverzeichnis

Den vollständigen Pfad kannst du mit `nb env info app1 --field app.appPath` anzeigen.

Standardmäßig organisiert die CLI lokale Dateien unter `app-path` nach dieser Konvention:

```text
<app-path>/
├── .nb/      # CLI-Metadaten für dieses env, z. B. hooks.mjs
├── source/   # Standardverzeichnis für den App-Quellcode oder heruntergeladene Inhalte
├── storage/  # Laufzeitdatenverzeichnis
└── .env      # optionale Datei mit Umgebungsvariablen der App
```

In der Regel gilt:

- `.nb/` speichert CLI-verwaltete Metadaten. Ein mit `--hook-script` übergebenes Skript wird nach `<app-path>/.nb/hooks.mjs` kopiert, damit `nb app upgrade` und lokale source-Wiederherstellung es später wiederverwenden können
- `source/` entspricht hauptsächlich dem lokalen App-Verzeichnis für npm-/Git-envs. Bei Docker-envs behält die CLI diese Standardpfadableitung ebenfalls bei, allerdings musst du dich in den meisten Fällen nicht manuell darum kümmern. Achte bei Upgrades besonders darauf: Das Verzeichnis `source/` wird gelöscht und erneut heruntergeladen. Lege hier also keine Dateien ab, die erhalten bleiben müssen
- `storage/` dient zum Speichern von Laufzeitdaten wie eingebetteten Datenbankdaten, Plugins, Logs usw.
- `.env` ist eine optionale Datei für Umgebungsvariablen der App. Du musst sie nur in `<app-path>/.env` anlegen, wenn du Umgebungsvariablen anpassen möchtest; falls diese Datei vorhanden ist, wird sie bei den Installationsquellen Docker, npm und Git standardmäßig eingelesen

Dies beschreibt die Standardverzeichnis-Konvention der CLI. Je nach Installationsquelle, Plugins und Laufzeitphase können die tatsächlich erzeugten Verzeichnisinhalte abweichen.

## Hinweise

:::warning Achtung

- `--ui` kann nicht zusammen mit `--yes` verwendet werden
- `--ui` kann auch nicht zusammen mit `--resume` verwendet werden
- `--ui-host` und `--ui-port` können nur zusammen mit `--ui` verwendet werden
- `--skip-auth` kann nicht zusammen mit `--access-token` oder `--token` verwendet werden

:::

## Schnelle Orientierung nach Steps

Je nach Setup-Pfad unterscheiden sich die angezeigten Steps leicht. Wenn du zum Beispiel eine bestehende App verbindest, werden normalerweise nur `Getting started` und `Remote connection` verwendet.

Wenn du dem lokalen UI-Assistenten Schritt für Schritt folgst, kannst du dich mit der folgenden Tabelle schnell orientieren:

| Step                      | Wichtige Parameter                                                                                                                                                                                                |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Getting started`         | `--env`、`--yes`、`--ui`、`--locale`、`--verbose`、`--skip-skills`、`--resume`、`--prepare-only`                                                                                                                 |
| `App environment`         | `--lang`、`--app-path`、`--app-port`、`--force`                                                                                                                                                                   |
| `App source and version`  | `--source`、`--version`、`--skip-download`、`--git-url`、`--docker-registry`、`--docker-platform`、`--npm-registry`、`--replace`、`--dev-dependencies`、`--output-dir`、`--docker-save`、`--build`、`--build-dts`、`--hook-script` |
| `Configure the database`  | `--builtin-db`、`--db-dialect`、`--builtin-db-image`、`--db-host`、`--db-port`、`--db-database`、`--db-user`、`--db-password`、`--db-schema`、`--db-table-prefix`、`--db-underscored`                             |
| `Create an admin account` | `--root-username`、`--root-email`、`--root-password`、`--root-nickname`                                                                                                                                           |
| `Remote connection`       | `--api-base-url`、`--auth-type`、`--access-token`、`--username`、`--password`、`--skip-auth`                                                                                                                      |

## Parameter

Es gibt viele Parameter; nach Nutzungsszenarien aufgeteilt sind sie übersichtlicher.

Der „Standardwert“ unten steht für den Wert oder das Verhalten, das `nb init` normalerweise verwendet, wenn du den Parameter weglässt.

### Grundlagen und Interaktion

| Parameter       | Typ     | Standardwert                                                                                  | Beschreibung                                                                                                                   |
| --------------- | ------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `--yes`, `-y`   | boolean | `false`                                                                                       | Überspringt Eingabeaufforderungen und verwendet Flags sowie Standardwerte                                                      |
| `--env`, `-e`   | string  | Kein Wert                                                                                     | Name des env, das bei dieser Initialisierung gespeichert wird; in den Modi `--yes` und `--resume` erforderlich                 |
| `--ui`          | boolean | `false`                                                                                       | Öffnet den Assistenten im lokalen Browser; kann nicht zusammen mit `--yes` oder `--resume` verwendet werden                    |
| `--verbose`     | boolean | `false`                                                                                       | Zeigt detaillierte Befehlsausgaben an                                                                                          |
| `--skip-skills` | boolean | `false`                                                                                       | Überspringt die Synchronisierung der NocoBase AI coding skills                                                                 |
| `--ui-host`     | string  | `127.0.0.1`                                                                                   | Im Browser erreichbarer Host in der URL des `--ui`-Assistenten; der lokale Dienst lauscht immer auf `0.0.0.0`                  |
| `--ui-port`     | integer | `0`                                                                                           | Port des lokalen `--ui`-Dienstes; `0` bedeutet automatische Zuweisung                                                          |
| `--locale`      | string  | Folgt `NB_LOCALE`, der CLI-Konfiguration oder dem System-Locale; endgültiger Fallback `en-US` | Sprache der CLI-Prompts und der lokalen Setup-UI: `en-US` oder `zh-CN`                                                         |
| `--resume`      | boolean | `false`                                                                                       | Setzt eine zuvor unvollständige Initialisierung fort und verwendet die bereits gespeicherte Workspace-env-Konfiguration wieder |
| `--prepare-only` | boolean | `false`                                                                                      | Speichert und bereitet ein lokales Installations-env vor, einschließlich `--ui`-Abläufen, ohne die App schon zu installieren oder zu starten |

### Verbindung mit einer bestehenden App

| Parameter              | Typ     | Standardwert | Beschreibung                                                                                                                                                      |
| ---------------------- | ------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--api-base-url`, `-u` | string  | Kein Wert    | API-Basisadresse; muss das Präfix `/api` enthalten                                                                                                                |
| `--auth-type`, `-a`    | string  | `oauth`      | Authentifizierungsmethode: `basic`, `token` oder `oauth`. In der Regel reicht der Standard `oauth`; in manchen CI/CD-Szenarien kann auch `basic` verwendet werden |
| `--access-token`, `-t` | string  | Kein Wert    | API key oder access token für die Authentifizierung mit `token`                                                                                                   |
| `--username`           | string  | Kein Wert    | Benutzername für die Authentifizierung mit `basic`                                                                                                                |
| `--password`           | string  | Kein Wert    | Passwort für die Authentifizierung mit `basic`                                                                                                                    |
| `--skip-auth`          | boolean | `false`      | Speichert zuerst env und Authentifizierungsmethode und führt die Anmeldung später mit `nb env auth` durch                                                         |

### Grundlegende Parameter für die lokale Installation

| Parameter         | Typ     | Standardwert                            | Beschreibung                                                                                 |
| ----------------- | ------- | --------------------------------------- | -------------------------------------------------------------------------------------------- |
| `--lang`, `-l`    | string  | `en-US`                                 | UI-Sprache der neu installierten App                                                         |
| `--force`, `-f`   | boolean | `false`                                 | Konfiguriert ein bestehendes env neu und ersetzt bei Bedarf kollidierende Laufzeitressourcen |
| `--app-path`      | string  | `./<envName>/`                          | Lokales App-Verzeichnis für npm/Git                                                          |
| `--app-port`      | string  | `13000`                                 | HTTP-Port der lokalen App; im Modus `--yes` wird automatisch ein verfügbarer Port gewählt    |
| `--root-username` | string  | `nocobase` (im Modus `--yes`)           | Benutzername des initialen Administrators                                                    |
| `--root-email`    | string  | `admin@nocobase.com` (im Modus `--yes`) | E-Mail des initialen Administrators                                                          |
| `--root-password` | string  | `admin123` (im Modus `--yes`)           | Passwort des initialen Administrators                                                        |
| `--root-nickname` | string  | `Super Admin` (im Modus `--yes`)        | Anzeigename des initialen Administrators                                                     |

### Datenbankparameter

| Parameter                                  | Typ     | Standardwert                                                             | Beschreibung                                                                                    |
| ------------------------------------------ | ------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `--builtin-db` / `--no-builtin-db`         | boolean | `true`                                                                   | Gibt an, ob eine von der CLI verwaltete eingebaute Datenbank erstellt und verbunden werden soll |
| `--db-dialect`                             | string  | `postgres`                                                               | Datenbanktyp: `postgres`, `mysql`, `mariadb`, `kingbase`                                        |
| `--builtin-db-image`                       | string  | Folgt `--db-dialect` und dem Locale                                      | Container-Image der eingebauten Datenbank                                                       |
| `--db-host`                                | string  | Bei eingebauter Datenbank `postgres`; bei externer Datenbank `127.0.0.1` | Host-Adresse der Datenbank                                                                      |
| `--db-port`                                | string  | `postgres=5432`、`mysql=3306`、`mariadb=3306`、`kingbase=54321`          | Datenbankport                                                                                   |
| `--db-database`                            | string  | `nocobase`; bei KingbaseES `kingbase`                                    | Name der Datenbank                                                                              |
| `--db-user`                                | string  | `nocobase`                                                               | Datenbankbenutzername                                                                           |
| `--db-password`                            | string  | `nocobase`                                                               | Datenbankpasswort                                                                               |
| `--db-schema`                              | string  | Kein Wert                                                                | Datenbankschema; nur für PostgreSQL                                                             |
| `--db-table-prefix`                        | string  | Kein Wert                                                                | Präfix für Datenbanktabellen                                                                    |
| `--db-underscored` / `--no-db-underscored` | boolean | `false`                                                                  | Ob Tabellen- und Feldnamen in der Datenbank Unterstrich-Schreibweise verwenden                  |

### Parameter für Download und Quellcode

| Parameter                                            | Typ     | Standardwert                                                                                 | Beschreibung                                                                                          |
| ---------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `--skip-download`                                    | boolean | `false`                                                                                      | Überspringt den Download und verwendet das vorhandene lokale App-Verzeichnis oder Docker-Image wieder |
| `--source`, `-s`                                     | string  | `docker`                                                                                     | Art, NocoBase zu beziehen: `docker`, `npm` oder `git`                                                 |
| `--version`, `-v`                                    | string  | `beta`                                                                                       | Versionsparameter: npm-Paketversion, Docker-Image-Tag oder Git-Ref                                    |
| `--replace`, `-r`                                    | boolean | `false`                                                                                      | Ersetzt, wenn das Zielverzeichnis bereits existiert                                                   |
| `--dev-dependencies`, `-D` / `--no-dev-dependencies` | boolean | `false`                                                                                      | Gibt an, ob bei npm-/Git-Installation devDependencies installiert werden sollen                       |
| `--output-dir`, `-o`                                 | string  | Bei npm/Git aus `--app-path` abgeleitet; bei Docker + `--docker-save` `./nocobase-<version>` | Zielverzeichnis für Downloads oder Speicherverzeichnis des Tarballs bei aktiviertem `--docker-save`   |
| `--git-url`                                          | string  | `https://github.com/nocobase/nocobase.git`                                                   | Adresse des Git-Repositorys                                                                           |
| `--docker-registry`                                  | string  | `nocobase/nocobase`; im Locale `zh-CN` `registry.cn-shanghai.aliyuncs.com/nocobase/nocobase` | Name des Docker-Image-Repositorys ohne Tag                                                            |
| `--docker-platform`                                  | string  | `auto`                                                                                       | Plattform des Docker-Images: `auto`, `linux/amd64`, `linux/arm64`                                     |
| `--docker-save` / `--no-docker-save`                 | boolean | `false`                                                                                      | Gibt an, ob das Docker-Image nach dem Pull zusätzlich als Tarball gespeichert werden soll             |
| `--npm-registry`                                     | string  | leer                                                                                         | Registry für npm-/Git-Downloads und die Installation von Abhängigkeiten                               |
| `--build` / `--no-build`                             | boolean | `true`                                                                                       | Gibt an, ob nach der Installation von npm-/Git-Abhängigkeiten gebaut werden soll                      |
| `--build-dts`                                        | boolean | `false`                                                                                      | Gibt an, ob beim npm-/Git-Build TypeScript-Deklarationsdateien erzeugt werden sollen                  |
| `--hook-script`                                      | string  | keiner                                                                                       | Kopiert das angegebene hook-Modul nach `<app-path>/.nb/hooks.mjs` und speichert es in der env config; unterstützt die Lifecycle-Hooks `beforeDependencyInstall`, `beforeAppInstall` und `afterAppStart` |

## Beispiele

Die gebräuchlichsten Verwendungsweisen sind die folgenden.

### Die Einrichtung Schritt für Schritt im Terminal durchführen

```bash
nb init
```

### Den Assistenten im lokalen Browser öffnen

```bash
nb init --ui
nb init --ui --ui-port 3000
```

### Zuerst vorbereiten, dann die Lizenz aktivieren und später starten

```bash
nb init --env app1 --prepare-only
nb license activate --env app1
nb app start --env app1
```

### Eine neue lokale App nicht interaktiv installieren

Wenn du `--source` nicht angibst, wird normalerweise Docker als Installationsquelle verwendet.

```bash
nb init --env app1 --yes
nb init --env app1 --yes --source docker --version latest
nb init --env app1 --yes --source docker --version beta
nb init --env app1 --yes --source docker --version alpha
nb init --env app1 --yes --source docker --version main \
  --docker-registry registry.cn-beijing.aliyuncs.com/nocobase/nocobase
nb init --env app1 --yes --source npm --version latest
nb init --env app1 --yes --source npm --version beta
nb init --env app1 --yes --source npm --version alpha
nb init --env app1 --yes --source npm --version beta --app-port 13080
nb init --env app1 --yes --source git --version latest
nb init --env app1 --yes --source git --version beta
nb init --env app1 --yes --source git --version alpha
nb init --env app1 --yes --source git --version feat/plugin-workflow-timeout
nb init --env app1 --yes --source git --version latest \
  --git-url https://gitee.com/nocobase/nocobase.git
```

### Installationsablauf mit einem hook-Skript erweitern

Wenn du während der Installation zusätzliche Inhalte vorbereiten musst, übergib mit `--hook-script` ein lokales ESM-Modul:

```bash
nb init --env app1 --yes --source git --hook-script ./hooks.mjs
```

Die CLI kopiert diese Datei nach `<app-path>/.nb/hooks.mjs` und speichert `hookScript: ".nb/hooks.mjs"` in der env config. Spätere `nb app start`, `nb app restart` und `nb app upgrade` verwenden sie von dort wieder.

Die hook-Datei muss ein Objekt als default exportieren. Implementiere nur die Methoden, die du brauchst:

```js
export default {
  beforeDependencyInstall: async (context) => {
    // Runs after git clone / npm scaffold and before yarn install.
  },
  beforeAppInstall: async (context) => {
    // Runs before the app-level install or upgrade command.
  },
  afterAppStart: async (context) => {
    // Runs after the app actually starts and passes the health check.
  },
};
```

- `beforeDependencyInstall` gilt nur für npm/Git source und läuft direkt vor dem echten `yarn install`; Docker source führt ihn nicht aus
- `beforeAppInstall` läuft vor app-weiten Installations- oder Upgrade-Befehlen und gilt für npm/Git/Docker source
- `afterAppStart` läuft, nachdem die App wirklich gestartet ist und `__health_check` bestanden hat; `nb app start`, `nb app restart` und `nb app upgrade` können ihn auslösen

`--prepare-only` speichert nur die env config und kopiert die hook-Datei. Hooks werden dabei nicht ausgeführt. Wenn du später zum ersten Mal `nb app start` ausführst, startet die CLI die Hooks für die Erstinstallation mit `context.phase` als `init` und `context.command` als `app:start`.

`context` enthält Lifecycle-Informationen wie `phase`, `command`, `source`, `version`, `appPath`, `sourcePath`, `storagePath`, `hookScript` und `envConfig`. Wenn ein hook einen Fehler wirft, schlägt der aktuelle CLI-Befehl fehl. Da `afterAppStart` bei start, restart und upgrade mehrfach laufen kann, sollte die Logik idempotent sein.

### Schnell installieren und basic-Authentifizierung verwenden

Wenn du im nicht interaktiven Modus schnell eine lokale App installieren und direkt nach der Installation `basic`-Authentifizierung speichern möchtest, kannst du es auch so schreiben. Dann musst du keinen Browser mehr öffnen, um OAuth abzuschließen.

Wenn du das Standard-Administratorkonto des Modus `--yes` beibehältst, ist dies die kürzeste Form.

Falls nichts angegeben wird, lautet das Standard-Administratorkonto `nocobase` und das Standardpasswort `admin123`:

```bash
nb init --env app1 --yes --auth-type basic
```

Wenn du gleichzeitig auch das Administratorkonto anpassen möchtest, kannst du es so schreiben:

```bash
nb init --env app1 --yes \
  --auth-type basic \
  --root-username admin \
  --root-password secret123
```

### Mit einer bestehenden App verbinden

Standardmäßig genügt OAuth. Wenn es in bestimmten CI/CD-Szenarien unpraktisch ist, einen Browser zu öffnen, kannst du auch direkt `basic`-Authentifizierung speichern; wenn du bereits ein API-Token hast, kannst du auch direkt `token`-Authentifizierung speichern.

```bash
nb init --env staging --yes \
  --api-base-url https://demo.example.com/api

nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type basic \
  --username <username> \
  --password <password>

nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type token \
  --access-token <token>

nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type oauth \
  --skip-auth
```

### Datenbankbenennung anpassen

Wenn du ein PostgreSQL-Schema, ein Tabellenpräfix oder Unterstrich-Schreibweise angeben musst, kannst du die Parameter so übergeben:

```bash
nb init --env app1 --yes \
  --db-dialect postgres \
  --db-schema public \
  --db-table-prefix nb_ \
  --db-underscored
```

### Eine zuvor unterbrochene Initialisierung fortsetzen

```bash
nb init --env app1 --resume
```

### Detaillierte Logs zur Fehlerbehebung anzeigen

```bash
nb init --env app1 --yes --source docker --version latest --verbose
```

## Verwandte Befehle

- [`nb env add`](./env/add.md)
- [`nb env auth`](./env/auth.md)
- [`nb source download`](./source/download.md)
