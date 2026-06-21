---
pkg: "@nocobase/plugin-multi-space"
---

# Multi-Space

<PluginInfo name="multi-space" licenseBundled="professional"></PluginInfo>

## Einführung

Das **Multi-Space-Plugin** ermöglicht mehrere unabhängige Datenräume innerhalb einer einzelnen Anwendung durch logische Isolation.

#### Typische Szenarien
- **Mehrere Filialen oder Fabriken**: Prozesse und Konfiguration sind weitgehend identisch, Daten der einzelnen Einheiten sollen aber getrennt bleiben.
- **Mehrere Organisationen oder Tochtergesellschaften**: Gemeinsame Plattform, aber getrennte Kunden-, Produkt- und Bestelldaten pro Marke.

## Installation

Aktivieren Sie im Plugin-Manager das Plugin **Multi-Space**.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)

## Benutzerhandbuch

### Multi-Space-Verwaltung

Nach der Aktivierung wechseln Sie in **Users & Permissions** zum Tab **Spaces**.

> Standardmäßig gibt es den eingebauten Bereich **Unassigned Space** für Altdaten ohne Zuordnung.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Space erstellen

Klicken Sie auf **Add space**.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Benutzer zuweisen

Nach Auswahl eines Spaces können rechts die zugehörigen Benutzer festgelegt werden.

> **Hinweis:** Nach der Zuweisung ist ein **manuelles Neuladen der Seite** erforderlich, damit die Space-Umschaltung oben rechts aktualisiert wird.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)

### Spaces wechseln und anzeigen

Oben rechts wechseln Sie den aktiven Space. Mit dem **Auge-Symbol** (hervorgehoben) sehen Sie Daten aus mehreren Spaces gleichzeitig.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### Datenverwaltung in Multi-Space

Nach Aktivierung fügt das System beim Erstellen einer Collection automatisch ein **Space-Feld** hinzu. **Nur Collections mit diesem Feld** unterliegen der Space-Logik.

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

Bei bestehenden Collections kann das Space-Feld manuell ergänzt werden.

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### Standardlogik

1. Beim Erstellen von Daten wird automatisch der aktuell gewählte Space verknüpft.
2. Bei Abfragen werden Daten automatisch auf den aktuell gewählten Space gefiltert.

### Altdaten in Spaces klassifizieren

Für Daten, die vor Aktivierung des Plugins existierten:

#### 1. Space-Feld hinzufügen

Fügen Sie das Space-Feld manuell in Alt-Tabellen ein.

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Benutzer dem Unassigned Space zuordnen

Ordnen Sie zuständige Benutzer allen Spaces zu, inklusive **Unassigned Space**, um noch nicht klassifizierte Daten zu sehen.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Daten aus allen Spaces anzeigen

Aktivieren Sie oben die Ansicht für alle Spaces.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Zuordnungsseite für Altdaten erstellen

Erstellen Sie eine neue Seite zur Zuordnung und zeigen Sie das Space-Feld in **Listen-** und **Bearbeitungsseite** an.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Setzen Sie das Space-Feld auf bearbeitbar.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Space manuell zuweisen

Bearbeiten Sie die Daten über diese Seite und weisen Sie Altdaten schrittweise dem richtigen Space zu (optional per Batch-Bearbeitung).
