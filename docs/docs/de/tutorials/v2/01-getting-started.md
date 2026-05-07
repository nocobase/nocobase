# Kapitel 1: NocoBase kennenlernen - in 5 Minuten startklar

In dieser Reihe bauen wir gemeinsam von Grund auf ein **minimales Ticket-System (HelpDesk)** mit NocoBase. Das gesamte System benötigt nur **2 [Datentabellen](/data-sources/data-modeling/collection)** und keine Zeile Code - es bietet Ticket-Erfassung, Kategorienverwaltung, Änderungsverfolgung, Berechtigungssteuerung und ein [Dashboard](/data-visualization).

In diesem Kapitel deployen wir NocoBase per [Docker](/get-started/installation/docker) mit einem Befehl, melden uns erstmals an, lernen den Unterschied zwischen [Konfigurations- und Nutzungsmodus](/get-started/how-nocobase-works) und erhalten eine Vorschau auf das Ticket-System.


## 1.1 Was ist NocoBase?

Kennen Sie folgendes Szenario?

- Ihr Team braucht ein internes System zur Geschäftsverwaltung, doch die Software auf dem Markt passt nie ganz.
- Eine eigene Lösung ist teuer und langsam, und Anforderungen ändern sich ständig.
- Mit Excel improvisieren Sie - die Daten werden chaotisch, die Zusammenarbeit schwierig.

**Genau dafür ist NocoBase gebaut.** Es ist eine Open-Source, hochgradig erweiterbare **AI-No-Code-Entwicklungsplattform**. Per Konfiguration und Drag-and-Drop bauen Sie Ihr eigenes Geschäftssystem - ganz ohne Code.

Im Vergleich zu anderen No-Code-Tools setzt NocoBase auf einige Kernideen:

- **Datenmodell-getrieben**: Erst [Datenquellen](/data-sources) und Strukturen definieren, dann mit [Blöcken](/interface-builder/blocks) Daten anzeigen, schließlich mit [Aktionen](/interface-builder/actions) Daten verarbeiten - UI und Daten sind klar entkoppelt.
- **WYSIWYG**: Die Seite ist die Leinwand. Was Sie sehen, ist auch das, was Sie ändern - vergleichbar mit Notion.
- **Alles ist ein Plugin**: Alle Funktionen sind [Plugins](/development/plugin) (ähnlich WordPress) - bei Bedarf installieren, flexibel erweitern.
- **AI integriert**: Eingebaute [AI Employees](/ai-employees/quick-start) erledigen Analysen, Übersetzungen, Erfassungen u. v. m. - eingebettet in Ihren Workflow.
- **Open Source + Self-Hosting**: Der Kern-Code ist komplett offen, Daten bleiben auf Ihrem Server.


## 1.2 NocoBase installieren

NocoBase unterstützt mehrere Installationsvarianten - wir wählen die einfachste: **[Installation per Docker](/get-started/installation/docker)**.

### Voraussetzungen

[Docker](https://docs.docker.com/get-docker/) und Docker Compose müssen installiert sein und der Docker-Dienst laufen. Windows, Mac und Linux werden unterstützt.

### Schritt 1: Konfigurationsdatei laden

Öffnen Sie das Terminal (Windows: PowerShell, Mac: Terminal) und führen Sie aus:

```bash
# Projektverzeichnis anlegen und betreten
mkdir my-project && cd my-project

# docker-compose.yml herunterladen (Standard: PostgreSQL)
curl -fsSL https://static-docs.nocobase.com/docker-compose/cn/latest-postgres.yml -o docker-compose.yml
```

> **Andere Datenbank?** Ersetzen Sie `postgres` im Link durch `mysql` oder `mariadb`.
> Auch verschiedene Versionen sind möglich: `latest` (stabil), `beta`, `alpha`. Details siehe [Installationsdokumentation](https://docs.nocobase.com/get-started/installation/docker).
>
> | Datenbank | Download-Link |
> |-----------|---------------|
> | PostgreSQL (empfohlen) | `https://static-docs.nocobase.com/docker-compose/cn/latest-postgres.yml` |
> | MySQL | `https://static-docs.nocobase.com/docker-compose/cn/latest-mysql.yml` |
> | MariaDB | `https://static-docs.nocobase.com/docker-compose/cn/latest-mariadb.yml` |

### Schritt 2: Starten

```bash
# Image holen
docker compose pull

# Im Hintergrund starten (beim ersten Mal wird automatisch installiert)
docker compose up -d

# Logs prüfen, ob der Start erfolgreich war
docker compose logs -f app
```

Erscheint folgende Zeile, ist der Start erfolgreich:

```
🚀 NocoBase server running at: http://localhost:13000/
```

![01-getting-started-2026-03-11-07-49-19](https://static-docs.nocobase.com/01-getting-started-2026-03-11-07-49-19.png)

### Schritt 3: Anmelden

Öffnen Sie `http://localhost:13000` im Browser und melden Sie sich mit dem Standardkonto an:

- **Benutzer**: `admin@nocobase.com`
- **Passwort**: `admin123`

> Nach der ersten Anmeldung sollten Sie das Standardpasswort sofort ändern.


## 1.3 Die Oberfläche kennenlernen

Nach erfolgreicher Anmeldung sehen Sie eine aufgeräumte Startseite. Bevor wir loslegen, lernen Sie zwei zentrale Konzepte kennen.

### Konfigurationsmodus vs. Nutzungsmodus

Die NocoBase-Oberfläche kennt zwei Modi:

| Modus | Beschreibung | Wer nutzt ihn |
|-------|--------------|---------------|
| **Nutzungsmodus** | Tägliche Oberfläche der Anwender | Alle |
| **Konfigurationsmodus** | Designmodus zum Aufbau und Anpassen | Administratoren |

Umschalten: Klicken Sie oben rechts auf **„[UI Editor](/get-started/how-nocobase-works)"** (Markersymbol).

![01-getting-started-2026-03-11-08-17-26](https://static-docs.nocobase.com/01-getting-started-2026-03-11-08-17-26.png)

Im Konfigurationsmodus erscheinen viele Elemente mit **orangefarbenem Highlight** - sie sind konfigurierbar. Oben rechts an jedem Element gibt es ein kleines Symbol für die Einstellungen.

Schauen wir es uns an einem Demo-System an:

![01-getting-started-2026-03-11-08-19-24](https://static-docs.nocobase.com/01-getting-started-2026-03-11-08-19-24.png)

Wie zu sehen, erscheinen orangefarbene Hinweise an Menü, Tabellen-Aktionsleiste und am Seitenende - klicken Sie sie an, um neue Optionen anzulegen.

> **Merken Sie sich**: In NocoBase wechseln Sie für Änderungen in den Konfigurationsmodus, finden das Symbol oben rechts am Element und klicken darauf.

### Grundstruktur der Oberfläche

Die Oberfläche besteht aus drei Bereichen:

```
┌──────────────────────────────────────────┐
│            Obere Navigationsleiste        │
├──────────┬───────────────────────────────┤
│          │                               │
│  Linkes  │         Inhaltsbereich         │
│  Menü    │     (verschiedene Blöcke)      │
│ (group) │                               │
│          │                               │
└──────────┴───────────────────────────────┘
```

- **Obere Navigation**: Hauptmenü zum Wechseln zwischen Modulen.
- **Linkes Menü (group)**: Untermenü bei Gruppen, organisiert die Seitenhierarchie.
- **Inhaltsbereich**: Hauptteil der Seite mit verschiedenen **Blöcken (Block)** zur Datenanzeige und -bearbeitung.

![01-getting-started-2026-03-11-08-24-34](https://static-docs.nocobase.com/01-getting-started-2026-03-11-08-24-34.png)

Aktuell ist alles leer - kein Problem. Ab dem nächsten Kapitel füllen wir die Seiten mit Inhalten.


## 1.4 Was wir bauen

Im Verlauf des Tutorials bauen wir Schritt für Schritt ein **IT-Ticket-System** mit folgenden Funktionen:

- ✅ Ticket erfassen: [Anwender](/users-permissions/user) füllen Titel, Beschreibung, Kategorie und Priorität aus.
- ✅ Ticketliste: nach Status und Kategorie filtern - alles auf einen Blick.
- ✅ [Berechtigungs](/users-permissions/acl/role)steuerung: Anwender sehen nur eigene Tickets, Administratoren alles.
- ✅ Daten-Dashboard: Verteilung und Trends in Echtzeit.
- ✅ Datenoperations-Log (eingebaut).

Das System nutzt nur **2 Tabellen**:

| Tabelle | Zweck | Eigene Felder |
|---------|-------|---------------|
| Ticket-Kategorien | Kategorisierung (z. B. Netzwerkproblem, Software-Fehler) | 2 |
| Tickets | Kerntabelle, jedes Ticket | 7-8 |

Richtig gelesen: nur 2 Tabellen. Funktionen wie Benutzer, Rechte, Dateiverwaltung, Abteilungen, E-Mail oder Operations-Logs liefert NocoBase über Plugins - wir konzentrieren uns auf die Geschäftsdaten.


## Fazit

In diesem Kapitel haben wir:

1. erfahren, was NocoBase ist - eine Open-Source No-Code-Plattform.
2. NocoBase per Docker mit einem Befehl installiert und gestartet.
3. die zwei Modi der Oberfläche (Konfigurationsmodus/Nutzungsmodus) und das Layout kennengelernt.
4. eine Vorschau auf das Ticket-System erhalten.

**Im nächsten Kapitel** legen wir los: Datenquellen anlegen, die erste Tabelle bauen. Sie ist das Skelett des Systems und die Kernfähigkeit von NocoBase.

Bis zum nächsten Kapitel!

## Verwandte Ressourcen

- [Detaillierte Docker-Installation](/get-started/installation/docker) - alle Installationsoptionen und Umgebungsvariablen
- [Systemanforderungen](/get-started/system-requirements) - Hardware und Software
- [Wie NocoBase funktioniert](/get-started/how-nocobase-works) - Datenquellen, Blöcke, Aktionen
