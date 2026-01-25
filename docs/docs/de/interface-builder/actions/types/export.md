---
pkg: "@nocobase/plugin-action-export"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Export

## Einführung

Die Exportfunktion ermöglicht es Ihnen, gefilterte Datensätze im **Excel**-Format zu exportieren. Dabei können Sie die zu exportierenden Felder konfigurieren. Wählen Sie die benötigten Felder für die spätere Datenanalyse, -verarbeitung oder -archivierung aus. Diese Funktion erhöht die Flexibilität bei Datenoperationen und ist besonders nützlich, wenn Daten auf andere Plattformen übertragen oder weiterverarbeitet werden müssen.

### Funktionshighlights:
- **Feldauswahl**: Sie können die zu exportierenden Felder konfigurieren und auswählen, um sicherzustellen, dass die exportierten Daten präzise und übersichtlich sind.
- **Unterstützung des Excel-Formats**: Die exportierten Daten werden als Standard-Excel-Datei gespeichert, was die Integration und Analyse mit anderen Daten erleichtert.

Mit dieser Funktion können Sie wichtige Daten aus Ihrer Arbeit einfach exportieren und extern nutzen, was Ihre Arbeitseffizienz steigert.

![20251029170811](https://static-docs.nocobase.com/20251029170811.png)

## Aktionskonfiguration

![20251029171452](https://static-docs.nocobase.com/20251029171452.png)

### Exportierbare Felder

- Erste Ebene: Alle Felder der aktuellen Sammlung;
- Zweite Ebene: Handelt es sich um ein Beziehungsfeld, müssen Sie Felder aus der verknüpften Sammlung auswählen;
- Dritte Ebene: Es werden nur drei Ebenen verarbeitet; Beziehungsfelder der letzten Ebene werden nicht angezeigt;

![20251029171557](https://static-docs.nocobase.com/20251029171557.png)

- [Verknüpfungsregel](/interface-builder/actions/action-settings/linkage-rule): Schaltfläche dynamisch ein-/ausblenden;
- [Schaltfläche bearbeiten](/interface-builder/actions/action-settings/edit-button): Titel, Typ und Symbol der Schaltfläche bearbeiten;