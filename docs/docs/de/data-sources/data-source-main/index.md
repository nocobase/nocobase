---
pkg: "@nocobase/plugin-data-source-main"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Haupt-Datenbank

## Einführung

Die Haupt-Datenbank von NocoBase dient sowohl der Speicherung von Geschäftsdaten als auch den Metadaten der Anwendung, einschließlich Systemtabellen- und benutzerdefinierter Tabellendaten. Sie unterstützt relationale Datenbanken wie MySQL, PostgreSQL und andere. Bei der Installation der NocoBase-Anwendung wird die Haupt-Datenbank mitinstalliert und kann nicht entfernt werden.

## Installation

Dieses Plugin ist integriert und muss nicht separat installiert werden.

## Sammlungsverwaltung

Die Haupt-Datenquelle bietet umfassende Funktionen zur Sammlungsverwaltung. Sie ermöglicht Ihnen, neue Sammlungen über NocoBase zu erstellen und bestehende Sammlungsstrukturen aus der Datenbank zu synchronisieren.

![20240322230134](https://static-docs.nocobase.com/20240322230134.png)

### Bestehende Sammlungen aus der Datenbank synchronisieren

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Ein wichtiges Merkmal der Haupt-Datenquelle ist die Möglichkeit, bereits in der Datenbank vorhandene Sammlungen in NocoBase zur Verwaltung zu synchronisieren. Das bedeutet:

- **Bestehende Investitionen schützen**: Wenn Sie bereits zahlreiche Geschäfts-Sammlungen in Ihrer Datenbank haben, müssen Sie diese nicht neu erstellen. Sie können sie direkt synchronisieren und verwenden.
- **Flexible Integration**: Sammlungen, die mit anderen Tools (wie SQL-Skripten, Datenbankverwaltungstools usw.) erstellt wurden, können in die NocoBase-Verwaltung integriert werden.
- **Progressive Migration**: NocoBase unterstützt die schrittweise Migration bestehender Systeme, anstatt einer einmaligen Neugestaltung.

Mit der Funktion „Aus Datenbank laden“ können Sie:
1. Alle Sammlungen in der Datenbank durchsuchen
2. Die Sammlungen auswählen, die Sie synchronisieren möchten
3. Sammlungsstrukturen und Feldtypen automatisch erkennen
4. Mit einem Klick in NocoBase zur Verwaltung importieren

### Unterstützung verschiedener Sammlungs-Typen

![nocobase_doc-2025-10-29-19-47-14](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-47-14.png)

NocoBase unterstützt das Erstellen und Verwalten verschiedener Sammlungs-Typen:
- **Standard-Sammlung**: Enthält häufig verwendete Systemfelder.
- **Vererbungs-Sammlung**: Ermöglicht die Erstellung einer übergeordneten Sammlung, von der untergeordnete Sammlungen abgeleitet werden können. Untergeordnete Sammlungen erben die Struktur der übergeordneten Sammlung und können zusätzlich eigene Spalten definieren.
- **Baum-Sammlung**: Eine baumstrukturierte Sammlung, die derzeit nur das Adjazenzlisten-Design unterstützt.
- **Kalender-Sammlung**: Zum Erstellen von kalenderbezogenen Ereignis-Sammlungen.
- **Datei-Sammlung**: Zur Verwaltung von Dateispeicher.
- **Ausdrucks-Sammlung**: Für dynamische Ausdrucks-Szenarien in Workflows.
- **SQL-Sammlung**: Ist keine tatsächliche Datenbanktabelle, sondern stellt SQL-Abfragen schnell und strukturiert dar.
- **Ansichts-Sammlung**: Verbindet sich mit bestehenden Datenbankansichten.
- **Externe Sammlung**: Ermöglicht dem Datenbanksystem den direkten Zugriff und die Abfrage von Daten in externen Datenquellen, basierend auf der FDW-Technologie.

### Unterstützung der Klassifizierungsverwaltung von Sammlungen

![20240322231520](https://static-docs.nocobase.com/20240322231520.png)

### Umfangreiche Feldtypen

![nocobase_doc-2025-10-29-19-48-51](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-48-51.png)

#### Flexible Feldtypen-Konvertierung

NocoBase unterstützt die flexible Konvertierung von Feldtypen innerhalb desselben Datenbanktyps.

**Beispiel: Konvertierungsoptionen für String-Feldtypen**

Wenn ein Datenbankfeld vom Typ String ist, kann es in NocoBase in eine der folgenden Formen konvertiert werden:

- **Basistypen**: Einzeiliger Text, Mehrzeiliger Text, Telefonnummer, E-Mail, URL, Passwort, Farbe, Symbol
- **Auswahltypen**: Dropdown (Einzelauswahl), Optionsfeldgruppe
- **Medientypen**: Markdown, Markdown (Vditor), Rich Text, Anhang (URL)
- **Datums- & Zeit-Typen**: Datum und Uhrzeit (mit Zeitzone), Datum und Uhrzeit (ohne Zeitzone)
- **Erweiterte Typen**: Sequenz, Sammlungs-Selektor, Verschlüsselung

Dieser flexible Konvertierungsmechanismus bedeutet:
- **Keine Änderung der Datenbankstruktur erforderlich**: Der zugrunde liegende Speichertyp des Feldes bleibt unverändert; nur seine Darstellung in NocoBase ändert sich.
- **Anpassung an Geschäftsänderungen**: Mit sich ändernden Geschäftsanforderungen können Sie die Anzeige- und Interaktionsmethoden von Feldern schnell anpassen.
- **Datensicherheit**: Der Konvertierungsprozess beeinträchtigt nicht die Integrität bestehender Daten.

### Flexible Synchronisierung auf Feldebene

NocoBase kann nicht nur ganze Sammlungen synchronisieren, sondern unterstützt auch eine detaillierte Synchronisierungsverwaltung auf Feldebene:

![nocobase_doc-2025-10-29-19-49-56](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-49-56.png)

#### Merkmale der Feld-Synchronisierung:

1. **Echtzeit-Synchronisierung**: Wenn sich die Datenbank-Sammlungsstruktur ändert, können neu hinzugefügte Felder jederzeit synchronisiert werden.
2. **Selektive Synchronisierung**: Sie können die benötigten Felder selektiv synchronisieren, anstatt alle Felder.
3. **Automatische Typenerkennung**: Erkennt Datenbankfeldtypen automatisch und ordnet sie den NocoBase-Feldtypen zu.
4. **Datenintegrität bewahren**: Der Synchronisierungsprozess beeinträchtigt keine bestehenden Daten.

#### Anwendungsfälle:

- **Entwicklung des Datenbankschemas**: Wenn sich Geschäftsanforderungen ändern und neue Felder zur Datenbank hinzugefügt werden müssen, können diese schnell mit NocoBase synchronisiert werden.
- **Team-Zusammenarbeit**: Wenn andere Teammitglieder oder DBAs Felder zur Datenbank hinzufügen, können diese umgehend synchronisiert werden.
- **Hybrid-Verwaltungsmodus**: Einige Felder werden über NocoBase verwaltet, andere über traditionelle Methoden – flexible Kombinationen sind möglich.

Dieser flexible Synchronisierungsmechanismus ermöglicht NocoBase eine nahtlose Integration in bestehende technische Architekturen, ohne die vorhandenen Datenbankverwaltungspraktiken ändern zu müssen, und gleichzeitig die Vorteile der Low-Code-Entwicklung von NocoBase zu nutzen.

Weitere Informationen finden Sie im Abschnitt „[Sammlungsfelder / Übersicht](/data-sources/data-modeling/collection-fields)“.