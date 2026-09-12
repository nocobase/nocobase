---
title: "Datum und Uhrzeit (mit Zeitzone)"
description: "Das Feld „Datum und Uhrzeit (mit Zeitzone)“ speichert Datum und Uhrzeit mit Zeitzonensemantik."
keywords: "Datum und Uhrzeit,datetime,Zeitzone,NocoBase"
---

# Datum und Uhrzeit (mit Zeitzone)

## Einführung

In NocoBase wird **Datum und Uhrzeit (mit Zeitzone) (Date time with timezone)** verwendet, um Datum und Uhrzeit zu speichern und sie gemäß der Zeitzonensemantik zu verarbeiten.

Datum und Uhrzeit (mit Zeitzone) eignet sich für die Zusammenarbeit über Zeitzonen hinweg, internationale Geschäftsprozesse oder Szenarien, in denen ein eindeutiger Zeitpunkt erforderlich ist, zum Beispiel für die Erstellung von Terminen, Fristen oder Ausführungszeiten.

Wenn für den Geschäftsprozess nur ein lokaler Zeittext relevant ist und keine Zeitzonenumrechnung benötigt wird, können Sie [Datum und Uhrzeit (ohne Zeitzone)](./datetime-without-tz.md) auswählen. Wenn Sie nur das Datum benötigen, wählen Sie [Datum](./date.md).

## Geeignete Einsatzszenarien

Datum und Uhrzeit (mit Zeitzone) eignet sich für folgende Geschäftsszenarien:

- Beginnzeit von Besprechungen, Terminzeiten
- Aufgabenfristen, Ausführungszeiten
- Zeitpunkte in Geschäftsprozessen über mehrere Zeitzonen hinweg
- Zeitbezogene Bedingungen für die zeitgesteuerte Ausführung in Workflows

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ der Datentabelle auf „Add field“ und wählen Sie „Datum und Uhrzeit (mit Zeitzone)“ aus, um ein Feld für Datum und Uhrzeit (mit Zeitzone) zu erstellen.

![20240512181142](https://static-docs.nocobase.com/20240512181142.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Oberflächentyp des Feldes. Datum und Uhrzeit (mit Zeitzone) entspricht `datetime` und legt fest, wie das Feld auf der Seite eingegeben und angezeigt wird. |
| Field display name | Name, unter dem das Feld in der Benutzeroberfläche angezeigt wird, zum Beispiel „Beginnzeit“, „Frist“ oder „Ausführungszeit“. Es wird empfohlen, einen für die Fachanwender unmittelbar verständlichen Namen zu verwenden. |
| Field name | Bezeichner des Feldes für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. Nach der Erstellung wird er in der Regel nicht mehr geändert. Er darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Datentyp des Feldes auf Datenebene. Für Datum und Uhrzeit (mit Zeitzone) wird normalerweise `date` verwendet. |
| Default value | Standardwert. Beim Erstellen eines neuen Datensatzes kann dieser automatisch eingetragen werden, wenn der Benutzer keinen Wert eingibt. |
| Validation rules | Validierungsregeln. Es können unter anderem Pflichtfelder und Zeitbereiche konfiguriert werden. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder zuständige Personen angegeben werden. |

:::warning Hinweis

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Überprüfen Sie die Benennung vor der Erstellung sorgfältig, um späteren Konfigurationsaufwand durch Änderungen zu vermeiden.

:::

## Feldeigenschaften

Das Feld für Datum und Uhrzeit (mit Zeitzone) weist standardmäßig folgende Eigenschaften auf:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `datetime`. |
| Standardmäßiger Field type | `date`. |
| Optionaler Field type | `date`. |
| Seitenkomponente | Im Bearbeitungsmodus wird ein Datum-und-Uhrzeit-Auswahlfeld verwendet. |
| Filterung | Unterstützt die Filterung nach Zeitpunkt, Zeitraum, leer und nicht leer. |
| Sortierung | Unterstützt die Sortierung nach Zeit. |
| Validierung | Unterstützt unter anderem Pflichtfeld- und Zeitbereichsvalidierungen. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Feldes für Datum und Uhrzeit (mit Zeitzone) zu bearbeiten. Die Bearbeitung eines Feldes dient hauptsächlich dazu, die Darstellung und Verwendung des Feldes in NocoBase anzupassen, zum Beispiel durch Ändern des Anzeigenamens, der Beschreibung, des Standardwerts, der Validierungsregeln oder feldspezifischer Einstellungen.

Wenn das Feld aus einer Tabelle in der Hauptdatenbank stammt, die bereits synchronisiert wurde, handelt es sich bei der Bearbeitung in der Regel um eine Feldzuordnung: Das Datenbankfeld wird einem Field type und einem Field interface in NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den Anzeigenamen des Feldes in der Benutzeroberfläche, ohne den Feldbezeichner zu ändern. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung normalerweise nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt | Bei der Feldzuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann dieser Wert angepasst werden. Dies beeinflusst anschließend die Art der Eingabe, Darstellung und Validierung auf der Seite. |
| Field type | Bedingt | Bei der Feldzuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann dieser Wert angepasst werden. Vor der Änderung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert für neue Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder zuständige Personen. |

:::warning Hinweis

Das Wechseln des Field type oder Field interface ist nicht gleichbedeutend mit einer einfachen Änderung des Anzeigenamens. Es beeinflusst die Speicherweise des Feldes, die Eingabekomponente, die Validierungsregeln, die Filterbedingungen und die Verwendung in Workflow-Variablen. Bei einer größeren Menge vorhandener Daten sollte zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Feld für Datum und Uhrzeit (mit Zeitzone) zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und sie gesammelt löschen.

Beim Löschen eines in der Hauptdatenbank erstellten Feldes für Datum und Uhrzeit (mit Zeitzone) werden normalerweise auch die entsprechende physische Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines aus einer Datenbank synchronisierten oder aus einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und dem Ursprung des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten beeinträchtigen. Prüfen Sie vor dem Löschen, ob das Feld noch von geschäftlichen Konfigurationen referenziert wird.

:::

## Verwendung in Seitenkonfigurationen

Felder für Datum und Uhrzeit (mit Zeitzone) eignen sich für die Verwendung in Kalendern, Tabellen, Filtern und Workflows.
![20260709232355](https://static-docs.nocobase.com/20260709232355.png)

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Auswahl von Datum und Uhrzeit. |
| Tabellenblock | Anzeigen, Sortieren und Filtern von Zeitangaben. |
| Kalenderblock | Als Feld für die Beginn- oder Endzeit. |
| Workflow | Als Zeitbedingung oder zeitbezogenes Feld. |

## Weiterführende Links

- [Felder](../index.md) — Erfahren Sie mehr über Zweck, Kategorien und Zuordnungslogik von Feldern
- [Normale Tabellen](../../../data-source-main/general-collection.md) — Felder in normalen Tabellen erstellen und verwalten
- [Datum und Uhrzeit (ohne Zeitzone)](./datetime-without-tz.md) — Datum und Uhrzeit ohne Zeitzonenumrechnung speichern
- [Datum](./date.md) — Nur das Datum speichern
- [Uhrzeit](./time.md) — Nur die Uhrzeit speichern