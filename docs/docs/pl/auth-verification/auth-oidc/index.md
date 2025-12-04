---
pkg: '@nocobase/plugin-auth-oidc'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Uwierzytelnianie: OIDC

## Wprowadzenie

Wtyczka Uwierzytelnianie: OIDC działa zgodnie ze standardem protokołu OIDC (Open ConnectID), wykorzystując tryb przepływu kodu autoryzacji (Authorization Code Flow), aby umożliwić użytkownikom logowanie się do NocoBase za pomocą kont dostarczanych przez zewnętrznych dostawców tożsamości (IdP).

## Aktywacja wtyczki

![](https://static-docs.nocobase.com/202411122358790.png)

## Dodawanie uwierzytelniania OIDC

Proszę przejść do strony zarządzania wtyczkami uwierzytelniania użytkowników.

![](https://static-docs.nocobase.com/202411130004459.png)

Dodaj - OIDC

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

## Konfiguracja

### Konfiguracja podstawowa

![](https://static-docs.nocobase.com/202411130006341.png)

| Ustawienie                                         | Opis                                                                                                                                                                | Wersja         |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| Sign up automatically when the user does not exist | Czy automatycznie utworzyć nowego użytkownika, jeśli nie zostanie znaleziony żaden istniejący użytkownik do powiązania.                                                           | -              |
| Issuer                                             | Wystawca (issuer) dostarczany przez IdP, zazwyczaj kończy się na `/.well-known/openid-configuration`.                                                                                   | -              |
| Client ID                                          | ID klienta                                                                                                                                                              | -              |
| Client Secret                                      | Sekret klienta                                                                                                                                                          | -              |
| scope                                              | Opcjonalne, domyślnie `openid email profile`.                                                                                                                              | -              |
| id_token signed response algorithm                 | Algorytm podpisu dla `id_token`, domyślnie `RS256`.                                                                                                                 | -              |
| Enable RP-initiated logout                         | Włącza wylogowanie inicjowane przez RP (RP-initiated logout). Wylogowuje sesję IdP, gdy użytkownik się wyloguje. Adres URL przekierowania po wylogowaniu (Post logout redirect URL) dla IdP powinien być tym, który jest podany w sekcji [Użycie](#użycie). | `v1.3.44-beta` |

### Mapowanie pól

![](https://static-docs.nocobase.com/92d3c8f6f4082b50d9f475674cb5650.png)

| Ustawienie                      | Opis                                                                                                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Field Map                       | Mapowanie pól. NocoBase obsługuje mapowanie pól takich jak pseudonim, e-mail i numer telefonu. Domyślny pseudonim używa `openid`.                                   |
| Use this field to bind the user | Pole używane do dopasowania i powiązania z istniejącymi użytkownikami. Można wybrać e-mail lub nazwę użytkownika, domyślnie jest to e-mail. IdP musi dostarczyć informacje o użytkowniku zawierające pole `email` lub `username`. |

### Konfiguracja zaawansowana

![](https://static-docs.nocobase.com/202411130013306.png)

| Ustawienie                                                        | Opis                                                                                                                                                                                                                                                         | Wersja         |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| HTTP                                                              | Czy adres URL zwrotny NocoBase używa protokołu HTTP, domyślnie `https`.                                                                                                                                                                                           | -              |
| Port                                                              | Port dla adresu URL zwrotnego NocoBase, domyślnie `443/80`.                                                                                                                                                                                                           | -              |
| State token                                                       | Służy do weryfikacji źródła żądania i zapobiegania atakom CSRF. Można podać stałą wartość, ale **zdecydowanie zaleca się pozostawienie tego pola pustego, aby domyślnie generować wartości losowe. Jeśli zdecydują się Państwo na użycie stałej wartości, prosimy o dokładną ocenę środowiska użytkowania i ryzyka bezpieczeństwa.** | -              |
| Pass parameters in the authorization code grant exchange          | Niektóre IdP mogą wymagać przekazania Client ID lub Client Secret jako parametrów podczas wymiany kodu na token. Można zaznaczyć tę opcję i określić odpowiednie nazwy parametrów.                                                                                | -              |
| Method to call the user info endpoint                             | Metoda HTTP używana podczas wywoływania API informacji o użytkowniku.                                                                                                                                                                                                             | -              |
| Where to put the access token when calling the user info endpoint | Sposób przekazywania tokenu dostępu podczas wywoływania API informacji o użytkowniku:<br/>- Header - W nagłówku żądania (domyślnie).<br />- Body - W treści żądania, używane z metodą `POST`.<br />- Query parameters - Jako parametry zapytania, używane z metodą `GET`.                   | -              |
| Skip SSL verification                                             | Pomiń weryfikację SSL podczas wysyłania żądań do API IdP. **Ta opcja naraża Państwa system na ryzyko ataków typu man-in-the-middle. Proszę zaznaczać tę opcję tylko wtedy, gdy dokładnie rozumieją Państwo jej przeznaczenie i konsekwencje. Zdecydowanie odradza się używanie tego ustawienia w środowiskach produkcyjnych.**        | `v1.3.40-beta` |

### Użycie

![](https://static-docs.nocobase.com/202411130019570.png)

| Ustawienie               | Opis                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| Redirect URL             | Służy do konfiguracji adresu URL przekierowania w IdP.                                                 |
| Post logout redirect URL | Służy do konfiguracji adresu URL przekierowania po wylogowaniu (Post logout redirect URL) w IdP, gdy włączone jest wylogowanie inicjowane przez RP. |

:::info
Podczas testowania lokalnego proszę używać `127.0.0.1` zamiast `localhost` jako adresu URL, ponieważ logowanie OIDC wymaga zapisania stanu (state) w pliku cookie klienta w celu weryfikacji bezpieczeństwa. Jeśli podczas logowania okno mignie, ale logowanie nie powiedzie się, proszę sprawdzić logi serwera pod kątem niezgodności stanu oraz upewnić się, że parametr stanu jest zawarty w pliku cookie żądania. Taka sytuacja zazwyczaj występuje, gdy stan w pliku cookie klienta nie odpowiada stanowi przekazanemu w żądaniu.
:::

## Logowanie

Proszę odwiedzić stronę logowania i kliknąć przycisk pod formularzem logowania, aby zainicjować logowanie za pomocą usługi zewnętrznej.

![](https://static-docs.nocobase.com/e493d156254c2ac0b6f6e1002e6a2e6b.png)