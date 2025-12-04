:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Gebruikersauthenticatie

De gebruikersauthenticatie in NocoBase is opgebouwd uit twee belangrijke onderdelen:

- De `@nocobase/auth` module in de kernel definieert uitbreidbare interfaces en middleware voor inloggen, registreren en verifiëren van gebruikers. Deze module wordt ook gebruikt voor het registreren en beheren van diverse uitgebreide authenticatiemethoden.
- De `@nocobase/plugin-auth` plugin initialiseert de authenticatiebeheermodule in de kernel en biedt de basisauthenticatiemethode met gebruikersnaam (of e-mailadres) en wachtwoord.

> U dient dit te gebruiken in combinatie met de gebruikersbeheerfunctie die wordt aangeboden door de [`@nocobase/plugin-users` plugin](/users-permissions/user).

Daarnaast biedt NocoBase diverse andere plugins voor gebruikersauthenticatie:

- [@nocobase/plugin-auth-sms](/auth-verification/auth-sms/) - Biedt de mogelijkheid om in te loggen via sms-verificatie
- [@nocobase/plugin-auth-saml](/auth-verification/auth-saml/) - Biedt SAML SSO-inlogfunctionaliteit
- [@nocobase/plugin-auth-oidc](/auth-verification/auth-oidc/) - Biedt OIDC SSO-inlogfunctionaliteit
- [@nocobase/plugin-auth-cas](/auth-verification/auth-cas/) - Biedt CAS SSO-inlogfunctionaliteit
- [@nocobase/plugin-auth-ldap](/auth-verification/auth-ldap/) - Biedt LDAP SSO-inlogfunctionaliteit
- [@nocobase/plugin-auth-wecom](/auth-verification/auth-wecom/) - Biedt WeCom-inlogfunctionaliteit
- [@nocobase/plugin-auth-dingtalk](/auth-verification/auth-dingtalk/) - Biedt DingTalk-inlogfunctionaliteit

Met behulp van de bovenstaande plugins kunnen beheerders de gewenste authenticatiemethoden configureren. Gebruikers kunnen vervolgens direct inloggen op het systeem met hun identiteit die wordt aangeboden door platforms zoals Google Workspace en Microsoft Azure, en kunnen ook koppelen met platformtools zoals Auth0, Logto en Keycloak. Daarnaast kunnen ontwikkelaars eenvoudig andere benodigde authenticatiemethoden uitbreiden via de basisinterfaces die wij aanbieden.