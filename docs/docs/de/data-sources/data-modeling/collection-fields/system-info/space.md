---
title: "Space"
description: "Das Space-Feld wird verwendet, um nach der Aktivierung der Multi-Space-Funktion den Space zu kennzeichnen, dem ein Datensatz zugeordnet ist."
keywords: "Space,space,Multi-Space,Systemfeld,NocoBase"
---

# Space

## Einführung

In NocoBase wird **Space** verwendet, um den Space zu erfassen, dem Daten zugeordnet sind.

Das Space-Feld wird in der Regel nach der Aktivierung des Multi-Space-Plugins angezeigt und dient der Trennung von Daten nach Space. Es eignet sich nicht dafür, wie ein gewöhnliches Geschäftsfach beliebig geändert zu werden.

Wenn es lediglich um geschäftliche Dimensionen wie Abteilungen, Regionen oder Projekte geht, empfiehlt es sich, ein gewöhnliches Beziehungsfeld oder Optionsfeld anzulegen.

## Geeignete Einsatzszenarien

Space eignet sich für folgende geschäftliche Szenarien:

- Isolierung von Daten über mehrere Spaces hinweg
- Filtern von Daten nach Space
- Berechtigungskontrolle auf Space-Ebene
- Zuordnung von Daten in mandantenähnlichen Geschäftsszenarien

## Erstellung und Konfiguration

Klicken Sie auf der Seite „Configure fields“ einer Datentabelle auf „Add field“ und wählen Sie „Space“, um ein Space-Feld zu erstellen.

![index-2025-11-01-00-50-45](https://static-docs.nocobase.com/index-2025-11-01-00-50-45.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Der Interface-Typ des Feldes. Für Space entspricht er `space` und legt fest, wie das Feld auf der Seite eingegeben und angezeigt wird. |
| Field display name | Der im Interface angezeigte Name des Feldes, zum Beispiel „Space“. Es empfiehlt sich, einen für die Fachanwender unmittelbar verständlichen Namen zu verwenden. |
| Field name | Der Bezeichner des Feldes, der für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. verwendet wird. Nach der Erstellung wird er in der Regel nicht mehr geändert. Zulässig sind nur Buchstaben, Ziffern und Unterstriche; außerdem muss der Name mit einem Buchstaben beginnen. |
| Field type | Der Typ des Feldes auf Datenebene. Das Space-Feld ist in der Regel ein Beziehungsfeld, das auf die Space-Tabelle verweist. |
| Default value | Der Standardwert. Wenn der Benutzer beim Anlegen eines neuen Datensatzes keinen Wert eingibt, kann automatisch der Standardwert übernommen werden. |
| Validation rules | Werden in der Regel vom System oder vom Space-Kontext verwaltet. |
| Description | Die Beschreibung des Feldes. Hier können Bedeutung, Eingabeanforderungen, Datenquelle oder verantwortliche Person dokumentiert werden. |

:::warning Hinweis

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um spätere Anpassungen an der Konfiguration zu vermeiden.

:::

## Feldeigenschaften

Das Space-Feld weist standardmäßig folgende Eigenschaften auf:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `space`. |
| Standardmäßiger Field type | `belongsTo`. |
| Verfügbarer Field type | `belongsTo`. |
| Seitenkomponente | Wird vom System oder von der Multi-Space-Funktion verwaltet. Auf der Seite ist das Feld in der Regel schreibgeschützt oder wird im Space-Kontext verwendet. |
| Filterung | Die Filterung nach Space wird unterstützt; dies hängt von der Multi-Space-Konfiguration ab. |
| Sortierung | Wird in der Regel nicht zur Sortierung verwendet. |
| Validierung | Wird von der Multi-Space-Funktion verwaltet. |

## Konfiguration bearbeiten

Nach der Erstellung können Sie rechts neben dem Feld auf „Edit“ klicken, um die Konfiguration des Space-Feldes zu bearbeiten. Die Bearbeitung eines Feldes dient hauptsächlich dazu, seine Anzeige und Verwendung in NocoBase anzupassen, beispielsweise den Anzeigenamen, die Beschreibung, den Standardwert, die Validierungsregeln oder feldspezifische Einstellungen zu ändern.

Wenn das Feld aus einer bereits mit der Hauptdatenbank synchronisierten Tabelle stammt, handelt es sich bei der Bearbeitung in der Regel um eine Feldzuordnung – das Datenbankfeld wird einem Field type und einem Field interface in NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den im Interface angezeigten Namen des Feldes, ohne den Feldbezeichner zu ändern. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung in der Regel nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt | Bei der Feldzuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann der Interface-Typ angepasst werden. Dies beeinflusst die Eingabe, Anzeige und Validierung auf den Seiten. |
| Field type | Bedingt | Bei der Feldzuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann der Feldtyp angepasst werden. Vor der Anpassung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert beim Anlegen neuer Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt Angaben zur Bedeutung des Feldes, zu Eingabeanforderungen, Datenquelle oder verantwortlichen Person. |

:::warning Hinweis

Das Umschalten von Field type oder Field interface ist nicht mit einer einfachen Änderung des Anzeigenamens gleichzusetzen. Es beeinflusst die Speicherweise des Feldes, die Eingabekomponente, die Validierungsregeln, die Filterbedingungen und die Verwendung von Workflow-Variablen. Bei einer größeren Anzahl vorhandener Daten muss zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Space-Feld zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und anschließend gesammelt löschen.

Beim Löschen eines in der Hauptdatenbank neu erstellten Space-Feldes werden in der Regel gleichzeitig die tatsächliche Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines aus der Datenbank synchronisierten oder aus einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und der Herkunft des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann sich auf Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten auswirken. Prüfen Sie vor dem Löschen, ob das Feld noch von Geschäftskonfigurationen referenziert wird.

:::

## Verwendung in der Seitenkonfiguration

Das Space-Feld eignet sich für Szenarien zur Isolierung von Daten über mehrere Spaces hinweg und für Berechtigungsszenarien.

| Szenario | Verwendung |
| --- | --- |
| Tabellenblock | Zeigt den Space an, dem der Datensatz zugeordnet ist. |
| Filterblock | Filtert Datensätze nach Space. |
| Berechtigungen | Isoliert den Datenzugriff nach Space. |
| Workflow | Liest den Space des Datensatzes als Kontext aus. |

## Verwandte Links

- [Felder](../index.md) — Erfahren Sie mehr über Funktion, Klassifizierung und Zuordnungslogik von Feldern
- [Gewöhnliche Tabellen](../../../data-source-main/general-collection.md) — Felder in gewöhnlichen Tabellen erstellen und verwalten
- [Multi-Space](../../../../multi-app/multi-space/index.md) — Erfahren Sie mehr über die Multi-Space-Funktion
- [Beziehungsfelder](../associations/index.md) — Gewöhnliche Beziehungsfelder erstellen