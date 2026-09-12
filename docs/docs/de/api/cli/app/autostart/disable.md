---
title: "nb app autostart disable"
description: "Referenz für nb app autostart disable: Deaktivieren Sie den automatischen Start der Anwendung für eine Env."
keywords: "nb app autostart disable,NocoBase CLI,Autostart,Env"
---

# nb app autostart disable

Deaktiviert den Autostart-Marker für eine Env.

Danach nimmt diese Env nicht mehr an `nb app autostart run` teil. Eine bereits laufende Anwendung wird durch diesen Befehl nicht direkt gestoppt. Wenn Sie auch die aktuelle Laufzeit stoppen möchten, verwenden Sie zusätzlich `nb app stop`.

## Verwendung

```bash
nb app autostart disable [flags]
```

## Flags

| Flag | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name der CLI-Env, die aus dem Autostart entfernt werden soll. Wenn weggelassen, wird die aktuelle Env verwendet |
| `--yes`, `-y` | boolean | Überspringt die interaktive Bestätigung, wenn ein explizites `--env` auf eine andere Env als die aktuelle zeigt |

## Beispiele

```bash
nb app autostart disable
nb app autostart disable --env app1
nb app autostart disable --env app1 --yes
```

## Hinweise

Dieser Befehl ändert nur den gespeicherten Autostart-Marker. Die Anwendung selbst wird nicht direkt gestoppt. Wenn eine Env vorher ohnehin keinen Autostart hatte, bleibt sie einfach deaktiviert.

Wie bei `enable` prüft das CLI eine env-übergreifende Bestätigung nur dann, wenn `--env` explizit angegeben wurde. In nicht interaktiven Terminals oder AI-Agent-Szenarien müssen Sie `--yes` bei Bedarf selbst ergänzen.

## Verwandte Befehle

- [`nb app autostart enable`](./enable.md)
- [`nb app autostart list`](./list.md)
- [`nb app stop`](../stop.md)
