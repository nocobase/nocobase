---
pkg: '@nocobase/plugin-auth-cas'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Uwierzytelnianie: CAS

## Wprowadzenie

Wtyczka Uwierzytelnianie: CAS jest zgodna ze standardem protokołu CAS (Central Authentication Service), umożliwiając Państwu logowanie się do NocoBase za pomocą kont dostarczanych przez zewnętrznych dostawców usług uwierzytelniania tożsamości (IdP).

## Instalacja

## Instrukcja obsługi

### Aktywacja wtyczki

![](https://static-docs.nocobase.com/469c48d9f2e8d41a088092c34ddb41f5.png)

### Dodawanie uwierzytelniania CAS

Proszę przejść do strony zarządzania uwierzytelnianiem użytkowników:

http://localhost:13000/admin/settings/auth/authenticators

Następnie proszę dodać metodę uwierzytelniania CAS.

![](https://static-docs.nocobase.com/a268500c5008d3b90e57ff1e2ea41aca.png)

Proszę skonfigurować CAS i aktywować.

![](https://static-docs.nocobase.com/2518b3fcc80d8a41391f3b629a510a02.png)

### Przejdź do strony logowania

http://localhost:13000/signin

![](https://static-docs.nocobase.com/49116aafbb2ed7218306f929ac8af967.png)