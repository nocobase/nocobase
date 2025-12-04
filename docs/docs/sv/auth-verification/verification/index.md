---
pkg: "@nocobase/plugin-verification"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::



pkg: '@nocobase/plugin-verification'
---

# Verifiering

:::info{title=Obs}
Från och med `1.6.0-alpha.30` har den ursprungliga funktionen "verifieringskod" uppgraderats till "Verifieringshantering". Denna funktion stöder hantering och integrering av olika metoder för användarverifiering. När användare har kopplat den relevanta verifieringsmetoden kan de utföra identitetsverifiering vid behov. Funktionen planeras att få stabilt stöd från och med version `1.7.0`.
:::

## Introduktion

**Verifieringshanteringscentret stöder hantering och integrering av olika metoder för användarverifiering.** Till exempel:

- SMS-verifieringskod – Tillhandahålls som standard av verifierings-**pluginen**. Se: [Verifiering: SMS](./sms)
- TOTP-autentiserare – Se: [Verifiering: TOTP-autentiserare](../verification-totp/)

Utvecklare kan också utöka andra typer av verifiering genom **pluginar**. Se: [Utöka verifieringstyper](./dev/type)

**Användare kan utföra identitetsverifiering vid behov efter att ha kopplat den relevanta verifieringsmetoden.** Till exempel:

- SMS-verifieringsinloggning – Se: [Autentisering: SMS](./sms)
- Tvåfaktorsautentisering (2FA) – Se: [Tvåfaktorsautentisering (2FA)](../2fa/)
- Sekundär verifiering för riskfyllda operationer – Stöds i framtiden

Utvecklare kan också integrera identitetsverifiering i andra nödvändiga scenarier genom att utöka **pluginar**. Se: [Utöka verifieringsscenarier](./dev/scene)

**Skillnader och samband mellan verifieringsmodulen och användarautentiseringsmodulen:** Användarautentiseringsmodulen ansvarar främst för identitetsautentisering vid användarinloggning, där processer som SMS-inloggning och tvåfaktorsautentisering förlitar sig på verifierare som tillhandahålls av verifieringsmodulen. Verifieringsmodulen hanterar å andra sidan identitetsverifiering för olika riskfyllda operationer, och användarinloggning är ett av dessa scenarier.

![](https://static-docs.nocobase.com/202502262315404.png)

![](https://static-docs.nocobase.com/202502262315966.png)