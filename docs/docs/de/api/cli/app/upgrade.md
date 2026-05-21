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
| `--yes`, `-y` | boolean | Wenn ein explizit übergebenes `--env` auf eine andere env als die aktuelle env zeigt, die interaktive Bestätigung überspringen |
| `--skip-code-update`, `-s` | boolean | Mit dem bereits gespeicherten lokalen Quellcode oder Docker-Image neu starten, ohne Aktualisierungen herunterzuladen |
| `--version` | string | Überschreibt die gespeicherte `downloadVersion`; bei erfolgreichem Upgrade wird die neue Version zurück in die env-Konfiguration geschrieben |
| `--verbose` | boolean | Ausgabe der zugrunde liegenden Aktualisierungs- und Neustartbefehle anzeigen |

## Beispiele

```bash
nb app upgrade
nb app upgrade --env local
nb app upgrade --env local -s
nb app upgrade --env local --version beta
nb app upgrade --env local --verbose
nb app upgrade --env local-docker -s
```

Wenn Sie `--env` explizit übergeben und es sich von der aktuellen env unterscheidet, fragt die CLI zuerst nach einer Bestätigung. In nicht interaktiven Terminals oder AI-Agent-Sitzungen fügen Sie `--yes` selbst hinzu oder führen zuerst `nb env use <name>` aus und versuchen es dann erneut.

## Verwandte Befehle

- [`nb source download`](../source/download.md)
- [`nb app restart`](./restart.md)
- [`nb self update`](../self/update.md)
