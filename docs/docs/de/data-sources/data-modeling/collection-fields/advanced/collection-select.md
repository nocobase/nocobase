---
title: "Datentabellenauswahl"
description: "Mit dem Feld „Datentabellenauswahl“ werden Datentabellen in NocoBase ausgewählt."
keywords: "Datentabellenauswahl,Collection select,Collection,NocoBase"
---

# Datentabellenauswahl

## Einführung

In NocoBase wird die **Datentabellenauswahl (Collection select)** verwendet, um eine oder mehrere Datentabellen auszuwählen.

Die Datentabellenauswahl eignet sich für Szenarien wie Plugin-Konfigurationen, Regelkonfigurationen und Metadatenverwaltung. Gespeichert wird die Kennung der Datentabelle, nicht ein Geschäftsd atensatz.

Wenn Datensätze aus einer bestimmten Tabelle ausgewählt werden sollen, sollte dafür ein Beziehungsfeld anstelle der Datentabellenauswahl verwendet werden.

## Geeignete Szenarien

Die Datentabellenauswahl eignet sich für folgende Geschäftsszenarien:

- Auswahl der betroffenen Datentabellen in der Plugin-Konfiguration
- Festlegung des Datentabellenbereichs in der Regelkonfiguration
- Metadatenverwaltung und Vorlagenkonfiguration
- Funktionskonfigurationen, die eine Collection-Kennung referenzieren müssen

## Konfiguration erstellen

Auf der Seite „Configure fields“ einer Datentabelle können Sie durch Klicken auf „Add field“ und Auswahl von „Datentabellenauswahl“ ein Feld für die Datentabellenauswahl erstellen.

![20240512174047](https://static-docs.nocobase.com/20240512174047.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Der Schnittstellentyp des Feldes. Für die Datentabellenauswahl entspricht er `collectionSelect` und bestimmt, wie Werte auf der Seite eingegeben und angezeigt werden. |
| Field display name | Der im Benutzeroberflächen angezeigte Name des Feldes, z. B. „Betroffene Datentabelle“, „Zieldatentabelle“ oder „Datenbereich“. Es wird empfohlen, einen für die Fachanwender unmittelbar verständlichen Namen zu verwenden. |
| Field name | Der Bezeichner des Feldes für interne Referenzen in API, Beziehungsfeldern, Berechtigungen, Workflows usw. Nach der Erstellung wird er normalerweise nicht mehr geändert. Er darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Der Typ des Feldes auf Datenebene. Die Datentabellenauswahl speichert normalerweise die Kennung der Datentabelle; der Speichertyp richtet sich nach der tatsächlichen Konfiguration. |
| Default value | Der Standardwert. Beim Erstellen eines neuen Datensatzes kann dieser automatisch übernommen werden, wenn der Benutzer keinen Wert eingibt. |
| Validation rules | Validierungsregeln. Üblicherweise werden hier die Pflichtfeldprüfung oder der Auswahlbereich konfiguriert. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder zuständige Person angegeben werden. |

:::warning Hinweis

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um späteren Konfigurationsaufwand durch Änderungen zu vermeiden.

:::

## Feldeigenschaften

Das Feld für die Datentabellenauswahl verhält sich standardmäßig wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `collectionSelect`. |
| Standardmäßiger Field type | `string`. |
| Verfügbare Field types | `string` und `json`, abhängig von der tatsächlichen Konfiguration. |
| Seitenkomponente | Im Bearbeitungsmodus wird die Komponente zur Auswahl von Datentabellen verwendet. |
| Filterung | Wird normalerweise nicht als geschäftliches Filterfeld verwendet. |
| Sortierung | Wird normalerweise nicht zur Sortierung verwendet. |
| Validierung | Unterstützt grundlegende Validierungen wie die Pflichtfeldprüfung. |

## Konfiguration bearbeiten

Nach der Erstellung können Sie rechts neben dem Feld auf „Edit“ klicken, um die Konfiguration des Feldes für die Datentabellenauswahl zu bearbeiten. Die Bearbeitung dient hauptsächlich dazu, die Darstellung und Verwendung des Feldes in NocoBase anzupassen, beispielsweise durch Ändern des Anzeigenamens, der Beschreibung, des Standardwerts, der Validierungsregeln oder feldspezifischer Einstellungen.

Wenn das Feld aus einer bereits mit der Hauptdatenbank synchronisierten Tabelle stammt, handelt es sich bei der Bearbeitung normalerweise um eine Feldzuordnung – ein Datenbankfeld wird dem Field type und dem Field interface von NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den im Benutzeroberflächen angezeigten Namen des Feldes, nicht jedoch dessen Bezeichner. |
| Field name | Nein | Der Bezeichner des Feldes kann nach der Erstellung normalerweise nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt | Felder der Hauptdatenbank oder synchronisierte Felder können bei der Feldzuordnung angepasst werden. Dies beeinflusst die Art der Eingabe, Anzeige und Validierung auf der Seite. |
| Field type | Bedingt | Felder der Hauptdatenbank oder synchronisierte Felder können bei der Feldzuordnung angepasst werden. Vor der Anpassung muss geprüft werden, ob vorhandene Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert für neu erstellte Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder zuständige Person. |

:::warning Hinweis

Das Wechseln des Field type oder Field interface ist nicht mit einer einfachen Änderung des Anzeigenamens gleichzusetzen. Es beeinflusst die Speicherweise des Feldes, die Eingabekomponente, Validierungsregeln, Filterbedingungen und die Verwendung in Workflow-Variablen. Bei einer größeren Menge vorhandener Daten sollte zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Durch Klicken auf „Delete“ rechts neben dem Feld können Sie das Feld für die Datentabellenauswahl löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und anschließend gesammelt löschen.

Beim Löschen eines in der Hauptdatenbank neu erstellten Feldes für die Datentabellenauswahl werden normalerweise auch die entsprechende physische Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines aus einer Datenbank synchronisierten oder einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und der Herkunft des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten beeinflussen. Prüfen Sie vor dem Löschen, ob das Feld noch von Geschäftskonfigurationen referenziert wird.

:::

## Verwendung in der Seitenkonfiguration

Die Datentabellenauswahl eignet sich für Formulare zur Konfiguration.

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Auswahl einer oder mehrerer Datentabellen. |
| Detailblock | Anzeige der ausgewählten Datentabellen. |
| Plugin-Konfiguration | Festlegung des Datentabellenbereichs, auf den sich eine Funktion auswirkt. |
| Workflow oder Regel | Beteiligung an der Logik als Metadatenkonfiguration. |

## Verwandte Links

- [Felder](../index.md) — Erfahren Sie mehr über Zweck, Klassifizierung und Zuordnungslogik von Feldern
- [Standardtabelle](../../../data-source-main/general-collection.md) — Felder in einer Standardtabelle erstellen und verwalten
- [Standardtabelle](../../../data-source-main/general-collection.md) — Erfahren Sie mehr über die Verwendung von Collections
- [Beziehungsfelder](../associations/index.md) — Datensätze aus einer bestimmten Tabelle auswählen