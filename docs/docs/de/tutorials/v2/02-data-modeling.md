# Kapitel 2: Datenmodellierung - mit zwei Tabellen zum Ticket-System

Im vorigen Kapitel haben wir NocoBase installiert und die Oberfläche kennengelernt. Jetzt geben wir dem Ticket-System sein Skelett - das **Datenmodell**.

Wir legen die [Datentabellen](/data-sources/data-modeling/collection) Tickets und Kategorien an, konfigurieren [Feldtypen](/data-sources/data-modeling/collection-fields) (einzeiliger Text, Dropdown, [Many-to-One](/data-sources/data-modeling/collection-fields/associations/m2o)-Beziehung etc.) und verknüpfen die Tabellen. Das Datenmodell ist das Fundament: Wenn Sie früh klären, welche Daten Sie speichern und wie sie zueinander stehen, läuft später alles - Oberflächen, Berechtigungen - reibungsloser.


## 2.1 Was sind Datentabellen und Felder?

Wer Excel kennt, versteht Datentabellen sofort:

| Excel-Begriff | NocoBase-Begriff | Beschreibung |
|---------------|------------------|--------------|
| Arbeitsblatt | Datentabelle (Collection) | Container für eine Datensorte |
| Spaltenüberschrift | Feld (Field) | beschreibt eine Eigenschaft |
| Zeile | Datensatz (Record) | konkrete Daten |

![02-data-modeling-2026-03-11-08-32-41](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-32-41.png)

Die Tabelle „Tickets" sieht aus wie eine Excel-Tabelle - jede Spalte ist ein Feld (Titel, Status, Priorität ...), jede Zeile ein Ticket.

NocoBase ist allerdings deutlich mächtiger als Excel. Es kennt mehrere **Tabellentypen**:

| Tabellentyp | Geeignet für | Beispiele |
|-------------|--------------|-----------|
| **Normale Tabelle** | die meisten Geschäftsdaten | Tickets, Aufträge, Kunden |
| **Baumtabelle** | hierarchische Daten | Kategorienbaum, Organisation |
| Kalendertabelle | datumsbasierte Ereignisse | Meetings, Schichten |
| Dateitabelle | Anhänge | Dokumente, Bilder |

Heute brauchen wir **normale Tabelle** und **Baumtabelle**, andere Typen lernen Sie später kennen.

**Datenquellen-Verwaltung öffnen**: Klicken Sie unten links auf das Symbol **„Datenquellen"** (DB-Symbol neben dem Zahnrad). Sie sehen die [Hauptdatenquelle](/data-sources) - hier liegen alle unsere Tabellen.

![02-data-modeling-2026-03-11-08-35-08](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-35-08.png)


## 2.2 Kerntabelle anlegen: Tickets

Wir starten mit der zentralen Tabelle - Tickets.

### Tabelle anlegen

1. In der Datenquellenverwaltung **Hauptdatenquelle** öffnen

![02-data-modeling-2026-03-11-08-36-06](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-36-06.png)

2. **„Datentabelle erstellen"** klicken und **„Normale Tabelle"** wählen

![02-data-modeling-2026-03-11-08-38-52](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-38-52.png)

3. Tabellenname: `tickets`, Anzeigename: `Tickets`

![02-data-modeling-2026-03-11-08-40-34](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-40-34.png)

Beim Anlegen sind einige **Systemfelder** standardmäßig aktiv. Sie protokollieren Metainformationen jedes Datensatzes:

| Feld | Beschreibung |
|------|--------------|
| ID | Primärschlüssel, verteilte eindeutige Kennung |
| Erstellungsdatum | Zeitpunkt der Anlage |
| Ersteller | wer den Datensatz angelegt hat |
| Letzte Änderung | Zeitpunkt der letzten Änderung |
| Letzter Bearbeiter | letzter Bearbeiter des Datensatzes |

Diese Felder bleiben standardmäßig aktiv, müssen nicht manuell verwaltet werden. In Spezialfällen können Sie Häkchen entfernen.

### Basisfelder ergänzen

Tabelle steht - jetzt zu den Feldern. Klicken Sie bei der Tickets-Tabelle auf **„Felder konfigurieren"**, dort finden Sie die Systemfelder.

![02-data-modeling-2026-03-11-08-58-48](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-58-48.png)

![02-data-modeling-2026-03-11-08-59-47](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-59-47.png)

Klicken Sie oben rechts auf **„Feld hinzufügen"** - es öffnet sich eine Dropdown-Liste mit Feldtypen.

![02-data-modeling-2026-03-11-09-00-22](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-00-22.png)

Wir legen zuerst die ticket-eigenen Felder an, Verknüpfungen folgen später.

**1. Titel (einzeiliger Text)**

Jedes Ticket benötigt einen kurzen Titel. „Feld hinzufügen" → **[„Einzeiliger Text"](/data-sources/data-modeling/collection-fields/basic/input)**:

![02-data-modeling-2026-03-11-09-01-00](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-01-00.png)

- Feldname: `title`, Anzeigename: `Titel`
- **„Validierungsregel festlegen"** klicken und **„Pflicht"** ergänzen

![02-data-modeling-2026-03-11-09-02-40](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-02-40.png)

**2. Beschreibung (Markdown(Vditor))**

Detailbeschreibung mit Formatierung, Bildern und Code. Unter „Feld hinzufügen" → „Media" gibt es drei Varianten:

| Feldtyp | Eigenschaften |
|---------|---------------|
| Markdown | einfaches Markdown, schlichte Stile |
| Rich Text | Rich-Text mit einfachen Stilen, Anhang-Upload |
| **Markdown(Vditor)** | umfangreichste Variante mit WYSIWYG, Live-Vorschau und Quelltext |

Wir wählen **Markdown(Vditor)**.

![02-data-modeling-2026-03-11-09-09-58](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-09-58.png)

- Feldname: `description`, Anzeigename: `Beschreibung`

![02-data-modeling-2026-03-11-09-10-50](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-10-50.png)

**3. Status (Dropdown - Einzelauswahl)**

![02-data-modeling-2026-03-11-09-12-00](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-12-00.png)
Tickets benötigen einen Status, um ihren Fortschritt zu verfolgen.

- Feldname: `status`, Anzeigename: `Status`
- Optionen ergänzen (jeweils Wert, Label, optional Farbe):

| Wert | Label | Farbe |
|------|-------|-------|
| pending | Offen | Orange |
| in_progress | In Bearbeitung | Blue |
| completed | Erledigt | Green |

![02-data-modeling-2026-03-11-09-17-44](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-17-44.png)

Speichern Sie zunächst die Optionen. Bearbeiten Sie das Feld danach erneut über **„Bearbeiten"** und setzen Sie unter „Standardwert" auf **„Offen"**.

![02-data-modeling-2026-03-11-09-20-28](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-20-28.png)

![02-data-modeling-2026-03-11-09-22-34](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-22-34.png)

> Beim ersten Anlegen existieren noch keine Optionen - der Standardwert lässt sich erst nach Speichern setzen.

> Warum Dropdown? Der Status ist auf wenige Werte beschränkt - das [Dropdown](/data-sources/data-modeling/collection-fields/choices/select) verhindert freie Eingaben und sichert die Datenqualität.

**4. Priorität (Dropdown - Einzelauswahl)**

Differenziert die Dringlichkeit; hilft bei der Sortierung.

- Feldname: `priority`, Anzeigename: `Priorität`
- Optionen:

| Wert | Label | Farbe |
|------|-------|-------|
| low | Niedrig | |
| medium | Mittel | |
| high | Hoch | Orange |
| urgent | Dringend | Red |

Bisher hat das Ticket-Modell vier Felder. Aber - Tickets brauchen ja eine **Kategorie**, etwa „Netzwerkproblem" oder „Software-Fehler".

Ein Dropdown wäre möglich. Aber: Kategorien können Unterkategorien haben (z. B. unter „Hardware" → „Monitor", „Tastatur", „Drucker") - dann reicht ein Dropdown nicht.

Wir brauchen eine **eigene Tabelle** für Kategorien, am besten als **Baumtabelle**.


## 2.3 Kategorien als Baumtabelle anlegen

### Was ist eine Baumtabelle?

Eine Baumtabelle ist eine spezielle Tabelle mit eingebauter **Eltern-Kind-Beziehung** - jeder Datensatz kann einen „Eltern-Knoten" haben. Ideal für hierarchische Daten:

```
Hardwareprobleme   ← 1. Ebene
├── Monitor        ← 2. Ebene
├── Tastatur/Maus
└── Drucker
Softwarefehler
├── Office-Software
└── Systemprobleme
Netzwerkproblem
Konto/Berechtigung
```

In einer normalen Tabelle müssten Sie ein Eltern-Feld manuell anlegen. **Baumtabellen** übernehmen das automatisch - inklusive Baumdarstellung und Anlegen von Untereinträgen.

### Tabelle anlegen

1. In der Datenquellenverwaltung **„Datentabelle erstellen"** klicken
2. Diesmal **„Baumtabelle"** (nicht normale Tabelle!)
![02-data-modeling-2026-03-11-09-26-07](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-26-07.png)

3. Tabellenname: `categories`, Anzeigename: `Ticket-Kategorien`

![02-data-modeling-2026-03-11-09-26-55](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-26-55.png)

> Hinweis: Nach der Erstellung enthält die Tabelle neben den Systemfeldern automatisch die Beziehungsfelder **„Parent"** und **„Children"** - das ist die Spezialfähigkeit der Baumtabelle. Über Parent erreichen Sie die übergeordnete Kategorie, über Children alle Unterkategorien.

![02-data-modeling-2026-03-11-09-27-40](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-27-40.png)

### Felder hinzufügen

Klicken Sie auf **„Felder konfigurieren"** und dann oben rechts auf **„Feld hinzufügen"**.

**Feld 1: Kategoriename**

1. **„Einzeiliger Text"** wählen
2. Feldname: `name`, Anzeigename: `Kategoriename`
3. **„Validierungsregel festlegen"** → **„Pflicht"** ergänzen

**Feld 2: Farbe**

1. **„Farbe"** wählen
2. Feldname: `color`, Anzeigename: `Farbe`

![02-data-modeling-2026-03-11-09-28-59](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-28-59.png)

Mit dem Farbfeld erhält jede Kategorie eine eigene Identität, die später in der UI klar erkennbar ist.

![02-data-modeling-2026-03-11-09-29-23](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-29-23.png)

Damit sind die Basisfelder beider Tabellen konfiguriert. Als Nächstes verknüpfen wir sie.


## 2.4 Zurück zur Tickets-Tabelle: Beziehungsfelder

> **Beziehungsfelder können beim ersten Mal abstrakt wirken.** Falls unklar, springen Sie zu [Kapitel 3: Seiten aufbauen](./03-building-pages) und kehren später zurück, um die Beziehungsfelder zu ergänzen.

Tickets brauchen Verknüpfungen zu Kategorie, Antragsteller und Bearbeiter. Diese Felder heißen **Beziehungsfelder** - sie speichern keinen Text, sondern die ID eines Datensatzes in einer anderen Tabelle und finden den passenden Datensatz darüber.

Beispiel: Links sind die Eigenschaften eines Tickets - „Kategorie" und „Antragsteller" speichern keine Texte, sondern eine ID. Über diese ID liest das System den passenden Datensatz aus der rechten Tabelle:


![02-data-modeling-2026-03-12-00-50-10](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-00-50-10.png)

In der UI sehen Sie Namen („Netzwerkproblem", „Max Müller"), im Hintergrund läuft die Verknüpfung über IDs. **Mehrere Tickets können auf dieselbe Kategorie oder denselben Anwender verweisen** - das ist eine [**Many-to-One**-Beziehung](/data-sources/data-modeling/collection-fields/associations/m2o).

### Beziehungsfeld hinzufügen

In den „Felder konfigurieren" der Tickets-Tabelle „Feld hinzufügen" → **„Many-to-One"** wählen.
![02-data-modeling-2026-03-12-00-52-39](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-00-52-39.png)

Beim Anlegen sehen Sie folgende Optionen:

| Option | Beschreibung | Empfohlene Eingabe |
|--------|--------------|--------------------|
| Quell-Tabelle | aktuelle Tabelle (vorbelegt) | unverändert |
| **Ziel-Tabelle** | Tabelle, die verknüpft wird | passende Tabelle wählen |
| **Fremdschlüssel** | Spaltenname in der aktuellen Tabelle | aussagekräftigen Namen vergeben |
| Ziel-Identifikatorfeld | standardmäßig `id` | Standard belassen |
| ON DELETE | Verhalten bei gelöschtem Zieldatensatz | Standard belassen |

![02-data-modeling-2026-03-12-00-58-38](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-00-58-38.png)

> Standardmäßig generiert NocoBase einen zufälligen Fremdschlüsselnamen (`f_xxxxx`). Empfohlen ist ein aussagekräftiger Name in Kleinbuchstaben mit Unterstrichen (z. B. `category_id`).

Legen Sie nacheinander folgende Felder an:

**5. Kategorie → Ticket-Kategorien**

- Anzeigename: `Kategorie`
- Ziel-Tabelle: **„Ticket-Kategorien"** (falls nicht in der Liste, einfach den Namen eintippen, NocoBase legt sie automatisch an)
- Fremdschlüssel: `category_id`

**6. Antragsteller → Benutzertabelle**

Hält fest, wer das Ticket eingereicht hat. NocoBase liefert eine eingebaute Benutzertabelle.

- Anzeigename: `Antragsteller`
- Ziel-Tabelle: **„Benutzer"**
- Fremdschlüssel: `submitter_id`
![02-data-modeling-2026-03-12-01-00-09](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-01-00-09.png)

**7. Bearbeiter → Benutzertabelle**

Wer das Ticket bearbeitet.

- Anzeigename: `Bearbeiter`
- Ziel-Tabelle: **„Benutzer"**
- Fremdschlüssel: `assignee_id`

![02-data-modeling-2026-03-12-01-00-22](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-01-00-22.png)


## 2.5 Datenmodell im Überblick

Zur Erinnerung das vollständige Datenmodell:

![02-data-modeling-2026-03-16-00-30-35](https://static-docs.nocobase.com/02-data-modeling-2026-03-16-00-30-35.png)

`}o--||` steht für Many-to-One: links „viele", rechts „eins".


## Fazit

In diesem Kapitel haben wir das Skelett des Ticket-Systems modelliert:

1. **Tickets-Tabelle**: 4 Basisfelder + 3 Beziehungsfelder, als **normale Tabelle**.
2. **Ticket-Kategorien**: 2 eigene Felder + automatische Parent/Children-Felder, als **Baumtabelle** für hierarchische Kategorisierung.

Wichtige Konzepte:

- **Datentabelle (Collection)** = Container für eine Datensorte.
- **Tabellentyp** = je nach Szenario (normal, baum ...).
- **Feld (Field)** = Eigenschaft, hinzugefügt über „Felder konfigurieren" → „Feld hinzufügen".
- **Systemfelder** = ID, Datum, Ersteller etc., automatisch aktiviert.
- **Beziehungsfeld (Many-to-One)** = Verweis auf einen Datensatz einer anderen Tabelle.

> Sie haben vielleicht bemerkt, dass spätere Screenshots Daten enthalten - das sind unsere Testdaten zur Demonstration. In NocoBase erfolgen CRUD-Operationen über das Frontend. In Kapitel 3 bauen wir Tabellen für die Anzeige, in Kapitel 4 Formulare für die Eingabe.


## Vorschau auf das nächste Kapitel

Skelett steht, doch die Tabellen sind leer. Im nächsten Kapitel bauen wir Seiten, um die Daten anzuzeigen.

Bis dann!

## Verwandte Ressourcen

- [Datenquellen-Übersicht](/data-sources) - Kernkonzepte der Datenmodellierung
- [Tabellenfelder](/data-sources/data-modeling/collection-fields) - alle Feldtypen im Detail
- [Many-to-One](/data-sources/data-modeling/collection-fields/associations/m2o) - Konfiguration der Verknüpfung
