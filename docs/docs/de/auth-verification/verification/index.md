---
pkg: "@nocobase/plugin-verification"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::



# Verifizierung

:::info{title=Hinweis}
Ab `1.6.0-alpha.30` wurde die ursprüngliche Funktion **Verifizierungscode** zu **Verifizierungsmanagement** erweitert. Dieses unterstützt die Verwaltung und Integration verschiedener Methoden zur Benutzerverifizierung. Sobald Benutzer die entsprechende Verifizierungsmethode hinterlegt haben, können sie bei Bedarf eine Identitätsverifizierung durchführen. Diese Funktion wird voraussichtlich ab Version `1.7.0` stabil unterstützt.
:::

## Einführung

**Das Verifizierungsmanagement-Zentrum unterstützt die Verwaltung und Integration verschiedener Methoden zur Benutzerverifizierung.** Zum Beispiel:

- SMS-Verifizierungscode – Wird standardmäßig vom Verifizierungs-Plugin bereitgestellt. Siehe: [Verifizierung: SMS](./sms)
- TOTP-Authentifikator – Siehe: [Verifizierung: TOTP-Authentifikator](../verification-totp/)

Entwickler können auch andere Verifizierungstypen als Plugin erweitern. Siehe: [Verifizierungstypen erweitern](./dev/type)

**Benutzer können bei Bedarf eine Identitätsverifizierung durchführen, nachdem sie die entsprechende Verifizierungsmethode hinterlegt haben.** Zum Beispiel:

- Login per SMS-Verifizierung – Siehe: [Authentifizierung: SMS](../auth-sms/index.md)
- Zwei-Faktor-Authentifizierung (2FA) – Siehe: [Zwei-Faktor-Authentifizierung (2FA)](../2fa/)
- Zweite Verifizierung für risikoreiche Vorgänge – Zukünftig unterstützt

Entwickler können die Identitätsverifizierung auch durch Erweiterungs-Plugins in andere notwendige Szenarien integrieren. Siehe: [Verifizierungsszenarien erweitern](./dev/scene)

**Unterschiede und Zusammenhänge zwischen dem Verifizierungsmodul und dem Benutzerauthentifizierungsmodul:** Das Benutzerauthentifizierungsmodul ist hauptsächlich für die Identitätsauthentifizierung bei Benutzeranmeldungen zuständig, wobei Prozesse wie SMS-Login und Zwei-Faktor-Authentifizierung auf die vom Verifizierungsmodul bereitgestellten Verifizierer angewiesen sind. Das Verifizierungsmodul handhabt die Identitätsverifizierung für verschiedene risikoreiche Vorgänge, wobei die Benutzeranmeldung eines dieser Szenarien ist.

![](https://static-docs.nocobase.com/202502262315404.png)

![](https://static-docs.nocobase.com/202502262315966.png)