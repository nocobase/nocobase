---
title: "nb env remove"
description: "nb env remove Befehlsreferenz: Entfernt die Konfiguration einer NocoBase CLI env."
keywords: "nb env remove,NocoBase CLI,Umgebung entfernen,Konfiguration entfernen"
---

# nb env remove

Entfernt eine konfigurierte env. Dieser Befehl entfernt nur die gespeicherte CLI-env-Konfiguration und bereinigt keine lokalen App-Verzeichnisse, Container oder Storage-Daten. Wenn Sie lokale Laufzeitressourcen bereinigen möchten, verwenden Sie [`nb app down`](../app/down.md).

Wenn die entfernte env zugleich die aktuelle env ist, wählt die CLI automatisch eine neue aktuelle env aus den verbleibenden env. Wenn keine env mehr vorhanden ist, wird die aktuelle env geleert.

Standardmäßig verlangt der Befehl eine Bestätigung. Um die Bestätigung zu überspringen, geben Sie `--yes` an. Im nicht interaktiven Modus ist `--yes` erforderlich, bevor die env entfernt werden kann.

## Verwendung

```bash
nb env remove <name> [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `<name>` | string | Name der konfigurierten Umgebung, die entfernt werden soll |
| `--yes`, `-y` | boolean | Bestätigung überspringen und die gespeicherte CLI-env-Konfiguration entfernen |
| `--verbose` | boolean | Ausführliche Fortschrittsanzeige |

## Beispiele

```bash
nb env remove staging
nb env remove staging --yes
```

## Verwandte Befehle

- [`nb app down`](../app/down.md)
- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
