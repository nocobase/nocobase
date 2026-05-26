---
title: "nb app start"
description: "Referenz für den Befehl nb app start: NocoBase-Anwendung einer angegebenen env starten und bei Docker-envs den Anwendungs-Container anhand der gespeicherten Konfiguration neu erstellen."
keywords: "nb app start,NocoBase CLI,Anwendung starten,Docker,pm2"
---

# nb app start

Startet die NocoBase-Anwendung der angegebenen env. Bei npm/Git-Installationen werden lokale Anwendungsbefehle ausgeführt, bei Docker-Installationen wird der gespeicherte Anwendungs-Container anhand der gespeicherten env-Konfiguration neu erstellt.

## Verwendung

```bash
nb app start [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name der zu startenden CLI env; bei Auslassung wird die aktuelle env verwendet |
| `--yes`, `-y` | boolean | Wenn ein explizit übergebenes `--env` auf eine andere env als die aktuelle env zeigt, die interaktive Bestätigung überspringen |
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
nb app start --env local --verbose
nb app start --env local-docker
```

Wenn Sie `--env` explizit übergeben und es sich von der aktuellen env unterscheidet, fragt die CLI zuerst nach einer Bestätigung. In nicht interaktiven Terminals oder AI-Agent-Sitzungen fügen Sie `--yes` selbst hinzu oder führen zuerst `nb env use <name>` aus und versuchen es dann erneut.

Standardmäßig werden lokale envs im Hintergrund gestartet, und Docker-envs erstellen den Anwendungs-Container anhand der gespeicherten env-Konfiguration neu. Immer wenn die CLI auf die Bereitschaft der Anwendung warten muss, prüft sie `__health_check`: zuerst wird eine Wartezeile ausgegeben, danach alle 10 Sekunden eine Fortschrittszeile, bis die Anwendung verfügbar ist oder das Zeitlimit erreicht wird.

Wenn Sie für eine lokale env `--no-daemon` übergeben, läuft die Anwendung im Vordergrund. In diesem Fall wartet die CLI nach dem Start nicht weiter auf den Readiness-Check.

## Verwandte Befehle

- [`nb app stop`](./stop.md)
- [`nb app restart`](./restart.md)
- [`nb app logs`](./logs.md)
