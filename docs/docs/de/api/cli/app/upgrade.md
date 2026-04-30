---
title: "nb app upgrade"
description: "Referenz für den Befehl nb app upgrade: Quellcode oder Image aktualisieren und angegebene NocoBase-Anwendung neu starten."
keywords: "nb app upgrade,NocoBase CLI,Upgrade,Aktualisieren,Docker-Image"
---

# nb app upgrade

Aktualisiert die angegebene NocoBase-Anwendung. Bei npm/Git-Installationen wird der gespeicherte Quellcode aktualisiert und die Anwendung mit quickstart neu gestartet; bei Docker-Installationen wird das gespeicherte Image aktualisiert und der Anwendungs-Container neu erstellt.

## Verwendung

```bash
nb app upgrade [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name der zu aktualisierenden CLI env; bei Auslassung wird die aktuelle env verwendet |
| `--skip-code-update`, `-s` | boolean | Mit dem bereits gespeicherten lokalen Quellcode oder Docker-Image neu starten, ohne Aktualisierungen herunterzuladen |
| `--verbose` | boolean | Ausgabe der zugrunde liegenden Aktualisierungs- und Neustartbefehle anzeigen |

## Beispiele

```bash
nb app upgrade
nb app upgrade --env local
nb app upgrade --env local -s
nb app upgrade --env local --verbose
nb app upgrade --env local-docker -s
```

## Verwandte Befehle

- [`nb source download`](../source/download.md)
- [`nb app restart`](./restart.md)
- [`nb self update`](../self/update.md)
