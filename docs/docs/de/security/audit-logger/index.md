---
pkg: '@nocobase/plugin-audit-logger'
title: "Audit-Log"
description: "Audit-Log: zeichnet Benutzeraktivitäten und den Verlauf von Ressourcenoperationen auf, mit Parametern wie Resource, Action, User, Target, IP, UA, Metadata, zur Operation Tracing und Compliance-Auditierung."
keywords: "Audit-Log,Operation Audit,Resource Action,Operation Tracing,Compliance Audit,Aufzeichnung von Benutzeraktivitäten,NocoBase"
---

:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Audit-Log

## Einführung

Das Audit-Log dient zum Aufzeichnen und Nachverfolgen von Benutzeraktivitäten und der Historie von Ressourcenoperationen im System.

![](https://static-docs.nocobase.com/202501031627719.png)

![](https://static-docs.nocobase.com/202501031627922.png)

## Parameterbeschreibung

| Parameter | Beschreibung |
| --- | --- |
| **Resource** | Typ der Zielressource der Operation |
| **Action** | Typ der ausgeführten Operation |
| **User** | Benutzer, der die Operation ausführt |
| **Role** | Rolle des Benutzers zum Zeitpunkt der Operation |
| **Data source** | Datenquelle |
| **Target collection** | Ziel-Datentabelle |
| **Target record UK** | Eindeutiger Bezeichner des Ziel-Datensatzes |
| **Source collection** | Quell-Datentabelle des Beziehungs-Fields |
| **Source record UK** | Eindeutiger Bezeichner des Quell-Datensatzes des Beziehungs-Fields |
| **Status** | HTTP-Statuscode der Antwort auf die Operation |
| **Created at** | Zeitpunkt der Operation |
| **UUID** | Eindeutige Kennung der Operation, identisch mit der Request-ID, kann zum Durchsuchen der Anwendungslogs verwendet werden |
| **IP** | IP-Adresse des Benutzers |
| **UA** | UA-Informationen des Benutzers |
| **Metadata** | Metadaten der Operation: Anfrageparameter, Request-Body, Response-Inhalt usw. |

## Auditierte Ressourcen

Folgende Ressourcenoperationen werden derzeit im Audit-Log aufgezeichnet:

### Hauptanwendung

| Operation | Beschreibung |
| --- | --- |
| `app:resart` | Anwendung neu starten |
| `app:clearCache` | Anwendungscache löschen |

### Plugin Manager

| Operation | Beschreibung |
| --- | --- |
| `pm:add` | Plugin hinzufügen |
| `pm:update` | Plugin aktualisieren |
| `pm:enable` | Plugin aktivieren |
| `pm:disable` | Plugin deaktivieren |
| `pm:remove` | Plugin entfernen |

### Benutzerauthentifizierung

| Operation | Beschreibung |
| --- | --- |
| `auth:signIn` | Anmelden |
| `auth:signUp` | Registrieren |
| `auth:signOut` | Abmelden |
| `auth:changePassword` | Passwort ändern |

### Benutzer

| Operation | Beschreibung |
| --- | --- |
| `users:updateProfile` | Profildaten ändern |

### UI-Konfiguration

| Operation | Beschreibung |
| --- | --- |
| `uiSchemas:insertAdjacent` | UI Schema einfügen |
| `uiSchemas:patch` | UI Schema ändern |
| `uiSchemas:remove` | UI Schema entfernen |

### Operationen auf Datentabellen

| Operation | Beschreibung |
| --- | --- |
| `create` | Datensatz erstellen |
| `update` | Datensatz aktualisieren |
| `destroy` | Datensatz löschen |
| `updateOrCreate` | Datensatz aktualisieren oder erstellen |
| `firstOrCreate` | Datensatz suchen oder erstellen |
| `move` | Datensatz verschieben |
| `set` | Datensatz eines Beziehungs-Fields setzen |
| `add` | Datensatz zu einem Beziehungs-Field hinzufügen |
| `remove` | Datensatz aus einem Beziehungs-Field entfernen |
| `export` | Datensätze exportieren |
| `import` | Datensätze importieren |

## Weitere Audit-Ressourcen hinzufügen

Wenn Sie über ein Plugin weitere Ressourcenoperationen erweitert haben und diese im Audit-Log aufzeichnen möchten, beachten Sie die [API](/api/server/audit-manager.md).
