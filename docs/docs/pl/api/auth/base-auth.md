:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# BaseAuth

## Przegląd

`BaseAuth` dziedziczy po abstrakcyjnej klasie [Auth](./auth) i stanowi podstawową implementację typów uwierzytelniania użytkowników, wykorzystując JWT jako metodę autoryzacji. W większości przypadków mogą Państwo rozszerzać typy uwierzytelniania użytkowników, dziedzicząc po `BaseAuth`, i nie ma potrzeby dziedziczenia bezpośrednio po abstrakcyjnej klasie `Auth`.

```ts
class BasicAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Ustawienie kolekcji użytkowników
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Logika uwierzytelniania użytkownika, wywoływana przez `auth.signIn`
  // Zwraca dane użytkownika
  async validate() {
    const ctx = this.ctx;
    const { values } = ctx.action.params;
    // ...
    return user;
  }
}
```

## Metody klasy

### `constructor()`

Konstruktor, tworzy instancję `BaseAuth`.

#### Sygnatura

- `constructor(config: AuthConfig & { userCollection: Collection })`

#### Szczegóły

| Parametr         | Typ          | Opis                                                                                                |
| :--------------- | :----------- | :-------------------------------------------------------------------------------------------------- |
| `config`         | `AuthConfig` | Proszę zapoznać się z [Auth - AuthConfig](./auth#authconfig)                                        |
| `userCollection` | `Collection` | Kolekcja użytkowników, np. `db.getCollection('users')`. Proszę zapoznać się z [DataBase - Collection](../database/collection) |

### `user()`

Akcesor, ustawia i pobiera informacje o użytkowniku. Domyślnie wykorzystuje obiekt `ctx.state.currentUser` do dostępu.

#### Sygnatura

- `set user()`
- `get user()`

### `check()`

Uwierzytelnia za pomocą tokenu żądania i zwraca informacje o użytkowniku.

### `signIn()`

Logowanie użytkownika, generuje token.

### `signUp()`

Rejestracja użytkownika.

### `signOut()`

Wylogowanie użytkownika, unieważnia token.

### `validate()` *

Główna logika uwierzytelniania, wywoływana przez interfejs `signIn`, aby określić, czy użytkownik może pomyślnie się zalogować.