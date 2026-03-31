---
pkg: "@nocobase/plugin-auth-ldap"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::



pkg: '@nocobase/plugin-auth-ldap'
---

# Authentifizierung: LDAP

## Einführung

Das Authentifizierung: LDAP Plugin folgt dem LDAP (Lightweight Directory Access Protocol) Protokollstandard und ermöglicht es Benutzern, sich mit ihren Anmeldedaten vom LDAP-Server bei NocoBase anzumelden.

## Plugin aktivieren

<img src="https://static-docs.nocobase.com/202405101600789.png"/>

## LDAP-Authentifizierung hinzufügen

Navigieren Sie zur Seite für die Einstellungen der Authentifizierungs-Plugins.

<img src="https://static-docs.nocobase.com/202405101601510.png"/>

Hinzufügen - LDAP

<img src="https://static-docs.nocobase.com/202405101602104.png"/>

## Konfiguration

### Basiskonfiguration

<img src="https://static-docs.nocobase.com/202405101605728.png"/>

- Sign up automatically when the user does not exist - Legt fest, ob automatisch ein neuer Benutzer erstellt werden soll, wenn kein passender, bereits vorhandener Benutzer gefunden wird.
- LDAP URL - Die URL des LDAP-Servers
- Bind DN - Der DN, der zum Testen der Serververbindung und zum Suchen von Benutzern verwendet wird.
- Bind password - Das Passwort des Bind DN
- Test connection - Klicken Sie auf die Schaltfläche, um die Serververbindung und die Gültigkeit des Bind DN zu testen.

### Suchkonfiguration

<img src="https://static-docs.nocobase.com/202405101609984.png"/>

- Search DN - Der DN, der zum Suchen von Benutzern verwendet wird.
- Search filter - Die Filterbedingung zum Suchen von Benutzern, wobei `{{account}}` das Benutzerkonto darstellt, das bei der Anmeldung verwendet wird.
- Scope - `Base`, `One level`, `Subtree`, Standard `Subtree`
- Size limit - Die maximale Anzahl der Suchergebnisse pro Seite.

### Attributzuordnung

<img src="https://static-docs.nocobase.com/202405101612814.png"/>

- Use this field to bind the user - Das Feld, das zum Binden an bestehende Benutzer verwendet wird. Wählen Sie 'Benutzername', wenn das Anmeldekonto ein Benutzername ist, oder 'E-Mail', wenn es eine E-Mail-Adresse ist. Standardmäßig ist dies 'Benutzername'.
- Attribute map - Die Zuordnung von Benutzerattributen zu Feldern in der NocoBase-Benutzertabelle.

## Anmeldung

Besuchen Sie die Anmeldeseite und melden Sie sich an, indem Sie Ihren LDAP-Benutzernamen und Ihr Passwort in das Anmeldeformular eingeben.

<img src="https://static-docs.nocobase.com/202405101614300.png"/>