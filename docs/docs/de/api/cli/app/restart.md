---
title: "nb app restart"
description: "Referenz für den Befehl nb app restart: NocoBase-Anwendung oder Docker-Container einer angegebenen env neu starten."
keywords: "nb app restart,NocoBase CLI,Anwendung neu starten,Docker"
---

# nb app restart

Stoppt die NocoBase-Anwendung der angegebenen env und startet sie anschließend wieder.

## Verwendung

```bash
nb app restart [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name der neu zu startenden CLI env; bei Auslassung wird die aktuelle env verwendet |
| `--yes`, `-y` | boolean | Wenn ein explizit übergebenes `--env` auf eine andere env als die aktuelle env zeigt, die interaktive Bestätigung überspringen |
| `--quickstart` | boolean | Anwendung nach dem Stoppen schnell starten |
| `--port`, `-p` | string | `appPort` aus der env-Konfiguration überschreiben |
| `--daemon`, `-d` / `--no-daemon` | boolean | Ob nach dem Stoppen im Daemon-Modus ausgeführt wird, standardmäßig aktiviert |
| `--instances`, `-i` | integer | Anzahl der nach dem Stoppen ausgeführten Instanzen |
| `--launch-mode` | string | Startmodus: `pm2` oder `node` |
| `--verbose` | boolean | Ausgabe der zugrunde liegenden Stop- und Startbefehle anzeigen |

## Beispiele

```bash
nb app restart
nb app restart --env local
nb app restart --env local --quickstart
nb app restart --env local --port 12000
nb app restart --env local --no-daemon
nb app restart --env local --instances 2
nb app restart --env local --launch-mode pm2
nb app restart --env local --verbose
nb app restart --env local-docker
```

Wenn Sie `--env` explizit übergeben und es sich von der aktuellen env unterscheidet, fragt die CLI zuerst nach einer Bestätigung. In nicht interaktiven Terminals oder AI-Agent-Sitzungen fügen Sie `--yes` selbst hinzu oder führen zuerst `nb env use <name>` aus und versuchen es dann erneut.

## Verwandte Befehle

- [`nb app start`](./start.md)
- [`nb app stop`](./stop.md)
- [`nb app logs`](./logs.md)
