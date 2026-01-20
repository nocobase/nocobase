:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Auth

## Přehled

`Auth` je abstraktní třída pro typy uživatelské autentizace. Definuje rozhraní potřebná k dokončení uživatelské autentizace. Pro rozšíření o nový typ uživatelské autentizace je nutné zdědit třídu `Auth` a implementovat její metody. Základní implementaci naleznete v: [BaseAuth](./base-auth.md).

```ts
interface IAuth {
  user: Model;
  // Zkontroluje stav autentizace a vrátí aktuálního uživatele.
  check(): Promise<Model>;
  signIn(): Promise<any>;
  signUp(): Promise<any>;
  signOut(): Promise<any>;
}

export abstract class Auth implements IAuth {
  abstract user: Model;
  abstract check(): Promise<Model>;
  // ...
}

class CustomAuth extends Auth {
  // check: autentizace
  async check() {
    // ...
  }
}
```

## Vlastnosti instance

### `user`

Informace o autentizovaném uživateli.

#### Signatura

- `abstract user: Model`

## Metody třídy

### `constructor()`

Konstruktor, vytváří instanci `Auth`.

#### Signatura

- `constructor(config: AuthConfig)`

#### Typ

```ts
export type AuthConfig = {
  authenticator: Authenticator;
  options: {
    [key: string]: any;
  };
  ctx: Context;
};
```

#### Podrobnosti

##### AuthConfig

| Vlastnost       | Typ                                             | Popis                                                                                                         |
| --------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `authenticator` | [`Authenticator`](./auth-manager#authenticator) | Datový model autentikátoru. Skutečný typ v aplikaci NocoBase je [AuthModel](/auth-verification/auth/dev/api#authmodel). |
| `options`       | `Record<string, any>`                           | Konfigurace související s autentikátorem.                                                                     |
| `ctx`           | `Context`                                       | Kontext požadavku.                                                                                            |

### `check()`

Uživatelská autentizace. Vrací informace o uživateli. Jedná se o abstraktní metodu, kterou musí implementovat všechny typy autentizace.

#### Signatura

- `abstract check(): Promise<Model>`

### `signIn()`

Přihlášení uživatele.

#### Signatura

- `signIn(): Promise<any>`

### `signUp()`

Registrace uživatele.

#### Signatura

- `signUp(): Promise<any>`

### `signOut()`

Odhlášení uživatele.

#### Signatura

- `signOut(): Promise<any>`