:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# JS online schreiben & ausführen

In NocoBase bietet **RunJS** eine leichtgewichtige Erweiterungsmöglichkeit, die sich ideal für **schnelle Experimente und die temporäre Verarbeitung von Logik** eignet. Sie können damit Oberflächen oder Interaktionen mittels JavaScript individuell anpassen, ohne Plugins erstellen oder den Quellcode ändern zu müssen.

Damit können Sie direkt im UI-Builder JS-Code eingeben, um Folgendes zu realisieren:

- Benutzerdefinierte Inhalte rendern (Felder, Blöcke, Spalten, Elemente usw.)  
- Benutzerdefinierte Interaktionslogik (Schaltflächenklicks, Ereignisverknüpfungen)  
- Dynamisches Verhalten in Kombination mit Kontextdaten  

## Unterstützte Szenarien

### JS-Block

Mithilfe von JS können Sie die Darstellung von Blöcken anpassen und so die Struktur und den Stil des Blocks vollständig steuern. Dies eignet sich für hochflexible Szenarien wie die Anzeige benutzerdefinierter Komponenten, statistischer Diagramme oder Inhalte von Drittanbietern.

![20250916105031](https://static-docs.nocobase.com/20250916105031.png)  

Dokumentation: [JS-Block](/interface-builder/blocks/other-blocks/js-block)

### JS-Aktion

Passen Sie die Klicklogik von Aktionsschaltflächen mit JS an, um beliebige Frontend- oder API-Anfragen auszuführen. Zum Beispiel: dynamische Wertberechnungen, Übermittlung benutzerdefinierter Daten oder das Auslösen von Pop-ups.

![20250916105123](https://static-docs.nocobase.com/20250916105123.png)  

Dokumentation: [JS-Aktion](/interface-builder/actions/types/js-action)

### JS-Feld

Mithilfe von JS können Sie die Rendering-Logik von Feldern anpassen. So können Sie basierend auf Feldwerten dynamisch verschiedene Stile, Inhalte oder Zustände anzeigen.

![20250916105354](https://static-docs.nocobase.com/20250916105354.png)  

Dokumentation: [JS-Feld](/interface-builder/fields/specific/js-field)

### JS-Element

Rendern Sie unabhängige Elemente mit JS, ohne sie an bestimmte Felder zu binden. Dies wird häufig zur Anzeige benutzerdefinierter Informationsblöcke verwendet.

![20250916104848](https://static-docs.nocobase.com/20250916104848.png)  

Dokumentation: [JS-Element](/interface-builder/fields/specific/js-item)

### JS-Tabellenspalte

Passen Sie die Darstellung von Tabellenspalten mit JS an. So können Sie komplexe Zellanzeigelogiken wie Fortschrittsbalken oder Status-Labels implementieren.

![20250916105443](https://static-docs.nocobase.com/20250916105443.png)  

Dokumentation: [JS-Tabellenspalte](/interface-builder/fields/specific/js-column)

### Verknüpfungsregeln

Steuern Sie die Verknüpfungslogik zwischen Feldern in Formularen oder Seiten mit JS. Zum Beispiel: Wenn sich ein Feld ändert, passen Sie den Wert oder die Sichtbarkeit eines anderen Feldes dynamisch an.

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)  

Dokumentation: [Verknüpfungsregeln](/interface-builder/linkage-rule)

### Ereignisfluss

Passen Sie die Auslösebedingungen und die Ausführungslogik von Ereignisflüssen mit JS an, um komplexere Frontend-Interaktionsketten zu erstellen.

![](https://static-docs.nocobase.com/20251031092755.png)  

Dokumentation: [Ereignisfluss](/interface-builder/event-flow)