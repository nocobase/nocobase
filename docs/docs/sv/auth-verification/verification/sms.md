---
pkg: '@nocobase/plugin-verification'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Verifiering: SMS

## Introduktion

SMS-verifieringskoden är en inbyggd verifieringstyp som används för att generera ett engångslösenord (OTP) och skicka det till användaren via SMS.

## Lägga till en SMS-verifierare

Navigera till sidan för verifieringshantering.

![](https://static-docs.nocobase.com/202502271726791.png)

Lägg till - SMS OTP

![](https://static-docs.nocobase.com/202502271726056.png)

## Administratörskonfiguration

![](https://static-docs.nocobase.com/202502271727711.png)

För närvarande stöds följande SMS-leverantörer:

- <a href="https://www.aliyun.com/product/sms" target="_blank">Aliyun SMS</a>
- <a href="https://cloud.tencent.com/product/sms" target="_blank">Tencent Cloud SMS</a>

När ni konfigurerar SMS-mallen i leverantörens administratörspanel behöver ni reservera en parameter för verifieringskoden.

- Exempel på Aliyun-konfiguration: `Din verifieringskod är: ${code}`

- Exempel på Tencent Cloud-konfiguration: `Din verifieringskod är: {1}`

Utvecklare kan också utöka stödet för andra SMS-leverantörer i form av en **plugin**. Se: [Utöka SMS-leverantörer](./dev/sms-type)

## Användarbindning

Efter att verifieraren har lagts till kan användare binda ett telefonnummer för verifiering i sin personliga verifieringshantering.

![](https://static-docs.nocobase.com/202502271737016.png)

![](https://static-docs.nocobase.com/202502271737769.png)

![](https://static-docs.nocobase.com/202502271738515.png)

När bindningen är lyckad kan identitetsverifiering utföras i alla verifieringsscenarier som använder denna verifierare.

![](https://static-docs.nocobase.com/202502271739607.png)

## Användaravbindning

För att avbinda ett telefonnummer krävs verifiering via en redan bunden metod.

![](https://static-docs.nocobase.com/202502282103205.png)