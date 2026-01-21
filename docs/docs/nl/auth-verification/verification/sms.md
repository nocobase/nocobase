---
pkg: '@nocobase/plugin-verification'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Verificatie: SMS

## Introductie

De SMS-verificatiecode is een ingebouwd verificatietype dat wordt gebruikt om een eenmalig dynamisch wachtwoord (OTP) te genereren en dit via SMS naar de gebruiker te versturen.

## Een SMS-verificator toevoegen

Ga naar de verificatiebeheerpagina.

![](https://static-docs.nocobase.com/202502271726791.png)

Toevoegen - SMS OTP

![](https://static-docs.nocobase.com/202502271726056.png)

## Beheerdersconfiguratie

![](https://static-docs.nocobase.com/202502271727711.png)

De momenteel ondersteunde SMS-dienstverleners zijn:

- <a href="https://www.aliyun.com/product/sms" target="_blank">Aliyun SMS</a>
- <a href="https://cloud.tencent.com/product/sms" target="_blank">Tencent Cloud SMS</a>

Wanneer u de SMS-sjabloon configureert in het beheerpaneel van de dienstverlener, moet u een parameter reserveren voor de verificatiecode.

- Configuratievoorbeeld Aliyun: `Uw verificatiecode is: ${code}`

- Configuratievoorbeeld Tencent Cloud: `Uw verificatiecode is: {1}`

Ontwikkelaars kunnen ook ondersteuning voor andere SMS-dienstverleners uitbreiden in de vorm van een plugin. Zie: [SMS-dienstverleners uitbreiden](./dev/sms-type)

## Gebruikersbinding

Nadat de verificator is toegevoegd, kunnen gebruikers een telefoonnummer koppelen in hun persoonlijke verificatiebeheer.

![](https://static-docs.nocobase.com/202502271737016.png)

![](https://static-docs.nocobase.com/202502271737769.png)

![](https://static-docs.nocobase.com/202502271738515.png)

Zodra de koppeling succesvol is, kan identiteitsverificatie worden uitgevoerd in elk scenario dat deze verificator gebruikt.

![](https://static-docs.nocobase.com/202502271739607.png)

## Gebruikers ontkoppelen

Om een telefoonnummer te ontkoppelen, is verificatie via een reeds gekoppelde methode vereist.

![](https://static-docs.nocobase.com/202502282103205.png)