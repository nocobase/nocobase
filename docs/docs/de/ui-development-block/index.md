:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Block-Erweiterungen im Überblick

In NocoBase 2.0 haben wir den Mechanismus für Block-Erweiterungen erheblich vereinfacht. Entwickler müssen lediglich die entsprechende **FlowModel**-Basisklasse erben und die zugehörigen Schnittstellenmethoden (hauptsächlich die Methode `renderComponent()`) implementieren, um Blöcke schnell anzupassen.

## Block-Kategorien

NocoBase unterteilt Blöcke in drei Kategorien, die in der Konfigurationsoberfläche gruppiert angezeigt werden:

- **Daten-Blöcke**: Blöcke, die von `DataBlockModel` oder `CollectionBlockModel` erben.
- **Filter-Blöcke**: Blöcke, die von `FilterBlockModel` erben.
- **Andere Blöcke**: Blöcke, die direkt von `BlockModel` erben.

> Die Gruppierung der Blöcke wird durch die entsprechende Basisklasse bestimmt. Die Klassifizierungslogik basiert auf Vererbungsbeziehungen und erfordert keine zusätzliche Konfiguration.

## Beschreibung der Basisklassen

Das System stellt vier Basisklassen für Erweiterungen bereit:

### BlockModel

**Basis-Block-Modell**, die vielseitigste Basisklasse für Blöcke.

- Geeignet für reine Anzeige-Blöcke, die nicht von Daten abhängen.
- Wird der Gruppe **Andere Blöcke** zugeordnet.
- Anwendbar für individuelle Szenarien.

### DataBlockModel

**Daten-Block-Modell (nicht an eine Datentabelle gebunden)**, für Blöcke mit benutzerdefinierten Datenquellen.

- Nicht direkt an eine Datentabelle gebunden; die Datenabruflogik kann angepasst werden.
- Wird der Gruppe **Daten-Blöcke** zugeordnet.
- Anwendbar für: Aufrufe externer APIs, benutzerdefinierte Datenverarbeitung, statistische Diagramme usw.

### CollectionBlockModel

**Sammlungs-Block-Modell**, für Blöcke, die an eine Datentabelle gebunden werden müssen.

- Erfordert die Bindung an eine Modell-Basisklasse für Datentabellen.
- Wird der Gruppe **Daten-Blöcke** zugeordnet.
- Anwendbar für: Listen, Formulare, Kanban-Boards und andere Blöcke, die eindeutig von einer bestimmten Datentabelle abhängen.

### FilterBlockModel

**Filter-Block-Modell**, zum Erstellen von Blöcken für Filterbedingungen.

- Modell-Basisklasse zum Erstellen von Filterbedingungen.
- Wird der Gruppe **Filter-Blöcke** zugeordnet.
- Arbeitet in der Regel in Verbindung mit Daten-Blöcken.

## So wählen Sie eine Basisklasse aus

Bei der Auswahl einer Basisklasse können Sie die folgenden Prinzipien befolgen:

- **Muss an eine Datentabelle gebunden werden**: Priorisieren Sie `CollectionBlockModel`.
- **Benutzerdefinierte Datenquelle**: Wählen Sie `DataBlockModel`.
- **Zum Festlegen von Filterbedingungen und zur Zusammenarbeit mit Daten-Blöcken**: Wählen Sie `FilterBlockModel`.
- **Nicht sicher, wie zu kategorisieren**: Wählen Sie `BlockModel`.

## Schnellstart

Das Erstellen eines benutzerdefinierten Blocks erfordert nur drei Schritte:

1. Erben Sie die entsprechende Basisklasse (z. B. `BlockModel`).
2. Implementieren Sie die Methode `renderComponent()`, um eine React-Komponente zurückzugeben.
3. Registrieren Sie das Block-Modell im **Plugin**.

Detaillierte Beispiele finden Sie unter [Einen Block-Plugin schreiben](./write-a-block-plugin).