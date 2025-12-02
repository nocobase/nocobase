---
pkg: "@nocobase/plugin-block-reference"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Referenz-Block

## Einführung
Der Referenz-Block zeigt einen bereits konfigurierten Block direkt auf der aktuellen Seite an, indem Sie die UID des Zielblocks eingeben. Eine erneute Konfiguration ist nicht erforderlich.

## Plugin aktivieren
Dieses Plugin ist integriert, aber standardmäßig deaktiviert.
Öffnen Sie die „Plugin-Verwaltung“ → Suchen Sie „Block: Referenz“ → Klicken Sie auf „Aktivieren“.

![Referenz-Block im Plugin-Manager aktivieren](https://static-docs.nocobase.com/block-reference-enable-20251102.png)

## So fügen Sie den Block hinzu
1) Fügen Sie einen Block hinzu → Gruppe „Andere Blöcke“ → Wählen Sie „Referenz-Block“.
2) Füllen Sie in den „Referenz-Block-Einstellungen“ Folgendes aus:
   - `Block-UID`: die UID des Zielblocks
   - `Referenzmodus`: Wählen Sie `Referenz` oder `Kopie`

![Referenz-Block hinzufügen und konfigurieren Demo](https://static-docs.nocobase.com/20251102193949_rec_.gif)

### So erhalten Sie die Block-UID
- Öffnen Sie das Einstellungsmenü des Zielblocks und klicken Sie auf `UID kopieren`, um dessen UID zu kopieren.

![Block-UID kopieren Beispiel](https://static-docs.nocobase.com/block-reference-copy-uid-20251102.png)

## Modi und Verhalten
- `Referenz` (Standard)
  - Teilt die gleiche Konfiguration wie der ursprüngliche Block; Änderungen am Original oder an einer beliebigen Referenzstelle werden in allen Referenzen synchronisiert.

- `Kopie`
  - Erzeugt einen unabhängigen Block, der zum Zeitpunkt der Erstellung mit dem Original identisch ist; spätere Änderungen wirken sich nicht gegenseitig aus und werden nicht synchronisiert.

## Konfiguration
- Referenz-Block:
  - „Referenz-Block-Einstellungen“: zum Festlegen der Ziel-Block-UID und zur Auswahl des „Referenz-/Kopie“-Modus;
  - Gleichzeitig werden die vollständigen Einstellungen des referenzierten Blocks selbst angezeigt (entspricht der direkten Konfiguration des Originalblocks).

![Referenz-Block Konfigurationsoberfläche](https://static-docs.nocobase.com/block-reference-settings-20251102.png)

- Kopierter Block:
  - Der neu erstellte Block hat den gleichen Typ wie der ursprüngliche Block und enthält nur dessen eigene Einstellungen;
  - Er enthält keine „Referenz-Block-Einstellungen“ mehr.

## Fehler- und Fallback-Zustände
- Wenn das Ziel fehlt/ungültig ist: Es wird eine Fehlermeldung angezeigt. Sie können die Block-UID in den Einstellungen des Referenz-Blocks (Referenz-Block-Einstellungen → Block-UID) neu festlegen und nach dem Speichern die Anzeige wiederherstellen.

![Fehlerzustand bei ungültigem Zielblock](https://static-docs.nocobase.com/block-reference-error-20251102.png)

## Hinweise und Einschränkungen
- Experimentelle Funktion – bitte in Produktionsumgebungen mit Vorsicht verwenden.
- Beim Kopieren müssen einige Konfigurationen, die von der Ziel-UID abhängen, möglicherweise neu konfiguriert werden.
- Alle Konfigurationen eines Referenz-Blocks werden automatisch synchronisiert, einschließlich der „Datenbereiche“. Ein Referenz-Block kann jedoch eine eigene [Ereignisfluss-Konfiguration](/interface-builder/event-flow/) haben. Durch Ereignisflüsse und benutzerdefinierte JavaScript-Aktionen können Sie indirekt unterschiedliche Datenbereiche oder ähnliche Konfigurationen pro Referenz erreichen.