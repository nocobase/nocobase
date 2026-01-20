:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Rozszerzanie typów uwierzytelniania

## Przegląd

NocoBase umożliwia rozszerzanie typów uwierzytelniania użytkowników zgodnie z Państwa potrzebami. Uwierzytelnianie użytkowników zazwyczaj dzieli się na dwa główne typy:
1.  **Weryfikacja tożsamości w samej aplikacji NocoBase**, np. logowanie za pomocą hasła, logowanie SMS-em.
2.  **Weryfikacja tożsamości przez usługi stron trzecich**, które następnie powiadamiają aplikację NocoBase o wyniku za pośrednictwem wywołań zwrotnych (callbacków), np. metody uwierzytelniania takie jak OIDC czy SAML.
Proces uwierzytelniania dla tych dwóch typów w NocoBase wygląda następująco:

### Bez zależności od wywołań zwrotnych stron trzecich

1.  Klient używa NocoBase SDK do wywołania interfejsu logowania `api.auth.signIn()`, żądając interfejsu `auth:signIn`. Jednocześnie identyfikator aktualnie używanego uwierzytelniacza jest przekazywany do backendu poprzez nagłówek żądania `X-Authenticator`.
2.  Interfejs `auth:signIn`, na podstawie identyfikatora uwierzytelniacza z nagłówka żądania, przekazuje żądanie do odpowiedniego typu uwierzytelniania. Metoda `validate` w klasie uwierzytelniającej zarejestrowanej dla tego typu wykonuje odpowiednie przetwarzanie logiczne.
3.  Klient otrzymuje informacje o użytkowniku i token uwierzytelniający z odpowiedzi interfejsu `auth:signIn`, zapisuje token w Local Storage i kończy proces logowania. Ten krok jest automatycznie obsługiwany wewnętrznie przez SDK.

<img src="https://static-docs.nocobase.com/202404211852848.png"/>

### Zależność od wywołań zwrotnych stron trzecich

1.  Klient uzyskuje URL logowania strony trzeciej za pośrednictwem własnego zarejestrowanego interfejsu (np. `auth:getAuthUrl`), przekazując zgodnie z protokołem informacje takie jak nazwa aplikacji i identyfikator uwierzytelniacza.
2.  Następuje przekierowanie do URL strony trzeciej w celu zakończenia logowania. Usługa strony trzeciej wywołuje interfejs zwrotny aplikacji NocoBase (który należy samodzielnie zarejestrować, np. `auth:redirect`), zwracając wynik uwierzytelniania oraz informacje takie jak nazwa aplikacji i identyfikator uwierzytelniacza.
3.  Metoda interfejsu zwrotnego analizuje parametry w celu uzyskania identyfikatora uwierzytelniacza, pobiera odpowiednią klasę uwierzytelniającą za pośrednictwem `AuthManager` i aktywnie wywołuje metodę `auth.signIn()`. Metoda `auth.signIn()` z kolei wywołuje metodę `validate()` do obsługi logiki autoryzacji.
4.  Metoda zwrotna, po uzyskaniu tokena uwierzytelniającego, przekierowuje (status 302) z powrotem na stronę front-endową, dołączając `token` i identyfikator uwierzytelniacza do parametrów URL, np. `?authenticator=xxx&token=yyy`.

<img src="https://static-docs.nocobase.com/202404211852377.png"/>

Poniżej przedstawiamy, jak zarejestrować interfejsy po stronie serwera oraz interfejsy użytkownika po stronie klienta.

## Serwer

### Interfejs uwierzytelniania

Jądro NocoBase zapewnia rejestrację i zarządzanie rozszerzalnymi typami uwierzytelniania. Aby rozszerzyć wtyczkę logowania o niestandardową logikę, należy dziedziczyć po abstrakcyjnej klasie `Auth` jądra i zaimplementować odpowiednie standardowe interfejsy.  
Pełne odniesienie do API znajdą Państwo w [Auth](/api/auth/auth).

```typescript
import { Auth } from '@nocobase/auth';

class CustomAuth extends Auth {
  set user(user) {}
  get user() {}

  async check() {}
  async signIn() {}
}
```

Jądro rejestruje również podstawowe operacje na zasobach związane z uwierzytelnianiem użytkowników.

| API            | Opis                               |
| -------------- | ---------------------------------- |
| `auth:check`   | Sprawdza, czy użytkownik jest zalogowany |
| `auth:signIn`  | Logowanie                          |
| `auth:signUp`  | Rejestracja                        |
| `auth:signOut` | Wylogowanie                        |

W większości przypadków rozszerzone typy uwierzytelniania użytkowników mogą również wykorzystywać istniejącą logikę autoryzacji JWT do generowania poświadczeń dostępu użytkownika do API. Klasa `BaseAuth` w jądrze stanowi podstawową implementację abstrakcyjnej klasy `Auth`. Proszę zapoznać się z [BaseAuth](../../../api/auth/base-auth.md). Wtyczki mogą bezpośrednio dziedziczyć po klasie `BaseAuth`, aby ponownie wykorzystać część kodu logicznego i zmniejszyć koszty rozwoju.

```javascript
import { BaseAuth } from '@nocobase/auth';

class CustomAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Ustawienie kolekcji użytkowników
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Implementacja logiki uwierzytelniania użytkownika
  async validate() {}
}
```

### Dane użytkownika

Podczas implementacji logiki uwierzytelniania użytkownika zazwyczaj konieczne jest przetwarzanie danych użytkownika. W aplikacji NocoBase, domyślnie powiązane **kolekcje** są zdefiniowane następująco:

| Kolekcja              | Opis                                                                                                     | Wtyczka                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `users`               | Przechowuje informacje o użytkownikach, takie jak adres e-mail, nazwa użytkownika i hasło                | [Wtyczka użytkowników (`@nocobase/plugin-users`)](/users-permissions/user) |
| `authenticators`      | Przechowuje informacje o uwierzytelniaczach (encji typu uwierzytelniania), odpowiadające typowi i konfiguracji uwierzytelniania | Wtyczka uwierzytelniania użytkowników (`@nocobase/plugin-auth`) |
| `usersAuthenticators` | Łączy użytkowników z uwierzytelniaczami, przechowuje informacje o użytkownikach w ramach danego uwierzytelniacza | Wtyczka uwierzytelniania użytkowników (`@nocobase/plugin-auth`) |

Zazwyczaj, rozszerzone metody logowania mogą wykorzystywać **kolekcje** `users` i `usersAuthenticators` do przechowywania odpowiednich danych użytkownika. Tylko w szczególnych przypadkach konieczne jest samodzielne dodanie nowej **kolekcji**.

Główne pola **kolekcji** `usersAuthenticators` to:

| Pole            | Opis                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------ |
| `uuid`          | Unikalny identyfikator użytkownika dla tego typu uwierzytelniania, np. numer telefonu, WeChat openid itp. |
| `meta`          | Pole JSON, inne informacje do zapisania                                                          |
| `userId`        | ID użytkownika                                                                                   |
| `authenticator` | Nazwa uwierzytelniacza (unikalny identyfikator)                                                  |

Dla operacji wyszukiwania i tworzenia użytkowników, model danych `AuthModel` **kolekcji** `authenticators` również hermetyzuje kilka metod, które mogą być używane w klasie `CustomAuth` poprzez `this.authenticator[nazwaMetody]`. Pełne odniesienie do API znajdą Państwo w [AuthModel](./api#authmodel).

```ts
import { AuthModel } from '@nocobase/plugin-auth';

class CustomAuth extends BaseAuth {
  async validate() {
    // ...
    const authenticator = this.authenticator as AuthModel;
    this.authenticator.findUser(); // Wyszukaj użytkownika
    this.authenticator.newUser(); // Utwórz nowego użytkownika
    this.authenticator.findOrCreateUser(); // Wyszukaj lub utwórz nowego użytkownika
    // ...
  }
}
```

### Rejestracja typu uwierzytelniania

Rozszerzona metoda uwierzytelniania musi zostać zarejestrowana w module zarządzania uwierzytelnianiem.

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

Interfejs użytkownika po stronie klienta jest rejestrowany za pośrednictwem interfejsu `registerType` dostarczanego przez klienta **wtyczki** uwierzytelniania użytkowników:

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm, // Formularz logowania
        SignInButton, // Przycisk logowania (strony trzeciej), alternatywa dla formularza logowania
        SignUpForm, // Formularz rejestracji
        AdminSettingsForm, // Formularz ustawień administracyjnych
      },
    });
  }
}
```

### Formularz logowania

![](https://static-docs.nocobase.com/33afe18f229c3db45c7a1921c2c050b7.png)

Jeśli wiele uwierzytelniaczy odpowiadających typom uwierzytelniania zarejestrowało formularze logowania, zostaną one wyświetlone w formie zakładek (Tabów). Tytuł zakładki będzie odpowiadał tytułowi uwierzytelniacza skonfigurowanemu w panelu administracyjnym.

![](https://static-docs.nocobase.com/ada6d7add744be0c812359c23bf4c7fc.png)

### Przycisk logowania

![](https://static-docs.nocobase.com/e706f7785782adc77b0f4ee4faadfab8.png)

Zazwyczaj jest to przycisk logowania strony trzeciej, ale w rzeczywistości może to być dowolny komponent.

### Formularz rejestracji

![](https://static-docs.nocobase.com/f95c53431bf21ec312fcfd51923f0b42.png)

Jeśli konieczne jest przejście ze strony logowania do strony rejestracji, należy to obsłużyć samodzielnie w komponencie logowania.

### Formularz ustawień administracyjnych

![](https://static-docs.nocobase.com/f4b544b5b0f5afee5621ad4abf66b24f.png)

Górna część przedstawia ogólną konfigurację uwierzytelniacza, natomiast dolna to sekcja formularza konfiguracji niestandardowej, którą można zarejestrować.

### Żądania API

Aby zainicjować żądania do interfejsów API związanych z uwierzytelnianiem użytkowników po stronie klienta, mogą Państwo użyć SDK dostarczonego przez NocoBase.

```ts
import { useAPIClient } from '@nocobase/client';

// Użycie w komponencie
const api = useAPIClient();
api.auth.signIn(data, authenticator);
```

Szczegółowe odniesienie do API znajdą Państwo w [@nocobase/sdk - Auth](/api/sdk/auth).