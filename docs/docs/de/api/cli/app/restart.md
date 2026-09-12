---
title: "nb app restart"
description: "Referenz für den Befehl nb app restart: NocoBase-Anwendung einer angegebenen env neu starten; sofern zutreffend, synchronisiert die CLI zuerst die durch die aktuelle Lizenz erlaubten kommerziellen Plugins, anschließend führen lokale envs beim Neustart automatisch die erforderliche Installations- oder Upgrade-Vorbereitung aus, und Docker-envs erstellen den Anwendungs-Container anhand der gespeicherten Konfiguration neu."
keywords: "nb app restart,NocoBase CLI,Anwendung neu starten,Docker"
---

# nb app restart

Stoppt die NocoBase-Anwendung der angegebenen env und startet sie anschließend wieder. Sofern zutreffend, synchronisiert die CLI zuerst die durch die aktuelle Lizenz erlaubten kommerziellen Plugins. Anschließend verwenden lokale envs den Ablauf von `nb app stop` und `nb app start` und führen vor dem erneuten Start automatisch die erforderliche Installations- oder Upgrade-Vorbereitung aus; Docker-envs entfernen zuerst den aktuellen Container und erstellen den Anwendungs-Container dann anhand der gespeicherten env-Konfiguration neu.

## Verwendung

```bash
nb app restart [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name der neu zu startenden CLI env; bei Auslassung wird die aktuelle env verwendet |
| `--yes`, `-y` | boolean | Wenn ein explizit übergebenes `--env` auf eine andere env als die aktuelle env zeigt, die interaktive Bestätigung überspringen |
| `--verbose` | boolean | Ausgabe der zugrunde liegenden Stop- und Startbefehle anzeigen |

## Beispiele

```bash
nb app restart
nb app restart --env local
nb app restart --env local --verbose
nb app restart --env local-docker
```

Wenn Sie `--env` explizit übergeben und es sich von der aktuellen env unterscheidet, fragt die CLI zuerst nach einer Bestätigung. In nicht interaktiven Terminals oder AI-Agent-Sitzungen fügen Sie `--yes` selbst hinzu oder führen zuerst `nb env use <name>` aus und versuchen es dann erneut.

Standardmäßig führt die CLI, sofern zutreffend, zuerst `nb license plugins sync --skip-if-no-license` aus, um die durch die aktuelle Lizenz erlaubten kommerziellen Plugins zu synchronisieren. Danach führen lokale envs vor dem erneuten Start automatisch die erforderliche Installations- oder Upgrade-Vorbereitung aus, und Docker-envs schließen diesen Schritt vor dem Neuerstellen des Containers ab. Immer wenn die CLI auf die Bereitschaft der Anwendung warten muss, prüft sie `__health_check`: zuerst wird eine Wartezeile ausgegeben, danach alle 10 Sekunden eine Fortschrittszeile, bis die Anwendung verfügbar ist oder das Zeitlimit erreicht wird. Wenn Sie fübergeben, läuft die Anwendung im Vordergrund, daher wartet die CLI nach dem Start nicht weiter auf den Readiness-Check.

## Hook-Skripte

Wenn das aktuelle env einen hook über `nb init --hook-script` gespeichert hat, führt `nb app restart` nach dem Neustart der App und bestandenem `__health_check` einmal `afterAppStart(context)` aus. Dabei gilt `context.phase = 'app-start'` und `context.command = 'app:restart'`.

## Verwandte Befehle

- [`nb app start`](./start.md)
- [`nb app stop`](./stop.md)
- [`nb app logs`](./logs.md)
