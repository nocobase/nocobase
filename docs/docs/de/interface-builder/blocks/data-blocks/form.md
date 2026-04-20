:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/interface-builder/blocks/data-blocks/form).
:::

# Formular-Block

## Einführung

Der Formular-Block ist ein wichtiger Block zum Erstellen von Dateneingabe- und Bearbeitungsoberflächen. Er ist hochgradig anpassbar und nutzt entsprechende Komponenten, um die benötigten Felder basierend auf dem Datenmodell anzuzeigen. Mittels Ereignisflüssen wie Verknüpfungsregeln kann der Formular-Block Felder dynamisch darstellen. Darüber hinaus lässt er sich mit Workflows kombinieren, um automatisierte Prozesse auszulösen und Daten zu verarbeiten, was die Arbeitseffizienz weiter steigert oder die Logik-Orchestrierung ermöglicht.

## Formular-Block hinzufügen

- **Formular bearbeiten**: Dient zum Ändern bestehender Daten.
- **Formular hinzufügen**: Dient zum Erstellen neuer Datensätze.

![20251023191139](https://static-docs.nocobase.com/20251023191139.png)

## Block-Einstellungen

![20251023191448](https://static-docs.nocobase.com/20251023191448.png)

### Block-Verknüpfungsregel

Steuern Sie das Block-Verhalten (z. B. ob er angezeigt oder JavaScript ausgeführt werden soll) mithilfe von Verknüpfungsregeln.

![20251023191703](https://static-docs.nocobase.com/20251023191703.png)

Weitere Details finden Sie unter [Block-Verknüpfungsregel](/interface-builder/blocks/block-settings/block-linkage-rule)

### Feld-Verknüpfungsregel

Steuern Sie das Verhalten von Formularfeldern mithilfe von Verknüpfungsregeln.

![20251023191849](https://static-docs.nocobase.com/20251023191849.png)

Weitere Details finden Sie unter [Feld-Verknüpfungsregel](/interface-builder/blocks/block-settings/field-linkage-rule)

### Layout

Der Formular-Block unterstützt zwei Layout-Modi, die über das Attribut `layout` eingestellt werden können:

- **horizontal** (horizontal): Bei diesem Layout werden Beschriftung und Inhalt in einer Zeile angezeigt, was vertikalen Platz spart und sich für einfache Formulare oder Fälle mit weniger Informationen eignet.
- **vertical** (vertikal) (Standard): Die Beschriftung wird über dem Feld platziert. Dieses Layout macht das Formular leichter lesbar und ausfüllbar, besonders bei Formularen mit mehreren Feldern oder komplexen Eingabeelementen.

![20251023193638](https://static-docs.nocobase.com/20251023193638.png)

## Felder konfigurieren

### Felder dieser Collection

> **Hinweis**: Felder aus vererbten Collections (d.h. Felder der übergeordneten Collection) werden automatisch zusammengeführt und in der aktuellen Feldliste angezeigt.

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### Beziehungs-Collection-Felder

> Beziehungs-Collection-Felder sind im Formular schreibgeschützt. Sie werden normalerweise zusammen mit Assoziationsfeldern verwendet, um mehrere Feldwerte der verknüpften Daten anzuzeigen.

![20260212161035](https://static-docs.nocobase.com/20260212161035.png)

- Derzeit werden nur To-One-Beziehungen unterstützt (z. B. belongsTo / hasOne usw.).
- Es wird normalerweise in Kombination mit einem Assoziationsfeld (zur Auswahl verknüpfter Datensätze) verwendet: Die Assoziationsfeld-Komponente ist für die Auswahl/Änderung des verknüpften Datensatzes zuständig, während das Beziehungs-Collection-Feld für die Anzeige weiterer Informationen dieses Datensatzes (schreibgeschützt) zuständig ist.

**Beispiel**: Nach Auswahl einer „verantwortlichen Person“ werden deren Mobiltelefonnummer, E-Mail-Adresse usw. im Formular angezeigt.

> Wenn das Assoziationsfeld „Verantwortliche Person“ im Bearbeitungsformular nicht konfiguriert ist, können die entsprechenden Verknüpfungsinformationen dennoch angezeigt werden. Wenn das Assoziationsfeld „Verantwortliche Person“ konfiguriert ist, werden die entsprechenden Verknüpfungsinformationen beim Ändern der verantwortlichen Person auf den entsprechenden Datensatz aktualisiert.

![20260212160748](https://static-docs.nocobase.com/20260212160748.gif)

### Weitere Felder

![20251023192559](https://static-docs.nocobase.com/20251023192559.png)

- Schreiben Sie JavaScript, um den Anzeigeinhalt anzupassen und komplexe Informationen darzustellen.

![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

### Feldvorlagen

Feldvorlagen werden verwendet, um die Konfiguration von Feldbereichen in Formular-Blöcken wiederzuverwenden. Weitere Details finden Sie unter [Feldvorlagen](/interface-builder/fields/field-template).

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

## Aktionen konfigurieren

![20251023193231](https://static-docs.nocobase.com/20251023193231.png)

- [Absenden](/interface-builder/actions/types/submit)
- [Workflow auslösen](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [AI-Mitarbeiter](/interface-builder/actions/types/ai-employee)