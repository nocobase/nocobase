---
pkg: '@nocobase/plugin-verification-totp-authenticator'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Weryfikacja: Autentykator TOTP

## Wprowadzenie

Autentykator TOTP umożliwia użytkownikom powiązanie dowolnego autentykatora zgodnego ze specyfikacją TOTP (jednorazowe hasło czasowe) (<a href="https://www.rfc-editor.org/rfc/rfc6238" target="_blank">RFC-6238</a>) oraz przeprowadzenie weryfikacji tożsamości za pomocą jednorazowego hasła czasowego (TOTP).

## Konfiguracja administratora

Proszę przejść do strony zarządzania weryfikacją.

![](https://static-docs.nocobase.com/202502271726791.png)

Dodaj - Autentykator TOTP

![](https://static-docs.nocobase.com/202502271745028.png)

Poza unikalnym identyfikatorem i tytułem, autentykator TOTP nie wymaga żadnej dodatkowej konfiguracji.

![](https://static-docs.nocobase.com/202502271746034.png)

## Powiązanie przez użytkownika

Po dodaniu autentykatora użytkownicy mogą powiązać autentykator TOTP w sekcji zarządzania weryfikacją w swoim centrum osobistym.

![](https://static-docs.nocobase.com/202502272252324.png)

:::warning
Wtyczka obecnie nie oferuje mechanizmu kodów odzyskiwania. Po powiązaniu autentykatora TOTP, prosimy o jego bezpieczne przechowywanie. W przypadku przypadkowej utraty autentykatora, mogą Państwo użyć innej metody weryfikacji tożsamości, aby go odłączyć, a następnie ponownie powiązać.
:::

## Odłączenie przez użytkownika

Odłączenie autentykatora wymaga weryfikacji za pomocą już powiązanej metody weryfikacji.

![](https://static-docs.nocobase.com/202502282103205.png)