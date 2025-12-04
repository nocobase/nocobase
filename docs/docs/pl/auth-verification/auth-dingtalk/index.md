---
pkg: '@nocobase/plugin-auth-dingtalk'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Uwierzytelnianie: DingTalk

## Wprowadzenie

Wtyczka Uwierzytelnianie: DingTalk umożliwia użytkownikom logowanie się do NocoBase za pomocą swoich kont DingTalk.

## Aktywacja wtyczki

![](https://static-docs.nocobase.com/202406120929356.png)

## Skonfiguruj uprawnienia API w panelu deweloperskim DingTalk

Proszę zapoznać się z <a href="https://open.dingtalk.com/document/orgapp/tutorial-obtaining-user-personal-information" target="_blank">Platforma Otwarta DingTalk - Implementacja logowania do stron trzecich</a>, aby utworzyć aplikację.

Proszę przejść do panelu zarządzania aplikacjami i włączyć „Informacje o osobistym numerze telefonu” oraz „Uprawnienia do odczytu osobistych informacji z książki adresowej”.

![](https://static-docs.nocobase.com/202406120006620.png)

## Pobierz poświadczenia z panelu deweloperskiego DingTalk

Proszę skopiować Client ID i Client Secret.

![](https://static-docs.nocobase.com/202406120000595.png)

## Dodaj uwierzytelnianie DingTalk w NocoBase

Proszę przejść do strony zarządzania wtyczkami uwierzytelniania użytkowników.

![](https://static-docs.nocobase.com/202406112348051.png)

Dodaj - DingTalk

![](https://static-docs.nocobase.com/202406112349664.png)

### Konfiguracja

![](https://static-docs.nocobase.com/202406120016896.png)

- Automatyczna rejestracja, gdy użytkownik nie istnieje - Czy automatycznie utworzyć nowego użytkownika, jeśli istniejący użytkownik nie zostanie dopasowany na podstawie numeru telefonu.
- Client ID i Client Secret - Proszę uzupełnić informacje skopiowane w poprzednim kroku.
- Redirect URL - Callback URL, proszę skopiować i przejść do następnego kroku.

## Skonfiguruj adres URL zwrotny w panelu deweloperskim DingTalk

Proszę wkleić skopiowany adres URL zwrotny do panelu deweloperskiego DingTalk.

![](https://static-docs.nocobase.com/202406120012221.png)

## Logowanie

Proszę odwiedzić stronę logowania i kliknąć przycisk poniżej formularza logowania, aby zainicjować logowanie za pośrednictwem strony trzeciej.

![](https://static-docs.nocobase.com/202406120014539.png)