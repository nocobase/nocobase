---
title: "nb portal dev"
description: "nb portal dev Befehlsreferenz: startet den Entwicklungsmodus für das lokale Quellcodeverzeichnis eines Portals."
keywords: "nb portal dev,NocoBase CLI,Portal,Entwicklungsmodus,lokale Entwicklung"
---

# nb portal dev

Startet den Entwicklungsmodus für das lokale Quellcodeverzeichnis des angegebenen Portals. Üblicherweise wird der Befehl nach [`nb portal create`](./create.md) oder [`nb portal pull`](./pull.md) verwendet.

Bei der Ausführung werden `.env` und `.env.local` im lokalen Quellcodeverzeichnis aktualisiert, anschließend wird dort `pnpm dev` ausgeführt.

## Verwendung

```bash
nb portal dev <portal> [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `<portal>` | string | Name oder Slug des Portals |
| `--env`, `-e` | string | Name der CLI-env. Wird er weggelassen, wird die aktuelle env verwendet |
| `--yes`, `-y` | boolean | Überspringt die interaktive Bestätigung, wenn ein explizit angegebenes `--env` von der aktuellen env abweicht |

## Beispiele

Entwicklungsmodus für ein Portal in der aktuellen env starten:

```bash
nb portal dev customer
```

Entwicklungsmodus für ein Portal in einer bestimmten env starten:

```bash
nb portal dev customer --env dev --yes
```

## Hinweise

`dev` startet den Entwicklungsserver aus dem lokalen Quellcodeverzeichnis des Portals. Der Befehl legt weder einen Portal-Datensatz an noch zieht er Quellcode von der Gegenstelle; existiert das lokale Quellcodeverzeichnis nicht, verwenden Sie zuvor [`nb portal create`](./create.md) oder [`nb portal pull`](./pull.md).

Das lokale Quellcodeverzeichnis muss `package.json` enthalten. envs vom Typ `ssh` unterstützen das Starten des Portal-Entwicklungsmodus derzeit noch nicht.

## Verwandte Befehle

- [`nb portal create`](./create.md)
- [`nb portal pull`](./pull.md)
- [`nb portal deploy`](./deploy.md)
