---
title: "nb license id"
description: "Referenz für den Befehl nb license id: Die Instanz-ID der kommerziellen Lizenz einer ausgewählten env anzeigen oder neu erzeugen."
keywords: "nb license id,NocoBase CLI,instance id"
---

# nb license id

Zeigt die Instanz-ID der kommerziellen Lizenz für die ausgewählte env an. Wenn noch keine gespeicherte Instanz-ID vorhanden ist, erzeugt und speichert die CLI automatisch eine.

## Verwendung

```bash
nb license id [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name der CLI-env; wenn weggelassen, wird die aktuelle env verwendet |
| `--yes`, `-y` | boolean | Wenn ein explizit übergebenes `--env` auf eine andere env als die aktuelle env zeigt, die interaktive Bestätigung überspringen |
| `--force` | boolean | Instanz-ID neu erzeugen, auch wenn bereits eine gespeichert ist |
| `--json` | boolean | JSON ausgeben |

## Beispiele

```bash
nb license id
nb license id --env app1
nb license id --env app1 --yes
nb license id --env app1 --force
nb license id --env app1 --json
```

`--force` erzwingt nur die Neuerzeugung der Instanz-ID. Es ersetzt keine env-übergreifende Bestätigung; wenn ein explizit übergebenes `--env` auf eine nicht aktuelle env zeigt, benötigen Sie weiterhin eine Bestätigung oder `--yes`.

## Verwandte Befehle

- [`nb license activate`](./activate.md)
- [`nb license status`](./status.md)
