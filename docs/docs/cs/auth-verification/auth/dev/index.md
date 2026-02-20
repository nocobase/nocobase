:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Rozšíření typů ověřování

## Přehled

NocoBase umožňuje podle potřeby rozšiřovat typy uživatelského ověřování. Uživatelské ověřování se obecně dělí na dva typy: jedním je určení identity uživatele přímo v aplikaci NocoBase, například přihlášení heslem, přihlášení pomocí SMS apod.; druhým je určení identity uživatele službami třetích stran, které následně oznámí výsledek aplikaci NocoBase prostřednictvím zpětných volání, například ověřovací metody jako OIDC, SAML. Proces ověřování pro tyto dva různé typy v NocoBase je v zásadě následující:

### Bez závislosti na zpětných voláních třetích stran

1. Klient použije NocoBase SDK k volání přihlašovacího rozhraní `api.auth.signIn()`, čímž vyžádá přihlašovací rozhraní `auth:signIn`. Zároveň předá identifikátor aktuálně použitého ověřovatele backendu prostřednictvím hlavičky požadavku `X-Authenticator`.
2. Rozhraní `auth:signIn` na základě identifikátoru ověřovatele v hlavičce požadavku přesměruje požadavek na odpovídající typ ověřování. Metoda `validate` v ověřovací třídě registrované pro tento typ ověřování provede příslušné logické zpracování.
3. Klient získá uživatelské informace a ověřovací `token` z odpovědi rozhraní `auth:signIn`, uloží `token` do Local Storage a dokončí přihlášení. Tento krok je automaticky zpracován interně SDK.

<img src="https://static-docs.nocobase.com/202404211852848.png"/>

### Se závislostí na zpětných voláních třetích stran

1. Klient získá URL pro přihlášení třetí strany prostřednictvím vlastního registrovaného rozhraní (např. `auth:getAuthUrl`) a podle protokolu předá informace, jako je název aplikace a identifikátor ověřovatele.
2. Přesměruje se na URL třetí strany k dokončení přihlášení. Služba třetí strany zavolá zpětné volání aplikace NocoBase (které je potřeba samostatně zaregistrovat, např. `auth:redirect`), vrátí výsledek ověření a zároveň vrátí informace, jako je název aplikace a identifikátor ověřovatele.
3. Metoda zpětného volání rozhraní analyzuje parametry k získání identifikátoru ověřovatele, získá odpovídající ověřovací třídu prostřednictvím `AuthManager` a aktivně zavolá metodu `auth.signIn()`. Metoda `auth.signIn()` následně zavolá metodu `validate()` pro zpracování ověřovací logiky.
4. Po získání ověřovacího `tokenu` metodou zpětného volání se provede přesměrování (302) zpět na frontendovou stránku, přičemž `token` a identifikátor ověřovatele jsou předány v parametrech URL, např. `?authenticator=xxx&token=yyy`.

<img src="https://static-docs.nocobase.com/202404211852377.png"/>

Níže si ukážeme, jak registrovat rozhraní na straně serveru a uživatelská rozhraní na straně klienta.

## Server

### Ověřovací rozhraní

Jádro NocoBase poskytuje registraci a správu pro rozšíření typů ověřování. Zpracování hlavní logiky pro rozšíření přihlašovacího **pluginu** vyžaduje dědění z abstraktní třídy `Auth` jádra a implementaci odpovídajících standardních rozhraní.  
Úplnou referenci k API naleznete v [Auth](/api/auth/auth).

```typescript
import { Auth } from '@nocobase/auth';

class CustomAuth extends Auth {
  set user(user) {}
  get user() {}

  async check() {}
  async signIn() {}
}
```

Jádro také registruje základní operace s prostředky souvisejícími s uživatelským ověřováním.

| API            | Popis                      |
| -------------- | -------------------------- |
| `auth:check`   | Zkontroluje, zda je uživatel přihlášen |
| `auth:signIn`  | Přihlásit se               |
| `auth:signUp`  | Registrovat se             |
| `auth:signOut` | Odhlásit se                |

Ve většině případů mohou rozšířené typy uživatelského ověřování využít stávající logiku ověřování JWT k vygenerování pověření pro přístup uživatele k API. Třída `BaseAuth` v jádře poskytuje základní implementaci abstraktní třídy `Auth`, viz [BaseAuth](../../../api/auth/base-auth.md). **Pluginy** mohou přímo dědit z třídy `BaseAuth`, aby znovu použily část logiky kódu a snížily tak náklady na vývoj.

```javascript
import { BaseAuth } from '@nocobase/auth';

class CustomAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Nastavení kolekce uživatelů
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Implementace logiky ověřování uživatele
  async validate() {}
}
```

### Uživatelská data

Při implementaci logiky ověřování uživatele se obvykle pracuje s uživatelskými daty. V aplikaci NocoBase jsou ve výchozím nastavení související **kolekce** definovány takto:

| **Kolekce**           | Popis                                                                                                          | **Plugin**                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `users`               | Ukládá uživatelské informace, jako je e-mail, přezdívka a heslo                                                        | [**Plugin** pro uživatele (`@nocobase/plugin-users`)](/users-permissions/user) |
| `authenticators`      | Ukládá informace o ověřovateli (entita typu ověřování), odpovídající typu ověřování a konfiguraci | **Plugin** pro uživatelské ověřování (`@nocobase/plugin-auth`)              |
| `usersAuthenticators` | Spojuje uživatele a ověřovatele, ukládá uživatelské informace pod odpovídajícím ověřovatelem                    | **Plugin** pro uživatelské ověřování (`@nocobase/plugin-auth`)              |

Obecně platí, že rozšířené metody přihlášení používají **kolekce** `users` a `usersAuthenticators` k ukládání odpovídajících uživatelských dat. Pouze ve zvláštních případech je nutné přidávat novou **kolekci** samostatně.

Hlavní pole **kolekce** `usersAuthenticators` jsou:

| Pole            | Popis                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------- |
| `uuid`          | Jedinečný identifikátor uživatele pro tento typ ověřování, např. telefonní číslo nebo ID uživatele služby třetí strany |
| `meta`          | Pole JSON, další informace k uložení                                                   |
| `userId`        | ID uživatele                                                                                     |
| `authenticator` | Název ověřovatele (jedinečný identifikátor)                                                      |

Pro operace dotazování a vytváření uživatelů datový model `AuthModel` pro `authenticators` také zapouzdřuje několik metod, které lze použít ve třídě `CustomAuth` prostřednictvím `this.authenticator[názevMetody]`. Úplnou referenci k API naleznete v [AuthModel](./api#authmodel).

```ts
import { AuthModel } from '@nocobase/plugin-auth';

class CustomAuth extends BaseAuth {
  async validate() {
    // ...
    const authenticator = this.authenticator as AuthModel;
    this.authenticator.findUser(); // Vyhledat uživatele
    this.authenticator.newUser(); // Vytvořit nového uživatele
    this.authenticator.findOrCreateUser(); // Vyhledat nebo vytvořit nového uživatele
    // ...
  }
}
```

### Registrace typu ověřování

Rozšířená metoda ověřování musí být registrována v modulu pro správu ověřování.

```javascript
class CustomAuthPlugin extends Plugin {
  async load() {
    this.app.authManager.registerTypes('custom-auth-type', {
      auth: CustomAuth,
    });
  }
}
```

## Klient

Uživatelské rozhraní klienta se registruje prostřednictvím rozhraní `registerType`, které poskytuje klientská část **pluginu** pro uživatelské ověřování:

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm, // Přihlašovací formulář
        SignInButton, // Tlačítko pro přihlášení (třetí strany), alternativa k přihlašovacímu formuláři
        SignUpForm, // Registrační formulář
        AdminSettingsForm, // Formulář nastavení administrace
      },
    });
  }
}
```

### Přihlašovací formulář

![](https://static-docs.nocobase.com/33afe18f229c3db45c7a1921c2c050b7.png)

Pokud více ověřovatelů odpovídajících typu ověřování zaregistrovalo přihlašovací formuláře, budou zobrazeny ve formě záložek (Tabů). Název záložky bude odpovídat názvu ověřovatele nakonfigurovaného v administraci.

![](https://static-docs.nocobase.com/ada6d7add744be0c812359c23bf4c7fc.png)

### Tlačítko pro přihlášení

![](https://static-docs.nocobase.com/e706f7785782adc77b0f4ee4faadfab8.png)

Obvykle se jedná o tlačítka pro přihlášení třetích stran, ale ve skutečnosti to může být jakákoli komponenta.

### Registrační formulář

![](https://static-docs.nocobase.com/f95c53431bf21ec312fcfd51923f0b42.png)

Pokud potřebujete přejít z přihlašovací stránky na registrační stránku, musíte to zpracovat sami v přihlašovací komponentě.

### Formulář pro správu administrace

![](https://static-docs.nocobase.com/f4b544b5b0f4afee5621ad4abf66b24f.png)

Nahoře je obecná konfigurace ověřovatele a dole je část formuláře pro vlastní konfiguraci, kterou lze registrovat.

### Volání API rozhraní

Pro iniciování požadavků na rozhraní související s uživatelským ověřováním na straně klienta můžete použít SDK poskytované NocoBase.

```ts
import { useAPIClient } from '@nocobase/client';

// Použití v komponentě
const api = useAPIClient();
api.auth.signIn(data, authenticator);
```

Podrobnou referenci k API naleznete v [@nocobase/sdk - Auth](/api/sdk/auth).