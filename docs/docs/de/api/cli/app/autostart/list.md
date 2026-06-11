---
title: "nb app autostart list"
description: "Referenz für nb app autostart list: Zeigt den Autostart-Status aller konfigurierten Envs an."
keywords: "nb app autostart list,NocoBase CLI,Autostart,Env-Liste"
---

# nb app autostart list

Zeigt den Autostart-Status aller konfigurierten Envs an.

Die Tabelle enthält:

- `Current`: markiert die aktuelle Env mit `*`
- `Env`: Env-Name
- `Kind`: Env-Typ
- `Source`: Installations- oder Quelltyp
- `Autostart`: ob Autostart aktiviert ist

## Verwendung

```bash
nb app autostart list
```

## Beispiel

```bash
nb app autostart list
```

## Hinweise

Wenn noch keine Envs gespeichert wurden, gibt der Befehl `No environments are configured.` aus.

Dieser Befehl zeigt nur den gespeicherten CLI-Zustand an. Er prüft nicht, ob eine Anwendung bereits läuft, und auch nicht, ob Ihr Systemstartprozess bereits `nb app autostart run` aufruft. Sein Zweck ist vor allem, zu zeigen, welche Envs in der CLI-Konfiguration für Autostart markiert sind.

## Verwandte Befehle

- [`nb app autostart enable`](./enable.md)
- [`nb app autostart disable`](./disable.md)
- [`nb env list`](../../env/list.md)
