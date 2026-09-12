---
title: "Plugin-Entwicklungs-Cheatsheet"
description: "NocoBase Plugin-Entwicklungs-Cheatsheet: Was tun → in welcher Datei → welche API aufrufen, schnell die richtige Stelle für den Code finden."
keywords: "Cheatsheet,Schnellübersicht,Registrierungsweise,Datei-Position,NocoBase"
---

# Plugin-Entwicklungs-Cheatsheet

Beim Schreiben von Plugins fragt man sich oft: „In welcher Datei und mit welcher API soll ich das tun?" Dieses Cheatsheet hilft Ihnen, schnell die richtige Stelle zu finden.

## Plugin-Verzeichnisstruktur

Mit `yarn pm create @my-project/plugin-name` erstellen Sie ein Plugin, dabei wird automatisch die folgende Verzeichnisstruktur erzeugt. Erstellen Sie Verzeichnisse nicht manuell, da sonst Registrierungsschritte vergessen werden können und das Plugin nicht funktioniert. Details siehe [Erstes Plugin schreiben](../../write-your-first-plugin).

```bash
plugin-name/
├── src/
│   ├── client-v2/              # Client-Code (v2)
│   │   ├── plugin.tsx          # Client-Plugin-Einstiegspunkt
│   │   ├── locale.ts           # useT / tExpr Übersetzungs-Hooks
│   │   ├── models/             # FlowModel (Block, Feld, Aktion)
│   │   └── pages/              # Seiten-Components
│   ├── client/                 # Client-Code (v1, kompatibel)
│   │   ├── plugin.tsx
│   │   ├── locale.ts
│   │   ├── models/
│   │   └── pages/
│   ├── server/                 # Server-Code
│   │   ├── plugin.ts           # Server-Plugin-Einstiegspunkt
│   │   └── collections/        # Datentabellen-Definitionen
│   └── locale/                 # Mehrsprachen-Übersetzungsdateien
│       ├── zh-CN.json
│       └── en-US.json
├── client-v2.js                # Stamm-Einstiegspunkt (verweist auf das Build-Ergebnis)
├── client-v2.d.ts
├── client.js
├── client.d.ts
├── server.js
├── server.d.ts
└── package.json
```

## Client: Was tun → Wie schreiben

| Was tun | In welcher Datei | Welche API | Dokumentation |
| --- | --- | --- | --- |
| Eine Seitenroute registrieren | `plugin.tsx` `load()` | `this.router.add()` | [Router](../router) |
| Eine Plugin-Einstellungsseite registrieren | `plugin.tsx` `load()` | `pluginSettingsManager.addMenuItem()` + `addPageTabItem()` | [Router](../router) |
| Einen benutzerdefinierten Block registrieren | `plugin.tsx` `load()` | `this.flowEngine.registerModelLoaders()` | [FlowEngine → Block-Erweiterung](../flow-engine/block) |
| Ein benutzerdefiniertes Feld registrieren | `plugin.tsx` `load()` | `this.flowEngine.registerModelLoaders()` | [FlowEngine → Feld-Erweiterung](../flow-engine/field) |
| Eine benutzerdefinierte Aktion registrieren | `plugin.tsx` `load()` | `this.flowEngine.registerModelLoaders()` | [FlowEngine → Aktions-Erweiterung](../flow-engine/action) |
| Eine interne Tabelle in der Datentabellen-Auswahl eines Blocks anzeigen | `plugin.tsx` `load()` | `mainDS.addCollection()` | [Collections](../../server/collections) |
| Plugin-Texte übersetzen | `locale/zh-CN.json` + `locale/en-US.json` | — | [i18n Internationalisierung](../component/i18n) |

## Server: Was tun → Wie schreiben

| Was tun | In welcher Datei | Welche API | Dokumentation |
| --- | --- | --- | --- |
| Eine Datentabelle definieren | `server/collections/xxx.ts` | `defineCollection()` | [Collections](../../server/collections) |
| Eine vorhandene Datentabelle erweitern | `server/collections/xxx.ts` | `extendCollection()` | [Collections](../../server/collections) |
| Eine benutzerdefinierte Schnittstelle registrieren | `server/plugin.ts` `load()` | `this.app.resourceManager.define()` | [ResourceManager](../../server/resource-manager) |
| Schnittstellen-Berechtigungen konfigurieren | `server/plugin.ts` `load()` | `this.app.acl.allow()` | [ACL](../../server/acl) |
| Beim Plugin-Installieren Initialdaten einfügen | `server/plugin.ts` `install()` | `this.db.getRepository().create()` | [Plugin](../../server/plugin) |

## FlowModel-Schnellübersicht

| Was tun | Welche Basisklasse erweitern | Wichtige API |
| --- | --- | --- |
| Reinen Anzeige-Block | `BlockModel` | `renderComponent()` + `define()` |
| Datentabellen-gebundenen Block (benutzerdefiniertes Rendering) | `CollectionBlockModel` | `createResource()` + `renderComponent()` |
| Vollständigen Tabellenblock (auf Basis der eingebauten Tabelle anpassen) | `TableBlockModel` | `filterCollection()` + `customModelClasses` |
| Feld-Anzeige-Component | `ClickableFieldModel` | `renderComponent(value)` + `bindModelToInterface()` |
| Aktionsbutton | `ActionModel` | `static scene` + `registerFlow({ on: 'click' })` |

## Übersetzungsmethoden-Schnellübersicht

| Szenario | Was verwenden | Woher importieren |
| --- | --- | --- |
| In Plugin `load()` | `this.t('key')` | In der Plugin-Basisklasse enthalten |
| In React-Components | `const t = useT(); t('key')` | `locale.ts` |
| Statische FlowModel-Definition (`define()`, `registerFlow()`) | `tExpr('key')` | `locale.ts` |

## Schnellübersicht häufiger API-Aufrufe

| Was tun | Im Plugin | Im Component |
| --- | --- | --- |
| API-Anfrage senden | `this.context.api.request()` | `ctx.api.request()` |
| Übersetzung abrufen | `this.t()` | `useT()` |
| Logger abrufen | `this.context.logger` | `ctx.logger` |
| Route registrieren | `this.router.add()` | — |
| Zur Seite navigieren | — | `ctx.router.navigate()` |
| Modal öffnen | — | `ctx.viewer.dialog()` |

## Verwandte Links

- [Client-Entwicklungs-Übersicht](../index.md) — Lernpfad und Schnellindex
- [Plugin](../plugin) — Plugin-Einstiegspunkt und Lebenszyklus
- [Häufige Fragen & Troubleshooting-Leitfaden](./faq) — Stolpersteine umgehen
- [Router](../router) — Seitenrouten registrieren
- [FlowEngine → Block-Erweiterung](../flow-engine/block) — BlockModel-Basisklassen
- [FlowEngine → Feld-Erweiterung](../flow-engine/field) — FieldModel-Entwicklung
- [FlowEngine → Aktions-Erweiterung](../flow-engine/action) — ActionModel-Entwicklung
- [Collections](../../server/collections) — defineCollection und Feldtypen
- [i18n Internationalisierung](../component/i18n) — Schreibweise von Übersetzungsdateien
- [ResourceManager](../../server/resource-manager) — Benutzerdefinierte REST-API
- [ACL](../../server/acl) — Berechtigungskonfiguration
- [Plugin (Server)](../../server/plugin) — Lebenszyklus serverseitiger Plugins
- [Erstes Plugin schreiben](../../write-your-first-plugin) — Plugin-Gerüst erstellen
