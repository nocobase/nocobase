---
title: "Desktop-Layout"
description: "Einführung in Navigation, Seitengestaltung, Routenverwaltung und responsives Verhalten des NocoBase Desktop-Layouts auf schmalen Bildschirmen."
keywords: "Desktop-Layout,UI-Layout,schmaler Bildschirm,responsives Layout,Seitengestaltung,Routenverwaltung,UI Editor,NocoBase"
---

# Desktop-Layout

In NocoBase ist das **Desktop-Layout** die Standardoberfläche der Anwendung. Es eignet sich für Datenverwaltung, Formulareingaben, Geschäftskonfigurationen und tägliche Abläufe am Computer und kann auch auf Mobilgeräten verwendet werden.

Das Desktop-Layout ist standardmäßig unter `/admin` erreichbar. Wenn für die Anwendung ein eigener Zugriffspfad konfiguriert ist, wird dieser Präfix automatisch in die tatsächliche Adresse übernommen.

![20260715224020](https://static-docs.nocobase.com/20260715224020.png)

![20260715224603](https://static-docs.nocobase.com/20260715224603.png)

## Eine Seite erstellen

### Erster Schritt: Desktop-Layout öffnen

Rufen Sie `/admin` auf, um das Desktop-Layout zu öffnen. Normalerweise wird dieser Bereich auch direkt nach einer erfolgreichen Anmeldung angezeigt.

![20260715225049](https://static-docs.nocobase.com/20260715225049.png)

### Zweiter Schritt: UI Editor öffnen

Klicken Sie oben rechts auf „UI Editor“, um die Oberflächengestaltung zu aktivieren. Anschließend werden an Menüs, Seiten, Blöcken, Feldern und Aktionen die jeweiligen Konfigurationseinstiege angezeigt.

![20260715225155_rec_](https://static-docs.nocobase.com/20260715225155_rec_.gif)

### Dritter Schritt: Menüs und Seiten erstellen

Im Navigationsbereich können Sie Gruppen, Seiten oder Links hinzufügen und für eine Seite Tabs aktivieren. Öffnen Sie die erstellte Seite und fügen Sie anschließend die benötigten Blöcke hinzu.

Der Seiteninhalt wird wie bei anderen Oberflächen aufgebaut: Fügen Sie zuerst [Blöcke](../blocks/index.md) hinzu und konfigurieren Sie anschließend je nach Anforderung [Felder](../fields/index.md) und [Aktionen](../actions/index.md).

![20260715225316_rec_](https://static-docs.nocobase.com/20260715225316_rec_.gif)

### Vierter Schritt: Seiteninhalt konfigurieren

Fügen Sie Tabellen-, Formular-, Detail-, Filter- oder andere Blöcke hinzu. Passen Sie danach die Anordnung von Feldern, Aktionen und Blöcken an. Alle Änderungen werden direkt auf der aktuellen Seite sichtbar.

![20260715225424_rec_](https://static-docs.nocobase.com/20260715225424_rec_.gif)

## Routen und Menüs verwalten

Wenn Sie im Navigationsbereich eine Seite oder einen Link hinzufügen, erscheint der entsprechende Eintrag auch im [Routen-Manager](../../routes/index.md). Änderungen im Routen-Manager werden ebenfalls mit dem Menü synchronisiert.

Das Desktop-Layout unterstützt diese häufig verwendeten Routentypen:

- **Gruppe (Group)** — fasst mehrere Seiten und Links in einer Navigationsgruppe zusammen.
- **Seite (Page)** — öffnet eine Seite, auf der Sie weitere Blöcke erstellen können.
- **Link (Link)** — öffnet eine interne oder externe Adresse.
- **Tab (Tab)** — organisiert mehrere Inhalte als Tabs innerhalb einer Seite.

Im Routen-Manager können Sie Routen hinzufügen, bearbeiten, löschen, einblenden oder ausblenden. Wenn Sie die Menüstruktur an einer Stelle ordnen möchten, ist der Routen-Manager besonders praktisch.

![20260715225711_rec_](https://static-docs.nocobase.com/20260715225711_rec_.gif)

## Responsives Verhalten auf schmalen Bildschirmen

Das Desktop-Layout kann direkt auf einem Smartphone oder in einem schmalen Browserfenster verwendet werden. Auch in dieser Ansicht nutzt es die ursprünglichen Desktop-Routen und -Seiten und wechselt nicht automatisch zum Mobil-Layout.

### Änderungen am Layout

Das Navigationsmenü wird eingeklappt, und die Aktionen im oberen Bereich werden in einem kompakteren Einstieg zusammengefasst. Auch Seitenränder und Abstände zwischen Blöcken werden kleiner. Der Inhaltsbereich passt sich an die sichtbare Höhe des mobilen Browsers an.

Auf schmalen Bildschirmen steht der UI Editor nicht zur Verfügung. Für Änderungen an Menüs oder Seiten müssen Sie zu einem Desktop-Browser zurückkehren.

![20260715224603](https://static-docs.nocobase.com/20260715224603.png)

### Anpassung des Seiteninhalts

Häufig verwendete Komponenten passen ihre Bedienung ebenfalls an schmale Bildschirme an, damit sie auf Smartphones leichter zu verwenden sind. So wechseln mehrspaltige Blöcke zu einer einzelnen Spalte, Tabellen lassen sich horizontal zu Spalten außerhalb des sichtbaren Bereichs scrollen, und Seitennavigation sowie Aktionen werden kompakter. Auswahlen, Datums- und Zeiteingaben, Filter und Unterseiten verwenden ebenfalls Interaktionen, die besser für Smartphones geeignet sind.

:::tip Responsives Desktop-Layout und Mobil-Layout

Wenn Sie nur gelegentlich per Smartphone zugreifen, genügt das responsive Verhalten des Desktop-Layouts. Benötigen Sie eine eigenständige untere Navigation, mobile Seiten und mobile Bedienabläufe, können Sie zusätzlich das [Mobil-Layout](./mobile.md) einrichten.

:::

## Empfehlungen

- Verwenden Sie für Abläufe, die hauptsächlich am Computer stattfinden, standardmäßig das Desktop-Layout.
- Erstellen Sie die Seite zunächst in einer breiten Ansicht und verkleinern Sie danach das Fenster, um die Darstellung auf schmalen Bildschirmen zu prüfen.
- Wenn eine Seite viele Tabellenspalten oder horizontale Aktionen enthält, sollten Sie nur die notwendigen Inhalte beibehalten, um die Bedienung auf kleinen Bildschirmen zu vereinfachen.
- Wenn sich die Abläufe am Computer und auf dem Mobilgerät stark unterscheiden, sind zwei getrennte Seiten übersichtlicher.

## Verwandte Links

- [UI-Layout im Überblick](./index.md) — Einsatzbereiche von Desktop- und Mobil-Layout kennenlernen
- [Mobil-Layout](./mobile.md) — eine eigenständige mobile Navigation und mobile Seiten erstellen
- [Blöcke](../blocks/index.md) — Blöcke auf einer Seite hinzufügen und konfigurieren
- [Felder](../fields/index.md) — Felder für Tabellen, Formulare und Detailansichten konfigurieren
- [Aktionen](../actions/index.md) — Aktionsschaltflächen auf Seiten und in Blöcken konfigurieren
- [Routen-Manager](../../routes/index.md) — Desktop-Menüs und -Routen zentral verwalten
- [Berechtigungskonfiguration](../../users-permissions/acl/permissions.md) — steuern, auf welche Desktop-Routen eine Rolle zugreifen darf
