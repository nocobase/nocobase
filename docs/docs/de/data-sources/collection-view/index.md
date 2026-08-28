---
pkg: "@nocobase/plugin-data-source-main"
title: "Datenbankansichten"
description: "Verbindet bereits vorhandene Ansichten in der Datenbank als Datenquelle, um Felder und Darstellung in NocoBase zu konfigurieren. Geeignet für die visuelle Verwaltung komplexer Abfrageergebnisse."
keywords: "Datenbankansicht,Collection View,Ansicht"
---
# Mit einer Datenbankansicht verbinden

## Einführung

Verbindet Ansichten in der Datenbank, zum Beispiel von DBAs gepflegte Ansichten für Finanzberichte, gefilterte Kundenansichten oder aggregierte Ansichten nach der systemübergreifenden Synchronisierung. Dies eignet sich zur Wiederverwendung der bereits in der Datenbank definierten Abfragelogik.

:::tip Hinweis

Unterstützt werden normale Ansichten im Bereich des Besitzers des Verbindungskontos der Hauptdatenbank. Materialisierte Ansichten werden nicht unterstützt. Auch wenn das Konto über Abfrageberechtigungen für Ansichten anderer Besitzer verfügt, werden diese Ansichten nicht in der Liste der verfügbaren Verbindungen angezeigt. Vor der Verbindung muss bestätigt werden, dass die Ansichtsfelder stabile Spaltennamen besitzen und die Feldtypen von NocoBase erkannt werden können.

:::

## Mit einer Datenbankansicht verbinden

1. Klicken Sie im Menü „Datenquellen“ unter den Systemfunktionen auf die Datenquellen-Startseite.
2. Wählen Sie in der Datenquellenliste die Datenquelle **Main** aus und klicken Sie auf „Configure“, um auf die Hauptdatenbank zuzugreifen.
3. Klicken Sie in der Verwaltung der Hauptdatenbank auf „Create collection“ und wählen Sie „Connect to database view“.

![configure_main_datasource](https://static-docs.nocobase.com/configure_main_datasource.png)
![connect_view](https://static-docs.nocobase.com/connect_view.png)
![connect_view_configure](https://static-docs.nocobase.com/connect_view_configure.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Collection display name | Der Name, unter dem die Datenbankansicht in der Benutzeroberfläche angezeigt wird, zum Beispiel „Finanzberichtansicht“ oder „Kundenstatistikansicht“. Es wird empfohlen, einen Namen zu verwenden, der den Zweck der Ansicht beschreibt. |
| Collection name | Der Bezeichner der Datenbankansicht in NocoBase, der für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. verwendet wird. Er wird automatisch generiert, kann aber manuell geändert werden. Es sind nur Buchstaben, Zahlen und Unterstriche zulässig; der Name muss mit einem Buchstaben beginnen. |
| Database view | Wählen Sie die zu verbindende Datenbankansicht aus. Die Feldstruktur und die Abfrageergebnisse werden aus der Ansicht gelesen. Beim Bearbeiten kann die aktuell verbundene view angezeigt, aber nicht durch eine andere view ersetzt werden. |
| Categories | Kategorie der Datentabelle. Beeinflusst nur die Organisation in der Verwaltungsoberfläche für Datentabellen, nicht die Datenbankansicht selbst. |
| Description | Beschreibung der Datentabelle. Es wird empfohlen, anzugeben, wer diese view pflegt, welche Daten abgefragt werden und für welche Seiten oder Berichte sie verwendet wird. |
| Use simple pagination mode | Einfacher Seitenumblättermodus. Bei Aktivierung wird bei der Seitennavigation von Tabellenblöcken auf die Ermittlung der Gesamtzahl der Datensätze verzichtet. Dies eignet sich für Ansichten mit großen Datenmengen und kann die Abfragelast reduzieren. |
| Record unique key | Eindeutiger Bezeichner eines Datensatzes. Datenbankansichten besitzen normalerweise keinen Primärschlüssel. Daher muss ein Feld ausgewählt werden, mit dem sich Datensätze eindeutig identifizieren lassen. Andernfalls können Datensätze möglicherweise nicht korrekt in Blöcken angezeigt oder bearbeitet werden. |
| Source collections | Quelle der Felder der Datenbankansicht. Dient dazu, Ansichts- und vorhandene Datentabellenfelder miteinander zu verknüpfen, damit NocoBase Feldtypen und Oberflächentypen erkennen kann. |
| Fields | Konfiguration der Feldzuordnung. Dient zur Bestätigung des Namens, Titels, Datentyps und Oberflächentyps jedes Feldes in der Ansicht. |
| Preview | Vorschau der Ergebnisse der Datenbankansicht. Vor dem Absenden können Sie prüfen, ob Feldzuordnung und Darstellung den Erwartungen entsprechen. |
| Allow add new, update and delete actions | Legt fest, ob Datensätze in der Datenbankansicht hinzugefügt, aktualisiert und gelöscht werden dürfen. Bei Aktivierung stellt NocoBase die entsprechenden Aktionen auf der Seite bereit. Ob Schreibvorgänge erfolgreich sind, hängt weiterhin davon ab, ob die Datenbank- view selbst beschreibbar ist und ob das Datenbankkonto über INSERT-, UPDATE- und DELETE-Berechtigungen verfügt. |

:::tip Hinweis

`Source collections` wird aus der Datenbankansicht abgeleitet. Dabei werden die vorhandenen Datentabellen ermittelt, aus denen die Felder in der view hauptsächlich stammen, und die Auswahl von `Field source` bei der Feldzuordnung eingeschränkt.

Das Ergebnis dient der Unterstützung bei der schnellen Konfiguration. Bei umbenannten, berechneten oder aggregierten Feldern sowie komplexen Joins in der view kann das Ergebnis ungenau sein oder es kann keine Zuordnung ermittelt werden. In diesem Fall muss die Zuordnung unter `Fields` manuell bestätigt werden.

:::

### Feldzuordnung

Die Feldzuordnung ist eine Konfiguration, die nach der Verbindung mit einer Datenbankansicht bestätigt werden muss. Nach der Verbindung mit der view ermittelt NocoBase zunächst die Quelle und den Datenbanktyp jedes Ansichtsfeldes. Wenn ein Quellfeld erkannt wird, werden Field type, Field interface und Field display name des vorhandenen Feldes automatisch übernommen. Andernfalls wird anhand des Datenbankfeldtyps ein initialer Field type festgelegt; Feldtyp und Oberflächenkonfiguration müssen manuell bestätigt werden.
[Weitere Informationen zur Feldkonfiguration](../data-modeling/collection-fields/index.md)

![connect_view_configure_field_source](https://static-docs.nocobase.com/connect_view_configure_field_source.png)
![connect_view_configure_field_interface](https://static-docs.nocobase.com/connect_view_configure_field_interface.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field source | Wählen Sie aus, aus welcher vorhandenen Datentabelle und welchem Feld das Ansichts- feld stammt. Nach Auswahl der Quelle kann NocoBase den Field type und das Field interface des ursprünglichen Feldes wiederverwenden. |
| Field type | Wenn das Ansichtsfeld keine eindeutige Quelle besitzt, muss der Datentyp des Feldes manuell bestätigt werden. |
| Field interface | Bestätigt, wie das Feld auf der Seite angezeigt und eingegeben wird, zum Beispiel als einzeiliger Text, Zahl, Datum oder Dropdown-Auswahl. |
| Field display name | Der Name, unter dem das Feld in der Benutzeroberfläche angezeigt wird. Es wird empfohlen, einen für die Fachanwender verständlichen Namen zu verwenden. |

Wenn die Ansicht beispielsweise `customer_name` zurückgibt und dieses Feld aus dem Feld „Kundenname“ der Kundentabelle stammt, kann es dem entsprechenden Feld der Kundentabelle zugeordnet werden. Dadurch kann NocoBase den ursprünglichen Titel, Typ und die Oberflächenkonfiguration des Feldes übernehmen.

Wenn ein Ansichtsfeld aus einem Aggregations- oder Berechnungsergebnis stammt, zum Beispiel `count(*) as total` oder `sum(amount) as amount_total`, müssen Field type und ein passendes Field interface normalerweise manuell ausgewählt werden.

:::tip Hinweis

`Field source` stammt aus der von NocoBase vorgenommenen Ermittlung für Datenbankansichten und gibt an, welchem vorhandenen Feld ein Ansichtsfeld möglicherweise entspricht. Wenn ein Feld über `Field source` verfügt, verwendet NocoBase bevorzugt den Field type und das Field interface des Quellfeldes wieder.

Wenn das Quellfeld nicht ermittelt werden kann oder das Ermittlungsergebnis nicht der fachlichen Bedeutung entspricht, muss `Field source` entfernt und `Field type` sowie `Field interface` und `Field display name` manuell ausgewählt werden.

:::

### Eindeutiger Bezeichner eines Datensatzes

Für Datenbankansichten muss ein Record unique key konfiguriert werden. Andernfalls können auf Seiten keine Blöcke erstellt und Datensätze nicht korrekt angezeigt oder bearbeitet werden. Als eindeutiger Bezeichner kann ein einzelnes Feld oder eine Kombination mehrerer Felder ausgewählt werden. Geeignete Felder für den Record unique key erfüllen normalerweise folgende Bedingungen:

- Der Feldwert ist eindeutig.
- Der Feldwert ist stabil und ändert sich nicht durch Änderungen an Sortierung, Seitennavigation oder Auswertungslogik.
- Das Feld ist nicht leer.
- Das Feld wird in der view immer zurückgegeben.

Wenn die view aus einer Abfrage einer einzelnen Tabelle stammt, sollte bevorzugt der Primärschlüssel der ursprünglichen Tabelle zurückgegeben werden. Wenn die view aus einem Join mehrerer Tabellen oder einer Aggregation stammt, kann in der Datenbankansicht eine stabile fachliche ID beibehalten oder von der Datenbankseite ein stabiles eindeutiges Feld erzeugt werden.

### Hinzufügen, Aktualisieren und Löschen erlauben

Wenn die Datenbank- view Schreibvorgänge unterstützt, kann „Allow add new, update and delete actions“ aktiviert werden. NocoBase erlaubt dann auf der Seite das Hinzufügen, Aktualisieren und Löschen von Datensätzen in dieser Ansicht.

Datenbankansichten eignen sich eher als Abfrageergebnisse und werden standardmäßig als schreibgeschützte Datentabellen behandelt. Die Option sollte nur aktiviert werden, wenn bereits bestätigt wurde, dass die Datenbank- view die entsprechenden Schreibvorgänge unterstützt und die Datenbankberechtigungen Schreibzugriffe erlauben.

### Ergebnisse der Ansicht in der Vorschau anzeigen

Verwenden Sie vor dem Absenden Preview, um die Abfrageergebnisse der Ansicht zu prüfen. Achten Sie bei der Vorschau insbesondere auf folgende Punkte:

- Kann die view normal abgefragt werden?
- Sind alle Felder vorhanden?
- Entsprechen Feldtyp und Oberflächentyp der fachlichen Bedeutung?
- Ist ein Record unique key vorhanden und sind die Daten eindeutig?
- Müssen nicht unterstützte Feldtypen auf der Datenbankseite angepasst werden?

![connect_view_configure_preview](https://static-docs.nocobase.com/connect_view_configure_preview.png)

## Felder konfigurieren

Nach dem Erstellen einer Datenbankansicht können Sie in der Datentabellenliste rechts neben der Ansicht auf „Configure fields“ klicken, um die Feldkonfigurationsseite zu öffnen. Die Feldkonfiguration dient dazu, die Felder der Ansicht zu verwalten, ihre Darstellung in der Benutzeroberfläche festzulegen und die Datenbankfelder der view den Field types und Field interfaces von NocoBase zuzuordnen.

Normale Felder einer Datenbankansicht stammen aus der Datenbank- view. NocoBase fügt keine tatsächlichen Spalten direkt in der view hinzu, ändert oder löscht sie. Auf der Feldkonfigurationsseite können nur Viele-zu-eins-Beziehungsfelder hinzugefügt werden, um geschäftliche Verknüpfungen in NocoBase zu ergänzen. Datenbankansichten können nicht als Zieldatentabellen von Beziehungsfeldern verwendet werden; ein Titelfeld muss normalerweise nicht konfiguriert werden.

[Weitere Informationen zur Feldkonfiguration](../data-modeling/collection-fields/index.md)

![configure_view](https://static-docs.nocobase.com/configure_view.png)

### Beziehungsfeld hinzufügen

Zu einer Datenbankansicht können nur Viele-zu-eins-Beziehungsfelder hinzugefügt werden. Ein Viele-zu-eins-Beziehungsfeld kann ein vorhandenes Feld der view dem Primärschlüssel oder einem eindeutigen Feld der Zieldatentabelle zuordnen, um verknüpfte Datensätze auf der Seite anzuzeigen. In der Datenbank- view werden dabei jedoch weder ein tatsächliches Feld noch eine Fremdschlüsselbeschränkung erstellt.

Klicken Sie auf „Add field“, um ein Viele-zu-eins-Beziehungsfeld hinzuzufügen.

[Weitere Informationen zur Feldkonfiguration](../data-modeling/collection-fields/index.md)

![add_view_field](https://static-docs.nocobase.com/add_view_field.png)
![add_view_field_configure](https://static-docs.nocobase.com/add_view_field_configure.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field display name | Der Name, unter dem das Viele-zu-eins-Beziehungsfeld in der Benutzeroberfläche angezeigt wird. Es wird empfohlen, einen für die Fachanwender verständlichen Namen zu verwenden, zum Beispiel „Zugehöriger Kunde“ oder „Verknüpfte Bestellung“. |
| Field name | Der Bezeichner, unter dem das Viele-zu-eins-Beziehungsfeld in NocoBase gespeichert wird. Er wird für interne Verweise in APIs, Berechtigungen, Workflows usw. verwendet. |
| Source collection | Quelldatentabelle, also die aktuelle Datentabelle der Datenbankansicht. Legt fest, aus welchem Datentabellenfeld `Foreign key` ausgewählt wird. Beim Hinzufügen eines Viele-zu-eins-Beziehungsfeldes zu einer Datenbankansicht bleibt normalerweise die aktuelle view ausgewählt. |
| Target collection | Die zu verknüpfende Zieldatentabelle. Normalerweise werden echte Datentabellen wie gewöhnliche Datentabellen oder Tabellen externer Datenbanken ausgewählt. Datenbankansichten können nicht ausgewählt werden. |
| Foreign key | Das Feld in der aktuellen Datenbankansicht, in dem der Bezeichner des Zieldatensatzes gespeichert wird. Dieses Feld muss in den Abfrageergebnissen der view stabil zurückgegeben werden. |
| Target key | Das Feld in der Zieldatentabelle, mit dem `Foreign key` abgeglichen wird. Normalerweise wird der Primärschlüssel oder ein eindeutiges Feld ausgewählt. |
| Description | Feldbeschreibung. Hier können die Bedeutung der Beziehung, die Datenquelle, die Pflegeweise oder wichtige Hinweise angegeben werden. |

### Feldzuordnung

Nach der Verbindung mit einer Datenbankansicht ermittelt NocoBase anhand der view-Felder und Quellfelder den Field type und ordnet ein standardmäßiges Field interface zu. Wenn Quelle, Darstellung oder fachliche Bedeutung des Feldes nicht den Erwartungen entsprechen, kann die Zuordnung in der Feldkonfiguration angepasst werden.

[Weitere Informationen zur Feldkonfiguration](../data-modeling/collection-fields/index.md)

![edit_view_field_configure](https://static-docs.nocobase.com/edit_view_field_configure.png)

:::tip Hinweis

- Field interface (Oberflächentyp / UI-Typ): Legt fest, wie ein Feld im Frontend angezeigt wird und mit ihm interagiert wird, zum Beispiel „Einzeiliger Text“, „Zahl“, „Dropdown-Menü“ oder „Datum und Uhrzeit“. Es handelt sich um eine feldbezogene Klassifizierung aus Benutzersicht.
- Field type (Datentyp): Legt fest, wie NocoBase den Datentyp eines Feldes erkennt. View-Felder ohne Quellfeld werden normalerweise aus dem Datenbankfeldtyp abgeleitet, zum Beispiel `string`, `integer`, `decimal`, `boolean`, `datetime` usw.

:::

:::warning Achtung

Das Anpassen von Field source, Field type oder Field interface entspricht nicht der Änderung des Feldtyps der Datenbank- view. Es beeinflusst hauptsächlich die Darstellungsweise auf Seiten, die Validierungsregeln und die Art, wie NocoBase das Feld erkennt.

:::

### Mit der Datenbank synchronisieren

Wenn die Feldstruktur der view auf der Datenbankseite geändert wurde, können Sie „Configure fields“ öffnen und auf „Sync from database“ klicken, um die Feldstruktur erneut einzulesen. Nach der Synchronisierung aktualisiert NocoBase die Felder: Neue Felder aus der view werden hinzugefügt, aus der view entfernte Felder bereinigt und Feldtypen sowie Feldquellen erneut bestätigt.

![edit_view_sync_from_database](https://static-docs.nocobase.com/edit_view_sync_from_database.png)
![edit_view_sync_from_database_configure](https://static-docs.nocobase.com/edit_view_sync_from_database_configure.png)

:::warning Achtung

Eine Umbenennung von Feldern wird bei der Synchronisierung normalerweise als „altes Feld löschen + neues Feld hinzufügen“ behandelt. Prüfen Sie vor der Synchronisierung, ob das alte Feld bereits von Seiten, Berechtigungen, Workflows oder externen APIs verwendet wird, um Konfigurationsfehler nach der Synchronisierung zu vermeiden. Prüfen Sie anschließend erneut Field type und Field interface.

:::

### Feld bearbeiten

Klicken Sie rechts neben einem Feld auf „Edit“, um die Feldkonfiguration zu bearbeiten. Das Bearbeiten eines Feldes eignet sich zum Anpassen der Darstellung und Verwendung des Feldes in NocoBase, zum Beispiel zum Ändern des Anzeigenamens, der Beschreibung, der Validierungsregeln oder feldspezifischer Einstellungen.
[Weitere Informationen zur Feldkonfiguration](../data-modeling/collection-fields/index.md)

![edit_field](https://static-docs.nocobase.com/edit_field.png)
![edit_field_configure](https://static-docs.nocobase.com/edit_field_configure.png)

:::warning Achtung

Das Bearbeiten der Feldkonfiguration ändert weder die tatsächlichen Spaltennamen und Feldtypen der Datenbank- view noch SQL-Ausdrücke oder Indizes. Wenn die tatsächliche Struktur der view angepasst werden muss, ändern Sie die view zuerst auf der Datenbankseite und synchronisieren Sie sie anschließend mit „Sync from database“.

:::

### Feld löschen

Klicken Sie rechts neben einem Feld auf „Delete“, um ein einzelnes Feld zu löschen. Beim Löschen wird nur das in NocoBase gespeicherte Feld entfernt; die tatsächliche Spalte der Datenbank- view wird nicht gelöscht.

[Weitere Informationen zur Feldkonfiguration](../data-modeling/collection-fields/index.md)

![delete_field](https://static-docs.nocobase.com/delete_field.png)

:::warning Achtung

Das Löschen eines Feldes kann Seitenblöcke, Filterbedingungen, Sortierungen, Berechtigungen, Workflows, APIs und vorhandene Konfigurationen beeinflussen. Prüfen Sie daher vor dem Löschen, ob das Feld noch verwendet wird. Wenn die Datenbank- view diese Spalte weiterhin zurückgibt, erkennt NocoBase das Feld möglicherweise bei einer späteren Ausführung von „Sync from database“ erneut.

:::

## Ansicht bearbeiten

Die SQL-Definition einer Datenbankansicht wird auf der Datenbankseite gepflegt. Klicken Sie in der Datentabellenliste rechts neben einer Datenbankansicht auf „Edit“, um die Metadaten und Laufzeiteinstellungen der Datenbankansicht in NocoBase anzupassen. Die view in der Datenbank wird dabei nicht geändert. Wenn eine Verbindung zu einer anderen Datenbank- view hergestellt werden soll, wird empfohlen, eine neue Datentabelle für die Datenbankansicht zu erstellen.

![edit_view](https://static-docs.nocobase.com/edit_view.png)
![edit_view_configure](https://static-docs.nocobase.com/edit_view_configure.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Collection display name | Der Name, unter dem die Datenbankansicht in der Benutzeroberfläche angezeigt wird. Er kann in einen für die Fachanwender verständlichen Namen geändert werden, zum Beispiel „Finanzberichtansicht“ oder „Kundenstatistikansicht“. |
| Collection name | Der Bezeichner der Datenbankansicht in NocoBase. Beim Bearbeiten kann er nicht geändert werden. |
| Database view | Die aktuell verbundene Datenbank- view. Beim Bearbeiten schreibgeschützt und nicht durch eine andere view ersetzbar. |
| Categories | Kategorie der Datentabelle. Beeinflusst nur die Organisation in der Verwaltungsoberfläche der Datenquelle, nicht die Datenbank- view. |
| Description | Beschreibung der Datentabelle. Hier können die für die view verantwortliche Person, die Abfragequelle sowie die verwendeten Seiten oder Berichte angegeben werden. |
| Use simple pagination mode | Einfacher Seitenumblättermodus. Bei Aktivierung wird bei der Seitennavigation von Tabellenblöcken auf die Ermittlung der Gesamtzahl der Datensätze verzichtet. Dies eignet sich für Ansichten mit großen Datenmengen. |
| Record unique key | Eindeutiger Bezeichner eines Datensatzes. Dient zur Identifizierung eines Datensatzes. Normalerweise wird ein stabiles eindeutiges Feld oder eine Kombination stabiler eindeutiger Felder aus der view ausgewählt. |
| Allow add new, update and delete actions | Legt fest, ob Datensätze hinzugefügt, aktualisiert und gelöscht werden dürfen. Die Aktivierung wird nur empfohlen, wenn die Datenbank- view selbst Schreibvorgänge unterstützt und das Datenbankkonto über die entsprechenden Berechtigungen verfügt. |

:::warning Achtung

Nach der Änderung von Record unique key oder Allow add new, update and delete actions müssen Sie prüfen, ob Seitenblöcke, Berechtigungen und Workflows weiterhin den Erwartungen entsprechen.

:::

## Ansicht löschen

Klicken Sie in der Datentabellenliste rechts neben einer Datenbankansicht auf „Delete“, um die Datentabelle der Datenbankansicht zu löschen. Dabei werden nur die Verbindungs- und Feldkonfigurationen in NocoBase gelöscht; die view in der Datenbank bleibt erhalten.

Datenbankansichten in der Hauptdatenbank können ebenfalls ausgewählt und gemeinsam gelöscht werden. Prüfen Sie vor dem Löschen, ob Seitenblöcke, Diagramme, Berechtigungen, Workflows oder externe APIs diese Datentabelle der Datenbankansicht noch verwenden.
![delete_view](https://static-docs.nocobase.com/delete_view.png)
![delete_view_second_confirmation](https://static-docs.nocobase.com/delete_view_second_confirmation.png)