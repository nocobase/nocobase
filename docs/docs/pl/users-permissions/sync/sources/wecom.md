---
pkg: "@nocobase/plugin-wecom"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::



# Synchronizacja danych użytkowników z WeChat Work

## Wprowadzenie

**Wtyczka** **WeChat Work** umożliwia synchronizację danych użytkowników i działów z WeChat Work.

## Tworzenie i konfiguracja niestandardowej aplikacji WeChat Work

Najpierw należy utworzyć niestandardową aplikację w panelu administracyjnym WeChat Work i uzyskać **Corp ID**, **AgentId** oraz **Secret**.

Proszę zapoznać się z [Uwierzytelnianiem użytkowników - WeChat Work](/auth-verification/auth-wecom/).

## Dodawanie źródła danych do synchronizacji w NocoBase

Proszę przejść do Użytkownicy i uprawnienia - Synchronizacja - Dodaj i uzupełnić uzyskane informacje.

![](https://static-docs.nocobase.com/202412041251867.png)

## Konfiguracja synchronizacji kontaktów

Proszę przejść do panelu administracyjnego WeChat Work - Bezpieczeństwo i zarządzanie - Narzędzia zarządzania i kliknąć Synchronizacja kontaktów.

![](https://static-docs.nocobase.com/202412041249958.png)

Proszę skonfigurować zgodnie z ilustracją i ustawić zaufany adres IP dla przedsiębiorstwa.

![](https://static-docs.nocobase.com/202412041250776.png)

Teraz mogą Państwo przystąpić do synchronizacji danych użytkowników.

## Konfiguracja serwera odbioru zdarzeń

Jeśli chcą Państwo, aby zmiany w danych użytkowników i działów po stronie WeChat Work były na bieżąco synchronizowane z aplikacją NocoBase, mogą Państwo przejść do dalszych ustawień.

Po uzupełnieniu poprzednich informacji konfiguracyjnych mogą Państwo skopiować adres URL powiadomienia zwrotnego dla kontaktów.

![](https://static-docs.nocobase.com/202412041256547.png)

Proszę wkleić go w ustawieniach WeChat Work, uzyskać Token i EncodingAESKey, a następnie zakończyć konfigurację źródła danych do synchronizacji użytkowników NocoBase.

![](https://static-docs.nocobase.com/202412041257947.png)