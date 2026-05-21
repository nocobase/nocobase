# Kapitel 7: Dashboard — Den Gesamtüberblick auf einen Blick

Im vorherigen Kapitel haben wir das System per Workflow automatisch benachrichtigen und Zeiten erfassen lassen. Das System wird zunehmend intelligenter, doch eines fehlt noch — der **Gesamtüberblick**.

Wie viele Tickets gibt es? Wie viele wurden bearbeitet? Welche Problemklasse tritt am häufigsten auf? Wie viele kommen täglich neu hinzu? Diese Fragen lassen sich durch Blättern in einer Liste nicht beantworten. In diesem Kapitel bauen wir mit [Diagramm-Blöcken](/data-visualization) (Kreisdiagramm, Liniendiagramm, Balkendiagramm) und einem [Markdown-Block](/interface-builder/blocks/other-blocks/markdown) ein **Daten-Dashboard** auf — Daten werden zu Bildern, die auf einen Blick verständlich sind.

## 7.1 Dashboard-Seite hinzufügen

Zunächst ergänzen wir in der oberen Navigation einen neuen Menü-Eintrag.

Wechseln Sie in den [Konfigurationsmodus](/get-started/how-nocobase-works), klicken Sie in der oberen Menüleiste auf **„Menü-Eintrag hinzufügen"** (`+`-Symbol), wählen Sie **„Neue Seite (v2)"** und nennen Sie sie „Daten-Dashboard".

![07-dashboard-2026-03-15-21-39-35](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-39-35.png)

Diese Seite ist speziell für Diagramme gedacht — die Bühne unseres Dashboards.

## 7.2 Kreisdiagramm: Verteilung der Ticket-Stati

Das erste Diagramm: ein Kreisdiagramm, das zeigt, wie sich „Offen, In Bearbeitung, Erledigt" verteilen.

Klicken Sie auf der Dashboard-Seite auf **Block erstellen (Add block) → [Diagramm](/data-visualization)**.

Klicken Sie nach dem Hinzufügen oben rechts im Block auf **Konfigurieren**, sodass rechts das Diagramm-Konfigurationspanel erscheint.

### Datenabfrage konfigurieren

- **[Collection](/data-sources/data-modeling/collection)**: „Tickets" auswählen
- **Measures**: Ein eindeutiges [Field](/data-sources/data-modeling/collection-fields) (z. B. ID), Aggregation **Count**.
- **Dimensions**: Field „Status"

![07-dashboard-2026-03-15-21-44-32](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-44-32.png)

Klicken Sie auf **Abfrage ausführen**, um darunter die zurückgelieferten Daten als Vorschau zu sehen.

### Diagrammoptionen konfigurieren

- **Diagrammtyp**: **Kreisdiagramm**
- **Field-Mapping**: Category → „Status", Value → Count-Wert
- **Labels**: einschalten

Auf der linken Seite sollte nun ein hübsches Kreisdiagramm sichtbar sein. Jedes Segment steht für einen Status, standardmäßig werden Anzahl und Anteil eingeblendet.

![07-dashboard-2026-03-15-21-45-40](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-45-40.png)

Klicken Sie auf **Speichern**, das erste Diagramm ist fertig.

## 7.3 Liniendiagramm: Täglicher Trend neuer Tickets

Das Kreisdiagramm zeigt „die aktuelle Verteilung", das Liniendiagramm zeigt „den Trend über die Zeit".

Fügen Sie einen weiteren Diagramm-Block hinzu und konfigurieren Sie:

### Datenabfrage

- **Collection**: „Tickets"
- **Measures**: ID, Count
- **Dimensions**: Field „Erstellungszeit", Format **YYYY-MM-DD** (täglich gruppiert)

> **Tipp**: Das Format der Datums-Dimension ist wichtig. `YYYY-MM-DD` aggregiert nach Tag, `YYYY-MM` nach Monat. Wählen Sie die Granularität je nach Datenmenge.

### Diagrammoptionen

- **Diagrammtyp**: **Liniendiagramm**
- **Field-Mapping**: xField → „Erstellungszeit", yField → Count-Wert

![07-dashboard-2026-03-15-21-48-33](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-48-33.png)

Nach dem Speichern sehen Sie die Veränderung des Ticket-Volumens über die Zeit. Wenn ein Tag plötzlich stark steigt, ist an dem Tag wohl etwas passiert — das verdient Aufmerksamkeit.

## 7.4 Balkendiagramm: Ticket-Anzahl pro Kategorie

Das dritte Diagramm zeigt, welche Kategorie die meisten Tickets hat. Wir nutzen hier **horizontale Balken** statt vertikaler Säulen — bei vielen Kategorien werden die X-Achsen-Beschriftungen sonst leicht überlagert oder ausgeblendet, horizontal ist das übersichtlicher.

Fügen Sie einen dritten Diagramm-Block hinzu:

### Datenabfrage

- **Collection**: „Tickets"
- **Measures**: ID, Count
- **Dimensions**: verknüpftes Field „Kategorie" (Field „Kategoriename" auswählen)

### Diagrammoptionen

- **Diagrammtyp**: **Balkendiagramm (Bar)**
- **Field-Mapping**: xField → Count-Wert (ID-Count), yField → „Kategoriename"

![07-dashboard-2026-03-15-22-05-11](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-05-11.png)

Nach dem Speichern sehen Sie auf einen Blick, welche Kategorie am häufigsten vorkommt. Wenn etwa „Netzwerkstörung" deutlich länger ist als die anderen, ist es vielleicht an der Zeit, die Netzwerkausstattung zu modernisieren.

## 7.5 Tabellen-Block: Offene Tickets

Diagramme bieten den Überblick, doch Administratoren benötigen oft auch konkrete Detailansichten. Wir fügen daher eine Tabelle **Offene Tickets** hinzu, die alle noch nicht abgeschlossenen Tickets direkt anzeigt.

Fügen Sie der Seite einen **Tabellen-Block** hinzu und wählen Sie als Collection „Tickets".

### Filterbedingungen konfigurieren

Klicken Sie oben rechts im Tabellen-Block auf die Konfiguration, suchen Sie **Datenbereich festlegen** und fügen Sie eine [Filter-Bedingung](/interface-builder/blocks/filter-blocks/form) hinzu:

- **Status** ungleich **Erledigt**

So zeigt die Tabelle nur noch nicht erledigte Tickets; sobald eines erledigt ist, verschwindet es automatisch aus der Liste.

### Fields konfigurieren

Wählen Sie die anzuzeigenden Spalten: Titel, Status, Priorität, Zuständiger, Erstellungszeit.

![07-dashboard-2026-03-15-22-20-11](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-20-11.png)

> **Tipp**: Sie können zusätzlich eine **Standardsortierung** (absteigend nach Erstellungszeit) festlegen, sodass die neuesten Tickets ganz oben stehen.

## 7.6 Markdown-Block: Systemmitteilung

Neben Diagrammen können wir auf dem Dashboard auch Texte platzieren.

Fügen Sie einen **[Markdown-Block](/interface-builder/blocks/other-blocks/markdown)** hinzu und schreiben Sie eine Systemmitteilung oder Hinweise:

```markdown
## IT-Ticket-System

Willkommen! Bei Problemen bitte ein Ticket einreichen, das technische Team wird sich umgehend kümmern.

**Bei dringenden Problemen** rufen Sie die IT-Hotline an: 8888
```

![07-dashboard-2026-03-15-21-53-54](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-53-54.png)

Der Markdown-Block oben auf dem Dashboard dient sowohl als Begrüßung als auch als Pinnwand. Inhalte lassen sich jederzeit anpassen, sehr flexibel.

![07-dashboard-2026-03-15-22-30-57](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-30-57.png)

## 7.7 JS-Block: Personalisiertes Begrüßungsbanner

Das Markdown-Format ist relativ starr. Für ausgefallenere Effekte stellt NocoBase den **JS-Block (JavaScript Block)** bereit, mit dem Sie die Anzeige per Code frei gestalten können.

Wir bauen damit ein schlichtes Business-Begrüßungsbanner, das je nach aktuell angemeldetem Benutzer und Tageszeit eine personalisierte Begrüßung anzeigt.

Fügen Sie der Seite einen **JS-Block** hinzu (Block erstellen → Andere Blöcke → JS-Block).

![07-dashboard-2026-03-15-22-33-24](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-33-24.png)

Im JS-Block können Sie über `ctx.getVar("ctx.user.username")` den Benutzernamen des aktuellen Benutzers abrufen. Hier ein zurückhaltendes Business-Banner:

```js
const uname = await ctx.getVar("ctx.user.username")
const name = uname || 'Benutzer';
const hour = new Date().getHours();
const hi = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';

const d = new Date();
const date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const week = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'][d.getDay()];

ctx.render(`
<div style="padding: 24px 32px; background: #f7f8fa; border-radius: 8px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-end;">
    <div>
      <div style="font-size: 22px; font-weight: 600; color: #1d2129;">${hi}, ${name}</div>
      <div style="font-size: 14px; color: #86909c; margin-top: 4px;">Willkommen zurück im IT-Ticket-System</div>
    </div>
    <div style="font-size: 14px; color: #86909c;">${date} ${week}</div>
  </div>
</div>`);
```

![07-dashboard-2026-03-15-22-51-27](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-51-27.png)

Das Ergebnis ist eine hellgraue Karte, links die Begrüßung, rechts das Datum. Schlicht, nützlich und nicht aufdringlich.

> **Tipp**: `ctx.getVar("ctx.user.xxx")` ist die Methode, um im JS-Block Benutzerinformationen abzurufen. Häufige Felder sind `nickname` (Spitzname), `username` (Benutzername), `email` (E-Mail) usw. Der JS-Block kann auch APIs aufrufen, um Daten abzufragen — damit lassen sich später weitere benutzerdefinierte Inhalte umsetzen.

## 7.8 Action Panel: Schnellzugriffe + Pop-up-Wiederverwendung

Das Dashboard ist nicht nur Anzeigefläche, sondern soll auch Ausgangspunkt für Aktionen sein. Wir fügen ein **Action Panel** hinzu, über das Benutzer direkt von der Startseite ein Ticket einreichen oder zur Ticket-Liste springen können.

Fügen Sie einen Block **Action Panel** hinzu (Block erstellen → Andere Blöcke → Action Panel) und legen Sie zwei [Aktionen](/interface-builder/actions) an:

![07-dashboard-2026-03-15-22-54-06](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-54-06.png)

1. **Link: Zur Ticket-Liste springen** — Fügen Sie eine Aktion „Link" hinzu und konfigurieren Sie die URL auf die Ticket-Liste (z. B. `/admin/camcwbox2uc`).

![07-dashboard-2026-03-15-22-57-49](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-57-49.png)

2. **Button: Ticket hinzufügen** — Fügen Sie einen Pop-up-Aktions-Button hinzu, Titel „Ticket hinzufügen".

![07-dashboard-2026-03-15-23-00-36](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-00-36.png)

Allerdings ist das Pop-up beim Klick auf „Ticket hinzufügen" leer; wir müssen den Inhalt des Pop-ups konfigurieren. Das Anlageformular noch einmal manuell aufzubauen, wäre mühsam — hier kommt eine sehr nützliche Funktion ins Spiel: **Pop-up-Wiederverwendung**.

### Pop-up-Vorlage speichern

> Hinweis: Die Pop-up-Vorlage hier ist nicht dasselbe wie die „Block-Vorlage" aus Kapitel 4. Eine Block-Vorlage speichert Felder und Layout eines einzelnen Formular-Blocks; eine Pop-up-Vorlage speichert den **gesamten Pop-up-Inhalt** — alle Blöcke, Felder und Aktionsbuttons darin.

1. Gehen Sie zur **Ticket-Liste-Seite** und suchen Sie den Button „Ticket hinzufügen".
2. Klicken Sie in den Button-Optionen auf **„Als Vorlage speichern"** und speichern Sie das aktuelle Pop-up.
3. Geben Sie der Vorlage einen Namen (z. B. „Neues-Ticket-Pop-up").

![07-dashboard-2026-03-15-23-05-17](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-05-17.png)

### Pop-up auf der Startseite wiederverwenden

1. Kehren Sie zur Daten-Dashboard-Seite zurück und klicken Sie auf die Optionen des Buttons „Ticket hinzufügen" im Action Panel.
2. Suchen Sie **„Pop-up-Einstellungen"** und wählen Sie die zuvor gespeicherte Vorlage „Neues-Ticket-Pop-up".
3. Nach dem Speichern öffnet ein Klick auf den Button dasselbe Anlage-Pop-up wie in der Ticket-Liste.

![07-dashboard-2026-03-15-23-06-33](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-06-33.png)

![07-dashboard-2026-03-15-23-07-20](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-07-20.gif)

### Klick auf den Titel öffnet das Detail-Pop-up

Auf dieselbe Weise können wir auch in der Tabelle der offenen Tickets den Titel klickbar machen, sodass er direkt das Ticket-Detail öffnet:

1. Gehen Sie zuerst zur **Ticket-Liste-Seite** und speichern Sie über die Optionen des Buttons „Anzeigen" ebenfalls **„Als Vorlage speichern"** (z. B. „Ticket-Detail-Pop-up").

![07-dashboard-2026-03-15-23-08-02](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-08-02.png)

2. Kehren Sie zur Daten-Dashboard-Seite zurück und klicken Sie in der Tabelle der offenen Tickets auf die Optionen des Fields „Titel".
3. Aktivieren Sie den Schalter **„Klick zum Öffnen aktivieren"** — nun erscheint die Option „Pop-up-Einstellungen".
4. Wählen Sie in den Pop-up-Einstellungen die zuvor gespeicherte Vorlage „Ticket-Detail-Pop-up".

![07-dashboard-2026-03-15-23-11-24](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-11-24.png)

Nun können Benutzer auf dem Dashboard direkt einen Ticket-Titel anklicken, um die Details zu sehen, ohne erst zur Ticket-Liste zu wechseln. Das Dashboard wird kompakter und effizienter.

![07-dashboard-2026-03-15-23-12-36](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-12-36.png)

> **Vorteile der Pop-up-Wiederverwendung**: Dieselbe Pop-up-Vorlage kann auf mehreren Seiten verwendet werden; Änderungen an der Vorlage werden überall synchron übernommen. Das ist analog zum „Reference"-Modus aus Kapitel 4 — einmal pflegen, überall wirksam.

## 7.9 Layout anpassen

Auf der Seite befinden sich nun 6 Blöcke (JS-Begrüßungsbanner + Action Panel + 3 Diagramme + Ticket-Tabelle). Wir passen das Layout an, damit es ansprechender wirkt.

Im Konfigurationsmodus können Sie Position und Größe jedes Blocks per **Drag-and-Drop** anpassen.

Empfohlenes Layout:

- **Erste Zeile**: JS-Begrüßungsbanner (links) + Action Panel (rechts)
- **Zweite Zeile**: Kreisdiagramm (links) + Ticket-Tabelle (rechts)
- **Dritte Zeile**: Liniendiagramm (links) + Balkendiagramm (rechts)

![07-dashboard-2026-03-15-23-14-19](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-14-19.png)

Falls die Blöcke nicht in der Höhe ausgerichtet sind, können Sie unter Block-Einstellungen > Block-Höhe manuell anpassen — zum Beispiel habe ich beide Blöcke der zweiten Zeile auf 500 px gesetzt.

Durch Ziehen am Rand passen Sie die Breite an, sodass sich die beiden Diagramme die Zeile teilen. Mehrere Versuche führen Sie zur angenehmsten Anordnung.

![07-dashboard-2026-03-15-23-18-57](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-18-57.png)

## Zusammenfassung

In diesem Kapitel haben wir mit 6 Blöcken ein reichhaltiges, praktisches Daten-Dashboard aufgebaut:

- **JS-Begrüßungsbanner**: Persönliche Begrüßung je nach Benutzer und Tageszeit
- **Action Panel**: Schneller Sprung zur Ticket-Liste, Ticket per Klick anlegen (Pop-up-Wiederverwendung)
- **Kreisdiagramm**: Verteilung der Ticket-Stati auf einen Blick
- **Liniendiagramm**: Trend des Ticket-Volumens über die Zeit
- **Balkendiagramm**: Horizontaler Vergleich der Kategorien — auch viele Beschriftungen überlagern sich nicht
- **Tabelle Offene Tickets**: Alle wartenden Tickets im Überblick, Klick auf den Titel öffnet die Details (Pop-up-Wiederverwendung)

Zudem haben wir die wichtige Technik **Pop-up-Wiederverwendung** kennengelernt — ein Pop-up auf einer Seite als Vorlage speichern und auf anderen Seiten wiederverwenden, um doppelte Konfigurationen zu vermeiden.

Die Datenvisualisierung ist ein eingebautes Plugin in NocoBase und benötigt keine zusätzliche Installation. Die Konfiguration ist genauso einfach wie der Seitenaufbau — Daten wählen, Diagrammtyp wählen, Felder zuordnen, fertig in drei Schritten.

## Vorschau auf den weiteren Verlauf

Damit ist unser Ticket-System funktional schon recht vollständig: Datenmodellierung, Seitenaufbau, Formulareingabe, Berechtigungssteuerung, automatisierte Workflows, Daten-Dashboard — alles vorhanden. Geplant ist die **AI-Agent-Variante des Aufbau-Tutorials** — wir lassen den AI Agent lokal das System automatisch aufbauen. Bleiben Sie gespannt.

## Verwandte Ressourcen

- [Datenvisualisierung](/data-visualization) — Detaillierte Diagrammkonfiguration
- [Markdown-Block](/interface-builder/blocks/other-blocks/markdown) — Verwendung des Markdown-Blocks
- [Block-Layout](/interface-builder/blocks) — Seitenlayout und Block-Konfiguration
