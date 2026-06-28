---
title: "nb self update"
description: "nb self update Befehlsreferenz: Aktualisiert die global per npm, pnpm oder yarn installierte NocoBase CLI."
keywords: "nb self update,NocoBase CLI,Aktualisierung,Selbstaktualisierung"
---

# nb self update

Aktualisiert die installierte NocoBase CLI, sofern die aktuelle CLI durch eine standardmäßige globale npm-, pnpm- oder yarn-Installation verwaltet wird.

## Verwendung

```bash
nb self update [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--channel` | string | Release-Channel, auf den aktualisiert werden soll, Standard `auto`; mögliche Werte: `auto`, `latest`, `test`, `beta`, `alpha` |
| `--yes`, `-y` | boolean | Bestätigung der Aktualisierung überspringen |
| `--json` | boolean | Ausgabe als JSON |
| `--skills` | boolean | Die global installierten NocoBase AI coding skills ebenfalls aktualisieren |
| `--verbose` | boolean | Ausführliche Ausgabe der Aktualisierung anzeigen |

## Aktualisierungsverhalten

`nb self update` erkennt zuerst die aktuelle Installationsmethode zur Laufzeit. Der historische Cache `self-install-methods.json` wird nicht verwendet.

Wenn ein Update verfügbar ist, verwendet der Befehl denselben Package Manager, der die aktuelle globale CLI-Installation verwaltet:

| Installationsmethode | Update-Befehl |
| --- | --- |
| `npm-global` | `npm install -g @nocobase/cli@<channel>` |
| `pnpm-global` | `pnpm add -g @nocobase/cli@<channel>` |
| `yarn-global` | `yarn global add @nocobase/cli@<channel>` |

Die interaktive Bestätigung ist standardmäßig yes. Verwende `--yes`, um die Abfrage in Scripts zu überspringen.

## Beispiele

```bash
nb self update
nb self update --yes
nb self update --skills
nb self update --channel alpha --json
```

## Verwandte Befehle

- [`nb self check`](./check.md)
- [`nb skills update`](../skills/update.md)
