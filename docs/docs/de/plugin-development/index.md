:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

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
├─ client.js             # Frontend-Build-Artefakt für das Laden zur Laufzeit
├─ server.js             # Serverseitiges Build-Artefakt für das Laden zur Laufzeit
├─ src/
│  ├─ client/            # Clientseitiger Quellcode, kann Blöcke, Aktionen, Felder usw. registrieren
│  └─ server/            # Serverseitiger Quellcode, kann Ressourcen, Ereignisse, Befehle usw. registrieren
```

## Verzeichnis-Konventionen und Lade-Reihenfolge

NocoBase scannt standardmäßig die folgenden Verzeichnisse, um Plugins zu laden:

```bash
my-nocobase-app/
├── packages/
│   └── plugins/          # Plugins in Entwicklung (höchste Priorität)
└── storage/
    └── plugins/          # Kompilierte Plugins, z. B. hochgeladene oder veröffentlichte Plugins
```

- `packages/plugins`: Dieses Verzeichnis wird für die lokale Plugin-Entwicklung genutzt und unterstützt Echtzeit-Kompilierung und Debugging.
- `storage/plugins`: Hier werden kompilierte Plugins gespeichert, wie z. B. kommerzielle Versionen oder Plugins von Drittanbietern.

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
yarn pm create @my-project/plugin-hello

# 2. Plugin-Paket herunterladen (download oder link)
yarn pm pull @my-project/plugin-hello

# 3. Plugin aktivieren (automatische Installation bei erster Aktivierung)
yarn pm enable @my-project/plugin-hello

# 4. Plugin deaktivieren
yarn pm disable @my-project/plugin-hello

# 5. Plugin entfernen
yarn pm remove @my-project/plugin-hello
```

## Plugin-Verwaltungsoberfläche

Greifen Sie im Browser auf den Plugin-Manager zu, um Plugins intuitiv anzuzeigen und zu verwalten:

**Standard-URL:** [http://localhost:13000/admin/settings/plugin-manager](http://localhost:13000/admin/settings/plugin-manager)

![Plugin-Manager](https://static-docs.nocobase.com/20251030195350.png)