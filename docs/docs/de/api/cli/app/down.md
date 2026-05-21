---
title: "nb app down"
description: "Referenz für den Befehl nb app down: Lokale Laufzeitressourcen einer angegebenen env stoppen und bereinigen."
keywords: "nb app down,NocoBase CLI,Ressourcen bereinigen,Container löschen,storage"
---

# nb app down

Stoppt und bereinigt die lokalen Laufzeitressourcen einer angegebenen env. Standardmäßig bleiben storage-Daten und env-Konfiguration erhalten; um alle Inhalte zu löschen, müssen Sie explizit `--all --force` übergeben.

## Verwendung

```bash
nb app down [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name der zu bereinigenden CLI env; bei Auslassung wird die aktuelle env verwendet |
| `--all` | boolean | Alle Inhalte dieser env einschließlich storage-Daten und gespeicherter env-Konfiguration löschen |
| `--yes`, `-y` | boolean | Wenn ein explizit übergebenes `--env` auf eine andere env als die aktuelle env zeigt, die interaktive Bestätigung überspringen |
| `--force`, `-f` | boolean | Erzwingt eine destruktive Bereinigung, z. B. mit `--all` oder andere risikoreiche Bereinigungen im nicht interaktiven Modus |
| `--verbose` | boolean | Ausgabe der zugrunde liegenden Stop- und Bereinigungsbefehle anzeigen |

## Beispiele

```bash
nb app down --env app1
nb app down --env app1 --all --force
nb app down --env app1 --force
```

`--yes` überspringt nur die interaktive Bestätigung, wenn ein explizit übergebenes `--env` auf eine andere env als die aktuelle env zeigt. `--force` dient dazu, eine destruktive Bereinigung wirklich zu erzwingen, z. B. mit `--all` oder bei anderen Bereinigungen mit hohem Risiko im nicht interaktiven Modus.

## Verwandte Befehle

- [`nb app stop`](./stop.md)
- [`nb env remove`](../env/remove.md)
- [`nb db stop`](../db/stop.md)
