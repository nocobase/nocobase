---
pkg: '@nocobase/plugin-two-factor-authentication'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Uwierzytelnianie dwuskładnikowe (2FA)

## Wprowadzenie

Uwierzytelnianie dwuskładnikowe (2FA) to dodatkowy środek bezpieczeństwa stosowany podczas logowania do aplikacji. Gdy 2FA jest włączone, użytkownicy, logując się za pomocą hasła, muszą podać dodatkową formę uwierzytelnienia, taką jak kod OTP, TOTP itp.

:::info{title=Uwaga}
Obecnie proces 2FA dotyczy wyłącznie logowania za pomocą hasła. Jeśli Państwa aplikacja korzysta z SSO lub innych metod uwierzytelniania, prosimy o użycie środków ochrony w postaci uwierzytelniania wieloskładnikowego (MFA) oferowanych przez odpowiedniego dostawcę tożsamości (IdP).
:::

## Włączanie wtyczki

![](https://static-docs.nocobase.com/202502282108145.png)

## Konfiguracja administratora

Po włączeniu wtyczki, na stronie zarządzania uwierzytelniaczami pojawi się podstrona konfiguracji 2FA.

Administratorzy muszą zaznaczyć opcję „Wymuś uwierzytelnianie dwuskładnikowe (2FA) dla wszystkich użytkowników” oraz wybrać dostępny typ uwierzytelniacza do powiązania. Jeśli nie ma dostępnych uwierzytelniaczy, należy najpierw utworzyć nowy uwierzytelniacz na stronie zarządzania weryfikacją. Szczegóły znajdą Państwo w: [Weryfikacja](../verification/index.md).

![](https://static-docs.nocobase.com/202502282109802.png)

## Logowanie użytkownika

Po włączeniu 2FA, gdy użytkownicy logują się za pomocą hasła, przechodzą do procesu weryfikacji 2FA.

Jeśli użytkownik nie powiązał jeszcze żadnego z określonych uwierzytelniaczy, zostanie poproszony o jego powiązanie. Po pomyślnym powiązaniu będzie mógł uzyskać dostęp do aplikacji.

![](https://static-docs.nocobase.com/202502282110829.png)

Jeśli użytkownik powiązał już jeden z określonych uwierzytelniaczy, zostanie poproszony o weryfikację tożsamości za pomocą powiązanego uwierzytelniacza. Po pomyślnej weryfikacji będzie mógł uzyskać dostęp do aplikacji.

![](https://static-docs.nocobase.com/202502282110148.png)

Po zalogowaniu użytkownicy mogą powiązać dodatkowe uwierzytelniacze na stronie zarządzania weryfikacją w swoim centrum osobistym.

![](https://static-docs.nocobase.com/202502282110024.png)