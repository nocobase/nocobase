---
pkg: '@nocobase/plugin-auth-sms'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Uwierzytelnianie SMS

## Wprowadzenie

Wtyczka uwierzytelniania SMS umożliwia użytkownikom rejestrację i logowanie do NocoBase za pomocą wiadomości SMS.

> Wymaga współpracy z funkcją kodów weryfikacyjnych SMS, którą udostępnia [`@nocobase/plugin-verification` wtyczka](/auth-verification/verification/).

## Dodawanie uwierzytelniania SMS

Proszę przejść do strony zarządzania wtyczkami uwierzytelniania użytkowników.

![](https://static-docs.nocobase.com/202502282112517.png)

Dodaj - SMS

![](https://static-docs.nocobase.com/202502282113553.png)

## Konfiguracja nowej wersji

:::info{title=Wskazówka}
Nowa konfiguracja została wprowadzona w wersji `1.6.0-alpha.30` i planowane jest jej stabilne wsparcie od wersji `1.7.0`.
:::

![](https://static-docs.nocobase.com/202502282114821.png)

**Weryfikator:** Proszę powiązać weryfikator SMS, który będzie używany do wysyłania kodów weryfikacyjnych SMS. Jeśli nie ma dostępnego weryfikatora, należy najpierw przejść do strony zarządzania weryfikacją i utworzyć weryfikator SMS.
Zobacz także:

- [Weryfikacja](../verification/index.md)
- [Weryfikacja: SMS](../verification/sms/index.md)

**Automatyczna rejestracja, gdy użytkownik nie istnieje:** Po zaznaczeniu tej opcji, jeśli numer telefonu użytkownika nie istnieje, zostanie utworzone nowe konto, a numer telefonu zostanie użyty jako nazwa użytkownika.

## Konfiguracja starszej wersji

![](https://static-docs.nocobase.com/a4d35ec63ba22ae2ea9e3e8e1cbb783d.png)

Funkcja uwierzytelniania logowania SMS będzie korzystać ze skonfigurowanego i ustawionego jako domyślny dostawcy kodów weryfikacyjnych SMS do wysyłania wiadomości.

**Automatyczna rejestracja, gdy użytkownik nie istnieje:** Po zaznaczeniu tej opcji, jeśli numer telefonu użytkownika nie istnieje, zostanie utworzone nowe konto, a numer telefonu zostanie użyty jako nazwa użytkownika.

## Logowanie

Proszę odwiedzić stronę logowania, aby skorzystać z tej funkcji.

![](https://static-docs.nocobase.com/8d630739201bc27d8b0de076ab4f75e2.png)