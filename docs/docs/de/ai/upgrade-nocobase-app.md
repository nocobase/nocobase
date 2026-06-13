---
title: NocoBase App aktualisieren
description: Aktualisiere eine als CLI env gespeicherte NocoBase App mit nb app upgrade, einschließlich env-Prüfung, Upgrade-Befehlen, Zielversionen und Verifikation.
---

# NocoBase App aktualisieren

## Schritt 1: Aktuelle env prüfen

Prüfe zuerst die aktuell aktive CLI env:

```bash
nb env current
```

Wenn du nicht sicher bist, welche envs vorhanden sind, zeige zuerst die Liste an:

```bash
nb env list
```

Wenn die aktuelle env nicht die App ist, die du aktualisieren möchtest, wechsle zuerst zur Ziel-env:

```bash
nb env use <env-name>
```

## Schritt 2: Upgrade ausführen

:::warning Hinweis

Standardmäßig lädt das Upgrade den App-Quellcode oder das Docker-Image erneut herunter.

Bei npm- / Git-envs wird das Verzeichnis `source/` gelöscht und erneut heruntergeladen. Lege dort keine Dateien ab, die erhalten bleiben müssen.

Wenn du den Quellcode oder das Docker-Image bereits manuell vorbereitet hast und nicht möchtest, dass die CLI erneut herunterlädt, füge dem Befehl `--skip-download` hinzu.

:::

Der Standardbefehl lautet:

```bash
nb app upgrade
```

Dieser Befehl führt normalerweise diese Schritte aus:

1. Aktuelle App stoppen
2. Gespeicherte Quellen oder Images herunterladen und ersetzen
3. Kommerzielle Plugins synchronisieren
4. App aktualisieren und starten
5. env-Laufzeitinformationen aktualisieren

In Skripten, CI oder AI-Agent-Sitzungen solltest du `--force` ausdrücklich angeben:

```bash
nb app upgrade --force
```

Wenn die zu aktualisierende App nicht die aktuelle env ist, gib die env an:

```bash
nb app upgrade --env app1 --yes --force
```

### Auf eine bestimmte Version aktualisieren

Mit `--version` kannst du auf einen bestimmten Versionskanal aktualisieren:

```bash
nb app upgrade --version beta
```

Du kannst auch eine exakte Versionsnummer angeben:

```bash
nb app upgrade --version 2.1.0-beta.24
```

Nach erfolgreichem Upgrade schreibt die CLI die Zielversion zurück in die env-Konfiguration. Spätere Upgrades oder Wiederherstellungen können diese Version weiterverwenden.

### Download überspringen

Wenn du den Quellcode oder das Docker-Image bereits aktualisiert hast und nur Upgrade und Start auf Basis des aktuellen Inhalts ausführen möchtest, füge `--skip-download` hinzu:

```bash
nb app upgrade --skip-download
```

Dieser Parameter überspringt den Quellcode- oder Image-Download und auch die Synchronisierung kommerzieller Plugins. Verwende ihn normalerweise nur, wenn die Zielversion bereits manuell vorbereitet wurde.

## Schritt 3: Ergebnis prüfen

Prüfe nach dem Upgrade zuerst env-Laufzeitinformationen und App-Logs:

```bash
nb env info
nb app logs
```

Öffne danach die App und bestätige, dass sich das Administratorkonto anmelden kann. Wenn ein AI Agent weiter mit dieser App arbeiten soll, starte eine neue AI-Agent-Sitzung oder starte die aktuelle Sitzung neu, damit die neuesten env-Informationen gelesen werden.

## Verwandte Links

- [Apps verwalten](../nocobase-cli/operations/manage-app.md) — Apps starten, stoppen, neu starten, Logs anzeigen und aktualisieren
- [`nb app upgrade` Befehlsreferenz](../api/cli/app/upgrade.md) — Alle Optionen des Upgrade-Befehls ansehen
- [Mehrere Umgebungen verwalten](../nocobase-cli/operations/multi-environment.md) — Mehrere CLI envs prüfen, wechseln und pflegen
