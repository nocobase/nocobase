---
title: "nb source download"
description: "nb source download Befehlsreferenz: Bezieht NocoBase Quellcode oder Images von npm, Docker oder Git."
keywords: "nb source download,NocoBase CLI,Download,npm,Docker,Git"
---

# nb source download

Bezieht NocoBase von npm, Docker oder Git. `--version` ist der gemeinsame Versionsparameter aller drei Quellen: npm verwendet die Paketversion, Docker den Image-Tag und Git eine git ref.

## Verwendung

```bash
nb source download [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Standardwerte verwenden und interaktive Eingabeaufforderungen überspringen |
| `--verbose` | boolean | Ausführliche Befehlsausgabe anzeigen |
| `--locale` | string | Sprache der CLI-Eingabeaufforderungen: `en-US` oder `zh-CN` |
| `--source`, `-s` | string | Bezugsweise: `docker`, `npm` oder `git` |
| `--version`, `-v` | string | npm-Paketversion, Docker-Image-Tag oder Git ref |
| `--replace`, `-r` | boolean | Ersetzen, wenn das Zielverzeichnis bereits existiert |
| `--dev-dependencies`, `-D` / `--no-dev-dependencies` | boolean | Ob bei der npm/Git-Installation devDependencies installiert werden sollen |
| `--output-dir`, `-o` | string | Zielverzeichnis des Downloads oder Verzeichnis zum Speichern des Docker-Tarballs |
| `--git-url` | string | Adresse des Git-Repositorys |
| `--docker-registry` | string | Name der Docker-Image-Registry, ohne Tag |
| `--docker-platform` | string | Docker-Image-Plattform: `auto`, `linux/amd64`, `linux/arm64` |
| `--docker-save` / `--no-docker-save` | boolean | Ob das Docker-Image nach dem Pull als Tarball gespeichert wird |
| `--npm-registry` | string | Registry, die für npm/Git-Download und Abhängigkeitsinstallation verwendet wird |
| `--build` / `--no-build` | boolean | Ob nach der npm/Git-Abhängigkeitsinstallation gebaut wird |
| `--build-dts` | boolean | Ob beim npm/Git-Build TypeScript-Deklarationsdateien erzeugt werden |

## Beispiele

```bash
nb source download
nb source download -y --source npm --version alpha
nb source download -y --source npm --version alpha --no-build
nb source download --source npm --version alpha --output-dir=./app
nb source download --source docker --version alpha --docker-registry=nocobase/nocobase --docker-platform=linux/arm64
nb source download -y --source docker --version alpha --docker-save -o ./docker-images
nb source download --source git --version alpha --git-url=git@github.com:nocobase/nocobase.git
nb source download --source git --version fix/cli-v2
nb source download -y --source npm --version alpha --build-dts
nb source download -y --source npm --version alpha --npm-registry=https://registry.npmmirror.com
```

## Versionsaliase

Bei der Git-Quelle werden gängige dist-Tags auf entsprechende Branches aufgelöst: `latest` → `main`, `beta` → `next`, `alpha` → `develop`.

## Verwandte Befehle

- [`nb init`](../init.md)
- [`nb app upgrade`](../app/upgrade.md)
