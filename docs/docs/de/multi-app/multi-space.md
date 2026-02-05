---
pkg: "@nocobase/plugin-multi-space"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::



pkg: "@nocobase/plugin-multi-space"
---

# Multi-Space

## Einführung

Das **Multi-Space Plugin** ermöglicht die Erstellung mehrerer unabhängiger Datenbereiche innerhalb einer einzigen Anwendungsinstanz durch logische Trennung.

#### Anwendungsfälle
- **Mehrere Filialen oder Fabriken**: Geschäftsprozesse und Systemkonfigurationen sind weitgehend identisch, wie z.B. eine einheitliche Bestandsverwaltung, Produktionsplanung, Verkaufsstrategien und Berichtsvorlagen. Es muss jedoch sichergestellt werden, dass die Daten jeder Geschäftseinheit sich nicht gegenseitig beeinflussen.
- **Verwaltung mehrerer Organisationen oder Tochtergesellschaften**: Mehrere Organisationen oder Tochtergesellschaften einer Unternehmensgruppe nutzen dieselbe Plattform, aber jede Marke verfügt über unabhängige Kunden-, Produkt- und Bestelldaten.

## Installation

Suchen Sie im Plugin-Manager das **Multi-Space** Plugin und aktivieren Sie es.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)

## Benutzerhandbuch

### Multi-Space Verwaltung

Nachdem Sie das Plugin aktiviert haben, navigieren Sie zur Einstellungsseite **„Benutzer & Berechtigungen“** und wechseln Sie zum Bereich **„Bereiche“**, um Ihre Bereiche zu verwalten.

> Im Anfangszustand gibt es einen integrierten **Nicht zugewiesenen Bereich (Unassigned Space)**, der hauptsächlich dazu dient, alte Daten anzuzeigen, die keinem Bereich zugeordnet sind.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Einen Bereich erstellen

Klicken Sie auf die Schaltfläche „Bereich hinzufügen“, um einen neuen Bereich zu erstellen:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Benutzer zuweisen

Nachdem Sie einen Bereich erstellt und ausgewählt haben, können Sie auf der rechten Seite die Benutzer festlegen, die diesem Bereich zugeordnet sind:

> **Tipp:** Nachdem Sie Benutzern einen Bereich zugewiesen haben, müssen Sie die Seite **manuell aktualisieren**, damit die Bereichswechselliste oben rechts den neuesten Bereich anzeigt.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)

### Multi-Space wechseln und anzeigen

Oben rechts können Sie den aktuellen Bereich wechseln.
Wenn Sie auf das **Augen-Symbol** auf der rechten Seite klicken (im hervorgehobenen Zustand), können Sie Daten aus mehreren Bereichen gleichzeitig anzeigen.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### Multi-Space Datenverwaltung

Nachdem Sie das Plugin aktiviert haben, fügt das System beim Erstellen einer Sammlung (Collection) automatisch ein **Bereichsfeld** hinzu.
**Nur Sammlungen, die dieses Feld enthalten, werden in die Logik der Bereichsverwaltung einbezogen.**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

Für bestehende Sammlungen können Sie manuell ein Bereichsfeld hinzufügen, um die Bereichsverwaltung zu aktivieren:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### Standardlogik

In Sammlungen, die das Bereichsfeld enthalten, wendet das System automatisch die folgende Logik an:

1. Beim Erstellen von Daten werden diese automatisch dem aktuell ausgewählten Bereich zugeordnet;
2. Beim Filtern von Daten werden diese automatisch auf die Daten des aktuell ausgewählten Bereichs beschränkt.

### Alte Daten in Multi-Space kategorisieren

Für Daten, die vor der Aktivierung des Multi-Space Plugins existierten, können Sie die Bereichszuordnung mit den folgenden Schritten vornehmen:

#### 1. Das Bereichsfeld hinzufügen

Fügen Sie das Bereichsfeld manuell zu der alten Sammlung hinzu:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Benutzer dem nicht zugewiesenen Bereich zuweisen

Verknüpfen Sie den Benutzer, der die alten Daten verwaltet, mit allen Bereichen, einschließlich des **Nicht zugewiesenen Bereichs (Unassigned Space)**, um Daten anzuzeigen, die noch keinem Bereich zugeordnet wurden:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Alle Bereichsdaten anzeigen

Wählen Sie oben aus, um Daten aus allen Bereichen anzuzeigen:

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Eine Seite für die Zuweisung alter Daten konfigurieren

Erstellen Sie eine neue Seite für die Zuweisung alter Daten. Zeigen Sie das „Bereichsfeld“ auf der **Listenansicht** und der **Bearbeitungsansicht** an, um die Bereichszuordnung manuell anzupassen.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Machen Sie das Bereichsfeld bearbeitbar

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Daten manuell Bereichen zuweisen

Bearbeiten Sie die Daten über die oben erstellte Seite manuell, um den alten Daten schrittweise den korrekten Bereich zuzuweisen (Sie können auch eine Stapelbearbeitung selbst konfigurieren).