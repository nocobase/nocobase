---
pkg: '@nocobase/plugin-auth-saml'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Uwierzytelnianie: SAML 2.0

## Wprowadzenie

Wtyczka Uwierzytelnianie: SAML 2.0 jest zgodna ze standardem protokołu SAML 2.0 (Security Assertion Markup Language 2.0). Umożliwia ona użytkownikom logowanie się do NocoBase przy użyciu kont dostarczanych przez zewnętrznych dostawców usług uwierzytelniania tożsamości (IdP).

## Aktywacja wtyczki

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

## Dodawanie uwierzytelniania SAML

Proszę przejść do strony zarządzania wtyczkami uwierzytelniania użytkowników.

![](https://static-docs.nocobase.com/202411130004459.png)

Dodaj - SAML

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

## Konfiguracja

![](https://static-docs.nocobase.com/976b66e58973c322d81dcddd22c6146.png)

- Adres URL SSO (Single Sign-On) – dostarczany przez IdP, używany do logowania jednokrotnego.
- Certyfikat publiczny (Public Certificate) – dostarczany przez IdP.
- Identyfikator jednostki (IdP Issuer) – opcjonalny, dostarczany przez IdP.
- http – Proszę zaznaczyć, jeśli Państwa aplikacja NocoBase korzysta z protokołu HTTP.
- Użyj tego pola do powiązania użytkownika – Pole służące do dopasowania i powiązania z istniejącymi użytkownikami. Mogą Państwo wybrać adres e-mail lub nazwę użytkownika; domyślnie jest to adres e-mail. Informacje o użytkowniku przekazywane przez IdP muszą zawierać pole `email` lub `username`.
- Automatyczna rejestracja, gdy użytkownik nie istnieje – Czy automatycznie tworzyć nowego użytkownika, jeśli nie znaleziono pasującego, istniejącego użytkownika.
- Użycie – `SP Issuer / EntityID` oraz `ACS URL` należy skopiować i wkleić do odpowiedniej konfiguracji w IdP.

## Mapowanie pól

Mapowanie pól należy skonfigurować na platformie konfiguracyjnej IdP. Mogą Państwo zapoznać się z [przykładem](./examples/google.md).

Pola dostępne do mapowania w NocoBase to:

- email (wymagane)
- phone (skuteczne tylko dla platform IdP, które obsługują `phone` w swoim zakresie, np. Alibaba Cloud, Feishu)
- nickname
- username
- firstName
- lastName

`nameID` jest przenoszone przez protokół SAML i nie wymaga mapowania; zostanie zapisane jako unikalny identyfikator użytkownika.
Priorytet reguły użycia pseudonimu dla nowego użytkownika to: `nickname` > `firstName lastName` > `username` > `nameID`
Obecnie mapowanie organizacji i ról użytkowników nie jest obsługiwane.

## Logowanie

Proszę przejść na stronę logowania i kliknąć przycisk pod formularzem logowania, aby zainicjować logowanie za pośrednictwem strony trzeciej.

![](https://static-docs.nocobase.com/74963865c9d36a294948e6adeb5b24bc.png)