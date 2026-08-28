---
title: "Telefonnummer"
description: "Das Telefonnummernfeld dient zum Speichern von Mobiltelefonnummern, Kontakttelefonnummern und anderen telefonbezogenen Texten und bietet eine Formatvalidierung."
keywords: "Telefonnummer,phone,Telefon,Kontaktinformationen,NocoBase"
---

# Telefonnummer

## Einführung

In NocoBase dient **Telefonnummer (Phone)** zum Speichern von Mobiltelefonnummern oder Kontakttelefonnummern.

Das Telefonnummernfeld eignet sich für Kundentelefonnummern, Kontakttelefonnummern, Mobiltelefonnummern von Mitarbeitenden und andere Kontaktinformationen. Für telefonbezogene Daten ist es besser geeignet als ein gewöhnliches Textfeld.

Wenn mehrere Telefonnummern oder komplexe Kontaktinformationen gespeichert werden müssen, können Sie [mehrzeiligen Text](./textarea.md) verwenden oder eine separate Kontakttabelle erstellen.

## Geeignete Einsatzszenarien

Das Telefonnummernfeld eignet sich für folgende Geschäftsszenarien:

- Mobiltelefonnummern von Kunden, Kontakttelefonnummern
- Mobiltelefonnummern von Mitarbeitenden, alternative Telefonnummern
- Kontakttelefonnummern von Filialen, Service-Hotlines
- Nummern für SMS-Benachrichtigungen

## Erstellung und Konfiguration

Klicken Sie auf der Seite „Configure fields“ der Datentabelle auf „Add field“ und wählen Sie „Telefonnummer“, um ein Telefonnummernfeld zu erstellen.

![20240512175526](https://static-docs.nocobase.com/20240512175526.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Oberflächentyp des Feldes. Für Telefonnummern entspricht er `phone` und bestimmt, wie der Wert auf der Seite eingegeben und angezeigt wird. |
| Field display name | Name, unter dem das Feld in der Benutzeroberfläche angezeigt wird, z. B. „Telefonnummer“, „Kontakttelefon“ oder „Service-Hotline“. Es wird empfohlen, einen für die Fachanwender direkt verständlichen Namen zu verwenden. |
| Field name | Bezeichner des Feldes für interne Verweise in API, Beziehungsfeldern, Berechtigungen, Workflows usw. Nach der Erstellung wird er normalerweise nicht mehr geändert. Er darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Datentyp des Feldes auf Datenebene. Der Feldtyp für Telefonnummern ist standardmäßig `string`. |
| Default value | Standardwert. Wenn der Benutzer beim Erstellen eines neuen Datensatzes keinen Wert eingibt, kann automatisch der Standardwert übernommen werden. |
| Validation rules | Validierungsregeln. Es können Länge, reguläre Ausdrücke oder die Pflichtangabe konfiguriert werden. |
| Description | Feldbeschreibung. Hier können die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder zuständige Person angegeben werden. |

:::warning Hinweis

Der Feldname wird nach der Erstellung von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Bestätigen Sie die Benennung vor der Erstellung, um spätere Konfigurationsanpassungen zu vermeiden.

:::

## Feldeigenschaften

Das Telefonnummernfeld verhält sich standardmäßig wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `phone`. |
| Standardmäßiger Field type | `string`. |
| Verfügbarer Field type | `string`. |
| Seitenkomponente | Im Bearbeitungsmodus wird ein Eingabefeld verwendet; außerdem kann eine Validierung des Telefonformats konfiguriert werden. |
| Filterung | Unterstützt textbasierte Filter, z. B. enthält, ist gleich, ist leer oder ist nicht leer. |
| Sortierung | Unterstützt die Sortierung in Tabellenblöcken. |
| Validierung | Unterstützt Validierungen wie Länge, reguläre Ausdrücke und Pflichtangaben. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Telefonnummernfelds zu bearbeiten. Die Bearbeitung eines Feldes dient hauptsächlich dazu, seine Darstellung und Verwendung in NocoBase anzupassen, beispielsweise durch Ändern des Anzeigenamens, der Beschreibung, des Standardwerts, der Validierungsregeln oder feldspezifischer Einstellungen.

Wenn das Feld aus einer bereits synchronisierten Tabelle der Hauptdatenbank stammt, dient die Bearbeitung normalerweise der Feldzuordnung: Dabei wird ein Datenbankfeld dem Field type und dem Field interface von NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den Anzeigenamen des Feldes in der Benutzeroberfläche, nicht jedoch den Feldbezeichner. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung normalerweise nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt unterstützt | Bei der Zuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann die Einstellung angepasst werden. Dies beeinflusst die Art der Eingabe, Anzeige und Validierung auf der Seite. |
| Field type | Bedingt unterstützt | Bei der Zuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann die Einstellung angepasst werden. Vor der Anpassung muss geprüft werden, ob vorhandene Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Ändert den Standardwert für neu erstellte Datensätze. |
| Validation rules | Ja | Ändert die Validierungsregeln des Feldes. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder zuständige Person. |

:::warning Hinweis

Der Wechsel von Field type oder Field interface ist nicht mit der einfachen Änderung eines Anzeigenamens gleichzusetzen. Er beeinflusst die Speicherweise des Feldes, die Eingabekomponente, Validierungsregeln, Filterbedingungen und die Verwendung von Workflow-Variablen. Bei einer großen Anzahl vorhandener Daten sollte zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Telefonnummernfeld zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und anschließend gesammelt löschen.

Beim Löschen eines in der Hauptdatenbank neu erstellten Telefonnummernfelds werden normalerweise auch die entsprechende physische Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines aus einer Datenbank synchronisierten oder aus einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und der Herkunft des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Import und Export sowie vorhandene Daten beeinflussen. Prüfen Sie vor dem Löschen, ob das Feld noch von Geschäftskonfigurationen referenziert wird.

:::

## Verwendung in der Seitenkonfiguration

Das Telefonnummernfeld eignet sich für Formulare, Detailansichten, Filter und Benachrichtigungen.
![20260709224555](https://static-docs.nocobase.com/20260709224555.png)

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Eingabe einer Mobiltelefonnummer oder Kontakttelefonnummer. |
| Detailblock | Anzeige von Kontaktinformationen. |
| Filterblock | Filtern von Datensätzen nach Telefonnummern oder Nummernfragmenten. |
| Workflows und Benachrichtigungen | Quelle der Nummer für SMS- und telefonbezogene Benachrichtigungen. |

## Verwandte Links

- [Feld](../index.md) — Informationen zur Funktion, Klassifizierung und Zuordnungslogik von Feldern
- [Standardtabelle](../../../data-source-main/general-collection.md) — Erstellen und Verwalten von Feldern in einer Standardtabelle
- [Einzeiliger Text](./input.md) — Speichern gewöhnlicher kurzer Texte
- [E-Mail](./email.md) — Speichern von E-Mail-Adressen
