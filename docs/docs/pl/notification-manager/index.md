---
pkg: '@nocobase/plugin-notification-manager'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Zarządzanie powiadomieniami

## Wprowadzenie

Zarządzanie powiadomieniami to centralna usługa, która integruje wiele kanałów powiadomień. Zapewnia ujednoliconą konfigurację kanałów, zarządzanie wysyłką i logowanie, a także umożliwia elastyczne rozszerzanie.

![20240928112556](https://static-docs.nocobase.com/20240928112556.png)

- Część fioletowa: Zarządzanie powiadomieniami zapewnia kompleksową usługę zarządzania, obejmującą konfigurację kanałów, logowanie i inne funkcje, z możliwością rozszerzania kanałów powiadomień.
- Część zielona: Wiadomości w aplikacji (In-App Message) to wbudowany kanał, umożliwiający użytkownikom otrzymywanie powiadomień bezpośrednio w aplikacji.
- Część czerwona: E-mail (Email) to rozszerzalny kanał, pozwalający użytkownikom otrzymywać powiadomienia za pośrednictwem poczty elektronicznej.

## Zarządzanie kanałami

![20240928181752](https://static-docs.nocobase.com/20240928181752.png)

Obecnie obsługiwane kanały to:

- [Wiadomości w aplikacji](/notification-manager/notification-in-app-message)
- [E-mail](/notification-manager/notification-email) (z wbudowanym transportem SMTP)

Mogą Państwo również rozszerzyć system o więcej kanałów powiadomień. Proszę zapoznać się z dokumentacją [Rozszerzanie kanałów](/notification-manager/development/extension).

## Logi powiadomień

System szczegółowo rejestruje szczegóły wysyłki i status każdego powiadomienia, co ułatwia analizę i rozwiązywanie problemów.

![20240928181649](https://static-docs.nocobase.com/20240928181649.png)

## Węzeł powiadomień w przepływie pracy

![20240928181726](https://static-docs.nocobase.com/20240928181726.png)