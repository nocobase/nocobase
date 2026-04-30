---
title: "nb init"
description: "Referenz für den Befehl nb init: NocoBase initialisieren, mit einer bestehenden Anwendung verbinden oder eine neue Anwendung installieren und als CLI env speichern."
keywords: "nb init,NocoBase CLI,Initialisierung,env,Docker,npm,Git"
---

# nb init

Initialisiert den aktuellen Arbeitsbereich, damit der coding agent NocoBase verbinden und nutzen kann. `nb init` kann sowohl mit einer bestehenden Anwendung verbinden als auch eine neue Anwendung über Docker, npm oder Git installieren.

## Verwendung

```bash
nb init [flags]
```

## Beschreibung

`nb init` unterstützt drei Eingabemodi:

- Standardmodus: Schrittweise Eingabe im Terminal.
- `--ui`: Öffnet ein lokales Browser-Formular für den Einrichtungsprozess.
- `--yes`: Überspringt die Eingabeaufforderungen und verwendet Standardwerte. In diesem Modus muss `--env <envName>` übergeben werden, und es wird eine neue lokale Anwendung erstellt.

Standardmäßig installiert oder aktualisiert `nb init` während der Initialisierung oder beim Wiederaufnehmen der Initialisierung die NocoBase AI coding skills. Wenn Sie skills selbst verwalten oder in CI- oder Offline-Umgebungen arbeiten, können Sie diesen Schritt mit `--skip-skills` überspringen.

Wenn die Initialisierung nach dem Speichern der env-Konfiguration unterbrochen wurde, können Sie mit `--resume` fortfahren:

```bash
nb init --env app1 --resume
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Eingabeaufforderungen überspringen, flags und Standardwerte verwenden |
| `--env`, `-e` | string | env-Name für diese Initialisierung; in den Modi `--yes` und `--resume` erforderlich |
| `--ui` | boolean | Visuellen Browser-Assistenten öffnen; kann nicht zusammen mit `--yes` verwendet werden |
| `--verbose` | boolean | Detaillierte Befehlsausgabe anzeigen |
| `--skip-skills` | boolean | Installation oder Aktualisierung der NocoBase AI coding skills während der Initialisierung überspringen |
| `--ui-host` | string | Bind-Adresse für den lokalen `--ui`-Dienst, Standard `127.0.0.1` |
| `--ui-port` | integer | Port für den lokalen `--ui`-Dienst; `0` bedeutet automatische Zuweisung |
| `--locale` | string | Sprache für CLI-Hinweise und UI: `en-US` oder `zh-CN` |
| `--api-base-url`, `-u` | string | NocoBase-API-Adresse mit `/api`-Präfix |
| `--auth-type`, `-a` | string | Authentifizierungsmethode: `token` oder `oauth` |
| `--access-token`, `-t` | string | API key oder access token für die `token`-Authentifizierung |
| `--resume` | boolean | Initialisierung mit der bereits gespeicherten Workspace env config fortsetzen |
| `--lang`, `-l` | string | Sprache der NocoBase-Anwendung nach der Installation |
| `--force`, `-f` | boolean | Bestehende env neu konfigurieren und bei Bedarf konfliktbehaftete Laufzeitressourcen ersetzen |
| `--app-root-path` | string | Lokales npm/Git-Quellverzeichnis der Anwendung, Standard `./<envName>/source/` |
| `--app-port` | string | Port der lokalen Anwendung, Standard `13000`; im `--yes`-Modus wird automatisch ein verfügbarer Port gewählt |
| `--storage-path` | string | Verzeichnis für hochgeladene Dateien und gehostete Datenbankdaten, Standard `./<envName>/storage/` |
| `--root-username` | string | Benutzername des initialen Administrators |
| `--root-email` | string | E-Mail-Adresse des initialen Administrators |
| `--root-password` | string | Passwort des initialen Administrators |
| `--root-nickname` | string | Anzeigename des initialen Administrators |
| `--builtin-db`, `--no-builtin-db` | boolean | Ob eine durch die CLI verwaltete eingebaute Datenbank erstellt werden soll |
| `--db-dialect` | string | Datenbanktyp: `postgres`, `mysql`, `mariadb`, `kingbase` |
| `--builtin-db-image` | string | Container-Image der eingebauten Datenbank |
| `--db-host` | string | Datenbankadresse |
| `--db-port` | string | Datenbankport |
| `--db-database` | string | Datenbankname |
| `--db-user` | string | Datenbankbenutzer |
| `--db-password` | string | Datenbankpasswort |
| `--fetch-source` | boolean | Vor der Installation Anwendungsdateien herunterladen oder Docker-Image abrufen |
| `--source`, `-s` | string | Methode zum Beziehen von NocoBase: `docker`, `npm` oder `git` |
| `--version`, `-v` | string | Versionsparameter: npm-Version, Docker-Image-Tag oder Git ref |
| `--replace`, `-r` | boolean | Zielverzeichnis ersetzen, falls es bereits existiert |
| `--dev-dependencies`, `-D` | boolean | Bei npm/Git-Installation auch devDependencies installieren |
| `--output-dir`, `-o` | string | Zielverzeichnis für den Download oder Speicherort des Docker-tarball |
| `--git-url` | string | Adresse des Git-Repositorys |
| `--docker-registry` | string | Docker-Image-registry-Name, ohne Tag |
| `--docker-platform` | string | Plattform des Docker-Images: `auto`, `linux/amd64`, `linux/arm64` |
| `--docker-save`, `--no-docker-save` | boolean | Ob das Docker-Image nach dem Pull als tarball gespeichert werden soll |
| `--npm-registry` | string | npm-registry, die für npm/Git-Downloads und Abhängigkeitsinstallation verwendet wird |
| `--build`, `--no-build` | boolean | Ob nach der Installation der npm/Git-Abhängigkeiten ein build durchgeführt werden soll |
| `--build-dts` | boolean | Ob beim npm/Git-build TypeScript-Deklarationsdateien erzeugt werden sollen |

## Beispiele

```bash
nb init
nb init --ui
nb init --env app1 --yes
nb init --env app1 --yes --skip-skills
nb init --env app1 --resume
nb init --env app1 --resume --skip-skills
nb init --env app1 --yes --source docker --version alpha
nb init --env app1 --yes --source npm --version alpha --app-port 13080
nb init --env app1 --yes --source git --version fix/cli-v2
nb init --ui --ui-port 3000
```

## Verwandte Befehle

- [`nb env add`](./env/add.md)
- [`nb source download`](./source/download.md)
