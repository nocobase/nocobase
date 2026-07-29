---
title: "nb portal registry sync"
description: "Befehlsreferenz für nb portal registry sync: Von Plugins bereitgestellte Registry-Einträge in einem AI Portal installieren, vergleichen oder aktualisieren."
keywords: "nb portal registry sync,NocoBase CLI,Portal Registry,shadcn,AI Portal"
---

# nb portal registry sync

Installiert NocoBase-Portal-Registry-Einträge in einem vorhandenen AI-Portal-Arbeitsbereich. Der Befehl liest den Registry-Index vom ausgewählten NocoBase-Dienst. Dadurch werden die Registry-Einträge neu aktivierter Plugins verfügbar, ohne sie fest im Portal-Template einzutragen.

## Verwendung

```bash
nb portal registry sync <portal> [Einträge...] [Flags]
```

## Argumente und Flags

| Argument oder Flag | Typ | Beschreibung |
| --- | --- | --- |
| `<portal>` | string | Erforderlicher Name oder Slug des AI Portals |
| `[Einträge...]` | string[] | Optionale Namen von Registry-Einträgen. Ohne Angabe werden alle Einträge aktivierter Plugins installiert. Sowohl `ai` als auch `@nocobase/ai` werden akzeptiert |
| `--env`, `-e` | string | Name der CLI-Umgebung; ohne Angabe wird die aktuelle Umgebung verwendet |
| `--yes`, `-y` | boolean | Bestätigung überspringen, wenn `--env` auf eine andere Umgebung verweist |
| `--overwrite` | boolean | Installierte Registry-Dateien ersetzen, vorhandene Dateien unter `src/components/ui` jedoch beibehalten |
| `--overwrite-ui` | boolean | `--overwrite` darf auch vorhandene Dateien unter `src/components/ui` ersetzen; erfordert `--overwrite` |
| `--diff` | boolean | Unterschiede anzeigen, ohne das Portal zu ändern |
| `--build` | boolean | Nach der Installation `pnpm build` und `pnpm build:html` ausführen |

## Beispiele

Alle noch nicht installierten Einträge installieren:

```bash
nb portal registry sync customer
```

Ausgewählte Einträge installieren:

```bash
nb portal registry sync customer ai acl auth-sms
```

Unterschiede zur Dienstversion anzeigen:

```bash
nb portal registry sync customer ai --diff
```

Einen Eintrag aktualisieren und Basis-UI-Komponenten schützen:

```bash
nb portal registry sync customer ai --overwrite
```

Registry-Dateien und Basis-UI-Komponenten überschreiben:

```bash
nb portal registry sync customer --overwrite --overwrite-ui
```

Installieren und anschließend bauen:

```bash
nb portal registry sync customer --build
```

Eine andere Umgebung in einem nicht interaktiven Ablauf verwenden:

```bash
nb portal registry sync customer --env dev --yes
```

## Verhalten

Der Befehl ruft zuerst den Registry-Index vom ausgewählten NocoBase-Dienst ab. Der Server liefert nur Einträge aktivierter Plugins zurück. Anschließend wird die Registry `@nocobase` in der `components.json` des Portals konfiguriert und die Installation mit der lokalen shadcn-CLI des Portals ausgeführt.

Standardmäßig werden Einträge übersprungen, deren deklarierte Zieldateien bereits vorhanden sind. Beim Hinzufügen fehlender Einträge und Abhängigkeiten werden vorhandene Dateien unter `src/extensions` und `src/components/ui` geschützt.

Verwenden Sie `--overwrite` nur, wenn installierte Registry-Dateien bewusst aktualisiert werden sollen. Basis-UI-Komponenten bleiben geschützt, solange nicht zusätzlich `--overwrite-ui` angegeben wird. Prüfen Sie vor dem Überschreiben alle lokalen Anpassungen.

`--diff` ist schreibgeschützt und kann nicht mit `--overwrite`, `--overwrite-ui` oder `--build` kombiniert werden.

Fehlt `node_modules` im Portal, führt der Befehl vor shadcn zunächst `pnpm install --frozen-lockfile` aus.

## Verwandte Befehle

- [`nb portal registry`](./index.md)
- [`nb portal create`](../create.md)
- [`nb portal dev`](../dev.md)
- [`nb portal deploy`](../deploy.md)
