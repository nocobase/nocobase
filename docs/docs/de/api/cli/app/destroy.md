---
title: "nb app destroy"
description: "Referenz für den Befehl nb app destroy: Entfernt für ein ausgewähltes env verwaltete Laufzeitressourcen, Storage-Daten und die gespeicherte env-Konfiguration."
keywords: "nb app destroy,NocoBase CLI,env löschen,Ressourcen bereinigen,Storage entfernen"
---

# nb app destroy

Zerstört ein ausgewähltes env, indem verwaltete Laufzeitressourcen, Storage-Daten und die gespeicherte CLI-env-Konfiguration entfernt werden.

Für lokale und Docker-env entfernt der Befehl zuerst die auf diesem Rechner verwalteten App-Laufzeitressourcen, entfernt bei Bedarf auch die Laufzeit der integrierten Datenbank, löscht die Storage-Daten und entfernt zuletzt die gespeicherte CLI-env-Konfiguration. Für HTTP- und SSH-env entfernt er nur die gespeicherte CLI-env-Konfiguration und berührt keine externen Dienste.

Für heruntergeladene lokale npm/Git-env entfernt der Befehl außerdem die vom CLI verwalteten lokalen Anwendungsdateien. Bei benutzerdefinierten lokalen app-Pfaden bleiben die lokalen Quelldateien erhalten; es werden nur die verwalteten Laufzeitressourcen, Storage-Daten und die gespeicherte env-Konfiguration entfernt.

Standardmäßig verlangt der Befehl eine Bestätigung. Im nicht interaktiven Modus müssen `--env` und `--force` explizit übergeben werden.

## Verwendung

```bash
nb app destroy [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--env`, `-e` | string | Name des CLI-env, das zerstört werden soll; im interaktiven Modus wird bei Auslassung standardmäßig das aktuelle env verwendet |
| `--force`, `-f` | boolean | Bestätigung überspringen und das ausgewählte env sofort zerstören; im nicht interaktiven Modus erforderlich |
| `--verbose` | boolean | Rohausgabe der Destroy-Befehle anzeigen |

## Beispiele

```bash
nb app destroy --env app1
nb app destroy --env app1 --force
```

## Verwandte Befehle

- [`nb app stop`](./stop.md)
- [`nb app down`](./down.md)
- [`nb env remove`](../env/remove.md)
