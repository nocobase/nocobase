:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Autoryzacja

## Przegląd

Klasa `Auth` służy głównie do dostępu do informacji o użytkowniku po stronie klienta oraz do wysyłania żądań do interfejsów API związanych z uwierzytelnianiem użytkowników.

## Właściwości instancji

### `locale`

Język używany przez bieżącego użytkownika.

### `role`

Rola używana przez bieżącego użytkownika.

### `token`

Token API.

### `authenticator`

Autentykator używany do uwierzytelniania bieżącego użytkownika. Zobacz [Uwierzytelnianie użytkownika](/auth-verification/auth/).

## Metody klasy

### `signIn()`

Logowanie użytkownika.

#### Sygnatura

- `async signIn(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Szczegóły

| Nazwa parametru | Typ      | Opis                                      |
| --------------- | -------- | ----------------------------------------- |
| `values`        | `any`    | Parametry żądania dla interfejsu API logowania. |
| `authenticator` | `string` | Identyfikator autentykatora używanego do logowania. |

### `signUp()`

Rejestracja użytkownika.

#### Sygnatura

- `async signUp(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Szczegóły

| Nazwa parametru | Typ      | Opis                                      |
| --------------- | -------- | ----------------------------------------- |
| `values`        | `any`    | Parametry żądania dla interfejsu API rejestracji. |
| `authenticator` | `string` | Identyfikator autentykatora używanego do rejestracji. |

### `signOut()`

Wylogowanie.

#### Sygnatura

- `async signOut(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Szczegóły

| Nazwa parametru | Typ      | Opis                                      |
| --------------- | -------- | ----------------------------------------- |
| `values`        | `any`    | Parametry żądania dla interfejsu API wylogowania. |
| `authenticator` | `string` | Identyfikator autentykatora używanego do wylogowania. |