---
title: "nb self check"
description: "nb self check Befehlsreferenz: Prüft die Version der installierten NocoBase CLI und die Unterstützung für Selbstaktualisierung."
keywords: "nb self check,NocoBase CLI,Versionsprüfung"
---

# nb self check

Prüft die aktuelle Installation der NocoBase CLI, ermittelt die neueste Version des gewählten Channels und meldet, ob automatische Selbstaktualisierung unterstützt wird.

## Verwendung

```bash
nb self check [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--channel` | string | Release-Channel zum Vergleich, Standard `auto`; mögliche Werte: `auto`, `latest`, `test`, `beta`, `alpha` |
| `--json` | boolean | Ausgabe als JSON |

## Installationsmethode

`nb self check` erkennt die aktuelle Installationsmethode zur Laufzeit. Der historische Cache `self-install-methods.json` wird nicht verwendet.

Der Befehl kann diese Installationsmethoden ausgeben:

| Installationsmethode | Bedeutung |
| --- | --- |
| `npm-global` | Die CLI ist unter dem aktuellen `npm prefix -g` installiert. |
| `pnpm-global` | Die CLI ist in einem globalen `node_modules`-Baum von pnpm installiert. |
| `yarn-global` | Die CLI wird aus `yarn global bin` gestartet oder ist unter `yarn global dir` installiert. |
| `package-local` | Die CLI ist in einem lokalen Projekt-Dependency-Baum installiert. |
| `source` | Die CLI läuft aus einem Repository-Checkout. |
| `unknown` | Die CLI-Installation konnte keiner unterstützten Installationsmethode zugeordnet werden. |

Selbstaktualisierung wird für `npm-global`, `pnpm-global` und `yarn-global` unterstützt. Bei `package-local` oder `source` aktualisierst du stattdessen das übergeordnete Projekt oder den Repository-Checkout.

## Beispiele

```bash
nb self check
nb self check --channel beta
nb self check --json
```

## Verwandte Befehle

- [`nb self update`](./update.md)
