---
title: "Desktop-Layout"
description: "Einführung in Navigation, Seitengestaltung, Routenverwaltung und responsives Verhalten des NocoBase Desktop-Layouts auf schmalen Bildschirmen."
keywords: "Desktop-Layout,UI-Layout,schmaler Bildschirm,responsives Layout,Seitengestaltung,Routenverwaltung,UI Editor,NocoBase"
---

# Desktop-Layout

In NocoBase ist das **Desktop-Layout** die Standardoberfläche der Anwendung. Es eignet sich für Datenverwaltung, Formulareingaben, Geschäftskonfigurationen und tägliche Abläufe am Computer. Auf schmalen Geräten passt es zudem die Navigation und den Seiteninhalt an.

Das Desktop-Layout ist standardmäßig unter `/admin` erreichbar. Wenn für die Anwendung ein eigener Zugriffspfad konfiguriert ist, wird dieser Präfix automatisch in die tatsächliche Adresse übernommen.

<!-- Benötigt wird ein Screenshot einer vollständigen Seite im Desktop-Layout mit oberer Navigation, seitlicher Navigation und Inhaltsbereich -->

## Eigenschaften des Layouts

Das Desktop-Layout besteht hauptsächlich aus diesen Bereichen:

- **Obere Navigation** — zeigt den Anwendungswechsel und globale Aktionen.
- **Seitliche Navigation** — zeigt die Seiten und Links der aktuellen Gruppe.
- **Seiteninhalt** — zeigt Seiten-Tabs, Blöcke, Felder und Aktionen.
- **UI Editor** — aktiviert die Oberflächengestaltung, um Menüs und Seiteninhalte anzupassen.

Die obere und die seitliche Navigation halten die aktuelle Route ausgewählt. Beim Wechseln der Seite wird der Inhalt im rechten Bereich angezeigt. Der Zustand bereits geöffneter Seiten bleibt normalerweise erhalten.

## Eine Seite erstellen

### Erster Schritt: Desktop-Layout öffnen

Rufen Sie `/admin` auf, um das Desktop-Layout zu öffnen. Normalerweise wird dieser Bereich auch direkt nach einer erfolgreichen Anmeldung angezeigt.

<!-- Benötigt wird ein Screenshot der Seite nach dem Öffnen des Desktop-Layouts -->

### Zweiter Schritt: UI Editor öffnen

Klicken Sie oben rechts auf „UI Editor“, um die Oberflächengestaltung zu aktivieren. Anschließend werden an Menüs, Seiten, Blöcken, Feldern und Aktionen die jeweiligen Konfigurationseinstiege angezeigt.

<!-- Benötigt wird ein Screenshot mit der Position der Schaltfläche „UI Editor“ und der Seite nach der Aktivierung -->

### Dritter Schritt: Menüs und Seiten erstellen

Im Navigationsbereich können Sie Gruppen, Seiten oder Links hinzufügen und für eine Seite Tabs aktivieren. Öffnen Sie die erstellte Seite und fügen Sie anschließend die benötigten Blöcke hinzu.

Der Seiteninhalt wird wie bei anderen Oberflächen aufgebaut: Fügen Sie zuerst [Blöcke](../blocks/index.md) hinzu und konfigurieren Sie anschließend je nach Anforderung [Felder](../fields/index.md) und [Aktionen](../actions/index.md).

<!-- Benötigt wird ein Video, das das Hinzufügen eines Menüs, das Erstellen einer Seite und das Öffnen der Seite zeigt -->

### Vierter Schritt: Seiteninhalt konfigurieren

Fügen Sie Tabellen-, Formular-, Detail-, Filter- oder andere Blöcke hinzu. Passen Sie danach die Anordnung von Feldern, Aktionen und Blöcken an. Alle Änderungen werden direkt auf der aktuellen Seite sichtbar.

<!-- Benötigt wird ein Screenshot einer Desktop-Seite in der Oberflächengestaltung mit den Konfigurationseinstiegen für Blöcke, Felder und Aktionen -->

## Routen und Menüs verwalten

Desktop-Menü und Desktop-Routen verwenden dieselbe Konfiguration. Wenn Sie im Navigationsbereich eine Seite oder einen Link hinzufügen, erscheint der entsprechende Eintrag auch im [Routen-Manager](../../routes/index.md). Änderungen im Routen-Manager werden ebenfalls mit dem Menü synchronisiert.

Das Desktop-Layout unterstützt diese häufig verwendeten Routentypen:

- **Gruppe (Group)** — fasst mehrere Seiten und Links in einer Navigationsgruppe zusammen.
- **Seite (Page)** — öffnet eine Seite, auf der Sie weitere Blöcke erstellen können.
- **Link (Link)** — öffnet eine interne oder externe Adresse.
- **Tab (Tab)** — organisiert mehrere Inhalte als Tabs innerhalb einer Seite.

Im Routen-Manager können Sie Routen hinzufügen, bearbeiten, löschen, einblenden oder ausblenden. Wenn Sie die Menüstruktur an einer Stelle ordnen möchten, ist der Routen-Manager besonders praktisch.

<!-- Benötigt wird ein Screenshot der Seite „Einstellungscenter / Routen / Desktop-Routen“ -->

## Responsives Verhalten auf schmalen Bildschirmen

Das Desktop-Layout kann direkt auf einem Smartphone oder in einem schmalen Browserfenster verwendet werden. Auch in dieser Ansicht nutzt es weiterhin die ursprünglichen Desktop-Routen und -Seiten und wechselt nicht automatisch zum Mobil-Layout.

### Änderungen am Layout

Das Navigationsmenü wird eingeklappt, und die Aktionen im oberen Bereich werden in einem kompakteren Einstieg zusammengefasst. Auch Seitenränder und Abstände zwischen Blöcken werden kleiner. Der Inhaltsbereich passt sich an die sichtbare Höhe des mobilen Browsers an.

Auf schmalen Bildschirmen steht der UI Editor nicht zur Verfügung. Wechseln Sie für Änderungen an Menüs oder Seiten zurück zu einem Desktop-Browser.

<!-- Benötigt wird ein Video, das dieselbe Desktop-Seite beim Wechsel von einer breiten zu einer schmalen Ansicht zeigt -->

### Anpassung des Seiteninhalts

Häufig verwendete Layouts und Komponenten passen sich ebenfalls an schmale Bildschirme an. So werden mehrspaltige Blöcke besser für das vertikale Lesen angeordnet, Tabellen lassen sich horizontal zu Spalten außerhalb des sichtbaren Bereichs scrollen, und Seitennavigation sowie Aktionen werden kompakter. Auswahlen, Datums- und Zeiteingaben, Filter und Unterseiten verwenden ebenfalls Interaktionen, die besser für kleine Bildschirme geeignet sind.

Ob weitere Blöcke ein eigenes Verhalten auf schmalen Bildschirmen bieten, hängt von der Unterstützung des jeweiligen Blocks ab. Tabellen bleiben auch in der schmalen Ansicht Tabellen und werden nicht automatisch in Karten umgewandelt.

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
