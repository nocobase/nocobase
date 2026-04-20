:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/interface-builder/blocks/block-settings/block-height).
:::

# Blockhöhe

## Einführung

Die Blockhöhe unterstützt drei Modi: **Standardhöhe**, **Festgelegte Höhe** und **Volle Höhe**. Die meisten Blöcke unterstützen Höheneinstellungen.

![20260211153947](https://static-docs.nocobase.com/20260211153947.png)

![20260211154020](https://static-docs.nocobase.com/20260211154020.png)

## Höhenmodi

### Standardhöhe

Die Strategie für die Standardhöhe variiert je nach Blocktyp. Zum Beispiel passen sich Tabellen- und Formular-Blöcke automatisch an den Inhalt an, sodass innerhalb des Blocks keine Bildlaufleisten erscheinen.

### Festgelegte Höhe

Sie können die Gesamthöhe des äußeren Blockrahmens manuell festlegen. Der Block berechnet und verteilt die verfügbare interne Höhe automatisch.

![20260211154043](https://static-docs.nocobase.com/20260211154043.gif)

### Volle Höhe

Der Modus „Volle Höhe“ ähnelt der festgelegten Höhe, aber die Blockhöhe wird basierend auf dem aktuellen **Anzeigebereich** (Viewport) des Browsers berechnet, um die maximale Vollbildhöhe zu erreichen. Auf der Browserseite erscheinen keine Bildlaufleisten; diese erscheinen nur innerhalb des Blocks.

Die interne Handhabung des Bildlaufs im Modus „Volle Höhe“ unterscheidet sich je nach Block leicht:

- **Tabelle**: Internes Scrollen innerhalb von `tbody`;
- **Formular / Details**: Scrollen innerhalb des Grids (Inhaltsscrollen ohne den Aktionsbereich);
- **Liste / Raster-Karte**: Scrollen innerhalb des Grids (Inhaltsscrollen ohne den Aktionsbereich und die Paginierungsleiste);
- **Karte / Kalender**: Gesamte Höhe passt sich an, keine Bildlaufleisten;
- **Iframe / Markdown**: Begrenzt die Gesamthöhe des Blockrahmens, Bildlaufleisten erscheinen innerhalb des Blocks.

#### Tabelle in voller Höhe

![20260211154204](https://static-docs.nocobase.com/20260211154204.gif)

#### Formular in voller Höhe

![20260211154335](https://static-docs.nocobase.com/20260211154335.gif)