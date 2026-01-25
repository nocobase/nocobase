:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Estensione dei tipi di autenticazione

## Panoramica

NocoBase supporta l'estensione dei tipi di autenticazione utente in base alle proprie esigenze. L'autenticazione utente si divide generalmente in due tipi: il primo prevede la verifica dell'identità dell'utente all'interno dell'applicazione NocoBase stessa, come l'accesso tramite password o SMS; il secondo si basa su servizi di terze parti che verificano l'identità dell'utente e notificano il risultato all'applicazione NocoBase tramite callback, come i metodi di autenticazione OIDC o SAML. Il processo di autenticazione per questi due diversi tipi di metodi in NocoBase è fondamentalmente il seguente:

### Autenticazione senza callback di terze parti

1. Il client utilizza l'SDK di NocoBase per richiamare l'interfaccia di accesso `api.auth.signIn()`, richiedendo l'interfaccia `auth:signIn` e inviando l'identificatore dell'autenticatore attualmente in uso al backend tramite l'header della richiesta `X-Authenticator`.
2. L'interfaccia `auth:signIn`, basandosi sull'identificatore dell'autenticatore presente nell'header della richiesta, inoltra la richiesta al tipo di autenticazione corrispondente. Il metodo `validate` della classe di autenticazione registrata per quel tipo gestisce quindi la logica appropriata.
3. Il client riceve le informazioni utente e il `token` di autenticazione dalla risposta dell'interfaccia `auth:signIn`, salva il `token` nel Local Storage e completa l'accesso. Questo passaggio viene gestito automaticamente dall'SDK.

<img src="https://static-docs.nocobase.com/202404211852848.png"/>

### Autenticazione con callback di terze parti

1. Il client ottiene l'URL di accesso di terze parti tramite un'interfaccia registrata autonomamente (ad esempio `auth:getAuthUrl`), e trasmette informazioni come il nome dell'applicazione e l'identificatore dell'autenticatore secondo il protocollo.
2. Si reindirizza all'URL di terze parti per completare l'accesso. Il servizio di terze parti richiama l'interfaccia di callback dell'applicazione NocoBase (che deve essere registrata autonomamente, ad esempio `auth:redirect`), restituendo il risultato dell'autenticazione e informazioni come il nome dell'applicazione e l'identificatore dell'autenticatore.
3. Il metodo dell'interfaccia di callback analizza i parametri per ottenere l'identificatore dell'autenticatore, recupera la classe di autenticazione corrispondente tramite `AuthManager` e richiama attivamente il metodo `auth.signIn()`. Il metodo `auth.signIn()` a sua volta richiama il metodo `validate()` per gestire la logica di autorizzazione.
4. Il metodo di callback ottiene il `token` di autenticazione, quindi effettua un reindirizzamento 302 alla pagina frontend, includendo il `token` e l'identificatore dell'autenticatore nei parametri dell'URL, ad esempio `?authenticator=xxx&token=yyy`.

<img src="https://static-docs.nocobase.com/202404211852377.png"/>

Di seguito, illustreremo come registrare le interfacce lato server e le interfacce utente lato client.

## Lato Server

### Interfaccia di autenticazione

Il kernel di NocoBase offre la registrazione e la gestione per l'estensione dei tipi di autenticazione. La gestione della logica centrale per l'estensione dei plugin di accesso richiede l'ereditarietà dalla classe astratta `Auth` del kernel e l'implementazione delle interfacce standard corrispondenti.  
Per la documentazione API completa, consulti [Auth](/api/auth/auth).

```typescript
import { Auth } from '@nocobase/auth';

class CustomAuth extends Auth {
  set user(user) {}
  get user() {}

  async check() {}
  async signIn() {}
}
```

Il kernel registra anche le operazioni sulle risorse di base relative all'autenticazione utente.

| API            | Descrizione                        |
| -------------- | ---------------------------------- |
| `auth:check`   | Verifica se l'utente è autenticato |
| `auth:signIn`  | Accedi                             |
| `auth:signUp`  | Registrati                         |
| `auth:signOut` | Disconnetti                        |

Nella maggior parte dei casi, il tipo di autenticazione utente esteso può anche riutilizzare la logica di autenticazione JWT esistente per generare le credenziali di accesso API per l'utente. La classe `BaseAuth` del kernel fornisce un'implementazione di base della classe astratta `Auth`; consulti [BaseAuth](../../../api/auth/base-auth.md). I plugin possono ereditare direttamente dalla classe `BaseAuth` per riutilizzare parte del codice logico e ridurre i costi di sviluppo.

```javascript
import { BaseAuth } from '@nocobase/auth';

class CustomAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Imposta la collezione utente
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Implementa la logica di autenticazione utente
  async validate() {}
}
```

### Dati Utente

Nell'implementazione della logica di autenticazione utente, è solitamente coinvolta la gestione dei dati utente. In un'applicazione NocoBase, le collezioni correlate sono definite di default come segue:

| Collezioni            | Descrizione                                                                                                          | Plugin                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `users`               | Memorizza le informazioni utente, come email, nickname e password                                                        | [Plugin Utente (`@nocobase/plugin-users`)](/users-permissions/user) |
| `authenticators`      | Memorizza le informazioni dell'autenticatore (entità del tipo di autenticazione), corrispondenti al tipo e alla configurazione | Plugin di autenticazione utente (`@nocobase/plugin-auth`)              |
| `usersAuthenticators` | Associa utenti e autenticatori, salva le informazioni utente sotto l'autenticatore corrispondente                    | Plugin di autenticazione utente (`@nocobase/plugin-auth`)              |

Generalmente, i metodi di accesso estesi utilizzano `users` e `usersAuthenticators` per memorizzare i dati utente corrispondenti. Solo in casi speciali è necessario aggiungere una nuova collezione autonomamente.

I campi principali di `usersAuthenticators` sono:

| Campo           | Descrizione                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------- |
| `uuid`          | Identificatore univoco per questo tipo di autenticazione, come un numero di telefono o un ID utente di un servizio di terze parti |
| `meta`          | Campo JSON, altre informazioni da salvare                                                   |
| `userId`        | ID Utente                                                                                     |
| `authenticator` | Nome dell'autenticatore (identificatore univoco)                                                      |

Per le operazioni di query e creazione utente, il modello di dati `AuthModel` di `authenticators` incapsula anche diversi metodi che possono essere utilizzati nella classe `CustomAuth` tramite `this.authenticator[nomeMetodo]`. Per la documentazione API completa, consulti [AuthModel](./api#authmodel).

```ts
import { AuthModel } from '@nocobase/plugin-auth';

class CustomAuth extends BaseAuth {
  async validate() {
    // ...
    const authenticator = this.authenticator as AuthModel;
    this.authenticator.findUser(); // Cerca utente
    this.authenticator.newUser(); // Crea nuovo utente
    this.authenticator.findOrCreateUser(); // Cerca o crea nuovo utente
    // ...
  }
}
```

### Registrazione del tipo di autenticazione

Il metodo di autenticazione esteso deve essere registrato nel modulo di gestione dell'autenticazione.

```javascript
class CustomAuthPlugin extends Plugin {
  async load() {
    this.app.authManager.registerTypes('custom-auth-type', {
      auth: CustomAuth,
    });
  }
}
```

## Lato Client

L'interfaccia utente lato client viene registrata tramite l'interfaccia `registerType` fornita dal client del plugin di autenticazione utente:

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm, // Modulo di accesso
        SignInButton, // Pulsante di accesso (terze parti), alternativa al modulo di accesso
        SignUpForm, // Modulo di registrazione
        AdminSettingsForm, // Modulo di impostazioni amministrative
      },
    });
  }
}
```

### Modulo di accesso

![](https://static-docs.nocobase.com/33afe18f229c3db45c7a1921c2c050b7.png)

Se più autenticatori corrispondenti a tipi di autenticazione hanno registrato moduli di accesso, questi verranno visualizzati sotto forma di schede (Tab). Il titolo della scheda sarà il titolo dell'autenticatore configurato nel backend.

![](https://static-docs.nocobase.com/ada6d7add744be0c812359c23bf4c7fc.png)

### Pulsante di accesso

![](https://static-docs.nocobase.com/e706f7785782adc77b0f4ee4faadfab8.png)

Solitamente si tratta di un pulsante di accesso di terze parti, ma può essere qualsiasi componente.

### Modulo di registrazione

![](https://static-docs.nocobase.com/f5c53431bf21ec312fcfd51923f0b42.png)

Se è necessario passare dalla pagina di accesso a quella di registrazione, dovrà gestire questo passaggio autonomamente nel componente di accesso.

### Modulo di impostazioni amministrative

![](https://static-docs.nocobase.com/f4b544b5b0f5afee5621ad4abf66b24f.png)

La parte superiore mostra la configurazione generica dell'autenticatore, mentre la parte inferiore è dedicata alla sezione del modulo di configurazione personalizzata registrabile.

### Richiesta di API

Per avviare richieste di interfacce relative all'autenticazione utente lato client, può utilizzare l'SDK fornito da NocoBase.

```ts
import { useAPIClient } from '@nocobase/client';

// utilizzare nel componente
const api = useAPIClient();
api.auth.signIn(data, authenticator);
```

Per riferimenti API dettagliati, consulti [@nocobase/sdk - Auth](/api/sdk/auth).