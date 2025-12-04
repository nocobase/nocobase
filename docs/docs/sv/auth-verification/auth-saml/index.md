---
pkg: '@nocobase/plugin-auth-saml'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Autentisering: SAML 2.0

## Introduktion

Pluginet Autentisering: SAML 2.0 följer protokollstandarden SAML 2.0 (Security Assertion Markup Language 2.0). Detta gör det möjligt för användare att logga in på NocoBase med konton från tredjepartsleverantörer av identitetsautentisering (IdP).

## Aktivera pluginet

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

## Lägg till SAML-autentisering

Gå till sidan för hantering av användarautentiseringsplugin.

![](https://static-docs.nocobase.com/202411130004459.png)

Lägg till - SAML

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

## Konfiguration

![](https://static-docs.nocobase.com/976b66e589973c322d81dcddd22c6146.png)

- SSO URL – Tillhandahålls av IdP, används för enkel inloggning (Single Sign-On).
- Publikt certifikat (Public Certificate) – Tillhandahålls av IdP.
- Entitets-ID (IdP Issuer) – Valfritt, tillhandahålls av IdP.
- http – Markera denna ruta om din NocoBase-applikation använder http-protokollet.
- Använd detta fält för att koppla användaren – Fältet som används för att matcha och koppla till befintliga användare. Du kan välja e-post eller användarnamn, standard är e-post. Användarinformationen som skickas från IdP måste innehålla fälten `email` eller `username`.
- Registrera automatiskt om användaren inte finns – Välj om en ny användare ska skapas automatiskt när ingen matchande befintlig användare hittas.
- Användning – `SP Issuer / EntityID` och `ACS URL` kopieras och fylls i IdP:s motsvarande konfiguration.

## Fältmappning

Fältmappning måste konfigureras på IdP:s konfigurationsplattform. Se [exemplet](./examples/google.md) för mer information.

Fälten som kan mappas i NocoBase är:

- email (obligatoriskt)
- phone (gäller endast för plattformar där scope stöder `phone`, som Alibaba Cloud, Feishu)
- nickname
- username
- firstName
- lastName

`nameID` skickas med SAML-protokollet och behöver inte mappas; det sparas som en unik användaridentifierare.
Prioritetsordningen för nya användares smeknamn är: `nickname` > `firstName lastName` > `username` > `nameID`.
Mappning av användarorganisation och roller stöds för närvarande inte.

## Logga in

Besök inloggningssidan och klicka på knappen under inloggningsformuläret för att initiera tredjepartsinloggning.

![](https://static-docs.nocobase.com/74963865c9d36a294948e6adeb5b24bc.png)