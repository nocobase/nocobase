:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Przegląd

Przepływ pracy zazwyczaj składa się z kilku połączonych ze sobą kroków operacyjnych. Każdy węzeł reprezentuje jeden z tych kroków i stanowi podstawową jednostkę logiczną w procesie. Podobnie jak w języku programowania, różne typy węzłów reprezentują różne instrukcje, które określają ich zachowanie. Gdy przepływ pracy jest uruchamiany, system kolejno wchodzi w każdy węzeł i wykonuje jego instrukcje.

:::info{title=Wskazówka}
Wyzwalacz przepływu pracy nie jest węzłem. Jest on wyświetlany jedynie jako punkt wejścia na schemacie przepływu, ale stanowi odrębną koncepcję od węzła. Szczegółowe informacje znajdą Państwo w sekcji [Wyzwalacze](../triggers/index.md).
:::

Z perspektywy funkcjonalnej, obecnie zaimplementowane węzły można podzielić na kilka głównych kategorii (łącznie 29 typów węzłów):

- Sztuczna Inteligencja
  - [Duży Model Językowy](../../ai-employees/workflow/nodes/llm/chat.md) (dostarczane przez wtyczkę @nocobase/plugin-workflow-llm)
- Sterowanie przepływem
  - [Warunek](./condition.md)
  - [Wiele warunków](./multi-conditions.md)
  - [Pętla](./loop.md) (dostarczane przez wtyczkę @nocobase/plugin-workflow-loop)
  - [Zmienna](./variable.md) (dostarczane przez wtyczkę @nocobase/plugin-workflow-variable)
  - [Gałąź równoległa](./parallel.md) (dostarczane przez wtyczkę @nocobase/plugin-workflow-parallel)
  - [Wywołanie przepływu pracy](./subflow.md) (dostarczane przez wtyczkę @nocobase/plugin-workflow-subflow)
  - [Wyjście przepływu pracy](./output.md) (dostarczane przez wtyczkę @nocobase/plugin-workflow-subflow)
  - [Mapowanie zmiennych JSON](./json-variable-mapping.md) (dostarczane przez wtyczkę @nocobase/plugin-workflow-json-variable-mapping)
  - [Opóźnienie](./delay.md) (dostarczane przez wtyczkę @nocobase/plugin-workflow-delay)
  - [Zakończ przepływ pracy](./end.md)
- Obliczenia
  - [Obliczenie](./calculation.md)
  - [Obliczenie daty](./date-calculation.md) (dostarczane przez wtyczkę @nocobase/plugin-workflow-date-calculation)
  - [Obliczenie JSON](./json-query.md) (dostarczane przez wtyczkę @nocobase/plugin-workflow-json-query)
- Operacje na kolekcji
  - [Utwórz dane](./create.md)
  - [Zaktualizuj dane](./update.md)
  - [Usuń dane](./destroy.md)
  - [Zapytaj o dane](./query.md)
  - [Zapytanie agregujące](./aggregate.md) (dostarczane przez wtyczkę @nocobase/plugin-workflow-aggregate)
  - [Operacja SQL](./sql.md) (dostarczane przez wtyczkę @nocobase/plugin-workflow-sql)
- Obsługa ręczna
  - [Obsługa ręczna](./manual.md) (dostarczane przez wtyczkę @nocobase/plugin-workflow-manual)
  - [Zatwierdzenie](./approval.md) (dostarczane przez wtyczkę @nocobase/plugin-workflow-approval)
  - [DW (Do wiadomości)](./cc.md) (dostarczane przez wtyczkę @nocobase/plugin-workflow-cc)
- Inne rozszerzenia
  - [Żądanie HTTP](./request.md) (dostarczane przez wtyczkę @nocobase/plugin-workflow-request)
  - [JavaScript](./javascript.md) (dostarczane przez wtyczkę @nocobase/plugin-workflow-javascript)
  - [Wysyłka e-maila](./mailer.md) (dostarczane przez wtyczkę @nocobase/plugin-workflow-mailer)
  - [Powiadomienie](../../notification-manager/index.md#węzeł powiadomień przepływu pracy) (dostarczane przez wtyczkę @nocobase/plugin-workflow-notification)
  - [Odpowiedź](./response.md) (dostarczane przez wtyczkę @nocobase/plugin-workflow-webhook)
  - [Wiadomość zwrotna](./response-message.md) (dostarczane przez wtyczkę @nocobase/plugin-workflow-response-message)