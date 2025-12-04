:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Utöka autentiseringstyper

## Översikt

NocoBase stöder utökning av användarautentiseringstyper efter behov. Användarautentisering delas generellt in i två typer: den ena är att fastställa användaridentiteten direkt i NocoBase-applikationen, till exempel via lösenordsinloggning eller SMS-inloggning; den andra är att låta tredjepartstjänster fastställa användaridentiteten och sedan meddela NocoBase-applikationen resultatet via återanrop (callbacks), som till exempel med OIDC- och SAML-autentisering. Autentiseringsprocessen för dessa två typer i NocoBase ser i princip ut så här:

### Utan beroende av tredjepartsåteranrop

1. Klienten använder NocoBase SDK för att anropa inloggningsgränssnittet `api.auth.signIn()`, som i sin tur begär inloggningsgränssnittet `auth:signIn`. Samtidigt skickas den aktuella autentiseringsidentifieraren till backend via HTTP-huvudet `X-Authenticator`.
2. Gränssnittet `auth:signIn` vidarebefordrar begäran till den autentiseringstyp som motsvarar autentiseringsidentifieraren i HTTP-huvudet. Metoden `validate` i den registrerade autentiseringsklassen för den typen hanterar sedan den relevanta logiken.
3. Klienten tar emot användarinformation och en autentiseringstoken från svaret från `auth:signIn`-gränssnittet, sparar token i Local Storage och slutför inloggningen. Detta steg hanteras automatiskt internt av SDK:n.

<img src="https://static-docs.nocobase.com/202404211852848.png"/>

### Med beroende av tredjepartsåteranrop

1. Klienten hämtar tredjeparts-inloggnings-URL:en via ett eget registrerat gränssnitt (till exempel `auth:getAuthUrl`) och skickar med information som applikationsnamn och autentiseringsidentifierare enligt protokollet.
2. Efter att ha omdirigerats till tredjeparts-URL:en för att slutföra inloggningen, anropar tredjepartstjänsten NocoBase-applikationens återanropsgränssnitt (som ni själva behöver registrera, till exempel `auth:redirect`). Tjänsten returnerar autentiseringsresultatet tillsammans med information som applikationsnamn och autentiseringsidentifierare.
3. I återanropsgränssnittsmetoden parsas parametrarna för att få autentiseringsidentifieraren. Via `AuthManager` hämtas den motsvarande autentiseringsklassen, och metoden `auth.signIn()` anropas aktivt. Metoden `auth.signIn()` kommer i sin tur att anropa `validate()` för att hantera autentiseringslogiken.
4. När återanropsmetoden har fått autentiseringstoken, omdirigeras den med en 302-statuskod tillbaka till frontend-sidan, och skickar med `token` och autentiseringsidentifieraren som URL-parametrar, till exempel `?authenticator=xxx&token=yyy`.

<img src="https://static-docs.nocobase.com/202404211852377.png"/>

Nedan beskriver vi hur ni registrerar gränssnitt på serversidan och användargränssnitt på klientsidan.

## Serversidan

### Autentiseringsgränssnitt

NocoBase-kärnan tillhandahåller registrering och hantering för att utöka autentiseringstyper. Kärnlogiken för att utöka ett inloggnings-plugin kräver att ni ärver från kärnans abstrakta klass `Auth` och implementerar de motsvarande standardgränssnitten.  
För fullständig API-referens, se [Auth](/api/auth/auth).

```typescript
import { Auth } from '@nocobase/auth';

class CustomAuth extends Auth {
  set user(user) {}
  get user() {}

  async check() {}
  async signIn() {}
}
```

Kärnan registrerar även grundläggande resursoperationer relaterade till användarautentisering.

| API            | Beskrivning                      |
| -------------- | -------------------------------- |
| `auth:check`   | Kontrollerar om användaren är inloggad |
| `auth:signIn`  | Logga in                         |
| `auth:signUp`  | Registrera dig                   |
| `auth:signOut` | Logga ut                         |

I de flesta fall kan den utökade användarautentiseringstypen även använda den befintliga JWT-autentiseringslogiken för att generera behörigheter för användare att komma åt API:et. Kärnans `BaseAuth`-klass har en grundläggande implementering av den abstrakta klassen `Auth`, se [BaseAuth](../../../api/auth/base-auth.md). Plugin kan direkt ärva från `BaseAuth`-klassen för att återanvända delar av logikkoden och därmed minska utvecklingskostnaderna.

```javascript
import { BaseAuth } from '@nocobase/auth';

class CustomAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Ställ in användarsamling
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Implementera användarautentiseringslogik
  async validate() {}
}
```

### Användardata

Vid implementering av användarautentiseringslogik involveras vanligtvis hantering av användardata. I en NocoBase-applikation definieras de relaterade samlingarna som standard enligt följande:

| Samling               | Syfte                                                                                              | Plugin                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `users`               | Lagrar användarinformation, såsom e-post, smeknamn och lösenord                                    | [Användar-plugin (`@nocobase/plugin-users`)](/users-permissions/user) |
| `authenticators`      | Lagrar information om autentiserare (autentiseringstypens entitet), motsvarande autentiseringstyp och konfiguration | Användarautentiserings-plugin (`@nocobase/plugin-auth`)              |
| `usersAuthenticators` | Kopplar samman användare och autentiserare, sparar användarinformation under den motsvarande autentiseraren | Användarautentiserings-plugin (`@nocobase/plugin-auth`)              |

Normalt sett räcker det att använda `users` och `usersAuthenticators` för att lagra relevant användardata för utökade inloggningsmetoder. Endast i speciella fall behöver ni lägga till en ny samling.

Huvudfälten för `usersAuthenticators` är:

| Fält            | Beskrivning                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------- |
| `uuid`          | Unik identifierare för användaren med denna autentiseringsmetod, till exempel telefonnummer eller WeChat openid |
| `meta`          | JSON-fält, annan information som behöver sparas                                                   |
| `userId`        | Användar-ID                                                                                     |
| `authenticator` | Autentiserarens namn (unik identifierare)                                                      |

För användarfrågor och skapandeoperationer har datamodellen `AuthModel` för `authenticators` även inkapslat flera metoder som kan användas i `CustomAuth`-klassen via `this.authenticator[metodnamn]`. För fullständig API-referens, se [AuthModel](./api#authmodel).

```ts
import { AuthModel } from '@nocobase/plugin-auth';

class CustomAuth extends BaseAuth {
  async validate() {
    // ...
    const authenticator = this.authenticator as AuthModel;
    this.authenticator.findUser(); // Fråga efter användare
    this.authenticator.newUser(); // Skapa ny användare
    this.authenticator.findOrCreateUser(); // Fråga efter eller skapa ny användare
    // ...
  }
}
```

### Registrering av autentiseringstyp

Den utökade autentiseringsmetoden behöver registreras hos autentiseringshanteringsmodulen.

```javascript
class CustomAuthPlugin extends Plugin {
  async load() {
    this.app.authManager.registerTypes('custom-auth-type', {
      auth: CustomAuth,
    });
  }
}
```

## Klientsidan

Klientens användargränssnitt registreras via gränssnittet `registerType` som tillhandahålls av användarautentiserings-pluginets klient:

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm, // Inloggningsformulär
        SignInButton, // Inloggningsknapp (tredjepart), kan vara ett alternativ till inloggningsformuläret
        SignUpForm, // Registreringsformulär
        AdminSettingsForm, // Administratörsinställningsformulär
      },
    });
  }
}
```

### Inloggningsformulär

![](https://static-docs.nocobase.com/33afe18f229c3db45c7a1921c2c050b7.png)

Om flera autentiserare som motsvarar autentiseringstypen har registrerat inloggningsformulär, kommer dessa att visas som flikar. Flikens titel är autentiserarens titel som konfigurerats i backend.

![](https://static-docs.nocobase.com/ada6d7add744be0c812359c23bf4c7fc.png)

### Inloggningsknapp

![](https://static-docs.nocobase.com/e706f7785782adc77b0f4ee4faadfab8.png)

Vanligtvis är detta en tredjeparts-inloggningsknapp, men det kan i praktiken vara vilken komponent som helst.

### Registreringsformulär

![](https://static-docs.nocobase.com/f95c53431bf21ec312fcfd51923f0b42.png)

Om ni behöver hoppa från inloggningssidan till registreringssidan, måste ni hantera detta själva i inloggningskomponenten.

### Administratörsinställningsformulär

![](https://static-docs.nocobase.com/f4b544b5b0f5afee5621ad4abf66b24f.png)

Överst finns den generella autentiseringskonfigurationen, och nedanför finns den del av det anpassade konfigurationsformuläret som kan registreras.

### Anropa API:er

För att initiera API-anrop relaterade till användarautentisering på klientsidan kan ni använda NocoBase SDK.

```ts
import { useAPIClient } from '@nocobase/client';

// Används i en komponent
const api = useAPIClient();
api.auth.signIn(data, authenticator);
```

För detaljerade API-referenser, se [@nocobase/sdk - Auth](/api/sdk/auth).