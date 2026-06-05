---
pkg: '@nocobase/plugin-auth-sms'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# SMS-Authentifizierung

## Einführung

Das SMS-Authentifizierungs-Plugin ermöglicht es Benutzern, sich per SMS zu registrieren und bei NocoBase anzumelden.

> Dieses Plugin muss in Verbindung mit der SMS-Verifizierungscode-Funktion verwendet werden, die vom [`@nocobase/plugin-verification` Plugin](/auth-verification/verification/) bereitgestellt wird.

## SMS-Authentifizierung hinzufügen

Gehen Sie zur Verwaltungsseite für Benutzerauthentifizierungs-Plugins.

![](https://static-docs.nocobase.com/202502282112517.png)

Hinzufügen - SMS

![](https://static-docs.nocobase.com/202502282113553.png)

## Konfiguration der neuen Version

:::info{title=Hinweis}
Die neue Konfiguration wurde mit `1.6.0-alpha.30` eingeführt und wird voraussichtlich ab `1.7.0` stabil unterstützt.
:::

![](https://static-docs.nocobase.com/202502282114821.png)

**Verifikator:** Binden Sie einen SMS-Verifikator, um SMS-Verifizierungscodes zu versenden. Falls kein Verifikator verfügbar ist, müssen Sie zuerst zur Verifizierungsverwaltungsseite gehen und einen SMS-Verifikator erstellen.
Siehe auch:

- [Verifizierung](../verification/index.md)
- [Verifizierung: SMS](../verification/sms/index.md)

**Automatische Registrierung, wenn der Benutzer nicht existiert:** Wenn diese Option aktiviert ist, wird ein neuer Benutzer mit der Telefonnummer als Spitznamen registriert, falls die verwendete Telefonnummer nicht existiert.

## Konfiguration der alten Version

![](https://static-docs.nocobase.com/a4d35ec63ba22ae2ea9e3e8e1cbb783d.png)

Die SMS-Login-Authentifizierungsfunktion verwendet den konfigurierten und als Standard festgelegten SMS-Verifizierungscode-Provider, um SMS-Nachrichten zu versenden.

**Automatische Registrierung, wenn der Benutzer nicht existiert:** Wenn diese Option aktiviert ist, wird ein neuer Benutzer mit der Telefonnummer als Spitznamen registriert, falls die verwendete Telefonnummer nicht existiert.

## Anmeldung

Besuchen Sie die Anmeldeseite, um diese Funktion zu nutzen.

![](https://static-docs.nocobase.com/8d630739201bc27d8b0de076ab4f75e2.png)