---
pkg: "@nocobase/plugin-auth-ldap"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::



pkg: '@nocobase/plugin-auth-ldap'
---

# Autentisering: LDAP



## Introduktion

Pluginet Autentisering: LDAP följer standarden för LDAP-protokollet (Lightweight Directory Access Protocol), vilket gör det möjligt för användare att logga in på NocoBase med sina inloggningsuppgifter från LDAP-servern.

## Aktivera pluginet

<img src="https://static-docs.nocobase.com/202405101600789.png"/>

## Lägg till LDAP-autentisering

Gå till hanteringssidan för användarautentiserings-pluginet.

<img src="https://static-docs.nocobase.com/202405101601510.png"/>

Lägg till - LDAP

<img src="https://static-docs.nocobase.com/202405101602104.png"/>

## Konfiguration

### Grundläggande konfiguration

<img src="https://static-docs.nocobase.com/202405101605728.png"/>

- Registrera automatiskt när användaren inte finns – Om en ny användare ska skapas automatiskt när ingen matchande befintlig användare hittas.
- LDAP-URL – LDAP-serverns adress
- Bind DN – DN som används för att testa serveranslutningen och söka efter användare
- Bind-lösenord – Lösenordet för Bind DN
- Testa anslutning – Klicka på knappen för att testa serveranslutningen och validera Bind DN.

### Sökkonfiguration

<img src="https://static-docs.nocobase.com/202405101609984.png"/>

- Sök-DN – DN som används för att söka efter användare
- Sökfilter – Filtreringsvillkor för att söka efter användare, där `{{account}}` representerar det användarkonto som används vid inloggning.
- Omfattning – `Base`, `One level`, `Subtree`, standard `Subtree`
- Storleksgräns – Sökningens sidstorlek

### Attributmappning

<img src="https://static-docs.nocobase.com/202405101612814.png"/>

- Använd detta fält för att koppla användaren – Fält som används för att koppla till befintliga användare. Välj 'användarnamn' om inloggningskontot är ett användarnamn, eller 'e-post' om det är en e-postadress. Standard är användarnamn.
- Attributmappning – Mappning av användarattribut till fält i NocoBase användartabell.

## Logga in

Besök inloggningssidan och ange LDAP-användarnamn och -lösenord i inloggningsformuläret.

<img src="https://static-docs.nocobase.com/202405101614300.png"/>