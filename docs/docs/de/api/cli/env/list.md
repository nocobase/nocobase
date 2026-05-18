---
title: "nb env list"
description: "nb env list Befehlsreferenz: Listet konfigurierte NocoBase CLI env auf."
keywords: "nb env list,NocoBase CLI,Umgebungsliste,API Base URL"
---

# nb env list

Listet alle konfigurierten env auf.

Dieser Befehl zeigt nur die gespeicherte Konfiguration an. Verwenden Sie standardmäßig [`nb env status`](./status.md), wenn Sie Statusinformationen prüfen möchten.

## Verwendung


nb env list

## Ausgabe

Die Ausgabetabelle enthält die Markierung der aktuellen Umgebung, den Namen, den Typ, `API Base URL`, den Authentifizierungstyp und die Laufzeitversion.

- `Current` markiert die aktuell wirksame env mit `*`
- `API Base URL` zeigt die gespeicherte rohe API-Adresse
- `Runtime` zeigt zwischengespeicherte Versionsinformationen der Runtime

## Beispiele


nb env list

## Verwandte Befehle

- [`nb env current`](./current.md)
- [`nb env status`](./status.md)
- [`nb env info`](./info.md)
- [`nb env use`](./use.md)
