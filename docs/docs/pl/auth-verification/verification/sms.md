---
pkg: '@nocobase/plugin-verification'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Weryfikacja: SMS

## Wprowadzenie

Kod weryfikacyjny SMS to wbudowany typ weryfikacji, służący do generowania jednorazowego hasła dynamicznego (OTP) i wysyłania go użytkownikowi za pośrednictwem wiadomości SMS.

## Dodawanie weryfikatora SMS

Proszę przejść do strony zarządzania weryfikacją.

![](https://static-docs.nocobase.com/202502271726791.png)

Dodaj - SMS OTP

![](https://static-docs.nocobase.com/202502271726056.png)

## Konfiguracja administratora

![](https://static-docs.nocobase.com/202502271727711.png)

Obecnie obsługiwani dostawcy usług SMS to:

- <a href="https://www.aliyun.com/product/sms" target="_blank">Aliyun SMS</a>
- <a href="https://cloud.tencent.com/product/sms" target="_blank">Tencent Cloud SMS</a>

Podczas konfigurowania szablonu SMS w panelu administracyjnym dostawcy usług, należy zarezerwować parametr dla kodu weryfikacyjnego.

- Przykład konfiguracji Aliyun: `Państwa kod weryfikacyjny to: ${code}`

- Przykład konfiguracji Tencent Cloud: `Państwa kod weryfikacyjny to: {1}`

Deweloperzy mogą również rozszerzyć obsługę o innych dostawców usług SMS w formie wtyczek. Zobacz: [Rozszerzanie dostawców usług SMS](./dev/sms-type)

## Powiązanie przez użytkownika

Po dodaniu weryfikatora, użytkownicy mogą powiązać numer telefonu w swoim osobistym zarządzaniu weryfikacją.

![](https://static-docs.nocobase.com/202502271737016.png)

![](https://static-docs.nocobase.com/202502271737769.png)

![](https://static-docs.nocobase.com/202502271738515.png)

Po pomyślnym powiązaniu, weryfikacja tożsamości może być przeprowadzona w każdym scenariuszu, który korzysta z tego weryfikatora.

![](https://static-docs.nocobase.com/202502271739607.png)

## Odwiązanie przez użytkownika

Odwiązanie numeru telefonu wymaga weryfikacji za pomocą już powiązanej metody.

![](https://static-docs.nocobase.com/202502282103205.png)