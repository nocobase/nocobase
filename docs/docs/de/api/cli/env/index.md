---
title: "nb env"
description: "nb env Befehlsreferenz: Verwalten Sie NocoBase CLI env, einschließlich Hinzufügen, Aktualisieren, Anzeigen, Wechseln, Authentifizieren und Entfernen."
keywords: "nb env,NocoBase CLI,Umgebungsverwaltung,env,Authentifizierung,OpenAPI"
---

# nb env

Verwalten Sie gespeicherte NocoBase CLI env. Eine env speichert die API-Adresse, Authentifizierungsinformationen, lokalen Anwendungspfad, Datenbankkonfiguration und den Cache der Laufzeitbefehle.

## Verwendung

```bash
nb env <command>
```

## Unterbefehle

| Befehl | Beschreibung |
| --- | --- |
| [`nb env add`](./add.md) | Speichert einen NocoBase API-Endpoint und wechselt zur aktuellen env |
| [`nb env update`](./update.md) | Aktualisiert das OpenAPI-Schema und den Cache der Laufzeitbefehle aus der Anwendung |
| [`nb env list`](./list.md) | Listet die konfigurierten env und den API-Authentifizierungsstatus auf |
| [`nb env info`](./info.md) | Zeigt Detailinformationen einer einzelnen env an |
| [`nb env remove`](./remove.md) | Entfernt die env-Konfiguration |
| [`nb env auth`](./auth.md) | Führt eine OAuth-Anmeldung für eine gespeicherte env durch |
| [`nb env use`](./use.md) | Wechselt die aktuelle env |

## Beispiele

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env list
nb env info app1
nb env update app1
nb env use app1
nb env auth app1
```

## Verwandte Befehle

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
