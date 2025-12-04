:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Przegląd

Wyzwalacz jest punktem wejścia dla przepływu pracy. Gdy podczas działania aplikacji wystąpi zdarzenie spełniające warunki wyzwalacza, przepływ pracy zostanie uruchomiony i wykonany. Typ wyzwalacza jest jednocześnie typem przepływu pracy. Wybiera się go podczas tworzenia przepływu pracy i nie można go później zmienić. Obecnie obsługiwane typy wyzwalaczy to:

- [Zdarzenia kolekcji](./collection) (Wbudowane)
- [Harmonogram](./schedule) (Wbudowane)
- [Przed akcją](./pre-action) (Dostarczane przez wtyczkę `@nocobase/plugin-workflow-request-interceptor`)
- [Po akcji](./post-action) (Dostarczane przez wtyczkę `@nocobase/plugin-workflow-action-trigger`)
- [Niestandardowa akcja](./custom-action) (Dostarczane przez wtyczkę `@nocobase/plugin-workflow-custom-action-trigger`)
- [Zatwierdzenie](./approval) (Dostarczane przez wtyczkę `@nocobase/plugin-workflow-approval`)
- [Webhook](./webhook) (Dostarczane przez wtyczkę `@nocobase/plugin-workflow-webhook`)

Poniższy schemat przedstawia momenty wyzwalania poszczególnych zdarzeń:

![Zdarzenia przepływu pracy](https://static-docs.nocobase.com/20251029221709.png)

Na przykład, gdy użytkownik przesyła formularz, dane w `kolekcji` zmieniają się w wyniku działania użytkownika lub wywołania programu, albo gdy zadanie z harmonogramu osiągnie swój czas wykonania, może zostać uruchomiony skonfigurowany `przepływ pracy`.

Wyzwalacze związane z danymi (takie jak akcje, zdarzenia `kolekcji`) zazwyczaj przenoszą dane kontekstowe wyzwalacza. Dane te działają jako zmienne i mogą być używane przez węzły w `przepływie pracy` jako parametry przetwarzania, aby umożliwić automatyzację przetwarzania danych. Na przykład, gdy użytkownik przesyła formularz, jeśli przycisk wysyłania jest powiązany z `przepływem pracy`, ten `przepływ pracy` zostanie uruchomiony i wykonany. Przesłane dane zostaną wstrzyknięte do środowiska kontekstowego planu wykonania, aby kolejne węzły mogły ich używać jako zmiennych.

Po utworzeniu `przepływu pracy`, na stronie podglądu `przepływu pracy`, wyzwalacz jest wyświetlany jako węzeł wejściowy na początku procesu. Kliknięcie tej karty otworzy panel konfiguracji. W zależności od typu wyzwalacza, można skonfigurować jego odpowiednie warunki.

![Wyzwalacz_Węzeł wejściowy](https://static-docs.nocobase.com/20251029222231.png)