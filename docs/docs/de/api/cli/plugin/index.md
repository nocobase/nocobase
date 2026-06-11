---
title: "nb plugin"
description: "nb plugin Befehlsreferenz: Verwaltet die Plugins der ausgewählten NocoBase env und importiert verpackte Plugins nach storage/plugins."
keywords: "nb plugin,NocoBase CLI,Pluginverwaltung,enable,disable,list,import"
---

# nb plugin

Verwaltet die Plugins der ausgewählten NocoBase env. npm/Git env führen Plugin-Befehle lokal aus, Docker env führen sie im gespeicherten Anwendungscontainer aus, und HTTP env greifen, falls verfügbar, auf die API zurück.

## Verwendung

```bash
nb plugin <command>
```

## Unterbefehle

| Befehl | Beschreibung |
| --- | --- |
| [`nb plugin import`](./import.md) | Importiert ein verpacktes Plugin-Archiv oder npm-Paket |
| [`nb plugin list`](./list.md) | Listet die installierten Plugins auf |
| [`nb plugin enable`](./enable.md) | Aktiviert ein oder mehrere Plugins |
| [`nb plugin disable`](./disable.md) | Deaktiviert ein oder mehrere Plugins |

## Beispiele

```bash
nb plugin import ./plugin-auth-cas-1.4.0.tgz --storage-path ./storage
nb plugin list -e local
nb plugin enable @nocobase/plugin-sample
nb plugin disable -e local @nocobase/plugin-sample
```

## Verwandte Befehle

- [`nb env info`](../env/info.md)
- [`nb scaffold plugin`](../scaffold/plugin.md)
