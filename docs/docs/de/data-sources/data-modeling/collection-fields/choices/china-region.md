---
title: "Chinesische Verwaltungsregionen"
description: "Das Feld für chinesische Verwaltungsregionen dient zur Auswahl von Informationen zu Provinzen, Städten, Bezirken und Landkreisen sowie weiteren Verwaltungseinheiten."
keywords: "Chinesische Verwaltungsregionen,china region,Adresse,Optionsfeld,NocoBase"
---

# Chinesische Verwaltungsregionen (veraltet)

## Einführung

:::warning Hinweis

Das Feld für chinesische Verwaltungsregionen wurde eingestellt. Es wird empfohlen, stattdessen ein Beziehungsfeld zur Verknüpfung mit einer Baumtabelle zu verwenden.

:::

In NocoBase wird **China region** zur Auswahl chinesischer Provinzen, Städte, Bezirke, Landkreise und anderer Verwaltungseinheiten verwendet.

Das Feld für chinesische Verwaltungsregionen eignet sich für Szenarien wie Kundenadressen, Filialadressen und Servicegebiete, in denen Regionen strukturiert ausgewählt werden müssen. Im Vergleich zur manuellen Eingabe von Adressen erleichtert es die Filterung und statistische Auswertung.

Wenn eine vollständige Adresse gespeichert werden muss, kann die [einzeilige Text](../basic/input.md)- oder [mehrzeilige Text](../basic/textarea.md)-Komponente verwendet werden, um Straße und Hausnummer zu speichern.

## Geeignete Szenarien

Das Feld für chinesische Verwaltungsregionen eignet sich für folgende Geschäftsszenarien:

- Provinz, Stadt und Bezirk des Kunden
- Servicegebiet der Filiale
- Gebiet der Projektdurchführung
- Verwaltungsregion in der Lieferadresse

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ der Datentabelle auf „Add field“ und wählen Sie „中国行政区划“, um ein Feld für chinesische Verwaltungsregionen zu erstellen.

![20240512180305](https://static-docs.nocobase.com/20240512180305.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Der Interface-Typ des Feldes. Für chinesische Verwaltungsregionen entspricht er `chinaRegion` und bestimmt, wie die Eingabe und Anzeige auf der Seite erfolgt. |
| Field display name | Der im Interface angezeigte Name des Feldes, zum Beispiel „Standort“, „Servicegebiet“ oder „Liefergebiet“. Es wird empfohlen, einen Namen zu verwenden, den die zuständigen Mitarbeitenden direkt verstehen. |
| Field name | Der Bezeichner des Feldes für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows und anderen Bereichen. Er wird nach der Erstellung normalerweise nicht mehr geändert, darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Der Datentyp des Feldes auf Datenebene. Felder für Verwaltungsregionen werden normalerweise als strukturierte Werte gespeichert. Der konkrete Field type richtet sich nach der Feldkonfiguration. |
| Default value | Der Standardwert. Wenn beim Erstellen eines Datensatzes kein Wert eingegeben wird, kann dieser automatisch übernommen werden. |
| Validation rules | Validierungsregeln. Üblicherweise werden hier Pflichtfeld und Auswahlstufe konfiguriert. |
| Description | Beschreibung des Feldes. Hier können Bedeutung, Eingabeanforderungen, Datenquelle oder zuständige Person angegeben werden. |

:::warning Hinweis

Der Feldname wird nach der Erstellung von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um spätere Anpassungen an der Konfiguration zu vermeiden.

:::

## Feldeigenschaften

Das Feld für chinesische Verwaltungsregionen weist standardmäßig folgende Eigenschaften auf:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standard-Field interface | `chinaRegion`. |
| Standard-Field type | `json`. |
| Verfügbare Field types | `json` und `string`, abhängig von der tatsächlichen Feldkonfiguration. |
| Seitenkomponente | Im Bearbeitungsmodus wird die Auswahlkomponente für Verwaltungsregionen verwendet. |
| Filterung | Die Filterung nach Regionswerten wird unterstützt. Die konkreten Möglichkeiten hängen von der Feldkonfiguration ab. |
| Sortierung | Wird normalerweise nicht zur Sortierung verwendet. |
| Validierung | Grundlegende Validierungen wie die Pflichtfeldprüfung werden unterstützt. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Feldes für chinesische Verwaltungsregionen zu bearbeiten. Die Bearbeitung dient hauptsächlich dazu, die Darstellung und Verwendung des Feldes in NocoBase anzupassen, zum Beispiel durch Ändern des Anzeigenamens, der Beschreibung, des Standardwerts, der Validierungsregeln oder feldspezifischer Einstellungen.

Wenn das Feld aus einer bereits synchronisierten Tabelle in der Hauptdatenbank stammt, handelt es sich bei der Bearbeitung normalerweise um eine Feldzuordnung – das Datenbankfeld wird einem Field type und einem Field interface von NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den im Interface angezeigten Namen des Feldes, nicht jedoch dessen Bezeichner. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung normalerweise nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt | Bei der Feldzuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann der Wert angepasst werden. Dies beeinflusst die Eingabe, Anzeige und Validierung auf den Seiten. |
| Field type | Bedingt | Bei der Feldzuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann der Wert angepasst werden. Vor der Anpassung muss geprüft werden, ob vorhandene Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Ändert den Standardwert für neu erstellte Datensätze. |
| Validation rules | Ja | Ändert die Validierungsregeln des Feldes. |
| Description | Ja | Ergänzt Angaben zur Bedeutung, zu Eingabeanforderungen, Datenquelle oder zuständigen Person. |

:::warning Hinweis

Das Wechseln von Field type oder Field interface ist nicht mit einer einfachen Änderung des Anzeigenamens gleichzusetzen. Dadurch ändern sich die Speicherweise des Feldes, die Eingabekomponente, die Validierungsregeln, die Filterbedingungen und die Verwendung von Workflow-Variablen. Bei einer großen Menge vorhandener Daten sollte zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Feld für chinesische Verwaltungsregionen zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und anschließend gesammelt löschen.

Beim Löschen eines neu erstellten Feldes für chinesische Verwaltungsregionen in der Hauptdatenbank werden normalerweise auch die entsprechende physische Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines Feldes, das mit einer Datenbank synchronisiert oder aus einer externen Datenquelle zugeordnet wurde, hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und der Herkunft des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Import und Export sowie vorhandene Daten beeinflussen. Prüfen Sie vor dem Löschen, ob das Feld noch von Geschäftskonfigurationen verwendet wird.

:::

## Verwendung in der Seitenkonfiguration

Das Feld für chinesische Verwaltungsregionen eignet sich für Adress-, Regions- und Statistik-Szenarien.

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Auswahl von Provinzen, Städten, Bezirken und Landkreisen. |
| Detailblock | Anzeige von Verwaltungsregionen. |
| Filterblock | Filtern von Datensätzen nach Region. |
| Diagrammblock | Statistische Auswertung von Geschäftsdaten nach Region. |

## Verwandte Links

- [Felder](../index.md) — Erfahren Sie mehr über Zweck, Kategorien und Zuordnungslogik von Feldern.
- [Normale Tabellen](../../../data-source-main/general-collection.md) — Felder in normalen Tabellen erstellen und verwalten.
- [Einzeiliger Text](../basic/input.md) — Detaillierte Adressen speichern.
- [Mehrzeiliger Text](../basic/textarea.md) — Längere Adressbeschreibungen speichern.
