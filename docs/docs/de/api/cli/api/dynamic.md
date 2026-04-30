---
title: "nb api Dynamische Befehle"
description: "Referenz für die dynamischen Befehle von nb api: CLI-API-Befehle, die anhand des NocoBase OpenAPI-Schemas generiert werden."
keywords: "nb api Dynamische Befehle,NocoBase CLI,OpenAPI,swagger"
---

# nb api Dynamische Befehle

Neben [`nb api resource`](./resource/index.md) gibt es unter `nb api` eine Reihe von Befehlen, die dynamisch anhand des OpenAPI-Schemas der NocoBase-Anwendung generiert werden. Diese Befehle werden beim ersten Ausführen von [`nb env add`](../env/add.md) oder [`nb env update`](../env/update.md) erzeugt und zwischengespeichert.

## Häufige Gruppen

| Befehlsgruppe | Beschreibung |
| --- | --- |
| `nb api acl` | Berechtigungsverwaltung: Rollen, Ressourcenberechtigungen und Aktionsberechtigungen |
| `nb api api-keys` | API-Key-Verwaltung |
| `nb api app` | Anwendungsverwaltung |
| `nb api authenticators` | Authentifizierungsverwaltung: Passwort, SMS, SSO usw. |
| `nb api data-modeling` | Datenmodellierung: Datenquellen, Tabellen und Felder |
| `nb api file-manager` | Dateiverwaltung: Speicherdienste und Anhänge |
| `nb api flow-surfaces` | Seiten-Orchestrierung: Seiten, Blöcke, Felder und Aktionen |
| `nb api system-settings` | Systemeinstellungen: Titel, Logo, Sprache usw. |
| `nb api theme-editor` | Theme-Verwaltung: Farben, Größen und Theme-Wechsel |
| `nb api workflow` | Workflow: Verwaltung automatisierter Abläufe |

Welche Gruppen und Befehle tatsächlich verfügbar sind, hängt von der Version der verbundenen NocoBase-Anwendung und den aktivierten Plugins ab. Führen Sie folgende Befehle aus, um die in der aktuellen Anwendung unterstützten Befehle anzuzeigen:

```bash
nb api --help
nb api <topic> --help
```

## Request-Body-Parameter

Dynamische Befehle mit Request-Body unterstützen:

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--body` | string | Request-Body als JSON-Zeichenkette |
| `--body-file` | string | Pfad zu einer JSON-Datei |

`--body` und `--body-file` schließen sich gegenseitig aus.

## Verwandte Befehle

- [`nb env update`](../env/update.md)
- [`nb api resource`](./resource/index.md)
