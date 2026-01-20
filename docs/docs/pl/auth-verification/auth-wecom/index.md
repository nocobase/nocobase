---
pkg: '@nocobase/plugin-auth-wecom'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Uwierzytelnianie: WeCom

## Wprowadzenie

**Wtyczka** WeCom umożliwia użytkownikom logowanie się do NocoBase za pomocą ich kont WeCom.

## Aktywacja wtyczki

![](https://static-docs.nocobase.com/202406272056962.png)

## Tworzenie i konfiguracja niestandardowej aplikacji WeCom

Proszę przejść do panelu administracyjnego WeCom, aby utworzyć niestandardową aplikację.

![](https://static-docs.nocobase.com/202406272101321.png)

![](https://static-docs.nocobase.com/202406272102087.png)

Proszę kliknąć aplikację, aby przejść do strony szczegółów, przewinąć stronę w dół i kliknąć „Autoryzowane logowanie WeCom”.

![](https://static-docs.nocobase.com/202406272104655.png)

Proszę ustawić autoryzowaną domenę zwrotną na domenę aplikacji NocoBase.

![](https://static-docs.nocobase.com/202406272105662.png)

Proszę wrócić do strony szczegółów aplikacji i kliknąć „Autoryzacja internetowa i JS-SDK”.

![](https://static-docs.nocobase.com/202406272107063.png)

Proszę ustawić i zweryfikować domenę zwrotną dla funkcji autoryzacji internetowej OAuth2.0 aplikacji.

![](https://static-docs.nocobase.com/202406272107899.png)

Na stronie szczegółów aplikacji proszę kliknąć „Zaufany adres IP firmy”.

![](https://static-docs.nocobase.com/202406272108834.png)

Proszę skonfigurować adres IP aplikacji NocoBase.

![](https://static-docs.nocobase.com/202406272109805.png)

## Pobieranie danych uwierzytelniających z panelu administracyjnego WeCom

W panelu administracyjnym WeCom, w sekcji „Moja firma”, proszę skopiować „ID firmy”.

![](https://static-docs.nocobase.com/202406272111637.png)

W panelu administracyjnym WeCom, w sekcji „Zarządzanie aplikacjami”, proszę przejść do strony szczegółów aplikacji utworzonej w poprzednim kroku i skopiować `AgentId` oraz `Secret`.

![](https://static-docs.nocobase.com/202406272122322.png)

## Dodawanie uwierzytelniania WeCom w NocoBase

Proszę przejść do strony zarządzania **wtyczkami** uwierzytelniania użytkowników.

![](https://static-docs.nocobase.com/202406272115044.png)

Dodaj - WeCom

![](https://static-docs.nocobase.com/202406272115805.png)

### Konfiguracja

![](https://static-docs.nocobase.com/202412041459250.png)

| Opcja                                                                                                 | Opis                                                                                                                                                                                   | Wymagana wersja |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Gdy numer telefonu nie pasuje do istniejącego użytkownika, <br />czy należy automatycznie utworzyć nowego użytkownika | Czy automatycznie utworzyć nowego użytkownika, gdy numer telefonu nie pasuje do istniejącego użytkownika.                                                                                | -                   |
| ID firmy                                                                                              | ID firmy, pobrane z panelu administracyjnego WeCom.                                                                                                                                            | -                   |
| AgentId                                                                                               | Pobierane z konfiguracji niestandardowej aplikacji w panelu administracyjnym WeCom.                                                                                                          | -                   |
| Secret                                                                                                | Pobierane z konfiguracji niestandardowej aplikacji w panelu administracyjnym WeCom.                                                                                                          | -                   |
| Origin                                                                                                | Bieżąca domena aplikacji.                                                                                                                                                               | -                   |
| Link przekierowania aplikacji pulpitu nawigacyjnego                                                    | Ścieżka aplikacji, na którą nastąpi przekierowanie po pomyślnym zalogowaniu.                                                                                                                                 | `v1.4.0`            |
| Automatyczne logowanie                                                                                | Automatyczne logowanie po otwarciu linku do aplikacji w przeglądarce WeCom. Gdy skonfigurowanych jest wiele uwierzytelniaczy WeCom, tylko jeden może mieć włączoną tę opcję.                          | `v1.4.0`            |
| Link do strony głównej aplikacji pulpitu nawigacyjnego                                                    | Link do strony głównej aplikacji pulpitu nawigacyjnego.                                                                                                                                                          | -                   |

## Konfiguracja strony głównej aplikacji WeCom

:::info
W przypadku wersji `v1.4.0` i nowszych, gdy opcja „Automatyczne logowanie” jest włączona, link do strony głównej aplikacji można uprościć do: `https://<url>/<path>`, na przykład `https://example.nocobase.com/admin`.

Można również skonfigurować oddzielne linki dla urządzeń mobilnych i stacjonarnych, na przykład `https://example.nocobase.com/m` i `https://example.nocobase.com/admin`.
:::

Proszę przejść do panelu administracyjnego WeCom i wkleić skopiowany link do strony głównej aplikacji pulpitu nawigacyjnego w polu adresu strony głównej odpowiedniej aplikacji.

![](https://static-docs.nocobase.com/202406272123631.png)

![](https://static-docs.nocobase.com/202406272123048.png)

## Logowanie

Proszę odwiedzić stronę logowania i kliknąć przycisk pod formularzem logowania, aby zainicjować logowanie za pomocą strony trzeciej.

![](https://static-docs.nocobase.com/202406272124608.png)

:::warning
Ze względu na ograniczenia uprawnień WeCom dotyczące wrażliwych informacji, takich jak numery telefonów, autoryzacja może być zakończona tylko w kliencie WeCom. Przy pierwszym logowaniu za pomocą WeCom, proszę postępować zgodnie z poniższymi krokami, aby zakończyć wstępną autoryzację logowania w kliencie WeCom.
:::

## Pierwsze logowanie

Z poziomu klienta WeCom proszę przejść do Pulpitu nawigacyjnego, przewinąć do dołu i kliknąć aplikację, aby przejść do wcześniej skonfigurowanej strony głównej. Spowoduje to zakończenie wstępnej autoryzacji. Następnie będzie Pan/Pani mógł/mogła używać WeCom do logowania się do aplikacji NocoBase.

<img src="https://static-docs.nocobase.com/202406272131113.png" width="400" />