---
title: "Einzeiliger Text"
description: "Das Feld für einzeiligen Text dient zum Speichern kurzer Textinhalte wie Namen, Nummern, Titeln und Kontaktdaten. Standardmäßig verwendet es den Typ string und das Eingabefeld Input."
keywords: "Einzeiliger Text,input,Textfeld,string,Field interface,NocoBase"
---

# Einzeiliger Text

## Einführung

In NocoBase ist **einzeiliger Text (Single line text)** das am häufigsten verwendete Textfeld. Es eignet sich zum Speichern kurzer Textinhalte, die in eine Zeile passen, zum Beispiel Kundennamen, Bestellnummern, Ansprechpartner, Adresszusammenfassungen oder IDs externer Systeme.

Das Feld für einzeiligen Text verwendet standardmäßig das Eingabefeld `Input`. Der Standardwert für den Field type ist `string`. Es kann als Titelfeld verwendet werden und in Filtern, Sortierungen, Berechtigungen, Workflow-Bedingungen und API-Abfragen zum Einsatz kommen.

Wenn der Inhalt möglicherweise Zeilenumbrüche benötigt oder länger ist, ist [mehrzeiliger Text](./textarea.md) in der Regel besser geeignet. Bei Inhalten mit einem festen Format, etwa E-Mail-Adressen, Telefonnummern oder URLs, sollten Sie bevorzugt das jeweils passende spezialisierte Feld verwenden.

## Geeignete Einsatzszenarien

Einzeiliger Text eignet sich für folgende Geschäftsszenarien:

- Kundenname, Firmenname, Name des Ansprechpartners
- Bestellnummer, Vertragsnummer, Projektnummer
- Aufgabentitel, Ticket-Titel, Artikeltitel
- ID eines externen Systems, Synchronisationsnummer, Geschäftscode
- Stadt, Adresszusammenfassung, Filialname und andere kurze Textinformationen

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ der Datentabelle auf „Add field“ und wählen Sie „Single line text“, um ein Feld für einzeiligen Text zu erstellen.

![20240512163555](https://static-docs.nocobase.com/20240512163555.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Oberflächentyp des Feldes. Für einzeiligen Text entspricht er `input`. Auf der Seite wird standardmäßig ein Eingabefeld zur Eingabe und Anzeige verwendet. |
| Field display name | Der im Benutzeroberfläche angezeigte Name des Feldes, zum Beispiel „Kundenname“, „Bestellnummer“ oder „Aufgabentitel“. Verwenden Sie möglichst eine Bezeichnung, die von den Fachanwendern direkt verstanden wird. |
| Field name | Bezeichnung des Feldbezeichners für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. Nach der Erstellung wird sie in der Regel nicht mehr geändert. Zulässig sind nur Buchstaben, Ziffern und Unterstriche; außerdem muss der Name mit einem Buchstaben beginnen. |
| Field type | Der Typ des Feldes auf Datenebene. Einzeiliger Text verwendet standardmäßig `string`, kann aber auch `uid` verwenden. Für gewöhnliche kurze Texte reicht `string` in der Regel aus. |
| Automatically remove heading and tailing spaces | Entfernt automatisch Leerzeichen am Anfang und Ende. Geeignet für Kundennamen, Nummern, Titel und andere Inhalte, bei denen führende oder nachfolgende Leerzeichen nicht beibehalten werden sollen. |
| Default value | Standardwert. Wenn der Benutzer beim Erstellen eines neuen Datensatzes keine Eingabe macht, kann automatisch ein Standardtext eingetragen werden. |
| Primary | Verwendet das Feld als Primärschlüssel. Diese Option ist nur beim Erstellen eines Feldes in der Hauptdatenbank verfügbar. Gewöhnliche Geschäftstexte sollten nicht als Primärschlüssel verwendet werden. |
| Unique | Eindeutigkeitsbedingung. Geeignet für Bestellnummern, Vertragsnummern, IDs externer Systeme und andere Texte, die nicht doppelt vorkommen dürfen. |
| Validation rules | Validierungsregeln. Damit können Mindestlänge, Maximallänge, feste Länge oder reguläre Ausdrücke festgelegt werden. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder zuständige Person dokumentiert werden. |

:::warning Hinweis

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um späteren Anpassungsaufwand zu vermeiden.

:::

## Feldeigenschaften

Das Feld für einzeiligen Text verhält sich standardmäßig wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiger Field interface | `input`. |
| Standardmäßiger Field type | `string`. |
| Verfügbare Field type | `string`, `uid`. |
| Seitenkomponente | Im Bearbeitungsmodus wird das Eingabefeld `Input` verwendet. |
| Titelfeld | Kann als Titelfeld der Datentabelle verwendet werden. Geeignet sind beispielsweise „Kundenname“, „Bestellnummer“ oder „Aufgabentitel“. |
| Sortierung | Unterstützt die Sortierung in Tabellenblöcken. |
| Filterung | Unterstützt textbasierte Filter wie enthält, enthält nicht, ist gleich, ist nicht gleich, ist leer oder ist nicht leer. |
| Validierung | Unterstützt Validierungen wie Mindestlänge, Maximallänge, feste Länge und reguläre Ausdrücke. |

## Konfiguration bearbeiten

Nach der Erstellung können Sie rechts neben dem Feld auf „Edit“ klicken, um die Konfiguration des Feldes für einzeiligen Text zu bearbeiten. Die Bearbeitung dient hauptsächlich dazu, die Darstellung und Verwendung des Feldes in NocoBase anzupassen, etwa den Anzeigenamen, die Beschreibung, den Standardwert, die Validierungsregeln oder das automatische Entfernen von Leerzeichen am Anfang und Ende zu ändern.

Wenn das Feld aus einer bereits mit der Hauptdatenbank synchronisierten Tabelle stammt, handelt es sich bei der Bearbeitung in der Regel um eine Feldzuordnung: Ein Datenbankfeld wird einem Field type und einem Field interface in NocoBase zugeordnet. Kurze Textspalten wie `varchar` und `char` in der Datenbank können beispielsweise einem Feld für einzeiligen Text zugeordnet werden.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den im Benutzeroberfläche angezeigten Namen des Feldes, nicht jedoch den Feldbezeichner. |
| Field name | Nein | Der Feldbezeichner kann im Bearbeitungsformular nach der Erstellung in der Regel nicht mehr geändert werden. |
| Field interface | Bedingt | Bei Feldern der Hauptdatenbank oder synchronisierten Feldern kann die Zuordnung angepasst werden. Dies wirkt sich auf Eingabe, Anzeige und Validierung auf der Seite aus. |
| Field type | Bedingt | Bei Feldern der Hauptdatenbank oder synchronisierten Feldern kann die Zuordnung angepasst werden. Prüfen Sie vor der Änderung, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Automatically remove heading and tailing spaces | Ja | Legt fest, ob beim Speichern Leerzeichen am Anfang und Ende entfernt werden. |
| Default value | Ja | Passt den Standardtext für neu erstellte Datensätze an. |
| Unique | Bedingt | Kann für neu erstellte Felder in der Hauptdatenbank konfiguriert werden. Wenn bereits doppelte Werte vorhanden sind, kann das Hinzufügen einer Eindeutigkeitsbedingung fehlschlagen. |
| Validation rules | Ja | Passt die Validierung von Länge, Format oder regulären Ausdrücken an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder zuständige Person. |

:::warning Hinweis

Das Wechseln des Field type oder Field interface ist nicht mit einer einfachen Änderung des Anzeigenamens gleichzusetzen. Es beeinflusst die Speicherung des Feldes, die Eingabekomponente, die Validierungsregeln, die Filterbedingungen und die Verwendung von Workflow-Variablen. Bei einer großen Menge vorhandener Daten sollten Sie zunächst prüfen, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Feld für einzeiligen Text zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und anschließend gesammelt löschen.

Beim Löschen eines in der Hauptdatenbank neu erstellten Feldes für einzeiligen Text werden in der Regel auch die entsprechende echte Datenbankspalte und die darin vorhandenen Daten gelöscht. Beim Löschen eines aus einer Datenbanksynchronisierung oder einer Zuordnung zu einer externen Datenquelle stammenden Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und dem Ursprung des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann sich auf Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten auswirken. Prüfen Sie vor dem Löschen, ob das Feld noch von Geschäftskonfigurationen verwendet wird.

:::

## Verwendung in der Seitenkonfiguration

Das Feld für einzeiligen Text kann in den meisten Szenarien mit Datenblöcken und Formularen verwendet werden.

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Eingabe oder Bearbeitung kurzer Textinhalte, etwa Kundenname, Bestellnummer oder Aufgabentitel. |
| Tabellenblock | Anzeige, Sortierung und Filterung kurzer Textinhalte. Bei längeren Inhalten wird der Text in der Tabelle entsprechend der Oberflächenkonfiguration gekürzt angezeigt. |
| Detailblock | Anzeige von Textinformationen eines einzelnen Datensatzes. |
| Filterblock | Verwendung als Abfragebedingung zum Filtern von Datensätzen, etwa nach Kundenname, Nummer oder Titel. |
| Anzeige von Beziehungsfeldern | Wenn das Feld für einzeiligen Text als Titelfeld festgelegt wurde, wird dieser Text bei der Auswahl eines Datensatzes in einem Beziehungsfeld bevorzugt angezeigt. |
| Workflows und Berechtigungen | Verwendung als Bedingungsfeld, etwa um zu prüfen, ob eine Bestellnummer leer ist oder ob ein Kundenname ein bestimmtes Schlüsselwort enthält. |

### Bearbeitungsmodus

Im Bearbeitungsmodus werden Inhalte des Feldes für einzeiligen Text über ein Eingabefeld eingegeben.

![20240512164001](https://static-docs.nocobase.com/20240512164001.png)

### Lesemodus

Im Lesemodus wird das Feld für einzeiligen Text als gewöhnlicher Text angezeigt.

![20240512164138](https://static-docs.nocobase.com/20240512164138.png)