# Kapitel 3: Seiten aufbauen - vom leeren Blatt zum produktiven Tool

Im vorigen Kapitel haben wir das Skelett der Datentabellen gebaut, doch die Daten existieren bisher nur „im Backend" - die Anwender sehen nichts. In diesem Kapitel bringen wir die Daten **auf die Bühne**: Wir bauen einen [Tabellenblock](/interface-builder/blocks/data-blocks/table) für die Tickets, konfigurieren Spalten, Sortierung, [Filter](/interface-builder/blocks/filter-blocks/form) und Pagination, sodass eine echte Ticketliste entsteht.

## 3.1 Was ist ein Block?

In NocoBase ist ein **Block** ein „Baustein" auf der Seite. Sie möchten eine Tabelle? Ein [Tabellenblock](/interface-builder/blocks/data-blocks/table). Ein Formular? Ein Formularblock. Auf einer Seite kombinieren Sie beliebig viele Blöcke und ordnen sie per Drag-and-Drop.

Häufige Block-Typen:

| Typ | Zweck |
|-----|-------|
| Tabelle | mehrere Datensätze in Zeilen/Spalten |
| Formular | Eingabe oder Bearbeitung |
| Detail | vollständige Anzeige eines Datensatzes |
| Filterformular | Filterbedingungen für andere Blöcke |
| Diagramm | Tortendiagramme, Liniendiagramme etc. |
| Markdown | freier Text oder Hinweise |

Merken Sie sich: **Block = Baustein**. Damit bauen wir die Ticket-Verwaltung.

## 3.2 Menü und Seiten anlegen

Zunächst legen wir einen Einstieg „Ticket-Verwaltung" an.

1. Klicken Sie oben rechts auf **UI Editor**, um in den [Konfigurationsmodus](/get-started/how-nocobase-works) zu wechseln (orangefarbene Rahmen erscheinen).
2. In der oberen Navigation **„Menüeintrag hinzufügen"** klicken, **„Gruppe hinzufügen"** wählen und **„Ticket-Verwaltung"** als Namen eingeben.

![03-building-pages-2026-03-12-09-38-36](https://static-docs.nocobase.com/03-building-pages-2026-03-12-09-38-36.png)


3. Der Menüeintrag erscheint sofort oben. **Klicken Sie ihn an**, um die Untermenüleiste links zu öffnen.
4. In der linken Menüleiste auf den orangefarbenen Button **„Menüeintrag hinzufügen"** klicken, **„Modern page (v2)"** wählen und zwei Unterseiten anlegen:
   - **Ticketliste** - alle Tickets
   - **Ticket-Kategorien** - Kategorienverwaltung

![03-building-pages-2026-03-12-09-41-26](https://static-docs.nocobase.com/03-building-pages-2026-03-12-09-41-26.png)

> **Hinweis**: Beim Hinzufügen sehen Sie „Legacy page (v1)" und „Modern page (v2)". Dieses Tutorial nutzt durchgehend **v2**.

## 3.3 Tabellenblock hinzufügen

Auf der Seite „Ticketliste" fügen wir nun einen Tabellenblock hinzu:

1. Auf der leeren Seite **„Block erstellen"** klicken.
2. **Datenblock → Tabelle** wählen.
3. In der angezeigten Liste **„Tickets"** auswählen (die in Kapitel 2 angelegte tickets-Tabelle).

![03-building-pages-2026-03-13-08-44-07](https://static-docs.nocobase.com/03-building-pages-2026-03-13-08-44-07.png)

Ein leerer Tabellenblock erscheint.

![03-building-pages-2026-03-13-08-44-29](https://static-docs.nocobase.com/03-building-pages-2026-03-13-08-44-29.png)

Damit der Block einfacher zu testen ist, fügen wir schnell einen „Hinzufügen"-Button hinzu, mit dem wir Testdaten erfassen:

1. Oben rechts in der Tabelle **„Aktionen konfigurieren"** klicken und **„Hinzufügen"** aktivieren.

![03-building-pages-2026-03-17-14-58-39](https://static-docs.nocobase.com/03-building-pages-2026-03-17-14-58-39.png)

2. Auf den neu erschienenen Button **„Hinzufügen"** klicken; im Popup **Block erstellen → Formular (Hinzufügen) → Aktuelle Tabelle** wählen.

![03-building-pages-2026-03-17-14-59-42](https://static-docs.nocobase.com/03-building-pages-2026-03-17-14-59-42.png)

3. Im Popup **„Felder konfigurieren"** klicken und Titel, Status, Priorität etc. aktivieren; **„Aktionen konfigurieren"** öffnen und den **„Senden"**-Button aktivieren.

![03-building-pages-2026-03-17-15-00-54](https://static-docs.nocobase.com/03-building-pages-2026-03-17-15-00-54.png)

![03-building-pages-2026-03-17-15-01-49](https://static-docs.nocobase.com/03-building-pages-2026-03-17-15-01-49.png)

4. Geben Sie ein paar Tickets ein und senden Sie ab - in der Tabelle erscheinen Daten.

![03-building-pages-2026-03-17-15-03-04](https://static-docs.nocobase.com/03-building-pages-2026-03-17-15-03-04.png)

> Die ausführliche Formularkonfiguration (Linkage, Bearbeitungsformular, Detail-Popups etc.) folgt in [Kapitel 4](/tutorials/v2/04-forms-and-details). Hier reicht es, Daten einzutippen.

## 3.4 Anzeige-Spalten konfigurieren

Standardmäßig werden nicht alle Felder angezeigt. Wir wählen die Spalten manuell aus:

1. Oben rechts neben den Spaltenüberschriften auf **„[Felder](/data-sources/data-modeling/collection-fields)"** klicken.
2. Folgende Felder aktivieren:
   - **Titel** - Themenüberschrift
   - **Status** - Bearbeitungsfortschritt
   - **Priorität** - Dringlichkeit
   - **Kategorie** - Beziehungsfeld, zeigt den Kategorienamen
   - **Antragsteller** - wer das Ticket erstellt hat
   - **Bearbeiter** - wer es bearbeitet
3. Felder wie ID oder Erstellungsdatum nicht aktivieren, damit die Tabelle übersichtlich bleibt.

![03-building-pages-2026-03-13-08-47-18](https://static-docs.nocobase.com/03-building-pages-2026-03-13-08-47-18.png)

> **Tipp**: Die Reihenfolge lässt sich per Drag-and-Drop anpassen. Stellen Sie wichtige Felder wie „Titel" und „Status" nach vorne.

### Problem: Beziehungsfelder zeigen die ID

Wenn Sie „Kategorie" aktivieren, sehen Sie die ID, nicht den Namen. Das liegt daran, dass Beziehungsfelder standardmäßig die ID als Titel-Feld nutzen. Es gibt zwei Lösungen:

**Variante 1: Spaltenkonfiguration ändern (gilt nur lokal)**

Klicken Sie auf die Konfiguration der Spalte „Kategorie", suchen Sie **„Title field"** und stellen Sie es von ID auf **Name** um. Wirkung nur in diesem Tabellenblock.

![03-building-pages-2026-03-13-09-23-03](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-23-03.png)

![03-building-pages-2026-03-13-09-57-40](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-57-40.gif)

**Variante 2: In der Datenquelle ändern (global, empfohlen)**

Gehen Sie zu **Einstellungen → [Datenquelle](/data-sources) → [Datentabelle](/data-sources/data-modeling/collection) → Kategorien-Tabelle** und stellen Sie das **„Title field"** auf **Name**. Damit zeigen alle Verwendungen der Kategorien-Tabelle den Namen - dauerhaft. Nach der Änderung müssen Sie das Feld in der Seite neu hinzufügen, damit es greift.
![03-building-pages-2026-03-13-09-23-41](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-23-41.png)

## 3.5 Filter und Sortierung

Mit wachsenden Ticketzahlen brauchen wir gezielte Filter. NocoBase bietet mehrere Optionen, beginnend mit dem **Filterformular-Block**.

### Filterformular hinzufügen

1. Auf der Ticketliste-Seite **„Block erstellen"** klicken und **Filterblock → Filterformular** wählen.
2. v2-Seiten verlangen keine Tabellenwahl - das Formular wird direkt eingefügt.
3. Im Filterformular **„Felder"** klicken; es zeigt alle filterbaren Datenblöcke der Seite, z. B. `Table: Tickets #c48b` (UID dahinter unterscheidet mehrere Blöcke der gleichen Tabelle).

![03-building-pages-2026-03-13-08-48-37](https://static-docs.nocobase.com/03-building-pages-2026-03-13-08-48-37.png)

4. Mauszeiger auf den Blocknamen → die filterbaren Felder erscheinen. Klicken Sie auf **Status**, **Priorität**, **Kategorie**, um sie als Filter zu aktivieren.

![03-building-pages-2026-03-13-09-25-44](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-25-44.png)

5. Der Anwender gibt Filterbedingungen ein, die Tabelle reagiert in Echtzeit.

![03-building-pages-2026-03-13-10-00-25](https://static-docs.nocobase.com/03-building-pages-2026-03-13-10-00-25.gif)

### Suche über mehrere Felder

Wie kombiniert man die Suche über mehrere Felder?

Klicken Sie oben rechts in einem Suchfeld auf die Konfiguration und wählen **„Connect fields"**. Dort sehen Sie die anschlussfähigen Felder pro Block - standardmäßig nur „Titel".
![03-building-pages-2026-03-13-09-30-06](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-30-06.png)

Wir können weitere Felder ergänzen, z. B. **Beschreibung**, sodass die Suche beide Felder einbezieht.

Sogar Felder verknüpfter Tabellen sind möglich - klicken Sie auf „Kategorie" und aktivieren Sie auf der nächsten Ebene „Kategoriename"; die Suche prüft dann auch die Kategorienamen.

![03-building-pages-2026-03-13-09-31-35](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-31-35.png)
![03-building-pages-2026-03-13-09-32-20](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-32-20.png)

> **„Connect fields" sind sehr mächtig**: Sie wirken über mehrere Blöcke und Felder. Wenn die Seite mehrere Datenblöcke enthält, probieren Sie es ruhig aus.

### Kein Auto-Filter gewünscht?

Soll der Filter erst per Klick auslösen? Klicken Sie unten rechts im Filterformular auf **„[Aktionen](/interface-builder/actions)"**, aktivieren Sie **„Filter"** und **„Reset"**. Anwender geben Bedingungen ein und klicken erst dann auf den Filter-Button.
![03-building-pages-2026-03-13-09-33-15](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-33-15.png)

### Alternative Filtermethode: Filter-Aktion in der Tabelle

Neben dem Filterformular bietet auch der Tabellenblock einen **„Filter"-Button** als Aktion. Über **„Aktionen"** oben in der Tabelle aktivieren Sie **„Filter"**; ein Filter-Button erscheint in der Tools-Leiste, beim Klicken öffnet sich ein Bedingungspanel.
![03-building-pages-2026-03-13-09-34-25](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-34-25.png)
![03-building-pages-2026-03-13-09-36-09](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-36-09.png)

Möchten Sie nicht jedes Mal die Felder einzeln auswählen, können Sie in der Konfiguration des Filter-Buttons Standardfelder vorbelegen.
![03-building-pages-2026-03-13-09-38-37](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-38-37.png)

> Hinweis: Die Tabellen-Filter-Aktion **unterstützt aktuell keine Mehrfeld-Suche**. Für diese verwenden Sie den oben gezeigten Filterformular-Block mit „Connect fields".

### Standard-Sortierung

Neue Tickets sollen oben stehen:

1. Oben rechts im Tabellenblock auf **Block-Einstellungen** (drei Querstriche) klicken.
2. **„[Sortier](/interface-builder/blocks/data-blocks/table)regeln festlegen"** aufrufen.
3. Sortierfeld: **Erstellungsdatum**, Reihenfolge: **absteigend**.

![03-building-pages-2026-03-13-09-40-54](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-40-54.png)

So stehen neue Tickets immer oben.

## 3.6 Zeilen-Aktionen

Reine Listen reichen nicht - wir möchten Tickets ansehen und bearbeiten.

1. Über der Aktionsspalte auf das zweite „+" klicken.
2. Aktionen aktivieren: **Anzeigen**, **[Bearbeiten](/interface-builder/actions/edit)**, **[Löschen](/interface-builder/actions/delete)**.
3. Pro Zeile erscheinen die Buttons „Anzeigen", „Bearbeiten" und „Löschen".

![03-building-pages-2026-03-13-09-42-42](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-42-42.png)

Beim Klick auf „Anzeigen" öffnet sich ein Drawer; darin können wir später einen Detailblock platzieren. Klick auf „Löschen" entfernt den Datensatz.

## 3.7 Layout anpassen

Aktuell stapeln sich Filterformular und Tabelle untereinander - nicht ideal. NocoBase erlaubt das **Drag-and-Drop**.

Im Konfigurationsmodus erscheint links oben am Block ein Verschiebe-Symbol; Cursor wird zum Kreuzpfeil, dann ziehen.

**Filterformular oberhalb der Tabelle platzieren**: Filterformular auf den oberen Rand der Tabelle ziehen, blaue Linie erscheint, dann loslassen.

![03-building-pages-2026-03-13-11-50-18](https://static-docs.nocobase.com/03-building-pages-2026-03-13-11-50-18.gif)

**Filterfelder in eine Zeile**: Innerhalb des Filterformulars sind Felder ebenfalls untereinander. Ziehen Sie „Priorität" rechts neben „Status", bis eine vertikale Hilfslinie erscheint - die beiden Felder stehen dann nebeneinander.

![03-building-pages-2026-03-13-11-50-58](https://static-docs.nocobase.com/03-building-pages-2026-03-13-11-50-58.gif)

> Praktisch alle Elemente in NocoBase sind ziehbar - Buttons, Spalten, Menüs ... Probieren Sie es aus!

## 3.8 Seite „Ticket-Kategorien" konfigurieren

Vergessen Sie nicht die Unterseite „Ticket-Kategorien" aus 3.2. Konfiguration läuft analog - Tabellenblock anlegen, Felder aktivieren, Aktionen einrichten. Ein Unterschied:

Erinnern Sie sich an die Tabelle „Ticket-Kategorien" aus Kapitel 2? Sie ist eine **Baumtabelle**. Damit der Tabellenblock die Hierarchie korrekt anzeigt, müssen Sie eine Option aktivieren:

1. Auf der Seite „Ticket-Kategorien" einen Tabellenblock mit Tabelle „Ticket-Kategorien" anlegen.
2. **Block-Einstellungen** öffnen, **„Tree table"** aktivieren.


Die Tabelle zeigt die Eltern-Kind-Beziehung dann eingerückt, statt alle Datensätze flach zu zeigen.

3. Felder wie Name, Beschreibung aktivieren, Aktionen konfigurieren (Hinzufügen, Bearbeiten, Löschen).
4. **Layout**: Stellen Sie „Name" als erste Spalte und „Aktionen" als zweite Spalte ein. Da die Tabelle wenige Felder hat, wirkt eine Zwei-Spalten-Anordnung übersichtlicher.

![03-building-pages-2026-03-13-18-51-36](https://static-docs.nocobase.com/03-building-pages-2026-03-13-18-51-36.png)

## Fazit

Glückwunsch! Das Ticket-System hat eine ansehnliche **Verwaltungsoberfläche**:

- klare Menüstruktur (Ticket-Verwaltung → Ticketliste / Ticket-Kategorien)
- ein **Tabellenblock** für Ticketdaten
- ein **Filterformular** mit schnellen Filtern für Status, Priorität, Kategorie
- **Sortierregel** nach Erstellungsdatum absteigend
- Aktionen pro Zeile zum Anzeigen und Bearbeiten
- ein **Baum-Tabellenblock** für Kategorien

Einfacher als gedacht? Alles ohne eine Zeile Code, nur per Drag-and-Drop und Konfiguration.

## Vorschau auf das nächste Kapitel

Nur „Ansehen" reicht nicht - Anwender müssen **neue Tickets erfassen** können. Im nächsten Kapitel bauen wir Formularblöcke, konfigurieren Linkage-Regeln und aktivieren Record-History für die Änderungsverfolgung.

## Verwandte Ressourcen

- [Block-Übersicht](/interface-builder/blocks) - alle Block-Typen
- [Tabellenblock](/interface-builder/blocks/data-blocks/table) - Detailkonfiguration
- [Filterblöcke](/interface-builder/blocks/filter-blocks/form) - Filterformulare
