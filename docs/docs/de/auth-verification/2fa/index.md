---
pkg: '@nocobase/plugin-two-factor-authentication'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Zwei-Faktor-Authentifizierung (2FA)

## Einführung

Die Zwei-Faktor-Authentifizierung (2FA) ist eine zusätzliche Sicherheitsmaßnahme, die beim Anmelden an einer Anwendung zum Einsatz kommt. Wenn 2FA aktiviert ist, müssen Benutzer beim Login mit einem Passwort eine weitere Authentifizierungsmethode angeben, zum Beispiel einen OTP-Code oder TOTP.

:::info{title=Hinweis}
Aktuell gilt der 2FA-Prozess nur für passwortbasierte Logins. Wenn Ihre Anwendung SSO oder andere Authentifizierungsmethoden aktiviert hat, nutzen Sie bitte die vom jeweiligen IdP bereitgestellten Multi-Faktor-Authentifizierungs-(MFA)-Schutzmaßnahmen.
:::

## Plugin aktivieren

![](https://static-docs.nocobase.com/202502282108145.png)

## Administratorkonfiguration

Nach der Aktivierung des Plugins wird der Seite für die Authentifikator-Verwaltung eine 2FA-Konfigurationsseite hinzugefügt.

Administratoren müssen die Option „Zwei-Faktor-Authentifizierung (2FA) für alle Benutzer erzwingen“ aktivieren und einen verfügbaren Authentifikator-Typ zur Bindung auswählen. Falls keine Authentifikatoren verfügbar sind, erstellen Sie bitte zuerst einen neuen Authentifikator auf der Seite für die Verifizierungsverwaltung. Siehe: [Verifizierung](../verification/index.md)

![](https://static-docs.nocobase.com/202502282109802.png)

## Benutzer-Login

Sobald 2FA aktiviert ist, gelangen Benutzer beim Login mit einem Passwort in den 2FA-Verifizierungsprozess.

Wenn ein Benutzer noch keinen der angegebenen Authentifikatoren gebunden hat, wird er aufgefordert, einen zu binden. Nach erfolgreicher Bindung kann er auf die Anwendung zugreifen.

![](https://static-docs.nocobase.com/202502282110829.png)

Wenn ein Benutzer bereits einen der angegebenen Authentifikatoren gebunden hat, muss er seine Identität über den gebundenen Authentifikator verifizieren. Nach erfolgreicher Verifizierung kann er auf die Anwendung zugreifen.

![](https://static-docs.nocobase.com/202502282110148.png)

Nach erfolgreichem Login können Benutzer im persönlichen Bereich auf der Seite für die Verifizierungsverwaltung weitere Authentifikatoren binden.

![](https://static-docs.nocobase.com/202502282110024.png)