---
pkg: "@nocobase/plugin-workflow-response-message"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::



# Odpowiedź HTTP

## Wprowadzenie

Ten węzeł jest obsługiwany wyłącznie w synchronicznych przepływach pracy Webhook i służy do zwracania odpowiedzi do systemów zewnętrznych. Na przykład, podczas przetwarzania wywołania zwrotnego płatności, jeśli proces biznesowy zakończy się nieoczekiwanym wynikiem (np. błędem lub niepowodzeniem), mogą Państwo użyć węzła odpowiedzi, aby zwrócić komunikat o błędzie do systemu zewnętrznego. Dzięki temu niektóre systemy zewnętrzne będą mogły ponowić próbę później, w zależności od statusu.

Co więcej, wykonanie węzła odpowiedzi zakończy działanie przepływu pracy, a kolejne węzły nie zostaną już wykonane. Jeśli w całym przepływie pracy nie skonfigurowano węzła odpowiedzi, system automatycznie odpowie na podstawie statusu wykonania procesu: zwróci `200` w przypadku pomyślnego wykonania i `500` w przypadku niepowodzenia.

## Tworzenie węzła odpowiedzi

W interfejsie konfiguracji przepływu pracy, proszę kliknąć przycisk plusa („+”) w przepływie, aby dodać węzeł „Odpowiedź”:

![20241210115120](https://static-docs.nocobase.com/20241210115120.png)

## Konfiguracja odpowiedzi

![20241210115500](https://static-docs.nocobase.com/20241210115500.png)

W treści odpowiedzi mogą Państwo używać zmiennych z kontekstu przepływu pracy.