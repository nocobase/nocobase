---
title: "nb app autostart"
description: "Referenz für die Befehlsgruppe nb app autostart: Aktivieren oder deaktivieren Sie den Autostart für lokale oder Docker-Envs und starten Sie alle aktivierten Envs gesammelt."
keywords: "nb app autostart,NocoBase CLI,Autostart,local,docker"
---

# nb app autostart

Verwaltet Einstellungen für den automatischen Start der Anwendung.

Diese Befehlsgruppe deckt zwei Arten von Aufgaben ab:

- den Autostart-Marker für eine Env aktivieren oder deaktivieren
- alle Envs starten, für die Autostart bereits aktiviert wurde

`nb app autostart` gilt nur für Envs mit einer vom CLI verwalteten Laufzeit auf der aktuellen Maschine, also `local` und `docker`. Wenn eine Env nur eine entfernte API-Verbindung ist oder auf dieser Maschine keine durch das CLI startbare Anwendungslaufzeit hat, kann sie nicht in diesen Autostart-Ablauf aufgenommen werden.

## Verwendung

```bash
nb app autostart <command>
```

## Unterbefehle

| Befehl | Beschreibung |
| --- | --- |
| [`nb app autostart enable`](./enable.md) | Autostart für eine Env aktivieren |
| [`nb app autostart disable`](./disable.md) | Autostart für eine Env deaktivieren |
| [`nb app autostart list`](./list.md) | Autostart-Status aller Envs anzeigen |
| [`nb app autostart run`](./run.md) | Alle aktivierten Envs starten |

## Hinweise

`nb app autostart enable` markiert eine Env nur als automatisch startbar. Die Env wird dadurch nicht automatisch in den Systemstart eingebunden. In einer echten Produktionsumgebung rufen Sie `nb app autostart run` normalerweise zusätzlich über Ihren eigenen Startmechanismus auf, etwa mit `systemd`, einem Startskript Ihrer Container-Plattform oder einem anderen Host-Boot-Prozess.

Außerdem prüft `nb app autostart run` jede aktivierte Env nacheinander. Startbare Envs laufen intern über `nb app start --env <name> --yes` weiter. Envs, die auf der aktuellen Maschine nicht automatisch gestartet werden sollen, erscheinen in der Ergebnistabelle als `skipped` oder `failed`.

## Beispiele

```bash
nb app autostart enable
nb app autostart enable --env app1 --yes
nb app autostart list
nb app autostart run
nb app autostart run --verbose
```

## Verwandte Befehle

- [`nb app start`](../start.md)
- [`nb app stop`](../stop.md)
- [`nb env list`](../../env/list.md)
- [`nb env use`](../../env/use.md)
