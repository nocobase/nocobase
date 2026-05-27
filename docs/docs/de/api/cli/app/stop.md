---
title: "nb app stop"
description: "Referenz für den Befehl nb app stop: NocoBase-Anwendung einer angegebenen env stoppen und in Docker-envs den Anwendungs-Container entfernen."
keywords: "nb app stop,NocoBase CLI,Anwendung stoppen,Docker"
---

# nb app stop

Stoppt die NocoBase-Anwendung der angegebenen env. Bei npm/Git-Installationen werden lokale Anwendungsprozesse gestoppt, bei Docker-Installationen wird der gespeicherte Anwendungs-Container entfernt.

## Verwendung

```bash
nb app stop [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name der zu stoppenden CLI env; bei Auslassung wird die aktuelle env verwendet |
| `--yes`, `-y` | boolean | Wenn ein explizit übergebenes `--env` auf eine andere env als die aktuelle env zeigt, die interaktive Bestätigung überspringen |
| `--verbose` | boolean | Ausgabe der zugrunde liegenden lokalen oder Docker-Befehle anzeigen |

## Beispiele

```bash
nb app stop
nb app stop --env local
nb app stop --env local --verbose
nb app stop --env local-docker
```

Wenn Sie `--env` explizit übergeben und es sich von der aktuellen env unterscheidet, fragt die CLI zuerst nach einer Bestätigung. In nicht interaktiven Terminals oder AI-Agent-Sitzungen fügen Sie `--yes` selbst hinzu oder führen zuerst `nb env use <name>` aus und versuchen es dann erneut.

## Verwandte Befehle

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb app down`](./down.md)
