---
pkg: '@nocobase/plugin-workflow-mailer'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Wysyłanie wiadomości e-mail

## Wprowadzenie

Służy do wysyłania wiadomości e-mail. Obsługuje treści w formatach tekstowych i HTML.

## Tworzenie węzła

W interfejsie konfiguracji przepływu pracy, kliknij przycisk plusa („+”) w przepływie, aby dodać węzeł „Wysyłanie wiadomości e-mail”:

![20251031130522](https://static-docs.nocobase.com/20251031130522.png)

## Konfiguracja węzła

![20251031131125](https://static-docs.nocobase.com/20251031131125.png)

Każda opcja może wykorzystywać zmienne z kontekstu przepływu pracy. W przypadku wrażliwych informacji można również użyć zmiennych globalnych i kluczy tajnych.

## Często zadawane pytania (FAQ)

### Limit częstotliwości wysyłania wiadomości przez Gmail

Podczas wysyłania niektórych wiadomości e-mail mogą Państwo napotkać następujący błąd:

```json
{
  "code": "ECONNECTION",
  "response": "421-4.7.0 Try again later, closing connection. (EHLO)\n421-4.7.0 For more information, go to\n421 4.7.0 About SMTP error messages - Google Workspace Admin Help 3f1490d57ef6-e7f7352f44csm831688276.30 - gsmtp",
  "responseCode": 421,
  "command": "EHLO"
}
```

Wynika to z faktu, że Gmail ogranicza częstotliwość wysyłania żądań z niezdefiniowanych domen. Podczas wdrażania aplikacji należy skonfigurować nazwę hosta serwera tak, aby odpowiadała domenie wysyłającej, którą skonfigurowali Państwo w Gmailu. Na przykład, podczas wdrożenia Docker:

```yaml
services:
  app:
    image: nocobase/nocobase
    hostname: <your-custom-hostname> # Ustaw na swoją skonfigurowaną domenę wysyłającą
```

Referencje: [Google SMTP Relay - Intermittent problems](https://forum.nocobase.com/t/google-smtp-relay-intermittent-problems/5483/6)