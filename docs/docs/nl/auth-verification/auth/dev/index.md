:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Authenticatietypen uitbreiden

## Overzicht

NocoBase ondersteunt het uitbreiden van gebruikersauthenticatietypen naar behoefte. Gebruikersauthenticatie kent over het algemeen twee typen: het ene type bepaalt de gebruikersidentiteit binnen de NocoBase-applicatie zelf (bijv. wachtwoordlogin, sms-login), terwijl het andere type de gebruikersidentiteit laat bepalen door externe services, die vervolgens het resultaat via callbacks aan de NocoBase-applicatie melden (bijv. OIDC, SAML en andere authenticatiemethoden). Het authenticatieproces voor deze twee verschillende typen authenticatiemethoden in NocoBase is in principe als volgt:

### Geen externe callbacks vereist

1. De client gebruikt de NocoBase SDK om de login-interface `api.auth.signIn()` aan te roepen, waarbij de login-interface `auth:signIn` wordt aangevraagd. Tegelijkertijd wordt de identificatie van de huidige authenticator via de request header `X-Authenticator` naar de backend gestuurd.
2. De `auth:signIn` interface stuurt de aanvraag door naar het corresponderende authenticatietype op basis van de authenticator-identificatie in de request header. De `validate`-methode in de geregistreerde authenticatieklasse van dat type voert vervolgens de bijbehorende logische verwerking uit.
3. De client ontvangt gebruikersinformatie en een authenticatietoken van de `auth:signIn` interface-respons, slaat het token op in Local Storage en voltooit de login. Deze stap wordt automatisch intern door de SDK afgehandeld.

<img src="https://static-docs.nocobase.com/202404211852848.png"/>

### Afhankelijk van externe callbacks

1. De client verkrijgt de URL voor inloggen via een externe partij via een eigen geregistreerde interface (zoals `auth:getAuthUrl`) en stuurt, conform het protocol, informatie mee zoals de applicatienaam en de authenticator-identificatie.
2. U wordt doorgestuurd naar de URL van de externe partij om de login te voltooien. De externe service roept de callback-interface van de NocoBase-applicatie aan (deze moet u zelf registreren, zoals `auth:redirect`), retourneert het authenticatieresultaat en stuurt tevens informatie mee zoals de applicatienaam en de authenticator-identificatie.
3. De callback-interfacemethode parseert de parameters om de authenticator-identificatie te verkrijgen, haalt de corresponderende authenticatieklasse op via `AuthManager` en roept actief de `auth.signIn()`-methode aan. De `auth.signIn()`-methode roept vervolgens de `validate()`-methode aan om de authenticatielogica af te handelen.
4. Nadat de callback-methode het authenticatietoken heeft verkregen, wordt er een 302-redirect uitgevoerd naar de frontend-pagina, waarbij het `token` en de authenticator-identificatie als URL-parameters worden meegestuurd, bijvoorbeeld `?authenticator=xxx&token=yyy`.

<img src="https://static-docs.nocobase.com/202404211852377.png"/>

Hieronder beschrijven we hoe u server-side interfaces en client-side gebruikersinterfaces registreert.

## Server

### Authenticatie-interface

De NocoBase-kernel biedt registratie en beheer voor het uitbreiden van authenticatietypen. De kernlogica voor het uitbreiden van een login-plugin vereist het overerven van de abstracte klasse `Auth` van de kernel en het implementeren van de corresponderende standaardinterfaces.
Voor de volledige API, zie [Auth](/api/auth/auth).

```typescript
import { Auth } from '@nocobase/auth';

class CustomAuth extends Auth {
  set user(user) {}
  get user() {}

  async check() {}
  async signIn() {}
}
```

De kernel registreert ook basis resource-operaties met betrekking tot gebruikersauthenticatie.

| API            | Beschrijving                     |
| -------------- | -------------------------------- |
| `auth:check`   | Controleren of gebruiker is ingelogd |
| `auth:signIn`  | Inloggen                         |
| `auth:signUp`  | Registreren                      |
| `auth:signOut` | Uitloggen                        |

In de meeste gevallen kan het uitgebreide gebruikersauthenticatietype ook de bestaande JWT-authenticologoca gebruiken om de referenties te genereren voor gebruikerstoegang tot de API. De `BaseAuth`-klasse in de kernel heeft een basisimplementatie van de abstracte klasse `Auth` uitgevoerd; zie [BaseAuth](../../../api/auth/base-auth.md). Plugins kunnen direct de `BaseAuth`-klasse overerven om een deel van de logische code te hergebruiken en zo de ontwikkelkosten te verlagen.

```javascript
import { BaseAuth } from '@nocobase/auth';

class CustomAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Stel de gebruikerscollectie in
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Implementeer de gebruikersauthenticologoca
  async validate() {}
}
```

### Gebruikersgegevens

Bij het implementeren van gebruikersauthenticologoca is meestal de verwerking van gebruikersgegevens betrokken. In een NocoBase-applicatie zijn de gerelateerde collecties standaard gedefinieerd als:

| Collectie             | Beschrijving                                                                                                          | Plugin                                                            |
| --------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `users`               | Slaat gebruikersinformatie op, zoals e-mail, bijnaam en wachtwoord                                                        | [Gebruikers-plugin (`@nocobase/plugin-users`)](/users-permissions/user) |
| `authenticators`      | Slaat authenticator (authenticatietype-entiteit) informatie op, corresponderend met authenticatietype en configuratie | Gebruikersauthenticatie-plugin (`@nocobase/plugin-auth`)              |
| `usersAuthenticators` | Koppelt gebruikers en authenticators, slaat gebruikersinformatie op onder de corresponderende authenticator             | Gebruikersauthenticatie-plugin (`@nocobase/plugin-auth`)              |

Gewoonlijk volstaat het om voor uitgebreide loginmethoden de `users` en `usersAuthenticators` te gebruiken om de bijbehorende gebruikersgegevens op te slaan. Alleen in speciale gevallen hoeft u zelf een nieuwe collectie toe te voegen.

De belangrijkste velden van `usersAuthenticators` zijn:

| Veld            | Beschrijving                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------- |
| `uuid`          | Unieke identificatie voor dit authenticatietype, zoals een telefoonnummer of een externe service gebruikers-ID |
| `meta`          | JSON-veld, andere op te slaan informatie                                                    |
| `userId`        | Gebruikers-ID                                                                                |
| `authenticator` | Authenticatornaam (unieke identificatie)                                                     |

Voor gebruikersquery- en aanmaakoperaties heeft het gegevensmodel `AuthModel` van `authenticators` ook verschillende methoden ingekapseld, die in de `CustomAuth`-klasse kunnen worden gebruikt via `this.authenticator[methodName]`. Voor de volledige API, zie [AuthModel](./api#authmodel).

```ts
import { AuthModel } from '@nocobase/plugin-auth';

class CustomAuth extends BaseAuth {
  async validate() {
    // ...
    const authenticator = this.authenticator as AuthModel;
    this.authenticator.findUser(); // Gebruiker opvragen
    this.authenticator.newUser(); // Nieuwe gebruiker aanmaken
    this.authenticator.findOrCreateUser(); // Gebruiker opvragen of aanmaken
    // ...
  }
}
```

### Authenticatietype registratie

De uitgebreide authenticatiemethode moet worden geregistreerd bij de authenticatiebeheermodule.

```javascript
class CustomAuthPlugin extends Plugin {
  async load() {
    this.app.authManager.registerTypes('custom-auth-type', {
      auth: CustomAuth,
    });
  }
}
```

## Client

De client-gebruikersinterface wordt geregistreerd via de `registerType`-interface die wordt aangeboden door de client van de gebruikersauthenticatie-plugin:

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm, // Inlogformulier
        SignInButton, // Inlogknop (externe partij), kan als alternatief voor het inlogformulier worden gebruikt
        SignUpForm, // Registratieformulier
        AdminSettingsForm, // Beheerinstellingenformulier
      },
    });
  }
}
```

### Inlogformulier

![](https://static-docs.nocobase.com/33afe18f229c3db45c7a1921c2c050b7.png)

Als meerdere authenticators die corresponderen met het authenticatietype een inlogformulier hebben geregistreerd, worden deze als tabs weergegeven. De tabtitel is de titel van de authenticator zoals geconfigureerd in de backend.

![](https://static-docs.nocobase.com/ada6d7add744be0c812359c23bf4c7fc.png)

### Inlogknop

![](https://static-docs.nocobase.com/e706f7785782adc77b0f4ee4faadfab8.png)

Meestal zijn dit inlogknoppen van externe partijen, maar het kan in feite elk component zijn.

### Registratieformulier

![](https://static-docs.nocobase.com/f95c53431bf21ec312fcfd51923f0b42.png)

Als u van de inlogpagina naar de registratiepagina moet navigeren, moet u dit zelf afhandelen in het inlogcomponent.

### Beheerinstellingenformulier

![](https://static-docs.nocobase.com/f4b544b5b0f4f5afee5621ad4abf66b24f.png)

Bovenaan vindt u de algemene authenticatorconfiguratie, en onderaan het deel van het aangepaste configuratieformulier dat kan worden geregistreerd.

### API's aanroepen

Om client-side verzoeken voor gebruikersauthenticatie-gerelateerde interfaces te initiëren, kunt u de door NocoBase geleverde SDK gebruiken.

```ts
import { useAPIClient } from '@nocobase/client';

// gebruiken in component
const api = useAPIClient();
api.auth.signIn(data, authenticator);
```

Voor gedetailleerde API-referenties, zie [@nocobase/sdk - Auth](/api/sdk/auth).