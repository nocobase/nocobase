---
title: "Übersicht zur Plugin-Entwicklung"
description: "NocoBase Mikrokernel-Architektur, Plugin-Lebenszyklus, Verzeichnisstruktur, Plug & Play, Full-Stack-Integration, client/server Quellcode, package.json Metadaten."
keywords: "Plugin-Entwicklung,NocoBase Plugin,Mikrokernel,Plugin-Lebenszyklus,Full-Stack-Integration,NocoBase Erweiterung"
---

# Übersicht zur Plugin-Entwicklung

NocoBase setzt auf eine **Mikrokernel-Architektur**. Der Kern ist dabei ausschließlich für die Planung des Plugin-Lebenszyklus, das Abhängigkeitsmanagement und die Kapselung grundlegender Funktionen zuständig. Alle Geschäftsfunktionen werden als Plugins bereitgestellt. Das Verständnis der Organisationsstruktur, des Lebenszyklus und der Verwaltung von Plugins ist daher der erste Schritt, um NocoBase anzupassen.

## Kernkonzepte

- **Plug & Play**: Plugins können bei Bedarf installiert, aktiviert oder deaktiviert werden, was eine flexible Kombination von Geschäftsfunktionen ohne Codeänderungen ermöglicht.
- **Full-Stack-Integration**: Plugins umfassen typischerweise sowohl serverseitige als auch clientseitige Implementierungen, um die Konsistenz zwischen Datenlogik und Benutzeroberflächen-Interaktionen zu gewährleisten.

## Grundlegende Plugin-Struktur

Jedes Plugin ist ein eigenständiges npm-Paket und enthält typischerweise die folgende Verzeichnisstruktur:

```bash
plugin-hello/
├─ package.json          # Plugin-Name, Abhängigkeiten und NocoBase Plugin-Metadaten
├─ client-v2.js          # Frontend-Build-Artefakt für das Laden zur Laufzeit
├─ server.js             # Serverseitiges Build-Artefakt für das Laden zur Laufzeit
├─ src/
│  ├─ client-v2/         # Clientseitiger Quellcode, kann Blöcke, Aktionen, Felder usw. registrieren
│  └─ server/            # Serverseitiger Quellcode, kann Ressourcen, Ereignisse, Befehle usw. registrieren
```

## Voraussetzungen

Bevor Sie mit der Plugin-Entwicklung beginnen, müssen Sie zunächst eine Anwendung über die NocoBase CLI initialisieren. Die CLI unterstützt zwei Quellen: npm und Git:

- **npm-Quelle** (`create-nocobase-app`): Ideal für den schnellen Einstieg, sofort einsatzbereit.
- **Git-Quelle** (empfohlen): Klonen Sie das NocoBase-Quellcode-Repository. Bei der KI-Entwicklung kann direkt auf den Kernquellcode verwiesen werden, was bessere Ergebnisse liefert.

Weitere Informationen finden Sie unter [Installation per CLI](../nocobase-cli/installation/cli.md) oder [KI-Agent-Integrationsanleitung](../ai/quick-start.mdx).

## Verzeichnis-Konventionen und Lade-Reihenfolge

Die über `nb init` erstellte Anwendung hat folgende Verzeichnisstruktur:

```bash
<app-path>/
├── .nb/                  # Von der CLI gespeicherte Metadaten für die aktuelle Umgebung
├── source/               # Anwendungsquellcode (NocoBase-Projekt)
├── storage/              # Laufzeitdatenverzeichnis
│   └── plugins/          # Kompilierte Plugins (hochgeladene oder importierte)
├── plugins/              # Deine Plugin-Quellcodes (nb scaffold plugin erzeugt sie hier)
└── .env                  # Umgebungsvariablen der Anwendung
```

- `plugins/`: Dein Plugin-Quellcodeverzeichnis. Über `nb scaffold plugin` erstellte Plugins werden hier abgelegt. `nb` synchronisiert sie automatisch nach `source/packages/plugins/` für den Entwicklungs- und Build-Prozess — du musst das `source/`-Verzeichnis nicht manuell bearbeiten.
- `storage/plugins/`: Hier werden kompilierte Plugins gespeichert, wie z. B. kommerzielle Versionen oder Plugins von Drittanbietern.

## Plugin-Lebenszyklus und -Zustände

Ein Plugin durchläuft typischerweise die folgenden Phasen:

1.  **Erstellen (create)**: Erstellen Sie eine Plugin-Vorlage über die CLI.
2.  **Herunterladen (pull)**: Laden Sie das Plugin-Paket lokal herunter; es wird jedoch noch nicht in die Datenbank geschrieben.
3.  **Aktivieren (enable)**: Bei der ersten Aktivierung werden "Registrierung + Initialisierung" ausgeführt; bei späteren Aktivierungen wird nur die Logik geladen.
4.  **Deaktivieren (disable)**: Stoppt die Ausführung des Plugins.
5.  **Entfernen (remove)**: Entfernt das Plugin vollständig aus dem System.

:::tip

- `pull` lädt lediglich das Plugin-Paket herunter; der eigentliche Installationsprozess wird durch die erste `enable`-Aktion ausgelöst.
- Wenn ein Plugin nur heruntergeladen (`pull`) aber nicht aktiviert wurde, wird es nicht geladen.

:::

### CLI-Befehlsbeispiele

```bash
# 1. Plugin-Gerüst erstellen
nb scaffold plugin @my-project/plugin-hello

# 2. Plugin aktivieren (automatische Installation bei erster Aktivierung)
nb plugin enable @my-project/plugin-hello

# 3. Plugin deaktivieren
nb plugin disable @my-project/plugin-hello
```

## Plugin-Verwaltungsoberfläche

Greifen Sie im Browser auf den Plugin-Manager zu, um Plugins intuitiv anzuzeigen und zu verwalten:

**Standard-URL:** [http://localhost:13000/admin/settings/plugin-manager](http://localhost:13000/admin/settings/plugin-manager)

![Plugin-Manager](https://static-docs.nocobase.com/20251030195350.png)

## Verwandte Links

- [Ihren ersten Plugin entwickeln](./write-your-first-plugin.md) — Ein Block-Plugin von Grund auf erstellen und den Entwicklungs-Workflow kennenlernen
- [Projektstruktur](./project-structure.md) — Verzeichnis-Konventionen und Plugin-Lade-Reihenfolge des NocoBase-Projekts
- [Server-Entwicklung Übersicht](./server/index.md) — Gesamtübersicht und Kernkonzepte der serverseitigen Plugin-Entwicklung
- [Client-Entwicklung Übersicht](./client/index.md) — Gesamtübersicht und Kernkonzepte der clientseitigen Plugin-Entwicklung
- [Build und Paketierung](./build.md) — Build- und Paketierungsprozess für Plugins
- [Abhängigkeitsverwaltung](./dependency-management.md) — Deklaration und Verwaltung von Plugin-Abhängigkeiten