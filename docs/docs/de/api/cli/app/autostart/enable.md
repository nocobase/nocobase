---
title: "nb app autostart enable"
description: "Referenz für nb app autostart enable: Aktivieren Sie den automatischen Start der Anwendung für eine lokale oder Docker-Env."
keywords: "nb app autostart enable,NocoBase CLI,Autostart,Env"
---

# nb app autostart enable

Aktiviert den Autostart-Marker für eine Env.

Dieser Marker gilt nur für `local`- oder `docker`-Envs, deren Laufzeit auf der aktuellen Maschine vom CLI verwaltet wird. Die Anwendung wird dadurch nicht sofort gestartet. Stattdessen wird die Env in die Menge aufgenommen, die später über `nb app autostart run` gestartet werden kann.

## Verwendung

```bash
nb app autostart enable [flags]
```

## Flags

| Flag | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name der CLI-Env, die zum Autostart hinzugefügt werden soll. Wenn weggelassen, wird die aktuelle Env verwendet |
| `--yes`, `-y` | boolean | Überspringt die interaktive Bestätigung, wenn ein explizites `--env` auf eine andere Env als die aktuelle zeigt |

## Beispiele

```bash
nb app autostart enable
nb app autostart enable --env app1
nb app autostart enable --env app1 --yes
```

## Hinweise

Das CLI prüft nur dann, ob sich die Ziel-Env von der aktuellen Env unterscheidet, wenn Sie `--env` explizit übergeben. In interaktiven Terminals wird zuerst bestätigt. In nicht interaktiven Terminals oder AI-Agent-Szenarien müssen Sie `--yes` selbst hinzufügen oder vorab mit `nb env use <name>` zur Ziel-Env wechseln.

Wenn die Ziel-Env keine vom CLI verwaltete `local`- oder `docker`-Laufzeit auf der aktuellen Maschine ist, schlägt der Befehl fehl und speichert keinen Autostart-Marker.

## Verwandte Befehle

- [`nb app autostart disable`](./disable.md)
- [`nb app autostart list`](./list.md)
- [`nb app autostart run`](./run.md)
