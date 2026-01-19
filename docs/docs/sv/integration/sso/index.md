:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Enkel inloggning (SSO) – Integration

NocoBase erbjuder kompletta lösningar för enkel inloggning (Single Sign-On, SSO) som stöder flera vanliga autentiseringsprotokoll för sömlös integration med befintliga identitetssystem i företag.

## Översikt

Enkel inloggning gör att användare kan logga in på flera relaterade men oberoende system med en enda uppsättning inloggningsuppgifter. Användaren behöver bara autentisera sig en gång för att få tillgång till alla auktoriserade applikationer, utan att behöva ange användarnamn och lösenord upprepade gånger. Detta förbättrar inte bara användarupplevelsen utan ökar också systemsäkerheten och den administrativa effektiviteten.

## Protokoll för autentisering som stöds

NocoBase stöder följande autentiseringsprotokoll och metoder via **plugin**:

### SSO-protokoll för företag

- **[SAML 2.0](/auth-verification/auth-saml/)**: En XML-baserad öppen standard som används flitigt för identitetsautentisering i företag. Lämplig för integration med företagsidentitetsleverantörer (IdP).

- **[OIDC (OpenID Connect)](/auth-verification/auth-oidc/)**: Ett modernt autentiseringslager byggt på OAuth 2.0 som tillhandahåller autentiserings- och auktoriseringsmekanismer. Stöder integration med stora identitetsleverantörer (som Google, Azure AD, etc.).

- **[CAS (Central Authentication Service)](/auth-verification/auth-cas/)**: Ett SSO-protokoll utvecklat av Yale University, som används flitigt inom högre utbildning.

- **[LDAP](/auth-verification/auth-ldap/)**: Lightweight Directory Access Protocol för åtkomst och underhåll av distribuerade katalogtjänster. Lämplig för integration med Active Directory eller andra LDAP-servrar.

### Autentisering via tredjepartsplattformar

- **[WeCom (WeChat Work)](/auth-verification/auth-wecom/)**: Stöder inloggning med QR-kod för WeCom och sömlös autentisering i appen.

- **[DingTalk](/auth-verification/auth-dingtalk/)**: Stöder inloggning med QR-kod för DingTalk och sömlös autentisering i appen.

### Andra autentiseringsmetoder

- **[SMS-verifiering](/auth-verification/auth-sms/)**: Autentisering med verifieringskod via SMS.

- **[Användarnamn/Lösenord](/auth-verification/auth/)**: NocoBase inbyggda grundläggande autentiseringsmetod.

## Integrationssteg

### 1. Installera autentiserings-**plugin**

Beroende på era behov, hitta och installera lämplig autentiserings-**plugin** från **plugin**-hanteraren. De flesta SSO-autentiserings-**plugin**s kräver ett separat köp eller abonnemang.

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

Till exempel, installera SAML 2.0-autentiserings-**plugin**:

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

Eller installera OIDC-autentiserings-**plugin**:

![](https://static-docs.nocobase.com/202411122358790.png)

### 2. Konfigurera autentiseringsmetod

1. Gå till sidan **Systeminställningar > Användarautentisering**

![](https://static-docs.nocobase.com/202411130004459.png)

2. Klicka på **Lägg till autentiseringsmetod**
3. Välj den installerade autentiseringstypen (t.ex. SAML)

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

Eller välj OIDC:

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

4. Konfigurera de nödvändiga parametrarna enligt anvisningarna

### 3. Konfigurera identitetsleverantör

Varje autentiseringsprotokoll kräver specifik konfiguration av identitetsleverantören:

- **SAML**: Konfigurera IdP-metadata, certifikat, etc.

![](https://static-docs.nocobase.com/976b66e589973c322d81dcddd22c6146.png)

- **OIDC**: Konfigurera klient-ID, klienthemlighet, discovery-slutpunkt, etc.

![](https://static-docs.nocobase.com/202411130006341.png)

- **CAS**: Konfigurera CAS-serveradress
- **LDAP**: Konfigurera LDAP-serveradress, Bind DN, etc.
- **WeCom/DingTalk**: Konfigurera applikationsuppgifter, Corp ID, etc.

### 4. Testa autentiseringen

Efter konfigurationen rekommenderar vi att ni utför ett test:

1. Logga ut från den aktuella sessionen
2. Välj den konfigurerade SSO-metoden på inloggningssidan

![](https://static-docs.nocobase.com/74963865c9d36a294948e6adeb5b24bc.png)

3. Slutför autentiseringsflödet hos identitetsleverantören
4. Verifiera att inloggningen till NocoBase lyckades

## Användarmappning och rolltilldelning

Efter lyckad SSO-autentisering hanterar NocoBase automatiskt användarkonton:

- **Första inloggningen**: Skapar automatiskt ett nytt användarkonto och synkroniserar grundläggande information (smeknamn, e-post, etc.) från identitetsleverantören.
- **Efterföljande inloggningar**: Använder det befintliga kontot; kan valfritt synkronisera uppdaterad användarinformation.
- **Rolltilldelning**: Konfigurera standardroller eller tilldela roller automatiskt baserat på användarattribut från identitetsleverantören.

## Säkerhetsrekommendationer

1. **Använd HTTPS**: Se till att NocoBase är distribuerat i en HTTPS-miljö för att skydda överföringen av autentiseringsdata.
2. **Regelbundna certifikatuppdateringar**: Uppdatera och rotera säkerhetsuppgifter som SAML-certifikat i tid.
3. **Konfigurera vitlista för callback-URL**: Konfigurera NocoBase callback-URL:er korrekt hos identitetsleverantören.
4. **Principen om minsta behörighet**: Tilldela lämpliga roller och behörigheter till SSO-användare.
5. **Aktivera granskningsloggning**: Logga och övervaka SSO-inloggningsaktiviteter.

## Felsökning

### Misslyckad SSO-inloggning?

1. Kontrollera att identitetsleverantörens konfiguration är korrekt.
2. Se till att callback-URL:erna är korrekt konfigurerade.
3. Kontrollera NocoBase-loggarna för detaljerade felmeddelanden.
4. Bekräfta att certifikat och nycklar är giltiga.

### Användarinformation synkroniseras inte?

1. Kontrollera användarattributen som returneras av identitetsleverantören.
2. Verifiera att fältmappningskonfigurationen är korrekt.
3. Bekräfta att alternativet för synkronisering av användarinformation är aktiverat.

### Hur stöder man flera autentiseringsmetoder samtidigt?

NocoBase stöder konfiguration av flera autentiseringsmetoder samtidigt. Användare kan välja sin föredragna metod på inloggningssidan.

## Relaterade resurser

- [Dokumentation om autentisering](/auth-verification/auth/)
- [Autentisering med API-nycklar](/integration/api-keys/)
- [Användar- och behörighetshantering](/plugins/@nocobase/plugin-users/)