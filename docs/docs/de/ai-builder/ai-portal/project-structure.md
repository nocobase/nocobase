---
title: "Projektstruktur und Technologie-Stack"
description: "Technologie-Stack, Verzeichniskonventionen, Umgebungsvariablen und gängige Befehle der AI-Portal-Vorlage, damit Sie beurteilen können, ob die KI ihren Code an der richtigen Stelle abgelegt hat."
keywords: "AI Portal,Projektstruktur,Technologie-Stack,React,Vite,Refine,Tailwind CSS,shadcn/ui,Umgebungsvariablen"
---

# Projektstruktur und Technologie-Stack

:::tip Voraussetzung

Bevor Sie diese Seite lesen, stellen Sie bitte sicher, dass Sie gemäß dem [Schnellstart Aufbau mit AI Portal](./index.md) Ihr erstes Portal zum Laufen gebracht haben.

:::

Den größten Teil der täglichen Entwicklung können Sie der KI überlassen. Wenn Sie die Struktur der Vorlage kennen, können Sie aber beurteilen, ob die KI ihren Code an der richtigen Stelle abgelegt hat, und Probleme lassen sich leichter eingrenzen.

## Technologie-Stack

Die Portal-Vorlage basiert auf `@nocobase/portal-template-default`, der Quellcode liegt unter [nocobase/portal-template-default](https://github.com/nocobase/portal-template-default).

| Technologie | Zweck |
| --- | --- |
| React 19 + TypeScript | Frontend-Framework |
| Vite | Entwicklungsserver und Build-Werkzeug |
| [Refine](https://refine.dev/docs/) | Datenschicht-Framework für Ressourcen, Routing, Formulare und Berechtigungen |
| Tailwind CSS 4 | Styling |
| [shadcn/ui](https://ui.shadcn.com/) | Komponentenbasis, deren Quellcode dem Projekt gehört |
| lucide | Icon-Bibliothek |
| pnpm | Paketmanager |

Diese Kombination ist der Frontend-Stack, den KI aktuell am besten kennt – entsprechend genauer fällt aus, was sie schreibt.

Das Portal ist derzeit ein reines Frontend-Projekt; die Geschäftslogik wird über die API von NocoBase, Standardkomponenten und Ähnliches abgedeckt. Unterstützung dafür, dass der AI Agent auch den Backend-Code des Portals schreibt, folgt später.

## Verzeichnisstruktur

```text
src/
├── app/            Routing und Laden der Erweiterungen
├── pages/          Anmeldung, Registrierung, Passwort vergessen und Weiteres
├── components/     Komponenten
│   ├── ui/         shadcn/ui-Komponentenbasis
│   ├── app-shell/  Layout, Navigation, Ladezustände
│   ├── auth/       Komponenten rund um die Authentifizierung
│   └── ...
├── extensions/     Erweiterungen, nach dem Ablegen sofort aktiv
├── lib/            NocoBase-Client-Kapselung und ACL-Logik
├── providers/      Die verschiedenen Provider von Refine
├── hooks/          Eigene Hooks
└── locales/        Texte für die Internationalisierung
```

Einige zentrale Stellen:

- **`src/app/routes.tsx`** – die Routenstruktur. Routen für angemeldete und nicht angemeldete Nutzer sind getrennt, und von Erweiterungen bereitgestellte Routen werden automatisch eingehängt
- **`src/app/extensions.tsx`** – die Logik zum Laden der Erweiterungen, die per `import.meta.glob` `src/extensions/*/extension.tsx` durchsucht
- **`src/providers/data.ts`** – der data provider von Refine, der die Abfragesyntax von Refine in NocoBase-API-Parameter übersetzt
- **`src/lib/nocobase/client.ts`** – `NocoBaseClient`, die zugrunde liegende Kapselung sämtlicher Anfragen
- **`src/components/ui/`** – über 60 shadcn/ui-Komponenten, direkt einsatzbereit

Geschäftsseiten liegen üblicherweise unter `src/extensions/`, ein Verzeichnis je Funktionsmodul. Details siehe [Standardkomponenten und Erweiterungen](./components.md).

## Zentrale Dateien

| Datei | Funktion |
| --- | --- |
| `AGENTS.md` | Entwicklungskonventionen für den AI Agent. Sie können hier auch eigene Projektregeln ergänzen |
| `components.json` | shadcn/ui-Konfiguration, inklusive Stil, Icon-Bibliothek und Pfad-Aliassen |
| `.env` / `.env.local` | Umgebungsvariablen, die `nb portal dev` und `deploy` automatisch aktualisieren |
| `vite.config.ts` | Build-Konfiguration, inklusive API-Proxy für die Entwicklung |

## Umgebungsvariablen

| Variable | Beschreibung |
| --- | --- |
| `NOCOBASE_API_URL` | Wurzeladresse der NocoBase REST API, **muss auf `/api` enden**. Bei Deployment auf derselben Origin üblicherweise `/api` |
| `NOCOBASE_PORTAL_BASE` | Öffentlicher Pfad, unter dem das Portal eingehängt ist. Lokal `/`, beim Build der tatsächliche Deployment-Pfad, etwa `/x/main/` |
| `NOCOBASE_AUTHENTICATOR` | Name des Authenticators, standardmäßig `basic` |
| `NOCOBASE_API_TOKEN` | Temporärer token für die Entwicklung, echte Werte gehören nicht ins Repository |
| `API_CLIENT_STORAGE_PREFIX` | Präfix für die token-Speicherung. Wurde es serverseitig angepasst, muss es übereinstimmen |
| `API_CLIENT_STORAGE_TYPE` | Art der token-Speicherung, standardmäßig `localStorage` |
| `API_CLIENT_SHARE_TOKEN` | Ob der token geteilt wird, standardmäßig `false` |

Diese Variablen schreiben `nb portal dev` und `nb portal deploy` automatisch, sodass Sie in der Regel nichts von Hand ändern müssen. Nur wenn die Art der Authentifizierungsspeicherung serverseitig angepasst wurde, müssen die letzten drei abgeglichen werden.

Steht in `NOCOBASE_API_URL` während der Entwicklung eine absolute Adresse, richtet Vite automatisch einen Proxy ein, der die Anfragen weiterleitet – um CORS müssen Sie sich also nicht selbst kümmern.

## Gängige Befehle

Für die tägliche Entwicklung brauchen Sie nur diese wenigen Befehle; Installation der Abhängigkeiten, Aktualisierung der Umgebungsvariablen und Builds erledigt die CLI im Hintergrund:

| Befehl | Funktion |
| --- | --- |
| `nb portal list` | ansehen, welche Portale die aktuelle Anwendung hat |
| `nb portal info <portal>` | Entwicklungspfad, Deployment-Pfad und Zugriffsadresse eines Portals abfragen |
| `nb portal create <portal>` | den Entwicklungs-Workspace eines neuen Portals aus der Vorlage erstellen |
| `nb portal pull <portal>` | den Portal-Quellcode von der Gegenstelle in den lokalen Entwicklungs-Workspace ziehen |
| `nb portal dev <portal>` | den lokalen Entwicklungsserver starten und Änderungen sofort sehen |
| `nb portal push <portal>` | lokale Quellcodeänderungen auf die Gegenstelle pushen |
| `nb portal deploy <portal>` | builden und deployen, damit Änderungen für Nutzer wirksam werden |
| `nb portal config <portal>` | source storage, Git-Konfiguration und Pfad des Entwicklungs-Workspace anpassen |
| `nb portal destroy <portal>` | den Portal-Datensatz und die deployten Dateien löschen |

Die vollständigen Parameter jedes Befehls finden Sie in der [`nb portal` Befehlsreferenz](../../api/cli/portal/index.md).

## Wo der Entwicklungs-Workspace liegt

Der Entwicklungs-Workspace eines Portals landet standardmäßig in dem Verzeichnis, in dem Sie `nb portal create` oder `nb portal pull` ausgeführt haben:

```text
./<portal>
```

Beim Erstellen oder Ziehen können Sie mit `--path` einen anderen Ort angeben. Die gebauten Deployment-Artefakte liegen an anderer Stelle, nämlich im storage der Zielanwendung; `nb portal deploy` hält sie synchron, und im Alltag müssen Sie sich nicht darum kümmern.

Wenn Sie nicht sicher sind, wo der Entwicklungs-Workspace eines Portals liegt, fragen Sie ihn einfach ab:

```bash
nb portal info main
```

## Verwandte Links

- [Schnellstart Aufbau mit AI Portal](./index.md) – bringen Sie Ihren ersten von der KI geschriebenen Frontend-Einstieg zum Laufen
- [Standardkomponenten und Erweiterungen](./components.md) – die shadcn/ui-Komponentenbasis und der Erweiterungsmechanismus
- [Deployment und Quellcodeverwaltung](./deploy.md) – der Build- und Deployment-Ablauf sowie source storage
- [Aufbau mit einem AI Agent](./agent-workflow.md) – Seiten in natürlicher Sprache von der KI schreiben lassen
- [`nb portal info`](../../api/cli/portal/info.md) – nachsehen, wo der Entwicklungs-Workspace eines Portals liegt
