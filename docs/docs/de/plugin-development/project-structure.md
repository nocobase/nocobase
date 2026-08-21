---
title: "Plugin-Projektstruktur"
description: "NocoBase Plugin-Projektstruktur: nb init Anwendungslayout, plugins Plugin-Verzeichnis, source Quellcode-Projekt, storage Laufzeitverzeichnis."
keywords: "Projektstruktur,nb init,plugins,Plugin-Verzeichnis,NocoBase"
---

# Projektstruktur

Über NocoBase CLI (`nb init`) initialisierte Anwendungen erzeugen ein standardisiertes Anwendungsverzeichnis. Die CLI unterstützt npm (`create-nocobase-app`) und Git als Quellen; die oberste Verzeichnisstruktur ist identisch.

## Überblick über die oberste Verzeichnisstruktur

```bash
<app-path>/
├── .nb/                   # CLI-Metadaten für die aktuelle Umgebung
├── source/                # Anwendungsquellcode-Projekt (NocoBase-Kern + integrierte Plugins)
├── storage/               # Laufzeitdaten und dynamisch generierte Inhalte
│   ├── plugins/           # Kompilierte Plugins (hochgeladen oder importiert)
│   └── tar/               # Plugin-Paketdateien (.tgz)
├── plugins/               # Deine Plugin-Quellcodes (nb scaffold plugin erzeugt sie hier)
└── .env                   # Umgebungsvariablen-Konfiguration
```

## plugins/ Plugin-Entwicklungsverzeichnis

`plugins/` ist der Hauptort für die Entwicklung benutzerdefinierter Plugins. Über `nb scaffold plugin` erstellte Plugins werden hier abgelegt.

`nb` synchronisiert Plugins unter `plugins/` automatisch als symbolische Links nach `source/packages/plugins/` für den Entwicklungs- und Build-Prozess. Sie müssen den Inhalt von `source/` nicht manuell bearbeiten.

## source/ Quellcode-Projektverzeichnis

Das Verzeichnis `source/` enthält das vollständige NocoBase-Quellcode-Projekt. Der Inhalt hängt von der Projektquelle ab:

- **npm-Quelle** (`create-nocobase-app`): Standardmäßig nur Basisverzeichnisse wie `packages/plugins/`.
- **Git-Quelle** (empfohlen): Enthält den vollständigen Framework-Kern (`packages/core/`), integrierte Plugins usw., die bei der KI-Entwicklung direkt als Referenz dienen können.

## Das `storage/` Laufzeitverzeichnis

`storage/` speichert zur Laufzeit generierte Daten und Build-Ausgaben:

- `plugins/`: Über die Benutzeroberfläche hochgeladene oder per CLI importierte paketierte Plugins.
- `tar/`: Komprimierte Plugin-Pakete, die nach Ausführung von `nb source build <plugin> --tar` generiert werden.

## Plugin-Ladepfade und Priorität

Plugins können an mehreren Orten existieren. NocoBase lädt sie beim Start in der folgenden Prioritätsreihenfolge:

1. Die Quellcode-Version in `source/packages/plugins` (für lokale Entwicklung und Debugging, von `nb` automatisch aus `plugins/` synchronisiert).
2. Die gepackte Version in `storage/plugins` (über die Benutzeroberfläche hochgeladen oder per CLI importiert).
3. Abhängigkeitspakete in `node_modules` (über npm/yarn installiert oder im Framework integriert).

Wenn ein Plugin mit demselben Namen sowohl im Quellcode-Verzeichnis als auch im gepackten Verzeichnis existiert, priorisiert das System das Laden der Quellcode-Version, was lokale Überschreibungen und Debugging erleichtert.

## Plugin-Verzeichnisvorlage

Erstellen Sie ein Plugin über die CLI:

```bash
nb scaffold plugin @my-project/plugin-hello
```

Die generierte Verzeichnisstruktur sieht wie folgt aus:

```bash
plugins/@my-project/plugin-hello/
├── dist/                    # Build-Ausgabe (bei Bedarf generiert)
├── src/                     # Quellcode-Verzeichnis
│   ├── client-v2/           # Frontend-Code (Blöcke, Seiten, Modelle usw.)
│   │   ├── plugin.ts        # Hauptklasse des Client-Plugins
│   │   └── index.ts         # Client-Einstiegspunkt
│   ├── locale/              # Mehrsprachige Ressourcen (Frontend und Backend geteilt)
│   ├── swagger/             # OpenAPI/Swagger-Dokumentation
│   └── server/              # Serverseitiger Code
│       ├── collections/     # Sammlung-Definitionen
│       ├── commands/        # Benutzerdefinierte Befehle
│       ├── migrations/      # Datenbankmigrationsskripte
│       ├── plugin.ts        # Hauptklasse des Server-Plugins
│       └── index.ts         # Server-Einstiegspunkt
├── index.ts                 # Frontend- und Backend-Bridge-Export
├── client-v2.d.ts           # Frontend-Typdeklarationen
├── client-v2.js             # Frontend-Build-Artefakt
├── server.d.ts              # Serverseitige Typdeklarationen
├── server.js                # Serverseitiges Build-Artefakt
├── .npmignore               # Veröffentlichungs-Ignorierkonfiguration
└── package.json
```

:::tip Hinweis

Nach Abschluss des Builds werden das Verzeichnis `dist/` sowie die Dateien `client-v2.js` und `server.js` geladen, wenn das Plugin aktiviert wird. Während der Entwicklung müssen Sie nur das Verzeichnis `src/` ändern. Vor der Veröffentlichung führen Sie einfach `nb source build <plugin>` oder `nb source build <plugin> --tar` aus.

:::

## Verwandte Links

- [Ihren ersten Plugin entwickeln](./write-your-first-plugin.md) — Ein Plugin von Grund auf erstellen und den vollständigen Entwicklungs-Workflow erleben
- [Server-Entwicklung Übersicht](./server/index.md) — Gesamtübersicht und Kernkonzepte der serverseitigen Plugin-Entwicklung
- [Client-Entwicklung Übersicht](./client/index.md) — Gesamtübersicht und Kernkonzepte der clientseitigen Plugin-Entwicklung
- [Build und Paketierung](./build.md) — Build-, Paketierungs- und Distributionsprozess für Plugins
- [Abhängigkeitsverwaltung](./dependency-management.md) — Deklaration und Verwaltung von Plugin-Abhängigkeiten