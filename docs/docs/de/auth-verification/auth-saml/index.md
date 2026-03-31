---
pkg: '@nocobase/plugin-auth-saml'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Authentifizierung: SAML 2.0

## Einführung

Das Authentifizierung: SAML 2.0 Plugin folgt dem SAML 2.0 (Security Assertion Markup Language 2.0) Protokollstandard. Es ermöglicht Benutzern, sich mit Konten, die von Drittanbieter-Identitätsanbietern (IdP) bereitgestellt werden, bei NocoBase anzumelden.

## Plugin aktivieren

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

## SAML-Authentifizierung hinzufügen

Gehen Sie zur Verwaltungsseite der Benutzerauthentifizierungs-Plugins.

![](https://static-docs.nocobase.com/202411130004459.png)

Hinzufügen - SAML

![](https://static-docs.nocobase.com/5076fe5806b7799be308bbaf7c4425d.png)

## Konfiguration

![](https://static-docs.nocobase.com/976b66e589973c322d81dcddd22c6146.png)

- **SSO URL** – Wird vom IdP bereitgestellt und für das Single Sign-On verwendet.
- **Öffentliches Zertifikat (Public Certificate)** – Wird vom IdP bereitgestellt.
- **Entitäts-ID (IdP Issuer)** – Optional, wird vom IdP bereitgestellt.
- **HTTP** – Aktivieren Sie diese Option, wenn Ihre NocoBase-Anwendung das HTTP-Protokoll verwendet.
- **Feld zur Benutzerbindung verwenden** – Dieses Feld wird verwendet, um Benutzer mit bestehenden Konten abzugleichen und zu verknüpfen. Sie können zwischen E-Mail oder Benutzername wählen, wobei E-Mail die Standardeinstellung ist. Die vom IdP übermittelten Benutzerinformationen müssen das Feld `email` oder `username` enthalten.
- **Automatische Registrierung, wenn der Benutzer nicht existiert** – Legt fest, ob automatisch ein neuer Benutzer erstellt werden soll, wenn kein passender bestehender Benutzer gefunden wird.
- **Verwendung** – Die Werte für `SP Issuer / EntityID` und `ACS URL` müssen kopiert und in die entsprechende Konfiguration des IdP eingefügt werden.

## Feldzuordnung

Die Feldzuordnung muss auf der Konfigurationsplattform des IdP vorgenommen werden. Ein [Beispiel](./examples/google.md) finden Sie hier.

Die in NocoBase für die Zuordnung verfügbaren Felder sind:

- **email** (erforderlich)
- **phone** (nur wirksam für IdPs, die `phone` in ihrem Geltungsbereich unterstützen, z.B. Alibaba Cloud, Feishu)
- **nickname**
- **username**
- **firstName**
- **lastName**

Das Feld `nameID` wird vom SAML-Protokoll übermittelt und muss nicht zugeordnet werden; es wird als eindeutige Benutzerkennung gespeichert.
Die Priorität der Regeln für den Spitznamen neuer Benutzer ist: `nickname` > `firstName lastName` > `username` > `nameID`
Die Zuordnung von Benutzerorganisationen und -rollen wird derzeit nicht unterstützt.

## Anmeldung

Besuchen Sie die Anmeldeseite und klicken Sie auf die Schaltfläche unter dem Anmeldeformular, um die Drittanbieter-Anmeldung zu starten.

![](https://static-docs.nocobase.com/74963865c9d36a294948e6adeb5b24bc.png)