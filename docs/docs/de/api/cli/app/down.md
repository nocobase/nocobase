---
title: "nb app down"
description: "Referenz für den Befehl nb app down: Lokale Laufzeitressourcen einer angegebenen env stoppen und bereinigen."
keywords: "nb app down,NocoBase CLI,Ressourcen bereinigen,Container löschen,storage"
---

# nb app down

Stoppt und bereinigt die lokalen Laufzeitressourcen einer angegebenen env. Standardmäßig bleiben storage-Daten und env-Konfiguration erhalten; um alle Inhalte zu löschen, müssen Sie explizit `--all --yes` übergeben.

## Verwendung

```bash
nb app down [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name der zu bereinigenden CLI env; bei Auslassung wird die aktuelle env verwendet |
| `--all` | boolean | Alle Inhalte dieser env einschließlich storage-Daten und gespeicherter env-Konfiguration löschen |
| `--yes`, `-y` | boolean | Bestätigung für destruktive Aktionen überspringen, üblicherweise zusammen mit `--all` verwendet |
| `--verbose` | boolean | Ausgabe der zugrunde liegenden Stop- und Bereinigungsbefehle anzeigen |

## Beispiele

```bash
nb app down --env app1
nb app down --env app1 --all --yes
```

## Verwandte Befehle

- [`nb app stop`](./stop.md)
- [`nb env remove`](../env/remove.md)
- [`nb db stop`](../db/stop.md)
