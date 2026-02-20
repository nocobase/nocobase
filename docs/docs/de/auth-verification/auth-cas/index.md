---
pkg: '@nocobase/plugin-auth-cas'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Authentifizierung: CAS

## Einführung

Das Authentifizierung: CAS Plugin folgt dem CAS (Central Authentication Service) Protokollstandard und ermöglicht es Benutzern, sich mit Konten von Drittanbieter-Identitätsanbietern (IdP) bei NocoBase anzumelden.

## Installation

## Benutzerhandbuch

### Plugin aktivieren

![](https://static-docs.nocobase.com/469c48d9f2e8d41a088092c34ddb41f5.png)

### CAS-Authentifizierung hinzufügen

Besuchen Sie die Seite zur Benutzerauthentifizierungsverwaltung:

http://localhost:13000/admin/settings/auth/authenticators

Fügen Sie eine CAS-Authentifizierungsmethode hinzu:

![](https://static-docs.nocobase.com/a268500c5008d3b90e57ff1e2ea41aca.png)

Konfigurieren und aktivieren Sie CAS:

![](https://static-docs.nocobase.com/2518b3fcc80d8a41391f3b629a510a02.png)

### Anmeldeseite aufrufen

http://localhost:13000/signin

![](https://static-docs.nocobase.com/49116aafbb2ed7218306f929ac8af967.png)