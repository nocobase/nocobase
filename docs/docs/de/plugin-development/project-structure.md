:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Projektstruktur

Ganz gleich, ob Sie den Quellcode über Git klonen oder ein Projekt mit `create-nocobase-app` initialisieren: Das generierte NocoBase-Projekt ist im Wesentlichen ein auf **Yarn Workspace** basierendes Monorepo.

## Überblick über die oberste Verzeichnisstruktur

Das folgende Beispiel verwendet `my-nocobase-app/` als Projektverzeichnis. In verschiedenen Umgebungen kann es geringfügige Abweichungen geben:

```bash
my-nocobase-app/
├── packages/              # Projekt-Quellcode
│   ├── plugins/           # Quellcode von Plugins in Entwicklung (unkompiliert)
├── storage/               # Laufzeitdaten und dynamisch generierte Inhalte
│   ├── apps/
│   ├── db/
│   ├── logs/
│   ├── uploads/
│   ├── plugins/           # Kompilierte Plugins (einschließlich der über die Benutzeroberfläche hochgeladenen)
│   └── tar/               # Plugin-Paketdateien (.tar)
├── scripts/               # Hilfsskripte und Tool-Befehle
├── .env*                  # Umgebungsvariablen-Konfigurationen für verschiedene Umgebungen
├── lerna.json             # Lerna Workspace-Konfiguration
├── package.json           # Root-Paketkonfiguration, deklariert Workspace und Skripte
├── tsconfig*.json         # TypeScript-Konfigurationen (Frontend, Backend, Pfad-Mapping)
├── vitest.config.mts      # Vitest Unit-Test-Konfiguration
└── playwright.config.ts   # Playwright E2E-Testkonfiguration
```

## Erläuterung des Unterverzeichnisses `packages/`

Das Verzeichnis `packages/` enthält die Kernmodule und erweiterbaren Pakete von NocoBase. Der Inhalt hängt von der Projektquelle ab:

- **Projekte, die mit `create-nocobase-app` erstellt wurden**: Standardmäßig enthält es nur `packages/plugins/`, das den Quellcode für benutzerdefinierte Plugins speichert. Jedes Unterverzeichnis ist ein unabhängiges npm-Paket.
- **Geklontes offizielles Quellcode-Repository**: Hier finden Sie weitere Unterverzeichnisse wie `core/`, `plugins/`, `pro-plugins/`, `presets/` usw., die dem Framework-Kern, den integrierten Plugins und den offiziellen vordefinierten Lösungen entsprechen.

In jedem Fall ist `packages/plugins` der Hauptort für die Entwicklung und das Debugging benutzerdefinierter Plugins.

## Das `storage/` Laufzeitverzeichnis

`storage/` speichert zur Laufzeit generierte Daten und Build-Ausgaben. Die gängigen Unterverzeichnisse werden im Folgenden erläutert:

- `apps/`: Konfiguration und Cache für Multi-App-Szenarien.
- `logs/`: Laufzeit-Logs und Debug-Ausgaben.
- `uploads/`: Vom Benutzer hochgeladene Dateien und Medienressourcen.
- `plugins/`: Paketierte Plugins, die über die Benutzeroberfläche hochgeladen oder per CLI importiert wurden.
- `tar/`: Komprimierte Plugin-Pakete, die nach Ausführung von `yarn build <plugin> --tar` generiert werden.

> Es wird in der Regel empfohlen, das `storage`-Verzeichnis zu `.gitignore` hinzuzufügen und es bei der Bereitstellung oder Sicherung separat zu behandeln.

## Umgebungskonfiguration und Projekt-Skripte

- `.env`, `.env.test`, `.env.e2e`: Werden jeweils für den lokalen Betrieb, Unit-/Integrationstests und End-to-End-Tests verwendet.
- `scripts/`: Enthält gängige Wartungsskripte (wie Datenbankinitialisierung, Release-Hilfsprogramme usw.).

## Plugin-Ladepfade und Priorität

Plugins können an mehreren Orten existieren. NocoBase lädt sie beim Start in der folgenden Prioritätsreihenfolge:

1. Die Quellcode-Version in `packages/plugins` (für lokale Entwicklung und Debugging).
2. Die gepackte Version in `storage/plugins` (über die Benutzeroberfläche hochgeladen oder per CLI importiert).
3. Abhängigkeitspakete in `node_modules` (über npm/yarn installiert oder im Framework integriert).

Wenn ein Plugin mit demselben Namen sowohl im Quellcode-Verzeichnis als auch im gepackten Verzeichnis existiert, priorisiert das System das Laden der Quellcode-Version, was lokale Überschreibungen und Debugging erleichtert.

## Plugin-Verzeichnisvorlage

Erstellen Sie ein Plugin über die CLI:

```bash
yarn pm create @my-project/plugin-hello
```

Die generierte Verzeichnisstruktur sieht wie folgt aus:

```bash
packages/plugins/@my-project/plugin-hello/
├── dist/                    # Build-Ausgabe (bei Bedarf generiert)
├── src/                     # Quellcode-Verzeichnis
│   ├── client/              # Frontend-Code (Blöcke, Seiten, Modelle usw.)
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
├── client.d.ts              # Frontend-Typdeklarationen
├── client.js                # Frontend-Build-Artefakt
├── server.d.ts              # Serverseitige Typdeklarationen
├── server.js                # Serverseitiges Build-Artefakt
├── .npmignore               # Veröffentlichungs-Ignorierkonfiguration
└── package.json
```

> Nach Abschluss des Builds werden das Verzeichnis `dist/` sowie die Dateien `client.js` und `server.js` geladen, wenn das Plugin aktiviert wird.  
> Während der Entwicklung müssen Sie nur das Verzeichnis `src/` ändern. Vor der Veröffentlichung führen Sie einfach `yarn build <plugin>` oder `yarn build <plugin> --tar` aus.