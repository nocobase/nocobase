---
pkg: "@nocobase/plugin-verification"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::



pkg: '@nocobase/plugin-verification'
---

# Verificatie

:::info{title=Opmerking}
Vanaf `1.6.0-alpha.30` is de oorspronkelijke functie voor 'verificatiecodes' geüpgraded naar 'Verificatiebeheer'. Deze functie ondersteunt het beheren en integreren van verschillende methoden voor gebruikersverificatie. Zodra gebruikers de bijbehorende verificatiemethode hebben gekoppeld, kunnen zij indien nodig hun identiteit verifiëren. Deze functie zal naar verwachting stabiel worden ondersteund vanaf versie `1.7.0`.
:::

## Introductie

**Het Verificatiebeheercentrum ondersteunt het beheren en integreren van diverse methoden voor gebruikersverificatie.** Bijvoorbeeld:

- SMS-verificatiecode – Standaard geleverd door de verificatie-plugin. Zie: [Verificatie: SMS](./sms)
- TOTP Authenticator – Zie: [Verificatie: TOTP Authenticator](../verification-totp/)

Ontwikkelaars kunnen ook andere verificatietypen uitbreiden in de vorm van plugins. Zie: [Verificatietypen uitbreiden](./dev/type)

**Gebruikers kunnen hun identiteit verifiëren wanneer dat nodig is, nadat zij de bijbehorende verificatiemethode hebben gekoppeld.** Bijvoorbeeld:

- SMS-verificatielogin – Zie: [Authenticatie: SMS](../auth-sms/index.md)
- Twee-factor authenticatie (2FA) – Zie: [Twee-factor authenticatie (2FA)](../2fa/)
- Secundaire verificatie voor risicovolle handelingen – Toekomstige ondersteuning

Ontwikkelaars kunnen identiteitsverificatie ook integreren in andere noodzakelijke scenario's door middel van uitbreidingsplugins. Zie: [Verificatiescenario's uitbreiden](./dev/scene)

**Verschillen en verbanden tussen de Verificatiemodule en de Gebruikersauthenticatiemodule:** De Gebruikersauthenticatiemodule is primair verantwoordelijk voor identiteitsauthenticatie tijdens het inloggen van gebruikers. Processen zoals SMS-login en twee-factor authenticatie zijn hierbij afhankelijk van de verifiers die door de Verificatiemodule worden geleverd. De Verificatiemodule daarentegen beheert identiteitsverificatie voor diverse risicovolle handelingen, waarbij het inloggen van gebruikers één van die scenario's is.

![](https://static-docs.nocobase.com/202502262315404.png)

![](https://static-docs.nocobase.com/202502262315966.png)