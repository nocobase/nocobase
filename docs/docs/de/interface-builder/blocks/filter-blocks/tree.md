---
title: "Tree Filter Block"
description: "Tree Filter Block: Filterbedingungen in Baumstruktur darstellen und Datenblöcke hierarchisch filtern – ideal für gekoppelte Filterung von Baumdaten."
keywords: "Tree Filter, TreeFilter, Baumfilter, hierarchische Filterung, gekoppelte Aktualisierung, Interface Builder, NocoBase"
---

# Tree Filter

## Einführung

Der Tree Filter Block stellt Filterfunktionen in einer Baumstruktur bereit und eignet sich für Datenszenarien mit hierarchischen Beziehungen, z. B. Produktkategorien oder Organisationsstrukturen.  
Benutzer können durch die Auswahl von Knoten verschiedener Ebenen die verbundenen Datenblöcke gekoppelt filtern.

## So verwenden Sie den Block

Der Tree Filter Block muss in Verbindung mit einem Datenblock eingesetzt werden, dem er die Filterfunktion bereitstellt.

Vorgehen:

1. Aktivieren Sie den Konfigurationsmodus und fügen Sie der Seite einen „Tree Filter"-Block sowie einen Datenblock hinzu (z. B. einen Tabellenblock).
2. Konfigurieren Sie den Tree Filter Block und wählen Sie eine baumförmige Datentabelle aus (z. B. die Tabelle der Produktkategorien).
3. Stellen Sie die Verbindung zwischen Tree Filter Block und Datenblock her.
4. Nach Abschluss der Konfiguration wird durch Klick auf einen Baumknoten der Datenblock entsprechend gefiltert.

## Block hinzufügen

Klicken Sie im Konfigurationsmodus auf die Schaltfläche „Block hinzufügen" und wählen Sie in der Kategorie „Filter-Block" den Eintrag „Tree" aus.

![](https://static-docs.nocobase.com/Tree-filter-04-07-2026_02_35_PM.png)

## Block-Konfigurationsoptionen

![](https://static-docs.nocobase.com/Tree-filter-04-07-2026_03_12_PM%20(1).png)

### Datenblock verbinden

Der Tree Filter Block muss mit einem Datenblock verbunden sein, damit er wirksam wird.  
Über die Konfigurationsoption „Datenblock verbinden" lässt sich der Tree Filter mit Tabellen-, Listen-, Diagramm- und ähnlichen Blöcken auf der Seite koppeln, um Filtern zu ermöglichen.

![](https://static-docs.nocobase.com/Tree-filter-04-07-2026_03_14_PM.png)

### Titelfeld

Gibt das Feld an, das als Bezeichnung des Baumknotens (Knotenname) angezeigt wird.

### Suche

Wenn aktiviert, können Baumknoten per Stichwort schnell gesucht und gefunden werden, was die Suchleistung erhöht.

### Alle ausklappen

Steuert, ob beim ersten Laden der Seite standardmäßig alle Baumknoten ausgeklappt werden.

### Untergeordnete Knoten einbeziehen

Wenn aktiviert, werden bei Auswahl eines Knotens auch alle Daten seiner Unterknoten in den Filter einbezogen.  
Geeignet für Szenarien, in denen alle Daten einer übergeordneten Kategorie zusammen betrachtet werden sollen.
