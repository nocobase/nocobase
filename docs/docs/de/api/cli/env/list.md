---
title: "nb env list"
description: "nb env list Befehlsreferenz: Listet die konfigurierten NocoBase CLI env und den API-Authentifizierungsstatus auf."
keywords: "nb env list,NocoBase CLI,Umgebungsliste,Authentifizierungsstatus"
---

# nb env list

Listet alle konfigurierten env auf und prüft den API-Authentifizierungsstatus der Anwendung anhand der gespeicherten Token-/OAuth-Anmeldedaten.

## Verwendung

```bash
nb env list
```

## Ausgabe

Die Ausgabetabelle enthält die Markierung der aktuellen Umgebung, den Namen, den Typ, den App Status, die URL, die Authentifizierungsmethode sowie die Laufzeitversion.

`App Status` zeigt den Status an, der zurückgegeben wird, wenn die CLI mit den Authentifizierungsinformationen der aktuellen env auf die Anwendungs-API zugreift, beispielsweise `ok`, `auth failed`, `unreachable` oder `unconfigured`. Den Laufzeitstatus der Datenbank prüfen Sie bitte mit [`nb db ps`](../db/ps.md).

## Beispiele

```bash
nb env list
```

## Verwandte Befehle

- [`nb env info`](./info.md)
- [`nb env use`](./use.md)
- [`nb db ps`](../db/ps.md)
