---
title: "URL"
description: "Das URL-Feld dient zum Speichern von Webseitenadressen, Links zu externen Systemen, Dokumentenlinks und anderen Adressinformationen."
keywords: "URL,Link,Webadresse,url,NocoBase"
---

# URL

## Einführung

In NocoBase wird **URL (URL)** zum Speichern von Webadressen oder Linkadressen verwendet.

Das URL-Feld eignet sich für Adressen externer Systeme, Dokumentenlinks, offizielle Webseiten, Callback-Adressen und ähnliche Inhalte. Im Vergleich zu normalem Text bringt es die Linksemantik deutlicher zum Ausdruck.

Wenn Sie eine Datei hochladen möchten, wählen Sie [Anhang](../media/field-attachment.md). Wenn es sich lediglich um normalen Beschreibungstext handelt, wählen Sie [Einzeiliger Text](./input.md) oder [Mehrzeiliger Text](./textarea.md).

## Geeignete Einsatzszenarien

URL eignet sich für folgende Geschäftsszenarien:

- Offizielle Websites von Kunden und Lieferanten
- Links zu Detailseiten externer Systeme
- Links zu Vertragsdokumenten und Wissensdatenbankseiten
- Webhook-Adressen und Callback-Adressen

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ einer Datentabelle auf „Add field“ und wählen Sie „URL“, um ein URL-Feld zu erstellen.

![20240512175641](https://static-docs.nocobase.com/20240512175641.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Oberflächentyp des Feldes. URL entspricht `url` und legt fest, wie das Feld auf der Seite eingegeben und angezeigt wird. |
| Field display name | Der in der Benutzeroberfläche angezeigte Name des Feldes, zum Beispiel „Offizielle Website“, „Dokumentenlink“ oder „Externe Adresse“. Es wird empfohlen, einen für die zuständigen Mitarbeitenden unmittelbar verständlichen Namen zu verwenden. |
| Field name | Bezeichner des Feldes für interne Referenzen in APIs, Beziehungsfeldern, Berechtigungen, Workflows und anderen Bereichen. Nach der Erstellung wird dieser normalerweise nicht mehr geändert. Er darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Datentyp des Feldes auf Datenebene. Der Standardwert für URL-Felder ist `string`. |
| Default value | Standardwert. Beim Erstellen eines neuen Datensatzes kann dieser automatisch übernommen werden, wenn kein Wert eingegeben wird. |
| Validation rules | Validierungsregeln. Es können URL-Format, Länge oder Pflichtfeldstatus konfiguriert werden. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder zuständige Person angegeben werden. |

:::warning Hinweis

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Überprüfen Sie die Benennung vor der Erstellung sorgfältig, um spätere Konfigurationsanpassungen zu vermeiden.

:::

## Feldeigenschaften

Das URL-Feld verhält sich standardmäßig wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `url`. |
| Standardmäßiger Field type | `string`. |
| Optionaler Field type | `string`. |
| Seitenkomponente | Im Bearbeitungsmodus wird ein Eingabefeld verwendet, im Lesemodus wird der Inhalt normalerweise als Link angezeigt. |
| Filterung | Unterstützt textbasierte Filter, z. B. enthält, ist gleich, ist leer oder ist nicht leer. |
| Sortierung | Unterstützt die Sortierung in Tabellenblöcken. |
| Validierung | Unterstützt die Validierung von URL-Format, Länge, Pflichtfeldstatus und weiteren Kriterien. |

## Konfiguration bearbeiten

Nach der Erstellung können Sie rechts neben dem Feld auf „Edit“ klicken, um die Konfiguration des URL-Feldes zu bearbeiten. Die Bearbeitung eines Feldes dient hauptsächlich dazu, die Darstellung und Verwendung des Feldes in NocoBase anzupassen, beispielsweise den Anzeigenamen, die Beschreibung, den Standardwert, die Validierungsregeln oder feldspezifische Einstellungen zu ändern.

Wenn das Feld aus einer bereits synchronisierten Tabelle der Hauptdatenbank stammt, handelt es sich bei der Bearbeitung normalerweise um eine Feldzuordnung – das Datenbankfeld wird einem Field type und einem Field interface von NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den in der Benutzeroberfläche angezeigten Namen des Feldes, ohne den Feldbezeichner zu ändern. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung normalerweise nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt unterstützt | Bei der Feldzuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann dieser angepasst werden. Die Anpassung wirkt sich auf die Eingabe, Darstellung und Validierung auf der Seite aus. |
| Field type | Bedingt unterstützt | Bei der Feldzuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann dieser angepasst werden. Vor der Anpassung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert für neu erstellte Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder zuständige Person. |

:::warning Hinweis

Das Wechseln von Field type oder Field interface ist nicht mit einer einfachen Änderung des Anzeigenamens gleichzusetzen. Es wirkt sich auf die Speicherweise des Feldes, die Eingabekomponente, Validierungsregeln, Filterbedingungen und die Verwendung von Workflow-Variablen aus. Bei einer größeren Anzahl vorhandener Daten sollten Sie zunächst prüfen, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das URL-Feld zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und gesammelt löschen.

Beim Löschen eines neu in der Hauptdatenbank erstellten URL-Feldes werden normalerweise auch die entsprechende physische Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines aus der Datenbank synchronisierten oder aus einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und der Herkunft des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann sich auf Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten auswirken. Prüfen Sie vor dem Löschen, ob das Feld noch von Geschäftskonfigurationen referenziert wird.

:::

## Verwendung in der Seitenkonfiguration

Das URL-Feld eignet sich für Detailansichten, Tabellen und Szenarien mit externen Weiterleitungen.
![20260709224747](https://static-docs.nocobase.com/20260709224747.png)

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Eingabe einer Linkadresse. |
| Detailblock | Anzeigen und Öffnen eines Links. |
| Tabellenblock | Anzeigen einer Linkzusammenfassung oder eines anklickbaren Links. |
| Workflow | Verwendung des Links als Benachrichtigungsinhalt oder Parameter für eine externe Anfrage. |

## Verwandte Links

- [Felder](../index.md) — Erfahren Sie mehr über Zweck, Kategorien und Zuordnungslogik von Feldern
- [Normale Tabelle](../../../data-source-main/general-collection.md) — Felder in normalen Tabellen erstellen und verwalten
- [Einzeiliger Text](./input.md) — Normalen kurzen Text speichern
- [Anhang](../media/field-attachment.md) — Dateien hochladen und verknüpfen