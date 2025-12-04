:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Single Sign-On (SSO) Integratie

NocoBase biedt complete Single Sign-On (SSO) oplossingen die diverse gangbare authenticatieprotocollen ondersteunen, voor een naadloze integratie met de bestaande identiteitssystemen van uw organisatie.

## Overzicht

Single Sign-On (SSO) stelt gebruikers in staat om met één set inloggegevens toegang te krijgen tot meerdere gerelateerde, maar onafhankelijke systemen. Gebruikers hoeven slechts één keer in te loggen om toegang te krijgen tot alle geautoriseerde applicaties, zonder telkens opnieuw hun gebruikersnaam en wachtwoord in te voeren. Dit verbetert niet alleen de gebruikerservaring, maar verhoogt ook de systeembeveiliging en de efficiëntie van het beheer.

## Ondersteunde authenticatieprotocollen

NocoBase ondersteunt de volgende authenticatieprotocollen en -methoden via **plugins**:

### Enterprise SSO-protocollen

- **[SAML 2.0](/auth-verification/auth-saml/)**: Een XML-gebaseerde open standaard die veel wordt gebruikt voor identiteitsauthenticatie op bedrijfsniveau. Geschikt voor integratie met Identity Providers (IdP's) van uw organisatie.

- **[OIDC (OpenID Connect)](/auth-verification/auth-oidc/)**: Een moderne authenticatielaag gebouwd op OAuth 2.0, die geavanceerde authenticatie- en autorisatiemechanismen biedt. Ondersteunt integratie met belangrijke identiteitsproviders (zoals Google, Azure AD, enz.).

- **[CAS (Central Authentication Service)](/auth-verification/auth-cas/)**: Een SSO-protocol ontwikkeld door Yale University, veel gebruikt in hogescholen en onderwijsinstellingen.

- **[LDAP](/auth-verification/auth-ldap/)**: Lightweight Directory Access Protocol voor toegang tot en onderhoud van gedistribueerde directory-informatiediensten. Geschikt voor integratie met Active Directory of andere LDAP-servers.

### Authenticatie via externe platforms

- **[WeCom (WeChat Work)](/auth-verification/auth-wecom/)**: Ondersteunt WeCom QR-code login en naadloze authenticatie binnen de app.

- **[DingTalk](/auth-verification/auth-dingtalk/)**: Ondersteunt DingTalk QR-code login en naadloze authenticatie binnen de app.

### Overige authenticatiemethoden

- **[SMS-verificatie](/auth-verification/auth-sms/)**: Authenticatie via een verificatiecode per sms.

- **[Gebruikersnaam/Wachtwoord](/auth-verification/auth/)**: De ingebouwde basisauthenticatiemethode van NocoBase.

## Integratiestappen

### 1. **Plugin** voor authenticatie installeren

Afhankelijk van uw behoeften, zoekt en installeert u de juiste authenticatie-**plugin** via de **plugin**-manager. De meeste SSO-authenticatie-**plugins** vereisen een aparte aankoop of abonnement.

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

Bijvoorbeeld, installeer de SAML 2.0 authenticatie-**plugin**:

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

Of installeer de OIDC authenticatie-**plugin**:

![](https://static-docs.nocobase.com/202411122358790.png)

### 2. Authenticatiemethode configureren

1. Ga naar de pagina **Systeeminstellingen > Gebruikersauthenticatie**

![](https://static-docs.nocobase.com/202411130004459.png)

2. Klik op **Authenticatiemethode toevoegen**
3. Selecteer het geïnstalleerde authenticatietype (bijv. SAML)

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

Of selecteer OIDC:

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

4. Configureer de vereiste parameters volgens de instructies.

### 3. Identity Provider configureren

Elk authenticatieprotocol vereist specifieke configuratie van de Identity Provider:

- **SAML**: Configureer IdP-metadata, certificaten, enz.

![](https://static-docs.nocobase.com/976b66e589973c322d81dcddd22c6146.png)

- **OIDC**: Configureer Client ID, Client Secret, discovery-endpoint, enz.

![](https://static-docs.nocobase.com/202411130006341.png)

- **CAS**: Configureer het CAS-serveradres
- **LDAP**: Configureer het LDAP-serveradres, Bind DN, enz.
- **WeCom/DingTalk**: Configureer applicatiereferenties, Corp ID, enz.

### 4. Authenticatie testen

Na de configuratie is het raadzaam om een testlogin uit te voeren:

1. Log uit de huidige sessie
2. Selecteer de geconfigureerde SSO-methode op de inlogpagina

![](https://static-docs.nocobase.com/74963865c9d36a294948e6adeb5b24bc.png)

3. Voltooi de authenticatiestroom van de Identity Provider
4. Controleer of u succesvol kunt inloggen bij NocoBase

## Gebruikersmapping en roltoewijzing

Na succesvolle SSO-authenticatie verwerkt NocoBase automatisch gebruikersaccounts:

- **Eerste login**: Er wordt automatisch een nieuw gebruikersaccount aangemaakt en basisinformatie (gebruikersnaam, e-mailadres, enz.) wordt gesynchroniseerd vanuit de Identity Provider.
- **Volgende logins**: Er wordt ingelogd met het bestaande account; u kunt optioneel bijgewerkte gebruikersinformatie synchroniseren.
- **Roltoewijzing**: U kunt standaardrollen configureren of rollen automatisch toewijzen op basis van gebruikersattributen van de Identity Provider.

## Beveiligingsaanbevelingen

1. **Gebruik HTTPS**: Zorg ervoor dat NocoBase is geïmplementeerd met HTTPS om de overdracht van authenticatiegegevens te beschermen.
2. **Regelmatige certificaatupdates**: Werk beveiligingsreferenties, zoals SAML-certificaten, tijdig bij en roteer deze.
3. **Configureer een whitelist voor callback-URL's**: Configureer de callback-URL's van NocoBase correct in de Identity Provider.
4. **Principe van minimale privileges**: Wijs geschikte rollen en machtigingen toe aan SSO-gebruikers.
5. **Schakel auditlogging in**: Registreer en bewaak SSO-loginactiviteiten.

## Probleemoplossing

### SSO-login mislukt?

1. Controleer of de configuratie van de Identity Provider correct is.
2. Controleer of de callback-URL's correct zijn geconfigureerd.
3. Raadpleeg de NocoBase-logs voor gedetailleerde foutmeldingen.
4. Controleer of certificaten en sleutels geldig zijn.

### Gebruikersinformatie wordt niet gesynchroniseerd?

1. Controleer de gebruikersattributen die door de Identity Provider worden geretourneerd.
2. Controleer of de configuratie van de veldmapping correct is.
3. Controleer of de optie voor het synchroniseren van gebruikersinformatie is ingeschakeld.

### Hoe kan ik meerdere authenticatiemethoden ondersteunen?

NocoBase ondersteunt het gelijktijdig configureren van meerdere authenticatiemethoden. Gebruikers kunnen hun voorkeursmethode selecteren op de inlogpagina.

## Gerelateerde bronnen

- [Authenticatiedocumentatie](/auth-verification/auth/)
- [API-sleutelauthenticatie](/integration/api-keys/)
- [Gebruikers- en rechtenbeheer](/plugins/@nocobase/plugin-users/)