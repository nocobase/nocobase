---
pkg: "@nocobase/plugin-multi-space"
---

:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/multi-space/multi-space).
:::

# Multi-Space

## Einführung

Das **Multi-Space-Plugin** ermöglicht die Einrichtung mehrerer unabhängiger Datenbereiche innerhalb einer einzigen Anwendungsinstanz durch logische Isolierung.

#### Anwendungsfälle
- **Mehrere Filialen oder Fabriken**: Geschäftsprozesse und Systemkonfigurationen sind hochgradig konsistent – wie zum Beispiel eine einheitliche Lagerverwaltung, Produktionsplanung, Verkaufsstrategien und Berichtsvorlagen –, aber die Daten für jede Geschäftseinheit müssen unabhängig voneinander bleiben.
- **Verwaltung mehrerer Organisationen oder Tochtergesellschaften**: Mehrere Organisationen oder Tochtergesellschaften innerhalb einer Unternehmensgruppe nutzen dieselbe Plattform, aber jede Marke verfügt über unabhängige Kunden-, Produkt- und Bestelldaten.


## Installation

Suchen Sie das **Multi-Space**-Plugin im Plugin-Manager und aktivieren Sie es.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)


## Benutzerhandbuch

### Multi-Space-Verwaltung

Gehen Sie nach der Aktivierung des Plugins zur Einstellungsseite **„Benutzer & Berechtigungen“** und wechseln Sie zum Bereich **Bereiche**, um die Bereiche zu verwalten.

> Standardmäßig gibt es einen integrierten **Nicht zugewiesenen Bereich (Unassigned Space)**, der primär dazu dient, Altdaten anzuzeigen, die noch keinem Bereich zugeordnet wurden.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Bereich erstellen

Klicken Sie auf die Schaltfläche „Bereich hinzufügen“, um einen neuen Bereich zu erstellen:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Benutzer zuweisen

Nachdem Sie einen erstellten Bereich ausgewählt haben, können Sie auf der rechten Seite die Benutzer festlegen, die diesem Bereich angehören:

> **Hinweis:** Nach der Zuweisung von Benutzern zu einem Bereich müssen Sie die **Seite manuell aktualisieren**, damit der Bereichsumschalter in der oberen rechten Ecke aktualisiert wird und die neuesten Bereiche anzeigt.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)


### Zwischen Bereichen wechseln und diese anzeigen

In der oberen rechten Ecke können Sie den aktuellen Bereich wechseln.  
Wenn Sie auf das **Augen-Symbol** auf der rechten Seite klicken (hervorgehobener Zustand), können Sie Daten aus mehreren Bereichen gleichzeitig anzeigen.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)


### Multi-Space-Datenverwaltung

Sobald das Plugin aktiviert ist, konfiguriert das System beim Erstellen einer **Sammlung** (Collection) automatisch ein **Bereichs-Feld** vor.  
**Nur Sammlungen, die dieses Feld enthalten, werden in die Logik der Bereichsverwaltung einbezogen.**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

Für bestehende Sammlungen können Sie manuell ein Bereichs-Feld hinzufügen, um die Bereichsverwaltung zu aktivieren:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### Standardlogik

In Sammlungen, die ein Bereichs-Feld enthalten, wendet das System automatisch die folgende Logik an:

1. Beim Erstellen von Daten werden diese automatisch dem aktuell ausgewählten Bereich zugeordnet.
2. Beim Filtern von Daten werden diese automatisch auf die Daten des aktuell ausgewählten Bereichs beschränkt.


### Kategorisierung von Altdaten in Bereiche

Für Daten, die bereits vor der Aktivierung des Multi-Space-Plugins existierten, können Sie die Bereichszuordnung mit den folgenden Schritten durchführen:

#### 1. Bereichs-Feld hinzufügen

Fügen Sie der alten Sammlung manuell ein Bereichs-Feld hinzu:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Benutzer dem nicht zugewiesenen Bereich zuweisen

Ordnen Sie die Benutzer, die Altdaten verwalten, allen Bereichen zu, einschließlich des **Nicht zugewiesenen Bereichs (Unassigned Space)**, um Daten anzuzeigen, die noch keinem Bereich zugewiesen wurden:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Ansicht auf alle Bereichsdaten umschalten

Wählen Sie oben die Option aus, um Daten aus allen Bereichen anzuzeigen:

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Seite zur Zuweisung von Altdaten konfigurieren

Erstellen Sie eine neue Seite für die Zuweisung von Altdaten. Zeigen Sie das „Bereichs-Feld“ sowohl im **Listen-Block** als auch im **Bearbeitungs-Formular** an, um die Bereichszuordnung manuell anzupassen.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Stellen Sie das Bereichs-Feld auf den bearbeitbaren Modus ein:

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Datenbereiche manuell zuweisen

Bearbeiten Sie die Daten über die oben genannte Seite manuell, um den Altdaten schrittweise den richtigen Bereich zuzuweisen (Sie können auch eine Stapelbearbeitung selbst konfigurieren).