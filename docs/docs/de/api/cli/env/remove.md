---
title: "nb env remove"
description: "nb env remove Befehlsreferenz: Stoppt verwaltete Laufzeitressourcen, bevor die env-Konfiguration entfernt wird, oder bereinigt bei Bedarf lokale CLI-Ressourcen vollständig."
keywords: "nb env remove,NocoBase CLI,Umgebung entfernen,Konfiguration entfernen,purge"
---

# nb env remove

Entfernt eine konfigurierte env. Bei lokalen und Docker-env stoppt dieser Befehl zuerst die von der CLI verwaltete App-Laufzeit und die integrierte Datenbank-Laufzeit auf diesem Rechner und entfernt danach die gespeicherte CLI-env-Konfiguration. Bei HTTP- und SSH-env wird nur die gespeicherte CLI-env-Konfiguration entfernt.

Wenn die entfernte env zugleich die aktuelle env ist, wählt die CLI automatisch eine neue aktuelle env aus den verbleibenden env. Wenn keine env mehr vorhanden ist, wird die aktuelle env geleert.

Standardmäßig verlangt der Befehl eine Bestätigung. Im nicht interaktiven Modus ist `--force` erforderlich, bevor der Befehl ausgeführt werden kann.

Mit `--purge` werden zusätzlich die von der CLI auf diesem Rechner verwalteten Ressourcen bereinigt. Für lokale und Docker-env entspricht `--purge` der Bereinigung von [`nb app destroy`](../app/destroy.md). Für HTTP- und SSH-env werden keine externen Dienste berührt; es wird nur die gespeicherte CLI-env-Konfiguration entfernt.

## Verwendung

```bash
nb env remove <name> [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `<name>` | string | Name der konfigurierten Umgebung, die entfernt werden soll |
| `--force`, `-f` | boolean | Bestätigung für den gewählten Remove-Modus überspringen; im nicht interaktiven Modus erforderlich |
| `--purge` | boolean | Entfernt zusätzlich von der CLI verwaltete lokale Laufzeitressourcen, Storage-Daten und – falls zutreffend – heruntergeladene lokale App-Dateien. Bei Remote-API-env wird nur die gespeicherte env-Konfiguration entfernt |
| `--verbose` | boolean | Ausführliche Fortschrittsanzeige |

## Beispiele

```bash
nb env remove staging
nb env remove staging --force
nb env remove staging --purge --force
```

## Verwandte Befehle

- [`nb app stop`](../app/stop.md)
- [`nb app destroy`](../app/destroy.md)
- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
