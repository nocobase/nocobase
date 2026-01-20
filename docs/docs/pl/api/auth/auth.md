:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Uwierzytelnianie

## Przegląd

`Auth` to abstrakcyjna klasa dla typów uwierzytelniania użytkowników. Definiuje ona interfejsy niezbędne do przeprowadzenia uwierzytelniania użytkowników. Aby rozszerzyć system o nowy typ uwierzytelniania użytkowników, należy dziedziczyć po klasie `Auth` i zaimplementować jej metody. Podstawową implementację znajdą Państwo w: [BaseAuth](./base-auth.md).

```ts
interface IAuth {
  user: Model;
  // Sprawdza status uwierzytelnienia i zwraca bieżącego użytkownika.
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
  // check: uwierzytelnianie
  async check() {
    // ...
  }
}
```

## Właściwości instancji

### `user`

Informacje o uwierzytelnionym użytkowniku.

#### Sygnatura

- `abstract user: Model`

## Metody klasy

### `constructor()`

Konstruktor, tworzy instancję `Auth`.

#### Sygnatura

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

#### Szczegóły

##### AuthConfig

| Właściwość      | Typ                                             | Opis                                                                                                          |
| --------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `authenticator` | [`Authenticator`](./auth-manager#authenticator) | Model danych uwierzytelniacza. Rzeczywisty typ w aplikacji NocoBase to [AuthModel](/auth-verification/auth/dev/api#authmodel). |
| `options`       | `Record<string, any>`                           | Konfiguracja związana z uwierzytelniaczem.                                                                    |
| `ctx`           | `Context`                                       | Kontekst żądania.                                                                                             |

### `check()`

Uwierzytelnianie użytkownika. Zwraca informacje o użytkowniku. Jest to abstrakcyjna metoda, którą muszą zaimplementować wszystkie typy uwierzytelniania.

#### Sygnatura

- `abstract check(): Promise<Model>`

### `signIn()`

Logowanie użytkownika.

#### Sygnatura

- `signIn(): Promise<any>`

### `signUp()`

Rejestracja użytkownika.

#### Sygnatura

- `signUp(): Promise<any>`

### `signOut()`

Wylogowanie użytkownika.

#### Sygnatura

- `signOut(): Promise<any>`