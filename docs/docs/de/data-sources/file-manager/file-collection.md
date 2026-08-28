---
title: "Dateitabelle"
description: "Die Dateitabelle speichert Dateititel, Dateinamen, Größe, MIME-Typ, Pfad, URL, Vorschauadresse, Speicherort und erweiterte Metadaten zur Verknüpfung mit Anlagenfeldern."
keywords: "Dateitabelle,File Collection,attachments,Metadaten,Anlagen,NocoBase"
---

# Dateitabelle

<PluginInfo name="file-manager"></PluginInfo>

## Einführung

Die Dateitabelle eignet sich zum Speichern von Dateimetadaten wie Dateiname, Erweiterung, Größe, MIME-Typ, Pfad, URL, Vorschauadresse, Speicherort und benutzerdefinierten Metadaten. Die eigentlichen Dateien werden von der Dateispeicher-Engine gespeichert; die Dateitabelle speichert die Metadaten der Dateien.

Dateitabellen können nur über die Seite der Hauptdatenbank erstellt werden. Externe Datenbanken, REST-API-Datenquellen und externe NocoBase-Datenquellen unterstützen das Erstellen von Dateitabellen nicht.

## Geeignete Szenarien

Dateitabellen eignen sich für folgende Geschäftsszenarien:

- Vertragsanlagen, Rechnungsdateien und Belege für die Kostenerstattung
- Produktbilder, Mitarbeiterausweise und Projektdokumente
- Hochgeladene Dateien, Vorsch Dateien und Download-Dateien von Geschäftsdatensätzen
- Anlagenbibliotheken, deren Dateimetadaten separat verwaltet werden müssen

## Verwendungsablauf

Die Dateitabelle wird normalerweise nicht direkt als primäre Geschäftstabelle verwendet. Ein typischer Ablauf ist:

1. Erstellen Sie eine Dateitabelle, um Metadaten wie Dateititel, Dateiname, Größe, Typ, URL und Speicherort zu speichern.
2. Erstellen Sie in der Geschäftstabelle ein Beziehungsfeld, das auf die Dateitabelle verweist. Verknüpfen Sie beispielsweise in der Tabelle „Verträge“ die Dateitabelle „Vertragsanlagen“.
3. Fügen Sie im Formularblock der Geschäftstabelle ein Beziehungsfeld hinzu, damit Benutzer beim Erstellen oder Bearbeiten von Geschäftsdatensätzen Dateien hochladen können.
4. Nach Abschluss des Uploads schreibt NocoBase die Dateimetadaten in die Dateitabelle und verknüpft den Datensatz über das Beziehungsfeld mit dem aktuellen Geschäftsdatensatz.
5. Zeigen Sie das Anlagenfeld im Detailblock, Tabellenblock oder Listenblock der Geschäftstabelle an, damit Benutzer Dateien anzeigen, in der Vorschau ansehen oder herunterladen können.

## Erstellung und Konfiguration

Klicken Sie in der Hauptdatenbank auf „Create collection“ und wählen Sie „File collection“, um eine Dateitabelle zu erstellen.

![20240324090414](https://static-docs.nocobase.com/20240324090414.png)

Die Erstellung und Konfiguration einer Dateitabelle entspricht im Wesentlichen der einer gewöhnlichen Tabelle. Eine Dateitabelle enthält standardmäßig eine Gruppe von Dateimetadatenfeldern zum Speichern von Titel, Pfad, URL, Speicherort und erweiterten Informationen der hochgeladenen Dateien.

| Konfiguration | Beschreibung |
| --- | --- |
| Collection display name | Der in der Benutzeroberfläche angezeigte Name der Datentabelle, zum Beispiel „Vertragsanlagen“, „Rechnungsdateien“ oder „Produktbilder“. |
| Collection name | Der Bezeichner der Datentabelle für interne Verweise in API, Beziehungsfeldern, Berechtigungen, Workflows und anderen Bereichen. |
| Categories | Kategorie der Datentabelle. Die Kategorie beeinflusst nur die Organisation in der Verwaltung der Datentabellen, nicht die Struktur der Datentabelle. |
| Description | Beschreibung der Datentabelle. Sie können angeben, welche Dateien diese Dateitabelle speichert, wer sie hochlädt und mit welchen Geschäftstabellen sie verknüpft ist. |
| Preset fields | Vordefinierte Felder. Es wird empfohlen, beim Erstellen einer Dateitabelle die Systemfelder und die integrierten Felder der Dateitabelle beizubehalten. |

### Integrierte Felder

Nach der Erstellung enthält eine Dateitabelle normalerweise die folgenden integrierten Felder. Die eigentlichen Dateien werden im Dateispeicher abgelegt; die Dateitabelle speichert diese Metadaten.

| Feld | Feldname | Beschreibung |
| --- | --- | --- |
| ID | `id` | Standardmäßiges Primärschlüsselfeld zur eindeutigen Identifizierung eines Dateidatensatzes. |
| Title | `title` | Dateititel, der normalerweise in der Benutzeroberfläche angezeigt wird. |
| File name | `filename` | Dateiname. |
| Extension name | `extname` | Dateierweiterung. |
| Size | `size` | Dateigröße. |
| MIME type | `mimetype` | MIME-Typ der Datei. |
| Path | `path` | Pfad der Datei im Speicher. |
| URL | `url` | Adresse für den Dateizugriff. |
| Preview | `preview` | Adresse für die Dateivorschau. |
| Storage | `storage` / `storageId` | Speicher, zu dem die Datei gehört. `storage` ist ein Beziehungsfeld, `storageId` der zugehörige Fremdschlüssel. |
| Meta | `meta` | Erweiterte Metadaten der Datei. |
| Erstellungszeit | `createdAt` | Zeichnet automatisch den Erstellungszeitpunkt des Dateidatensatzes auf. |
| Ersteller | `createdBy` | Zeichnet automatisch den Benutzer auf, der den Dateidatensatz hochgeladen oder erstellt hat. |
| Aktualisierungszeit | `updatedAt` | Zeichnet automatisch den Zeitpunkt der letzten Aktualisierung des Dateidatensatzes auf. |
| Aktualisierer | `updatedBy` | Zeichnet automatisch den Benutzer auf, der den Dateidatensatz zuletzt aktualisiert hat. |
| Bereich | `space` | Nach Aktivierung des [Multi-Space-Plugins](../../multi-app/multi-space/index.md) verfügbar, um Daten nach Bereichen zu isolieren. Wird ohne aktivierten Multi-Space nicht angezeigt. |

![20240324090527](https://static-docs.nocobase.com/20240324090527.png)

### Primärschlüsselfeld

Wie gewöhnliche Tabellen benötigen auch Dateitabellen ein Primärschlüsselfeld. Anlagenfelder und Beziehungsfelder verknüpfen die Dateimetadaten über den Primärschlüssel.

Wenn eine Dateitabelle keinen Primärschlüssel besitzt, müssen Sie beim Bearbeiten der Datentabelle „Record unique key“ festlegen. Andernfalls können Anlagen möglicherweise nicht korrekt verknüpft, in der Vorschau angezeigt oder bearbeitet werden.

## Beziehungen erstellen
Erstellen Sie in der Geschäftstabelle ein Beziehungsfeld, das auf die Dateitabelle verweist.

![20240324091529](https://static-docs.nocobase.com/20240324091529.png)

## Verwendung in der Seitenkonfiguration

Die Daten einer Dateitabelle werden normalerweise automatisch durch den Upload über eine Anlagenkomponente erstellt. Sie werden in Formularblöcken, Detailblöcken oder Beziehungsblöcken verwendet.

![20260710160424](https://static-docs.nocobase.com/20260710160424.png)

![20240324091321](https://static-docs.nocobase.com/20240324091321.png)

| Konfigurationsort | Zweck |
| --- | --- |
| [Formularblock](../../interface-builder/blocks/data-blocks/form.md) | Hochladen von Anlagen in Datensätzen der Geschäftstabelle. |
| [Detailblock](../../interface-builder/blocks/data-blocks/details.md) | Anzeigen, Vorschau oder Herunterladen von Anlagen. |
| [Tabellenblock](../../interface-builder/blocks/data-blocks/table.md) | Anzeigen von Anlagenfeldern in einer Liste. |
| [Beziehungsblock](../../interface-builder/blocks/data-blocks/table.md) | Direktes Verwalten der mit dem aktuellen Geschäftsdatensatz verknüpften Dateidatensätze. |


## Konfiguration bearbeiten

Klicken Sie in der Liste der Datentabellen rechts neben der Dateitabelle auf „Edit“, um Konfigurationen wie den Anzeigenamen, die Kategorie, die Beschreibung, den einfachen Seitennavigationsmodus und „Record unique key“ zu ändern.

Dateimetadatenfelder werden normalerweise automatisch während des Uploads ausgefüllt. Es wird nicht empfohlen, Felder wie `url`, `path` und `storageId` für andere geschäftliche Bedeutungen zu verwenden. Wenn Sie zusätzliche Informationen zu Dateien benötigen, können Sie neue Felder hinzufügen, zum Beispiel „Dateityp“, „Zugehörige Phase“ oder „Archiviert“.

## Datentabelle löschen

Klicken Sie in der Liste der Datentabellen rechts neben der Dateitabelle auf „Delete“, um die Dateitabelle zu löschen.

Beim Löschen der Dateitabelle werden die Dateimetadatensätze und die zugehörigen Collection-Metadaten gelöscht. Prüfen Sie vor dem Löschen, ob Anlagenfelder, Beziehungsfelder, Seitenblöcke, Berechtigungen, Workflows und APIs in den Geschäftstabellen weiterhin davon abhängen.

:::danger Warnung

Die Dateitabelle speichert die Metadaten der Dateien. Das Löschen von Datensätzen der Dateitabelle kann dazu führen, dass Anlagenverweise in Geschäftsdatensätzen ungültig werden. Ob die eigentlichen Dateien ebenfalls gelöscht werden, hängt vom Dateispeicher und der Geschäftskonfiguration ab. Prüfen Sie vor dem Vorgang, ob die Dateien noch im Geschäftsbetrieb verwendet werden.

:::

## Verwandte Links

- [Gewöhnliche Tabelle](../data-source-main/general-collection.md) — Informationen zu allgemeinen Konfigurationen und zur Verwendung von Blöcken
- [Felder von Datentabellen](../data-modeling/collection-fields/index.md) — Informationen zur Konfiguration von Anlagenfeldern und Beziehungsfeldern
- [Dateimanager](../../plugins/@nocobase/plugin-file-manager/index.md) — Informationen zu Konfigurationen des Dateispeichers
- [Multi-Space](../../multi-app/multi-space/index.md) — Informationen zu Bereichsfeldern und zur Bereichsisolation