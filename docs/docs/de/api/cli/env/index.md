---
title: "nb env"
description: "Referenz zum Befehl nb env: gespeicherte NocoBase-CLI-Umgebungen verwalten, einschließlich Hinzufügen, Anzeigen des aktuellen Env, Statusprüfung, Wechseln, Aktualisieren, Authentifizieren und Entfernen."
keywords: "nb env,NocoBase CLI,Umgebungsverwaltung,env,current env,Authentifizierung,OpenAPI"
---

# nb env

Verwaltet gespeicherte NocoBase-CLI-Envs. Ein Env speichert Verbindungsdaten und lokale Laufzeitinformationen wie API-Adresse, Authentifizierungsdaten, lokalen Anwendungspfad und Datenbankkonfiguration.

Seit dieser Version trennt die CLI zwei Konzepte:

- `current env`: das Env, das von der aktuellen Shell oder Agent-Runtime verwendet wird und nach Möglichkeit über `NB_SESSION_ID` isoliert ist
- `last env`: das zuletzt global verwendete Env, das als Rückfallwert dient, wenn der Session-Modus nicht aktiviert ist

## Verwendung

```bash
nb env <command>
```

## Unterbefehle

| Befehl | Beschreibung |
| --- | --- |
| [`nb env add`](./add.md) | Einen NocoBase-API-Endpunkt speichern und zu diesem Env wechseln |
| [`nb env current`](./current.md) | Das aktuell wirksame Env anzeigen |
| [`nb env update`](./update.md) | Eine gespeicherte Env-Konfiguration aktualisieren und erforderliche Folgesynchronisationen automatisch ausführen |
| [`nb env list`](./list.md) | Konfigurierte Envs auflisten |
| [`nb env status`](./status.md) | Den Status des aktuellen Env, eines angegebenen Env oder aller Envs anzeigen |
| [`nb env info`](./info.md) | Detaillierte Informationen zu einem einzelnen Env anzeigen |
| [`nb env remove`](./remove.md) | Die Env-Konfiguration entfernen, nachdem die verwaltete Runtime gestoppt wurde |
| [`nb env auth`](./auth.md) | Eine OAuth-Anmeldung für ein gespeichertes Env durchführen |
| [`nb env use`](./use.md) | Das aktuelle Env wechseln |

## Beispiele

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env list
nb env status
nb env info app1
nb env update app1
nb env use app1
nb env auth app1
```

## Session-Modus

Standardmäßig wird empfohlen, den Session-Modus zu aktivieren. So bleiben `current env` in verschiedenen Terminals, Shells oder Agent-Runtimes voneinander getrennt, statt sich parallel gegenseitig zu beeinflussen.

Wenn der Session-Modus nicht aktiviert ist, aktualisiert `nb env use` das globale `last env`, und auch andere Sitzungen ohne Session-Isolation werden davon beeinflusst.

Wie du ihn aktivierst, findest du unter [`nb session setup`](../session/setup.md).

## Verwandte Befehle

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
- [`nb proxy`](../proxy/index.md)
- [`nb session`](../session/index.md)
