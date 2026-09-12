---
title: "Linie"
description: "Das Linienfeld dient zum Speichern linienförmiger Geodaten wie Routen und Pfaden."
keywords: "Linie,LineString,Route,Geometrie,NocoBase"
---

# Linie

## Einführung

In NocoBase wird **Linie (LineString)** zum Speichern linienförmiger Geodaten verwendet.

Das Linienfeld eignet sich für Geschäftsdaten wie Routen, Pfade, Leitungen und Inspektionsstrecken. Zusammen mit dem Kartenblock können Pfade angezeigt werden.

Wenn Sie nur einen Standort benötigen, wählen Sie [Punkt](./point.md). Wenn Sie einen Bereich benötigen, wählen Sie [Polygon](./polygon.md).

## Anwendungsfälle

Linien eignen sich für folgende Geschäftsszenarien:

- Liefer- und Inspektionsrouten
- Fahrzeug- und Personenpfade
- Leitungen, Strecken und Grenzlinien
- Ergebnisse der Routenplanung auf Karten

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ der Datentabelle auf „Add field“ und wählen Sie „Linie“, um ein Linienfeld zu erstellen.

![20240512181454](https://static-docs.nocobase.com/20240512181454.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Der Interface-Typ des Feldes. Für Linien entspricht er `lineString` und bestimmt, wie das Feld auf der Seite eingegeben und angezeigt wird. |
| Field display name | Der im Interface angezeigte Name des Feldes, z. B. „Lieferroute“, „Inspektionspfad“ oder „Leitung“. Es wird empfohlen, einen für die zuständigen Mitarbeitenden unmittelbar verständlichen Namen zu verwenden. |
| Field name | Der Bezeichner des Feldes für interne Verweise, z. B. in APIs, Beziehungsfeldern, Berechtigungen und Workflows. Nach der Erstellung wird er normalerweise nicht mehr geändert. Er darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Der Typ des Feldes auf Datenebene. Für Linien ist standardmäßig `lineString` festgelegt. |
| Default value | Der Standardwert. Beim Anlegen eines neuen Datensatzes kann dieser automatisch übernommen werden, wenn die Benutzerin oder der Benutzer keinen Wert eingibt. |
| Validation rules | Validierungsregeln. In der Regel reicht es aus, das Feld als Pflichtfeld zu konfigurieren. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder verantwortliche Person angegeben werden. |

:::warning Hinweis

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um späteren Konfigurationsaufwand durch Änderungen zu vermeiden.

:::

## Feldeigenschaften

Das Linienfeld verhält sich standardmäßig wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `lineString`. |
| Standardmäßiger Field type | `lineString`. |
| Verfügbare Field types | `lineString`. |
| Seitenkomponente | Im Bearbeitungsmodus wird eine Kartenkomponente zum Zeichnen verwendet. |
| Filterung | Die Möglichkeiten zur räumlichen Filterung hängen vom Karten-Plugin und den Funktionen der Datenquelle ab. |
| Sortierung | Wird normalerweise nicht zur Sortierung verwendet. |
| Validierung | Unterstützt grundlegende Validierungen wie die Pflichtfeldprüfung. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Linienfeldes zu bearbeiten. Die Bearbeitung dient hauptsächlich dazu, anzupassen, wie das Feld in NocoBase angezeigt und verwendet wird, beispielsweise durch Ändern des Anzeigenamens, der Beschreibung, des Standardwerts, der Validierungsregeln oder feldspezifischer Einstellungen.

Wenn das Feld aus einer bereits synchronisierten Tabelle der Hauptdatenbank stammt, handelt es sich bei der Bearbeitung normalerweise um eine Feldzuordnung — das Datenbankfeld wird dem Field type und dem Field interface von NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den im Interface angezeigten Namen des Feldes, nicht jedoch den Feldbezeichner. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung normalerweise nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt | Bei der Feldzuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann dieser Wert angepasst werden. Dies beeinflusst die Eingabe, Anzeige und Validierung auf der Seite. |
| Field type | Bedingt | Bei der Feldzuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann dieser Wert angepasst werden. Vor der Änderung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert für neue Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder verantwortliche Person. |

:::warning Hinweis

Das Wechseln von Field type oder Field interface ist nicht mit einer einfachen Änderung des Anzeigenamens gleichzusetzen. Es beeinflusst die Speicherweise des Feldes, die Eingabekomponente, Validierungsregeln, Filterbedingungen und die Verwendung von Workflow-Variablen. Bei einer großen Menge vorhandener Daten sollte zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Linienfeld zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und anschließend gesammelt löschen.

Beim Löschen eines in der Hauptdatenbank neu erstellten Linienfeldes werden normalerweise auch die tatsächliche Spalte in der Datenbank und die bereits darin enthaltenen Daten gelöscht. Beim Löschen eines aus der Datenbank synchronisierten oder einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und der Herkunft des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann sich auf Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten auswirken. Prüfen Sie vor dem Löschen, ob das Feld noch von geschäftlichen Konfigurationen verwendet wird.

:::

## Verwendung in der Seitenkonfiguration

Linienfelder eignen sich für Szenarien mit Kartenpfaden und räumlichen Analysen.
![20260710144453](https://static-docs.nocobase.com/20260710144453.png)

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Routen zeichnen oder eingeben. |
| Detailblock | Routen anzeigen. |
| Kartenblock | Linienförmige Pfade auf der Karte anzeigen. |
| Workflow | Als routenbezogene Daten in einem Prozess verwenden. |

## Weiterführende Links

- [Feld](../index.md) — Informationen zu Zweck, Kategorien und Zuordnungslogik von Feldern
- [Standardtabelle](../../../data-source-main/general-collection.md) — Felder in einer Standardtabelle erstellen und verwalten
- [Punkt](./point.md) — Einen einzelnen Standort speichern
- [Polygon](./polygon.md) — Einen Bereich speichern