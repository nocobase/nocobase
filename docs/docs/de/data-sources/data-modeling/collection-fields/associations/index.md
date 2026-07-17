---
title: "Beziehungsfelder"
description: "Beziehungsfelder dienen dazu, Verknüpfungen zwischen Datentabellen herzustellen. Unterstützt werden die Beziehungstypen Eins-zu-eins, Eins-zu-viele, Viele-zu-eins, Viele-zu-viele und Viele-zu-viele als Array."
keywords: "Beziehungsfeld,BelongsTo,HasMany,O2O,O2M,M2O,M2M,Verknüpfungsfeld,NocoBase"
---

# Beziehungsfelder

In NocoBase werden **Beziehungsfelder** verwendet, um Verknüpfungen zwischen verschiedenen Datentabellen herzustellen. Dadurch kann ein Datensatz auf einen Datensatz in einer anderen Tabelle oder auf mehrere Datensätze verweisen, beispielsweise eine Bestellung auf einen Kunden, eine Aufgabe auf eine verantwortliche Person oder ein Schüler auf mehrere Kurse.

Beziehungsfelder unterscheiden sich in einigen Punkten von gewöhnlichen Feldern. Gewöhnliche Felder entsprechen in der Datenbank normalerweise echten Spalten und speichern Werte wie Text, Zahlen oder Datumsangaben. Beziehungsfelder speichern die Konfiguration der Verbindung zwischen Tabellen sowie die Schlüssel, anhand derer verknüpfte Datensätze gefunden werden. In der primären Datenbank kann ein Beziehungsfeld beim Erstellen die erforderliche Beziehungskonfiguration anlegen. Bei externen Datenbanken werden Beziehungen in der Regel auf Grundlage vorhandener Primärschlüssel, Fremdschlüssel oder eindeutiger Felder erstellt; die Tabellenstruktur der externen Datenbank wird dabei nicht automatisch geändert.

## Beziehungstyp auswählen

Die gängigsten Beziehungstypen sind:

| Beziehungstyp | Anwendungsfall |
| --- | --- |
| [Eins-zu-eins](./o2o/index.md) | Ein Datensatz ist jeweils nur mit einem Datensatz in der anderen Tabelle verknüpft. Zum Beispiel ist ein Mitarbeiter mit einer Personalakte verknüpft. |
| [Eins-zu-viele](./o2m/index.md) | Ein Datensatz ist mit mehreren Datensätzen in der anderen Tabelle verknüpft. Zum Beispiel ist ein Kunde mit mehreren Bestellungen verknüpft. |
| [Viele-zu-eins](./m2o/index.md) | Mehrere Datensätze sind mit demselben Zieldatensatz verknüpft. Zum Beispiel sind mehrere Bestellungen mit demselben Kunden verknüpft. |
| [Viele-zu-viele](./m2m/index.md) | Zwei Tabellen können jeweils mit mehreren Datensätzen der anderen Tabelle verknüpft sein. Zum Beispiel können Schüler und Kurse jeweils mehreren Einträgen der anderen Tabelle zugeordnet werden. |
| [Viele-zu-viele (Array)](../../../field-m2m-array/index.md) | Mehrere Bezeichner von Zieldatensätzen werden in einem Array-Feld gespeichert. Dies eignet sich für vorhandene Tabellenstrukturen, in denen Verknüpfungswerte bereits als Array gespeichert werden. |

Gehen Sie standardmäßig zunächst von der fachlichen Bedeutung aus: Wenn der aktuelle Datensatz nur zu einem Zieldatensatz gehört, wird normalerweise eine Viele-zu-eins-Beziehung verwendet. Wenn der aktuelle Datensatz mehrere Datensätze der Zieltabelle anzeigen soll, wird normalerweise eine Eins-zu-viele-Beziehung verwendet. Wenn beide Seiten mit mehreren Datensätzen verknüpft werden können, wird normalerweise eine Viele-zu-viele-Beziehung verwendet.

## Wichtige Konfigurationspunkte

Achten Sie bei der Konfiguration eines Beziehungsfelds insbesondere auf folgende Punkte:

- Zieltabelle: Mit welcher Tabelle soll die Beziehung verknüpft werden?
- Beziehungstyp: Eins-zu-eins, Eins-zu-viele, Viele-zu-eins, Viele-zu-viele oder Viele-zu-viele als Array
- Beziehungsschlüssel: Anhand welcher Felder werden die Datensätze auf beiden Seiten identifiziert? In der Regel sind dies Primärschlüssel, Fremdschlüssel oder eindeutige Felder.
- Titelfeld: Welches Feld des verknüpften Datensatzes wird standardmäßig in Auswahlfeldern und Blöcken angezeigt?

:::warning Hinweis

Beziehungsfelder in externen Datenbanken bestehen hauptsächlich aus Beziehungsmetadaten, die von NocoBase gespeichert werden. Beim Hinzufügen eines Beziehungsfelds werden in der externen Datenbank nicht automatisch echte Fremdschlüssel, Indizes oder Zwischentabellen erstellt. Wenn Einschränkungen auf Datenbankebene erforderlich sind, richten Sie diese zuerst auf Datenbankseite ein und synchronisieren und konfigurieren Sie anschließend das Feld in NocoBase.

:::

## Weitere Links

- [Eins-zu-eins](./o2o/index.md) — Konfiguration von Eins-zu-eins-Beziehungsfeldern anzeigen
- [Eins-zu-viele](./o2m/index.md) — Konfiguration von Eins-zu-viele-Beziehungsfeldern anzeigen
- [Viele-zu-eins](./m2o/index.md) — Konfiguration von Viele-zu-eins-Beziehungsfeldern anzeigen
- [Viele-zu-viele](./m2m/index.md) — Konfiguration von Viele-zu-viele-Beziehungsfeldern anzeigen
- [Viele-zu-viele (Array)](../../../field-m2m-array/index.md) — Array-basierte Viele-zu-viele-Beziehungen anzeigen
