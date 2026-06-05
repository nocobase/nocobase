---
pkg: '@nocobase/plugin-verification'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Verifizierung: SMS

## Einführung

Der SMS-Verifizierungscode ist ein integrierter Verifizierungstyp. Er generiert ein einmaliges dynamisches Passwort (OTP) und sendet es dem Benutzer per SMS zu.

## SMS-Verifikator hinzufügen

Gehen Sie zur Verifizierungsverwaltung.

![](https://static-docs.nocobase.com/202502271726791.png)

Hinzufügen - SMS-OTP

![](https://static-docs.nocobase.com/202502271726056.png)

## Administratorkonfiguration

![](https://static-docs.nocobase.com/202502271727711.png)

Derzeit werden folgende SMS-Dienstanbieter unterstützt:

- <a href="https://www.aliyun.com/product/sms" target="_blank">Aliyun SMS</a>
- <a href="https://cloud.tencent.com/product/sms" target="_blank">Tencent Cloud SMS</a>

Bei der Konfiguration der SMS-Vorlage im Admin-Panel des Dienstanbieters müssen Sie einen Parameter für den Verifizierungscode vorsehen.

- Aliyun-Konfigurationsbeispiel: `Ihr Verifizierungscode lautet: ${code}`

- Tencent Cloud-Konfigurationsbeispiel: `Ihr Verifizierungscode lautet: {1}`

Entwickler können auch die Unterstützung für weitere SMS-Dienstanbieter in Form von Plugins erweitern. Siehe: [SMS-Dienstanbieter erweitern](./dev/sms-type)

## Benutzer verknüpfen

Nachdem der Verifikator hinzugefügt wurde, können Benutzer in ihrer persönlichen Verifizierungsverwaltung eine Telefonnummer verknüpfen.

![](https://static-docs.nocobase.com/202502271737016.png)

![](https://static-docs.nocobase.com/202502271737769.png)

![](https://static-docs.nocobase.com/202502271738515.png)

Nach erfolgreicher Verknüpfung kann die Identitätsverifizierung in jedem Szenario durchgeführt werden, das diesen Verifikator verwendet.

![](https://static-docs.nocobase.com/202502271739607.png)

## Benutzer entknüpfen

Das Entknüpfen einer Telefonnummer erfordert eine Verifizierung über eine bereits verknüpfte Methode.

![](https://static-docs.nocobase.com/202502282103205.png)