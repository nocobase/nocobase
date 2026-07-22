---
title: "Anhang-URL"
description: "Das Feld „Anhang-URL“ speichert Adressen externer Dateien und eignet sich für Szenarien, in denen die eigentlichen Dateien nicht hochgeladen werden."
keywords: "Anhang-URL,attachment url,externe Datei,URL,NocoBase"
---

# Anhang-URL

## Einführung

In NocoBase wird **Anhang-URL (Attachment URL)** zum Speichern der Zugriffsadresse einer externen Datei verwendet.

Das Feld „Anhang-URL“ eignet sich für Szenarien, in denen Dateien bereits in einem externen System, einem Objektspeicher oder einem CDN gespeichert sind und in NocoBase nur die Zugriffsadresse gespeichert werden soll.

Wenn NocoBase Dateien hochladen und verwalten soll, wählen Sie [Anhang](../file-manager/field-attachment.md). Wenn es sich lediglich um eine gewöhnliche Webadresse handelt, wählen Sie [URL](../data-modeling/collection-fields/basic/url.md).

## Geeignete Einsatzszenarien

Das Feld „Anhang-URL“ eignet sich für folgende Geschäftsszenarien:

- Adressen von Dateien in externen Objektspeichern
- Bildadressen von CDNs
- Dokumentadressen von Drittanbietersystemen
- Dateilinks nach der Migration historischer Daten

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ der Datentabelle auf „Add field“ und wählen Sie „Anhang-URL“, um ein Feld „Anhang-URL“ zu erstellen.

![20241017092323](https://static-docs.nocobase.com/20241017092323.png)

![20241017092456](https://static-docs.nocobase.com/20241017092456.png)

![20241017092759](https://static-docs.nocobase.com/20241017092759.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Oberflächentyp des Feldes. Für „Anhang-URL“ entspricht dieser `attachmentUrl` und legt fest, wie das Feld auf der Seite eingegeben und angezeigt wird. |
| Field display name | Name, unter dem das Feld in der Benutzeroberfläche angezeigt wird, z. B. „Dateiadresse“, „Bild-URL“ oder „Externer Anhang“. Es empfiehlt sich, eine für die zuständigen Mitarbeitenden unmittelbar verständliche Bezeichnung zu verwenden. |
| Field name | Bezeichner des Feldes für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. Nach der Erstellung wird er in der Regel nicht mehr geändert. Er darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Datentyp des Feldes auf Datenebene. Für „Anhang-URL“ wird die Adresse in der Regel mit `string` oder `text` gespeichert. |
| Default value | Standardwert. Wenn beim Anlegen eines Datensatzes kein Wert eingegeben wird, kann automatisch der Standardwert übernommen werden. |
| Validation rules | Validierungsregeln. Es können beispielsweise URL-Format, Länge oder Pflichtfeldstatus konfiguriert werden. |
| Description | Beschreibung des Feldes. Hier können Bedeutung, Eingabeanforderungen, Datenquelle oder verantwortliche Person festgehalten werden. |

:::warning Achtung

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um spätere Anpassungen an der Konfiguration zu vermeiden.

:::

## Feldeigenschaften

Das Feld „Anhang-URL“ weist standardmäßig folgende Eigenschaften auf:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `attachmentUrl`. |
| Standardmäßiger Field type | `string`. |
| Optionale Field types | `string`, `text`, abhängig von der tatsächlichen Feldkonfiguration. |
| Seitenkomponente | Im Bearbeitungsmodus wird eine Eingabekomponente für URLs oder Anhangsadressen verwendet. |
| Filterung | Unterstützt textbasierte Filter und die Prüfung auf leere Werte. |
| Sortierung | Wird in der Regel nicht zur Sortierung verwendet. |
| Validierung | Unterstützt Validierungen wie URL-Format, Länge und Pflichtfeldstatus. |

## Feldkonfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Feldes „Anhang-URL“ zu bearbeiten. Die Bearbeitung dient hauptsächlich dazu, die Darstellung und Verwendung des Feldes in NocoBase anzupassen, beispielsweise den Anzeigenamen, die Beschreibung, den Standardwert, die Validierungsregeln oder feldspezifische Einstellungen zu ändern.

Stammt das Feld aus einer bereits synchronisierten Tabelle der Hauptdatenbank, handelt es sich bei der Bearbeitung in der Regel um eine Feldzuordnung – das Datenbankfeld wird einem Field type und einem Field interface in NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den Anzeigenamen des Feldes in der Benutzeroberfläche, ohne den Feldbezeichner zu ändern. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung in der Regel nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt | Felder aus der Hauptdatenbank oder synchronisierte Felder können bei der Feldzuordnung angepasst werden. Dies beeinflusst die Eingabe, Darstellung und Validierung auf den Seiten. |
| Field type | Bedingt | Felder aus der Hauptdatenbank oder synchronisierte Felder können bei der Feldzuordnung angepasst werden. Vor der Änderung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert für neu angelegte Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt Bedeutung, Eingabeanforderungen, Datenquelle oder verantwortliche Person. |

:::warning Achtung

Das Wechseln von Field type oder Field interface ist nicht mit einer einfachen Änderung des Anzeigenamens gleichzusetzen. Es beeinflusst die Speicherweise des Feldes, die Eingabekomponente, Validierungsregeln, Filterbedingungen und die Verwendung in Workflow-Variablen. Bei größeren Datenmengen sollte zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Feld „Anhang-URL“ zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und gesammelt löschen.

Beim Löschen eines neu erstellten Feldes „Anhang-URL“ in der Hauptdatenbank werden in der Regel auch die entsprechende physische Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines Feldes, das aus einer Datenbanksynchronisierung oder einer Zuordnung zu einer externen Datenquelle stammt, hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und dem Ursprung des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten beeinflussen. Prüfen Sie vor dem Löschen, ob das Feld noch von geschäftlichen Konfigurationen verwendet wird.

:::

## Verwendung in der Seitenkonfiguration

Das Feld „Anhang-URL“ eignet sich zur Anzeige und zum Zugriff auf externe Dateien.
![20260709231803](https://static-docs.nocobase.com/20260709231803.png)

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Eingabe der Adresse einer externen Datei. |
| Detailblock | Anzeige des Dateilinks. |
| Tabellenblock | Anzeige des Links oder eines Vorschaueinstiegs. |
| Workflow | Einfügen der Dateiadresse in eine Benachrichtigung oder eine externe Anfrage. |

## Weiterführende Links

- [Felder](../index.md) — Erfahren Sie mehr über Zweck, Kategorien und Zuordnungslogik von Feldern
- [Gewöhnliche Tabellen](../data-source-main/general-collection.md) — Felder in gewöhnlichen Tabellen erstellen und verwalten
- [Anhang](../file-manager/field-attachment.md) — NocoBase-Dateien hochladen und verknüpfen
- [URL](../data-modeling/collection-fields/basic/url.md) — Gewöhnliche Links speichern