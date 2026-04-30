---
title: "nb env remove"
description: "nb env remove Befehlsreferenz: Entfernt die Konfiguration einer NocoBase CLI env."
keywords: "nb env remove,NocoBase CLI,Umgebung entfernen,Konfiguration entfernen"
---

# nb env remove

Entfernt eine konfigurierte env. Dieser Befehl löscht ausschließlich die CLI env-Konfiguration. Wenn Sie zusätzlich die lokale Anwendung, Container und Storage bereinigen möchten, verwenden Sie bitte [`nb app down`](../app/down.md).

## Verwendung

```bash
nb env remove <name> [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `<name>` | string | Name der zu entfernenden Umgebung |
| `--force`, `-f` | boolean | Bestätigung überspringen und direkt löschen |
| `--verbose` | boolean | Ausführliche Fortschrittsanzeige |

## Beispiele

```bash
nb env remove staging
nb env remove staging -f
```

## Verwandte Befehle

- [`nb app down`](../app/down.md)
- [`nb env list`](./list.md)
