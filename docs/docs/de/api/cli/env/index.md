---
title: 'nb env'
description: 'Referenz für den Befehl nb env: Verwalten Sie NocoBase-CLI-envs, einschließlich Hinzufügen, Anzeigen des current env, Statusprüfung, Wechseln, Aktualisieren, Authentifizieren und Entfernen.'
keywords: 'nb env,NocoBase CLI,Umgebungsverwaltung,env,current env,Authentifizierung,OpenAPI'
---

# nb env

Verwalten Sie gespeicherte NocoBase-CLI-envs. Ein env speichert Verbindungs- und lokale Laufzeitinformationen wie API-Adresse, Authentifizierungsdaten, lokalen App-Pfad und Datenbankkonfiguration.

Ab dieser Version trennt die CLI zwei Konzepte:

- `current env`: das env, das aktuell von der aktuellen Shell oder Agent Runtime verwendet wird, nach Möglichkeit über `NB_SESSION_ID` isoliert
- `last env`: das zuletzt global verwendete env, das als Rückfallwert dient, wenn der Sitzungsmodus nicht aktiviert ist

## Verwendung

```bash
nb env <command>
```

## Unterbefehle

| Befehl                           | Beschreibung                                                                                                            |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [`nb env add`](./add.md)         | Speichert einen NocoBase-API-Endpunkt und wechselt zu diesem env                                                        |
| [`nb env current`](./current.md) | Das aktuell wirksame env anzeigen                                                                                       |
| [`nb env update`](./update.md)   | Aktualisiert eine gespeicherte env-Konfiguration und übernimmt bei Bedarf automatisch die nachfolgende Synchronisierung |
| [`nb env list`](./list.md)       | Konfigurierte envs auflisten                                                                                            |
| [`nb env status`](./status.md)   | Den Status des aktuellen env, eines angegebenen env oder aller envs anzeigen                                            |
| [`nb env info`](./info.md)       | Detaillierte Informationen zu einem einzelnen env anzeigen                                                              |
| [`nb env remove`](./remove.md)   | Entfernt die env-Konfiguration nach dem Stoppen der verwalteten Laufzeit                                                |
| [`nb env auth`](./auth.md)       | Führt eine OAuth-Anmeldung für ein gespeichertes env aus                                                                |
| [`nb env use`](./use.md)         | Wechselt das aktuelle env                                                                                               |

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

## session mode

Es wird empfohlen, den session mode standardmäßig zu aktivieren. So kann das `current env` in verschiedenen Terminals, verschiedenen Shells oder verschiedenen Agent Runtimes voneinander isoliert werden, ohne sich parallel gegenseitig zu beeinflussen.

Wenn der session mode nicht aktiviert ist, aktualisiert `nb env use` das globale `last env`, und andere Sitzungen ohne Sitzungsisolierung werden ebenfalls beeinflusst.

Wie Sie ihn aktivieren, finden Sie unter [`nb session setup`](../session/setup.md).

## Verwandte Befehle

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
- [`nb session`](../session/index.md)
