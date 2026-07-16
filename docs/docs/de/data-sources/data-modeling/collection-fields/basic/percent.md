---
title: "Prozentsatz"
description: "Das Prozentfeld dient zum Speichern von Verhältniswerten wie Abschlussquoten, Rabattsätzen und Konversionsraten."
keywords: "Prozentsatz,percent,Verhältnis,Abschlussquote,NocoBase"
---

# Prozentsatz

## Einführung

In NocoBase wird **Prozentsatz (Percent)** zum Speichern und Anzeigen von Verhältniswerten verwendet.

Prozentfelder eignen sich für Geschäftsdaten wie Abschlussquoten, Rabattsätze, Konversionsraten und Anteile. Im Kern handelt es sich um ein Zahlenfeld, dessen Anzeige und Eingabe jedoch stärker an die Bedeutung eines Prozentsatzes angepasst sind.

Wenn es sich lediglich um gewöhnliche Beträge, Mengen oder Bewertungen handelt, ist [Zahl](./number.md) besser geeignet.

## Geeignete Anwendungsfälle

Prozentwerte eignen sich für folgende Geschäftsszenarien:

- Projektabschluss, Aufgabenfortschritt
- Rabatt, Steuersatz, Provisionsanteil
- Konversionsrate, Zielerreichung, Anteil
- Bewertungsgewichtung, Verteilungsverhältnis

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ der Datentabelle auf „Add field“ und wählen Sie „Prozentsatz“, um ein Prozentfeld zu erstellen.

![20240512175847](https://static-docs.nocobase.com/20240512175847.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Der Oberflächentyp des Feldes. Für Prozentsätze entspricht er `percent` und bestimmt, wie Werte auf der Seite eingegeben und angezeigt werden. |
| Field display name | Der in der Benutzeroberfläche angezeigte Name des Feldes, zum Beispiel „Abschlussquote“, „Rabatt“ oder „Konversionsrate“. Es wird empfohlen, einen für die Fachanwender unmittelbar verständlichen Namen zu verwenden. |
| Field name | Der Bezeichner des Feldes für interne Verweise in API, Beziehungsfeldern, Berechtigungen, Workflows usw. Nach der Erstellung wird er in der Regel nicht mehr geändert. Er darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Der Datentyp des Feldes auf Datenebene. Prozentfelder verwenden in der Regel `double`. Je nach erforderlicher Genauigkeit kann auch `decimal` gewählt werden. |
| Default value | Der Standardwert. Wenn der Benutzer beim Anlegen eines Datensatzes keinen Wert eingibt, kann automatisch der Standardwert übernommen werden. |
| Validation rules | Validierungsregeln. Damit können Mindestwert, Höchstwert oder eine Pflichtangabe festgelegt werden. |
| Description | Beschreibung des Feldes. Hier können Bedeutung, Eingabeanforderungen, Datenquelle oder zuständige Person dokumentiert werden. |

:::warning Hinweis

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um spätere Anpassungen an der Konfiguration zu vermeiden.

:::

## Feldeigenschaften

Das Standardverhalten von Prozentfeldern ist wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `percent`. |
| Standardmäßiger Field type | `double`. |
| Verfügbare Field types | `float`, `double`, `decimal`. |
| Seitenkomponente | Im Bearbeitungsmodus wird eine Eingabekomponente für Prozentsätze verwendet. |
| Filtern | Numerische Filter werden unterstützt, z. B. größer als, kleiner als, Bereich, leer und nicht leer. |
| Sortieren | Das Sortieren in Tabellenblöcken wird unterstützt. |
| Validierung | Validierungen wie Wertebereich und Pflichtangabe werden unterstützt. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Prozentfelds zu bearbeiten. Die Bearbeitung dient hauptsächlich dazu, die Anzeige und Verwendung des Feldes in NocoBase anzupassen, beispielsweise den Anzeigenamen, die Beschreibung, den Standardwert, die Validierungsregeln oder feldspezifische Einstellungen zu ändern.

Wenn das Feld aus einer bereits mit der Hauptdatenbank synchronisierten Tabelle stammt, handelt es sich bei der Bearbeitung in der Regel um eine Feldzuordnung – das Datenbankfeld wird einem Field type und einem Field interface in NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den in der Benutzeroberfläche angezeigten Namen des Feldes, ohne den Feldbezeichner zu ändern. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung in der Regel nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt | Bei Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann die Zuordnung angepasst werden. Dies wirkt sich auf Eingabe, Anzeige und Validierung auf der Seite aus. |
| Field type | Bedingt | Bei Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann die Zuordnung angepasst werden. Vor der Anpassung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert für neu angelegte Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt Bedeutung, Eingabeanforderungen, Datenquelle oder zuständige Person. |

:::warning Hinweis

Das Wechseln des Field type oder Field interface ist nicht mit einer einfachen Änderung des Anzeigenamens gleichzusetzen. Es beeinflusst die Speicherung des Feldes, die Eingabekomponente, die Validierungsregeln, die Filterbedingungen und die Verwendung von Workflow-Variablen. Bei einer großen Menge vorhandener Daten sollte zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Prozentfeld zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und anschließend gesammelt löschen.

Beim Löschen eines neu in der Hauptdatenbank erstellten Prozentfelds werden in der Regel sowohl die tatsächliche Spalte in der Datenbank als auch die bereits darin enthaltenen Daten gelöscht. Beim Löschen eines aus einer Datenbank synchronisierten oder einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und dem Ursprung des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann sich auf Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten auswirken. Prüfen Sie vor dem Löschen, ob das Feld noch von geschäftlichen Konfigurationen referenziert wird.

:::

## Verwendung in der Seitenkonfiguration

Prozentfelder eignen sich dazu, Verhältnisse in Geschäftsformularen, Dashboards, Diagrammen und Berichten darzustellen.
![20260709225150](https://static-docs.nocobase.com/20260709225150.png)

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Eingabe von Abschlussquoten, Rabatten, Steuersätzen und anderen Verhältniswerten. |
| Tabellenblock | Anzeigen, Sortieren und Filtern von Verhältniswerten. |
| Diagrammblock | Anzeigen von Anteilen, Konversionsraten und anderen Kennzahlen. |
| Workflows und Berechtigungen | Verwendung als Bedingungsfeld für Prüfungen, z. B. ob die Abschlussquote 100 % erreicht. |

## Weiterführende Links

- [Felder](../index.md) — Erfahren Sie mehr über Zweck, Kategorien und Zuordnungslogik von Feldern
- [Gewöhnliche Tabellen](../../../data-source-main/general-collection.md) — Felder in gewöhnlichen Tabellen erstellen und verwalten
- [Zahl](./number.md) — Gewöhnliche Zahlenwerte speichern
- [Formel](../../../field-formula/index.md) — Verhältniswerte berechnen