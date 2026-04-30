---
title: "nb app start"
description: "Referenz für den Befehl nb app start: NocoBase-Anwendung oder Docker-Container einer angegebenen env starten."
keywords: "nb app start,NocoBase CLI,Anwendung starten,Docker,pm2"
---

# nb app start

Startet die NocoBase-Anwendung der angegebenen env. Bei npm/Git-Installationen werden lokale Anwendungsbefehle ausgeführt, bei Docker-Installationen wird der gespeicherte Anwendungs-Container gestartet.

## Verwendung

```bash
nb app start [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name der zu startenden CLI env; bei Auslassung wird die aktuelle env verwendet |
| `--quickstart` | boolean | Anwendung schnell starten |
| `--port`, `-p` | string | `appPort` aus der env-Konfiguration überschreiben |
| `--daemon`, `-d` / `--no-daemon` | boolean | Ob im Daemon-Modus ausgeführt wird, standardmäßig aktiviert |
| `--instances`, `-i` | integer | Anzahl der ausgeführten Instanzen |
| `--launch-mode` | string | Startmodus: `pm2` oder `node` |
| `--verbose` | boolean | Ausgabe der zugrunde liegenden lokalen oder Docker-Befehle anzeigen |

## Beispiele

```bash
nb app start
nb app start --env local
nb app start --env local --quickstart
nb app start --env local --port 12000
nb app start --env local --daemon
nb app start --env local --no-daemon
nb app start --env local --instances 2
nb app start --env local --launch-mode pm2
nb app start --env local-docker
```

## Verwandte Befehle

- [`nb app stop`](./stop.md)
- [`nb app restart`](./restart.md)
- [`nb app logs`](./logs.md)
