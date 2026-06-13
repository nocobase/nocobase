---
title: "nb app start"
description: "Referenz für den Befehl nb app start: NocoBase-Anwendung einer angegebenen env starten; sofern zutreffend, synchronisiert die CLI zuerst die durch die aktuelle Lizenz erlaubten kommerziellen Plugins, anschließend führen lokale envs vor dem Start automatisch die erforderliche Installations- oder Upgrade-Vorbereitung aus, und Docker-envs erstellen den Anwendungs-Container anhand der gespeicherten Konfiguration neu."
keywords: "nb app start,NocoBase CLI,Anwendung starten,Docker,pm2"
---

# nb app start

Startet die NocoBase-Anwendung der angegebenen env. Sofern zutreffend, synchronisiert die CLI zuerst die durch die aktuelle Lizenz erlaubten kommerziellen Plugins. Anschließend wird bei npm/Git-Installationen vor dem Ausführen lokaler Anwendungsbefehle automatisch die erforderliche Installations- oder Upgrade-Vorbereitung durchgeführt; bei Docker-Installationen wird der gespeicherte Anwendungs-Container anhand der gespeicherten env-Konfiguration neu erstellt.

## Verwendung

```bash
nb app start [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name der zu startenden CLI env; bei Auslassung wird die aktuelle env verwendet |
| `--yes`, `-y` | boolean | Wenn ein explizit übergebenes `--env` auf eine andere env als die aktuelle env zeigt, die interaktive Bestätigung überspringen |
| `--verbose` | boolean | Ausgabe der zugrunde liegenden lokalen oder Docker-Befehle anzeigen |

## Beispiele

```bash
nb app start
nb app start --env local
nb app start --env local --verbose
nb app start --env local-docker
```

Wenn Sie `--env` explizit übergeben und es sich von der aktuellen env unterscheidet, fragt die CLI zuerst nach einer Bestätigung. In nicht interaktiven Terminals oder AI-Agent-Sitzungen fügen Sie `--yes` selbst hinzu oder führen zuerst `nb env use <name>` aus und versuchen es dann erneut.

Standardmäßig führt die CLI, sofern zutreffend, zuerst `nb license plugins sync --skip-if-no-license` aus, um die durch die aktuelle Lizenz erlaubten kommerziellen Plugins zu synchronisieren. Danach führen lokale envs vor dem Start im Hintergrund automatisch die erforderliche Installations- oder Upgrade-Vorbereitung aus, und Docker-envs erstellen den Anwendungs-Container anhand der gespeicherten env-Konfiguration neu. Immer wenn die CLI auf die Bereitschaft der Anwendung warten muss, prüft sie `__health_check`: zuerst wird eine Wartezeile ausgegeben, danach alle 10 Sekunden eine Fortschrittszeile, bis die Anwendung verfügbar ist oder das Zeitlimit erreicht wird.
## Verwandte Befehle

- [`nb app stop`](./stop.md)
- [`nb app restart`](./restart.md)
- [`nb app logs`](./logs.md)
