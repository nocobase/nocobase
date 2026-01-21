:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Dropdown-Auswahl

## Einführung

Der Dropdown-Selektor ermöglicht es Ihnen, Daten aus bestehenden Einträgen einer Ziel-Sammlung auszuwählen und zu verknüpfen, oder neue Daten hinzuzufügen und diese anschließend zu verknüpfen. Die Dropdown-Optionen unterstützen eine unscharfe Suche (Fuzzy Search).

![20251029205901](https://static-docs.nocobase.com/20251029205901.png)

## Feldkonfiguration

### Datenumfang festlegen

Steuert den Datenumfang der Dropdown-Liste.

![20251029210025](https://static-docs.nocobase.com/20251029210025.png)

Weitere Informationen finden Sie unter [Datenumfang festlegen](/interface-builder/fields/field-settings/data-scope).

### Sortierregeln festlegen

Steuert die Sortierung der Daten im Dropdown-Selektor.

Beispiel: Sortierung nach Service-Datum in absteigender Reihenfolge.

![20251029210105](https://static-docs.nocobase.com/20251029210105.png)

### Mehrere Datensätze hinzufügen/verknüpfen erlauben

Begrenzt eine Eins-zu-Viele- oder Viele-zu-Viele-Beziehung, sodass nur ein Datensatz verknüpft werden kann.

![20251029210145](https://static-docs.nocobase.com/20251029210145.png)

### Titel-Feld

Das Titel-Feld ist das Beschriftungsfeld, das in den Optionen angezeigt wird.

![20251029210507](https://static-docs.nocobase.com/20251029210507.gif)

> Unterstützt die schnelle Suche basierend auf dem Titel-Feld.

Weitere Informationen finden Sie unter [Titel-Feld](/interface-builder/fields/field-settings/title-field).

### Schnellerstellung: Zuerst hinzufügen, dann auswählen

![20251125220046](https://static-docs.nocobase.com/20251125220046.png)

#### Hinzufügen über Dropdown

Nachdem Sie einen neuen Datensatz in der Ziel-Sammlung erstellt haben, wird dieser automatisch ausgewählt und nach dem Absenden des Formulars verknüpft.

Die Bestellungs-Sammlung hat ein Viele-zu-Eins-Beziehungsfeld „Account“.

![20251125220447](https://static-docs.nocobase.com/20251125220447.gif)

#### Hinzufügen über Modal-Fenster

Das Hinzufügen über ein Modal-Fenster eignet sich für komplexere Dateneingabeszenarien und ermöglicht die Konfiguration eines benutzerdefinierten Formulars zur Erstellung neuer Datensätze.

![20251125220607](https://static-docs.nocobase.com/20251125220607.gif)

[Feldkomponente](/interface-builder/fields/association-field)