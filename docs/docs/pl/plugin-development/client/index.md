:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Przegląd

Rozwój wtyczek klienckich NocoBase oferuje różnorodne funkcje i możliwości, które pomagają deweloperom dostosowywać i rozszerzać funkcjonalności front-endowe NocoBase. Poniżej przedstawiono główne możliwości rozwoju wtyczek klienckich NocoBase oraz powiązane z nimi rozdziały:

| Moduł                       | Opis                                                                 | Powiązany rozdział                                      |
| :-------------------------- | :------------------------------------------------------------------- | :------------------------------------------------------ |
| **Klasa wtyczki**           | Tworzenie i zarządzanie wtyczkami klienckimi, rozszerzanie funkcjonalności front-endowych | [plugin.md](plugin.md)                                  |
| **Zarządzanie routingiem**  | Dostosowywanie routingu front-endowego, implementacja nawigacji po stronach i przekierowań | [router.md](router.md)                                  |
| **Operacje na zasobach**    | Zarządzanie zasobami front-endowymi, obsługa pobierania i manipulacji danymi | [resource.md](resource.md)                              |
| **Obsługa żądań**           | Dostosowywanie żądań HTTP, obsługa wywołań API i transferu danych    | [request.md](request.md)                                |
| **Zarządzanie kontekstem**  | Pobieranie i używanie kontekstu aplikacji, dostęp do globalnego stanu i usług | [context.md](context.md)                                |
| **Kontrola dostępu (ACL)**  | Implementacja kontroli dostępu front-endowego, zarządzanie uprawnieniami do stron i funkcji | [acl.md](acl.md)                                        |
| **Zarządzanie źródłami danych** | Zarządzanie i używanie wielu źródeł danych, implementacja przełączania i dostępu do źródeł danych | [data-source-manager.md](data-source-manager.md)        |
| **Style i motywy**          | Dostosowywanie stylów i motywów, implementacja personalizacji i upiększania interfejsu użytkownika | [styles-themes.md](styles-themes.md)                    |
| **Obsługa wielu języków (i18n)** | Integracja obsługi wielu języków, implementacja internacjonalizacji i lokalizacji | [i18n.md](i18n.md)                                      |
| **Rejestrowanie zdarzeń (Logger)** | Dostosowywanie formatów i metod wyjścia logów, zwiększanie możliwości debugowania i monitorowania | [logger.md](logger.md)                                  |
| **Pisanie przypadków testowych** | Pisanie i uruchamianie przypadków testowych, zapewnienie stabilności wtyczki i dokładności funkcjonalnej | [test.md](test.md)                                      |

## Rozszerzenia UI

| Moduł                      | Opis                                                                                                                              | Powiązany rozdział                                                                                                                                     |
| :------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Konfiguracja UI**        | Użycie silnika przepływu (FlowEngine) i modeli przepływu do implementacji dynamicznej konfiguracji i orkiestracji właściwości komponentów, wspierające wizualne dostosowywanie złożonych stron i interakcji | [silnik przepływu](../../flow-engine/index.md) i [model przepływu](../../flow-engine/flow-model.md) |
| **Rozszerzenia bloków**    | Dostosowywanie bloków stron, tworzenie modułów i układów UI wielokrotnego użytku                                                  | [bloków](../../ui-development-block/index.md)                                                                                                         |
| **Rozszerzenia pól**       | Dostosowywanie typów pól, implementacja wyświetlania i edycji złożonych danych                                                    | [pól](../../ui-development-field/index.md)                                                                                                            |
| **Rozszerzenia akcji**     | Dostosowywanie typów akcji, implementacja złożonej logiki i obsługi interakcji                                                    | [akcji](../../ui-development-action/index.md)                                                                                                         |