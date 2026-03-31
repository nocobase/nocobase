---
pkg: '@nocobase/plugin-verification-totp-authenticator'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Verifizierung: TOTP-Authentifikator

## Einführung

Der TOTP-Authentifikator ermöglicht es Benutzern, beliebige Authentifikatoren zu verknüpfen, die der TOTP-Spezifikation (Time-based One-Time Password) (<a href="https://www.rfc-editor.org/rfc/rfc6238" target="_blank">RFC-6238</a>) entsprechen, und die Identität mittels eines zeitbasierten Einmalpassworts (TOTP) zu verifizieren.

## Administratorkonfiguration

Navigieren Sie zur Seite für die Verifizierungsverwaltung.

![](https://static-docs.nocobase.com/202502271726791.png)

Hinzufügen - TOTP-Authentifikator

![](https://static-docs.nocobase.com/202502271745028.png)

Abgesehen von einer eindeutigen Kennung und einem Titel benötigt der TOTP-Authentifikator keine weitere Konfiguration.

![](https://static-docs.nocobase.com/202502271746034.png)

## Benutzerverknüpfung

Nachdem der Authentifikator hinzugefügt wurde, können Benutzer den TOTP-Authentifikator in ihrem persönlichen Bereich zur Verifizierungsverwaltung verknüpfen.

![](https://static-docs.nocobase.com/202502272252324.png)

:::warning
Das Plugin bietet derzeit keinen Mechanismus für Wiederherstellungscodes. Sobald der TOTP-Authentifikator verknüpft ist, sollten Benutzer ihn sorgfältig aufbewahren. Sollte der Authentifikator versehentlich verloren gehen, können Sie eine alternative Verifizierungsmethode verwenden, um Ihre Identität zu bestätigen, den Authentifikator zu entknüpfen und ihn anschließend erneut zu verknüpfen.
:::

## Benutzerentknüpfung

Das Entknüpfen des Authentifikators erfordert eine Verifizierung mittels der bereits verknüpften Verifizierungsmethode.

![](https://static-docs.nocobase.com/202502282103205.png)