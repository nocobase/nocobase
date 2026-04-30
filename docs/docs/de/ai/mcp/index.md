---
pkg: '@nocobase/plugin-mcp-server'
sidebar: false
---

# NocoBase MCP

Sobald das NocoBase-MCP-Service-Plugin aktiviert ist, stellt die NocoBase-Anwendung eine MCP-Service-Schnittstelle bereit, über die MCP-Clients NocoBase-Schnittstellen aufrufen können.

## Service-Adresse

- Hauptanwendung:

  `http(s)://<host>:<port>/api/mcp`

- Sub-Anwendung:

  `http(s)://<host>:<port>/api/__app/<app_name>/mcp`

Diese Adresse verwendet das Übertragungsprotokoll `streamable HTTP`.

## Bereitgestellte Funktionen

### Allgemeine Tools

Können zum Bedienen von Datentabellen verwendet werden.

| Tool-Name           | Funktionsbeschreibung                                       |
| ------------------ | ---------------------------------------------- |
| `resource_list`    | Datenliste abrufen                                   |
| `resource_get`     | Datendetails abrufen                                   |
| `resource_create`  | Daten anlegen                                       |
| `resource_update`  | Daten aktualisieren                                       |
| `resource_destroy` | Daten löschen                                       |
| `resource_query`   | Daten abfragen, mit Unterstützung für komplexe Abfragebedingungen wie Aggregationen, verknüpfte Abfragen usw. |

### NocoBase-Kern und Schnittstellen verschiedener Plugins

Über den Request-Header `x-mcp-packages` lässt sich steuern, welche Paket-Schnittstellen MCP exponiert, zum Beispiel:

```bash
x-mcp-packages: @nocobase/server,plugin-workflow*,plugin-users
```

Dieser Request-Header unterstützt vollständige Paketnamen; fehlt der Scope, wird automatisch `@nocobase/` ergänzt.

Standardmäßig werden außer den allgemeinen Tools keine weiteren Paket-Schnittstellen geladen. Empfohlen wird, andere Systemfunktionen über die [NocoBase CLI](../quick-start.md) zu bedienen.

Häufig verwendete Pakete:

| Paketname                                   | Funktionsbeschreibung                                 |
| -------------------------------------- | ---------------------------------------- |
| `@nocobase/plugin-data-source-main`    | Verwaltung der Hauptdatenquelle, einschließlich Anlegen von Datentabellen, Hinzufügen von Feldern usw. |
| `@nocobase/plugin-data-source-manager` | Verwaltung von Datenquellen, Abruf verfügbarer Datenquelleninformationen           |
| `@nocobase/plugin-workflow`            | Workflow-Verwaltung                               |
| `@nocobase/plugin-acl`                 | Verwaltung von Rollen und Berechtigungen                           |
| `@nocobase/plugin-users`               | Benutzerverwaltung                                 |

Weitere Pakete und zugehörige Schnittstellenbeschreibungen finden Sie über das Plugin [API-Dokumentation](/integration/api-doc).

## Authentifizierungsmethoden

### API-Key-Authentifizierung

Mit einem über das Plugin [API keys](/auth-verification/api-keys/index.md) erstellten API Key können Sie die MCP-Service-Schnittstelle aufrufen; die Berechtigungen werden durch die mit dem API Key verknüpfte Rolle bestimmt.

### OAuth-Authentifizierung

Verwenden Sie das nach erfolgreicher OAuth-Authentifizierung erhaltene Access Token, um die MCP-Service-Schnittstelle aufzurufen; die Berechtigungen werden durch den autorisierten Nutzer bestimmt. Hat der Nutzer mehrere Rollen, kann die Aufruferrolle über den Request-Header `x-role` festgelegt werden.

## Schnellstart

### Codex

#### Mit API-Key-Authentifizierung

Aktivieren Sie zunächst das API-Keys-Plugin und erstellen Sie einen API Key.

```bash
export NOCOBASE_API_TOKEN=<your_api_key>
codex mcp add nocobase --url https://<host>:<port>/api/mcp --bearer-token-env-var NOCOBASE_API_TOKEN
```

#### Mit OAuth-Authentifizierung

Aktivieren Sie zunächst das Plugin „IdP: OAuth".

```bash
codex mcp add nocobase --url https://<host>:<port>/api/mcp
codex mcp login nocobase --scopes mcp,offline_access
```

### Claude Code

#### Mit API-Key-Authentifizierung

Aktivieren Sie zunächst das API-Keys-Plugin und erstellen Sie einen API Key.

```bash
claude mcp add --transport http nocobase https://<host>:<port>/api/mcp --header "Authorization: Bearer <your_api_key>"
```

#### Mit OAuth-Authentifizierung

Aktivieren Sie zunächst das Plugin „IdP: OAuth".

```bash
claude mcp add --transport http nocobase https://<host>:<port>/api/mcp
```

Öffnen Sie nach der Ausführung Claude und melden Sie sich am gewünschten MCP-Service an:

```bash
claude
/mcp
```

### OpenCode

#### Mit API-Key-Authentifizierung

Aktivieren Sie zunächst das API-Keys-Plugin und erstellen Sie einen API Key. Konfigurieren Sie `opencode.json`:

```json
{
  "mcp": {
    "nocobase": {
      "type": "remote",
      "url": "https://<host>:<port>/api/mcp",
      "enabled": true,
      "headers": {
        "Authorization": "Bearer <your_api_key>"
      }
    }
  },
  "$schema": "https://opencode.ai/config.json"
}
```

#### Mit OAuth-Authentifizierung

Aktivieren Sie zunächst das Plugin „IdP: OAuth". Konfigurieren Sie `opencode.json`:

```json
{
  "mcp": {
    "nocobase": {
      "type": "remote",
      "url": "https://<host>:<port>/api/mcp",
      "enabled": true
    }
  },
  "$schema": "https://opencode.ai/config.json"
}
```

Login

```bash
opencode mcp auth nocobase
```

Debug

```bash
opencode mcp debug nocobase
```
