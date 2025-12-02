:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Detailblock

## Einführung

Der Detailblock dient dazu, die Feldwerte jedes Datensatzes anzuzeigen. Er unterstützt flexible Feldlayouts und verfügt über integrierte Funktionen zur Datenbearbeitung, die es Benutzern erleichtern, Informationen anzuzeigen und zu verwalten.

## Block-Einstellungen

![20251029202614](https://static-docs.nocobase.com/20251029202614.png)

### Block-Verknüpfungsregeln

Steuern Sie das Verhalten des Blocks (z. B. ob er angezeigt oder JavaScript ausgeführt werden soll) mithilfe von Verknüpfungsregeln.

![20251023195004](https://static-docs.nocobase.com/20251023195004.png)
Weitere Informationen finden Sie unter [Verknüpfungsregeln](/interface-builder/linkage-rule)

### Datenbereich festlegen

Beispiel: Zeigen Sie nur bezahlte Bestellungen an.

![20251023195051](https://static-docs.nocobase.com/20251023195051.png)

Weitere Informationen finden Sie unter [Datenbereich festlegen](/interface-builder/blocks/block-settings/data-scope)

### Feld-Verknüpfungsregeln

Die Verknüpfungsregeln im Detailblock unterstützen das dynamische Ein- und Ausblenden von Feldern.

Beispiel: Zeigen Sie den Betrag nicht an, wenn der Bestellstatus „Storniert“ ist.

![20251023200739](https://static-docs.nocobase.com/20251023200739.png)

Weitere Informationen finden Sie unter [Verknüpfungsregeln](/interface-builder/linkage-rule)

## Felder konfigurieren

### Felder dieser Sammlung

> **Hinweis**: Felder aus vererbten Sammlungen (d. h. Felder der übergeordneten Sammlung) werden automatisch zusammengeführt und in der aktuellen Feldliste angezeigt.

![20251023201012](https://static-docs.nocobase.com/20251023201012.png)

### Felder aus verknüpften Sammlungen

> **Hinweis**: Das Anzeigen von Feldern aus verknüpften Sammlungen wird unterstützt (derzeit nur für 1:1-Beziehungen).

![20251023201258](https://static-docs.nocobase.com/20251023201258.png)

### Weitere Felder
- JS Field
- JS Item
- Trennlinie
- Markdown

![20251023201514](https://static-docs.nocobase.com/20251023201514.png)

> **Tipp**: Sie können JavaScript schreiben, um benutzerdefinierte Anzeigeinhalte zu implementieren und so komplexere Informationen darzustellen.  
> Zum Beispiel können Sie verschiedene Anzeigeeffekte basierend auf unterschiedlichen Datentypen, Bedingungen oder Logiken rendern.

![20251023202017](https://static-docs.nocobase.com/20251023202017.png)

## Aktionen konfigurieren

![20251023200529](https://static-docs.nocobase.com/20251023200529.png)

- [Bearbeiten](/interface-builder/actions/types/edit)
- [Löschen](/interface-builder/actions/types/delete)
- [Link](/interface-builder/actions/types/link)
- [Pop-up](/interface-builder/actions/types/pop-up)
- [Datensatz aktualisieren](/interface-builder/actions/types/update-record)
- [Workflow auslösen](/interface-builder/actions/types/trigger-workflow)
- [JS-Aktion](/interface-builder/actions/types/js-action)
- [KI-Mitarbeiter](/interface-builder/actions/types/ai-employee)