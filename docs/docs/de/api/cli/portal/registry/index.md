---
title: "nb portal registry"
description: "Befehlsreferenz für nb portal registry: Von Plugins bereitgestellte Portal-Registry-Einträge in einem AI-Portal-Arbeitsbereich verwalten."
keywords: "nb portal registry,NocoBase CLI,Portal Registry,shadcn,AI Portal"
---

# nb portal registry

Verwaltet NocoBase-Portal-Registry-Einträge in einem AI-Portal-Arbeitsbereich. Aktivierte Server-Plugins können wiederverwendbare Frontend-Integrationen wie Komponenten, Hooks, Adapter und Demo-Seiten bereitstellen. Mit den Registry-Befehlen werden diese Integrationen in den Portal-Quellcode installiert.

## Verwendung

```bash
nb portal registry <Befehl>
```

## Unterbefehle

| Befehl | Beschreibung |
| --- | --- |
| [`nb portal registry sync`](./sync.md) | Registry-Einträge installieren oder aktualisieren, die von aktivierten NocoBase-Plugins bereitgestellt werden |

## Voraussetzungen

- Der Portal-Arbeitsbereich muss bereits vorhanden sein und `package.json` sowie `components.json` enthalten.
- Die ausgewählte NocoBase-Umgebung muss die Portal-Registry-API bereitstellen.
- Es sind nur Registry-Einträge aktivierter Plugins verfügbar.

## Beispiele

Alle verfügbaren Registry-Einträge im Portal `customer` installieren:

```bash
nb portal registry sync customer
```

Nur ausgewählte Einträge installieren:

```bash
nb portal registry sync customer ai acl auth-sms
```

## Verwandte Befehle

- [`nb portal create`](../create.md)
- [`nb portal dev`](../dev.md)
- [`nb portal deploy`](../deploy.md)
