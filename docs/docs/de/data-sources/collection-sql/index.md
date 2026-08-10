---
pkg: "@nocobase/plugin-collection-sql"
title: "SQL-Tabelle"
description: "Erstellt Datentabellen aus SQL-Abfrageergebnissen und konfiguriert Feldquellen, Feldzuordnungen und eindeutige Datensatzkennungen – geeignet für verknüpfte Abfragen, Statistiken und Berichte."
keywords: "SQL-Tabelle,SQL collection,SQL-Abfrage,Feldzuordnung,Berichte,NocoBase"
---

#  SQL-Tabelle

## Einführung

Durch das Schreiben einer SQL-Abfrage wird eine SQL-Tabelle erstellt. Dabei wird keine echte Datenbanktabelle in der Datenbank angelegt. Stattdessen werden die Ergebnisse der SQL-Abfrage gelesen, sodass sie in Tabellen, Detailansichten, Diagrammen und Workflows verwendet werden können. Geeignete Einsatzszenarien sind aggregierte Daten und statistische Berichte.

:::warning Hinweis

Eine SQL-Tabelle unterstützt nur `SELECT`-Anweisungen oder `WITH ... SELECT`-Anweisungen. Sie unterstützt ausschließlich die Anzeige von Daten und nicht das Erstellen, Bearbeiten oder Löschen von Daten.

:::

## SQL-Tabelle erstellen

1. Klicken Sie im Bereich „Systemfunktionen“ auf das Menü „Datenquellen“, um die Startseite der Datenquellen aufzurufen.
2. Wählen Sie in der Liste der Datenquellen die Datenquelle **Main** aus und klicken Sie auf die Aktion „Configure“, um auf die Hauptdatenbank zuzugreifen.
3. Klicken Sie in der Verwaltung der Hauptdatenbank auf „Create collection“ und wählen Sie „SQL collection“ aus.

![configure_main_datasource](https://static-docs.nocobase.com/configure_main_datasource.png)
![create_sql_collection](https://static-docs.nocobase.com/create_sql_collection.png)
![create_sql_collection_configure](https://static-docs.nocobase.com/create_sql_collection_configure.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Collection display name | Der Name, unter dem die SQL-Tabelle in der Benutzeroberfläche angezeigt wird, z. B. „Verkaufsübersicht“ oder „Bestandswarnung“. Es wird empfohlen, einen Namen zu verwenden, der die Bedeutung des Abfrageergebnisses beschreibt. |
| Collection name | Der Bezeichner der SQL-Tabelle in NocoBase, der für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. verwendet wird. Er wird automatisch generiert, kann aber auch manuell geändert werden. Es sind nur Buchstaben, Zahlen und Unterstriche zulässig, und der Name muss mit einem Buchstaben beginnen. |
| Categories | Kategorie der Datentabelle. Sie beeinflusst nur die Organisation in der Verwaltungsoberfläche für Datentabellen, nicht die SQL-Abfrage. |
| Description | Beschreibung der Datentabelle. Es wird empfohlen, deutlich anzugeben, welche Daten diese SQL-Abfrage abruft, wer sie pflegt und für welche Seite oder welchen Bericht sie verwendet wird. |
| Record unique key | Eindeutige Datensatzkennung. Die Ergebnisse einer SQL-Abfrage verfügen nicht über einen echten Primärschlüssel. Daher muss ein Feld oder eine Feldkombination ausgewählt werden, mit dem bzw. der sich Datensätze eindeutig identifizieren lassen. Andernfalls können Datensätze möglicherweise nicht korrekt in Blöcken angezeigt werden. |
| SQL | Die von der SQL-Tabelle verwendete Abfrage. NocoBase führt diese SQL-Abfrage aus, konfiguriert auf Grundlage des Ergebnisses die Felder und verwendet das Ergebnis anschließend als Datentabelle. |
| Source collections | Quellen der Felder im SQL-Abfrageergebnis. Damit werden die Felder des Abfrageergebnisses mit den Feldern vorhandener Datentabellen verknüpft, sodass NocoBase die Feldquellen und die Benutzeroberflächentypen erkennen kann. |
| Fields | Konfiguration der Feldzuordnung. Damit werden Name, Quelle, Benutzeroberflächentyp und Anzeigename jedes Feldes festgelegt. |
| Preview | Vorschau des SQL-Abfrageergebnisses. Vor dem Absenden können Sie prüfen, ob die Feldzuordnung und die Darstellung wie erwartet sind. |

### SQL-Abfrage schreiben

Geben Sie eine SQL-Abfrage ein und klicken Sie auf „Execute“, um die Abfrage auszuführen und die zurückgegebenen Felder sowie die Quelldatentabellen zu analysieren.
„Execute“ dient ausschließlich der Vorschauausführung und der Feldanalyse. Nachdem Sie bestätigt haben, dass die SQL-Abfrage verwendet werden kann, klicken Sie auf „Confirm“. Erst dann kann das Formular diese SQL-Abfrage als bestätigte Abfrage übermitteln.

![execute_sql_statement](https://static-docs.nocobase.com/202405191453556.png)

:::tip Tipp

`Source collections` sind die Quelldatentabellen, die anhand der SQL-Abfrage ermittelt wurden. Dabei wird erkannt, aus welchen vorhandenen Datentabellen die Felder des Abfrageergebnisses hauptsächlich stammen. Bei der Feldzuordnung wird dadurch die Auswahl der verfügbaren `Field source` eingeschränkt.

Das Ermittlungsergebnis dient als Unterstützung für eine schnelle Konfiguration. Bei Aliasen, Unterabfragen, berechneten Feldern, Aggregationsfunktionen oder komplexen Joins in der SQL-Abfrage kann das Ergebnis unvollständig oder nicht verfügbar sein. In diesem Fall können Sie `Source collections` manuell festlegen.

:::

### Feldzuordnung

Die Feldzuordnung ist eine Konfiguration, die nach dem Erstellen einer SQL-Tabelle bestätigt werden muss. Das SQL-Abfrageergebnis teilt NocoBase zunächst nur mit, welche Spalten zurückgegeben wurden. Damit diese Spalten wie gewöhnliche Felder in der Benutzeroberfläche verwendet werden können, müssen Sie außerdem `Field source` bestätigen oder `Field interface` und den Anzeigenamen des Feldes konfigurieren.
[Weitere Informationen zur Feldkonfiguration](../data-modeling/collection-fields/index.md)

![configure_sql_field_source](https://static-docs.nocobase.com/202405191453579.png)
![configure_sql_field_interface](https://static-docs.nocobase.com/202405191454703.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field source | Wählen Sie aus, aus welcher vorhandenen Datentabelle und welchem Feld das Feld des SQL-Abfrageergebnisses stammt. Nach Auswahl der Quelle kann NocoBase das Field interface des ursprünglichen Feldes wiederverwenden. |
| Field interface | Legen Sie fest, wie das Feld auf der Seite angezeigt und eingegeben wird, z. B. als einzeiliger Text, Zahl, Datum oder Dropdown-Auswahl. |
| Field display name | Der Name, unter dem das Feld in der Benutzeroberfläche angezeigt wird. Es wird empfohlen, einen für die Fachanwender verständlichen Namen zu verwenden. |

Wenn die SQL-Abfrage beispielsweise `customers.name as customer_name` zurückgibt und dieser Wert aus dem Feld „Kundenname“ der Kundentabelle stammt, kann er dem entsprechenden Feld der Kundentabelle zugeordnet werden. NocoBase kann dann den Titel und die Benutzeroberflächenkonfiguration des ursprünglichen Feldes übernehmen.

Wenn ein Feld aus einem Berechnungsergebnis stammt, z. B. `count(*) as total` oder `sum(amount) as amount_total`, gibt es normalerweise kein eindeutig bestimmbares Quellfeld. In diesem Fall muss manuell ein geeignetes Field interface ausgewählt werden.

:::tip Tipp

`Field source` hängt von `Source collections` ab. Erst nachdem eine Quelldatentabelle ausgewählt wurde, werden in der Feldzuordnung die verfügbaren Quellfelder dieser Datentabelle angezeigt.

Wenn bei der Feldermittlung `Field source` vorhanden ist, verwendet NocoBase bevorzugt das Field interface des Quellfeldes wieder. Wenn das Quellfeld nicht ermittelt werden kann, können Sie `Field source` manuell festlegen. Entspricht das Ermittlungsergebnis nicht der fachlichen Bedeutung, müssen Sie `Field source` entfernen. Anschließend können Sie `Field source` manuell festlegen oder `Field interface` auswählen und `Field display name` konfigurieren.

:::

### Eindeutige Datensatzkennung

Für eine SQL-Tabelle muss ein Record unique key konfiguriert werden. Andernfalls können auf Seiten keine Blöcke erstellt und Datensätze nicht korrekt angezeigt werden. Als eindeutige Kennung kann ein einzelnes Feld oder eine Kombination mehrerer Felder ausgewählt werden. Felder, die sich als Record unique key eignen, erfüllen in der Regel folgende Bedingungen:

- Jede Zeile im Abfrageergebnis ist eindeutig
- Der Feldwert ist stabil und ändert sich nicht durch Seitennummerierung, Sortierung oder Änderungen des statistischen Bezugs
- Das Feld ist nicht leer
- Das Feld wird im Abfrageergebnis immer zurückgegeben

Wenn das Abfrageergebnis aus einer einzelnen Tabelle stammt, sollte bevorzugt der Primärschlüssel der ursprünglichen Tabelle zurückgegeben werden. Wenn das Abfrageergebnis aus einem Join mehrerer Tabellen oder einer Aggregation stammt, kann in der SQL-Abfrage eine stabile fachliche ID beibehalten oder es können mehrere Felder zurückgegeben werden, die den Datensatz gemeinsam eindeutig identifizieren.

:::warning Hinweis

Verwenden Sie keine Werte wie `row_number()`, die sich durch Sortierung, Filterung oder Änderungen des Statistikbereichs verändern können, als langfristig stabile Record unique key. Wenn sich die eindeutige Datensatzkennung ändert, können Seitenblöcke, Berechtigungen, Workflows und externe APIs möglicherweise nicht mehr denselben Datensatz identifizieren.

:::

### Abfrageergebnisse in der Vorschau anzeigen

Verwenden Sie vor dem Absenden die Funktion „Preview“, um das SQL-Abfrageergebnis zu prüfen. Achten Sie bei der Vorschau insbesondere auf Folgendes:

- Die SQL-Abfrage lässt sich erfolgreich ausführen
- Die zurückgegebenen Felder sind vollständig
- Field interface und Anzeigenamen entsprechen der fachlichen Bedeutung
- Der Record unique key ist vorhanden und die Daten sind eindeutig
- Das Abfrageergebnis eignet sich für die Darstellung auf der Seite

![preview_sql_collection](https://static-docs.nocobase.com/202405191455439.png)

## Felder konfigurieren

Nach dem Erstellen der SQL-Tabelle können Sie in der Liste der Datentabellen rechts neben der SQL-Tabelle auf „Configure fields“ klicken, um die Feldkonfigurationsseite aufzurufen. Dort wird festgelegt, welche Felder die SQL-Tabelle enthält, wie sie in der Benutzeroberfläche angezeigt werden und wie das SQL-Abfrageergebnis auf die Field interfaces von NocoBase abgebildet wird.
[Weitere Informationen zur Feldkonfiguration](../data-modeling/collection-fields/index.md)

### UI-Typ wechseln

Auch nach dem Erstellen der SQL-Tabelle können Sie die Benutzeroberflächenkonfiguration der Felder in der Feldkonfiguration anpassen. Die Feldkonfigurationsseite dient hauptsächlich dazu, das Field interface zu wechseln sowie Anzeigenamen, Beschreibung und feldspezifische Einstellungen zu ändern.
![configure_field_sql](https://static-docs.nocobase.com/configure_field_sql.png)

Diese Fälle können Sie hier bearbeiten:

- Beim Erstellen der SQL-Tabelle wurde ein falsches Field interface festgelegt
- Der Anzeigename des Feldes entspricht nicht den fachlichen Konventionen und sollte verständlicher formuliert werden
- Die fachliche Bedeutung des Feldes im Abfrageergebnis hat sich geändert und die Darstellungsweise muss erneut festgelegt werden
- Die Feldbeschreibung oder feldspezifische Einstellungen, z. B. Dropdown-Optionen, müssen angepasst werden

### Aus der Datenbank synchronisieren

Wenn sich die SQL-Abfrage nicht geändert hat, aber die Struktur der zugrunde liegenden Datentabelle oder ein Feld geändert wurde, können Sie „Configure fields“ aufrufen und auf „Sync from database“ klicken, um die SQL-Abfrage erneut auszuführen und die Felder zu synchronisieren. Informationen zur Feldzuordnung finden Sie unter [„SQL-Tabelle erstellen“](#字段映射).

![sync_sql_collection_fields](https://static-docs.nocobase.com/202405191456216.png)

### Felder bearbeiten

Klicken Sie rechts neben einem Feld auf „Edit“, um die Feldkonfiguration zu bearbeiten. Das Bearbeiten eines Feldes eignet sich, um festzulegen, wie das Feld in NocoBase angezeigt und verwendet wird, beispielsweise durch Ändern des Anzeigenamens, der Beschreibung, der Validierungsregeln oder der feldspezifischen Einstellungen.
[Weitere Informationen zur Feldkonfiguration](../data-modeling/collection-fields/index.md)

:::warning Hinweis

Das Bearbeiten der Feldkonfiguration ändert weder die SQL-Abfrage noch den Namen oder die Definition des Feldes in der Quelltabelle und auch keine Datenbankindizes. Wenn die tatsächlichen Spalten im Abfrageergebnis angepasst werden müssen, ändern Sie zuerst die SQL-Abfrage und führen Sie anschließend die Abfrage erneut aus, um die Felder zu synchronisieren.

:::

### Felder löschen

Klicken Sie rechts neben einem Feld auf „Delete“, um ein einzelnes Feld zu löschen. Beim Löschen eines Feldes wird nur das in NocoBase gespeicherte Feld entfernt. Die SQL-Abfrage und die tatsächliche Spalte in der Quelldatentabelle werden nicht gelöscht.
[Weitere Informationen zur Feldkonfiguration](../data-modeling/collection-fields/index.md)

:::warning Hinweis

Das Löschen eines Feldes kann sich auf Seitenblöcke, Filterbedingungen, Sortierungen, Berechtigungen, Workflows, APIs und bestehende Konfigurationen auswirken. Prüfen Sie daher vor dem Löschen, ob das Feld noch verwendet wird. Wenn die SQL-Abfrage diese Spalte weiterhin zurückgibt, erkennt NocoBase das Feld bei einer späteren Ausführung von „Sync from database“ möglicherweise erneut.

:::

## SQL-Tabelle bearbeiten

Klicken Sie in der Liste der Datentabellen rechts neben einer SQL-Tabelle auf „Edit“, um die Metadaten und Laufzeitkonfiguration der SQL-Tabelle in NocoBase anzupassen. Die Konfigurationsoptionen beim Bearbeiten entsprechen im Wesentlichen denen beim Erstellen einer SQL-Tabelle. Nur `Collection name` kann nicht geändert werden.

Wenn sich die SQL-Abfrage geändert hat, müssen Sie erneut auf „Execute“ klicken und die Feldzuordnung, den Record unique key sowie das Vorschauergebnis bestätigen.

![edit_sql_collection](https://static-docs.nocobase.com/202405191455302.png)

:::warning Hinweis

Eine Änderung der SQL-Abfrage kann zu Änderungen bei Feldnamen, Feldzuordnungen oder dem Record unique key führen. Prüfen Sie anschließend erneut, ob Seitenblöcke, Diagramme, Berechtigungen und Workflows weiterhin funktionieren.

:::

## SQL-Tabelle löschen

Klicken Sie in der Liste der Datentabellen rechts neben der SQL-Tabelle auf „Delete“. Dadurch werden nur die Konfiguration und die Felder der SQL-Tabelle in NocoBase gelöscht. Die zugrunde liegende Quelltabelle und die darin enthaltenen Daten werden nicht gelöscht.
Sie können auch mehrere Tabellen auswählen und gemeinsam löschen. Prüfen Sie vor dem Löschen, ob Seitenblöcke, Diagramme, Berechtigungen, Workflows und externe APIs diese SQL-Tabelle noch verwenden.