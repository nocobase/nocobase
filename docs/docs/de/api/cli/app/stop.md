---
title: "nb app stop"
description: "Referenz für den Befehl nb app stop: NocoBase-Anwendung oder Docker-Container einer angegebenen env stoppen."
keywords: "nb app stop,NocoBase CLI,Anwendung stoppen,Docker"
---

# nb app stop

Stoppt die NocoBase-Anwendung der angegebenen env. Bei npm/Git-Installationen werden lokale Anwendungsprozesse gestoppt, bei Docker-Installationen wird der gespeicherte Anwendungs-Container gestoppt.

## Verwendung

```bash
nb app stop [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name der zu stoppenden CLI env; bei Auslassung wird die aktuelle env verwendet |
| `--verbose` | boolean | Ausgabe der zugrunde liegenden lokalen oder Docker-Befehle anzeigen |

## Beispiele

```bash
nb app stop
nb app stop --env local
nb app stop --env local --verbose
nb app stop --env local-docker
```

## Verwandte Befehle

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb app down`](./down.md)
