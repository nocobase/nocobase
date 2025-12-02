:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Beziehungsfeld-Komponenten

## Einführung

Die Beziehungsfeld-Komponenten von NocoBase wurden entwickelt, um Ihnen dabei zu helfen, verknüpfte Daten besser darzustellen und zu verwalten. Unabhängig vom Beziehungstyp sind diese Komponenten flexibel und vielseitig, sodass Sie sie entsprechend Ihren spezifischen Anforderungen auswählen und konfigurieren können.

### Dropdown-Auswahl

Für alle Beziehungsfelder, außer wenn die Ziel-Sammlung eine Datei-Sammlung ist, ist die Dropdown-Auswahl die Standardkomponente im Bearbeitungsmodus. Die Dropdown-Optionen zeigen den Wert des Titelfeldes an. Dies eignet sich besonders für Szenarien, in denen verknüpfte Daten schnell durch die Anzeige wichtiger Feldinformationen ausgewählt werden können.

![20240429205659](https://static-docs.nocobase.com/20240429205659.png)

Weitere Informationen finden Sie unter [Dropdown-Auswahl](/interface-builder/fields/specific/select)

### Datenselektor

Der Datenselektor präsentiert Daten in einem Popup-Fenster. Sie können im Datenselektor die anzuzeigenden Felder konfigurieren (einschließlich Felder aus verschachtelten Beziehungen), um verknüpfte Daten präziser auszuwählen.

![20240429210824](https://static-docs.nocobase.com/20240429210824.png)

Weitere Informationen finden Sie unter [Datenselektor](/interface-builder/fields/specific/picker)

### Unterformular

Bei der Arbeit mit komplexeren Beziehungsdaten können Dropdown-Auswahlen oder Datenselektoren unpraktisch sein. In solchen Fällen müssten Sie häufig Popups öffnen. Für diese Szenarien können Sie ein Unterformular verwenden. Damit können Sie die Felder der verknüpften Sammlung direkt auf der aktuellen Seite oder im aktuellen Popup-Block bearbeiten, ohne wiederholt neue Popups öffnen zu müssen, was den Arbeitsablauf flüssiger gestaltet. Mehrstufige Beziehungen werden als verschachtelte Formulare dargestellt.

![20251029122948](https://static-docs.nocobase.com/20251029122948.png)

Weitere Informationen finden Sie unter [Unterformular](/interface-builder/fields/specific/sub-form)

### Untertabelle

Die Untertabelle zeigt Eins-zu-Viele- oder Viele-zu-Viele-Beziehungsdatensätze in Tabellenform an. Sie bietet eine klare, strukturierte Möglichkeit, verknüpfte Daten darzustellen und zu verwalten, und unterstützt das massenhafte Erstellen neuer Daten oder das Auswählen und Verknüpfen bestehender Daten.

![20251029123042](https://static-docs.nocobase.com/20251029123042.png)

Weitere Informationen finden Sie unter [Untertabelle](/interface-builder/fields/specific/sub-table)

### Unterdetails

Unterdetails ist die entsprechende Komponente zum Unterformular im Lesemodus. Sie unterstützt die Anzeige von Daten mit verschachtelten, mehrstufigen Beziehungen.

![20251030213050](https://static-docs.nocobase.com/20251030213050.png)

Weitere Informationen finden Sie unter [Unterdetails](/interface-builder/fields/specific/sub-detail)

### Dateimanager

Der Dateimanager ist eine Beziehungsfeld-Komponente, die speziell dann verwendet wird, wenn die Ziel-Sammlung der Beziehung eine Datei-Sammlung ist.

![20240429222753](https://static-docs.nocobase.com/20240429222753.png)

Weitere Informationen finden Sie unter [Dateimanager](/interface-builder/fields/specific/file-manager)

### Titel

Die Titelfeld-Komponente ist eine Beziehungsfeld-Komponente, die im Lesemodus verwendet wird. Durch die Konfiguration des Titelfeldes können Sie die entsprechende Feldkomponente einstellen.

![20251030213327](https://static-docs.nocobase.com/20251030213327.png)

Weitere Informationen finden Sie unter [Titel](/interface-builder/fields/specific/title)