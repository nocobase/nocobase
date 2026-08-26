---
title: "nb app autostart run"
description: "Referenz für nb app autostart run: Startet alle Envs, für die der automatische Start der Anwendung aktiviert wurde."
keywords: "nb app autostart run,NocoBase CLI,Autostart,Sammelstart"
---

# nb app autostart run

Startet alle Envs, für die der automatische Start der Anwendung aktiviert wurde.

Dieser Befehl wird typischerweise nach dem Booten des Host-Systems über Ihren eigenen Startmechanismus aufgerufen. Das CLI liest alle gespeicherten Envs, filtert die mit aktiviertem Autostart und versucht dann, sie nacheinander zu starten.

## Verwendung

```bash
nb app autostart run [flags]
```

## Flags

| Flag | Typ | Beschreibung |
| --- | --- | --- |
| `--verbose` | boolean | Zeigt die rohe Startausgabe der zugrunde liegenden lokalen oder Docker-Befehle |

## Beispiele

```bash
nb app autostart run
nb app autostart run --verbose
```

## Hinweise

Wenn keine Env Autostart aktiviert hat, gibt der Befehl `No environments have app autostart enabled.` aus.

Während der Ausführung verarbeitet das CLI jede aktivierte Env einzeln:

- startbare Envs erscheinen als `started`
- Envs, die auf der aktuellen Maschine nicht automatisch gestartet werden sollen, erscheinen als `skipped`
- Envs, die beim Start fehlschlagen, erscheinen als `failed`

Intern ruft dieser Befehl `nb app start --env <name> --yes` auf. Wenn Sie `--verbose` übergeben, wird dieses Flag ebenfalls an den zugrunde liegenden Startablauf weitergereicht.

Wenn mindestens ein Ergebnis `failed` ist, beendet sich der Befehl mit einem Fehler und gibt `Some app autostart envs failed to start.` aus. So werden Fehler in `systemd`, CI oder anderen Startmechanismen des Hosts klar sichtbar.

## Verwandte Befehle

- [`nb app autostart enable`](./enable.md)
- [`nb app start`](../start.md)
- [`nb app logs`](../logs.md)
