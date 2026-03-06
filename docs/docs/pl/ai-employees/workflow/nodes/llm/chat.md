---
pkg: "@nocobase/plugin-ai"
---

:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/ai-employees/workflow/nodes/llm/chat).
:::

# Czat tekstowy

## Wprowadzenie

Używając węzła LLM w przepływie pracy, mogą Państwo zainicjować rozmowę z usługą LLM online, wykorzystując możliwości dużych modeli do pomocy w realizacji serii procesów biznesowych.

![](https://static-docs.nocobase.com/202503041012091.png)

## Nowy węzeł LLM

Ponieważ rozmowy z usługami LLM są zazwyczaj czasochłonne, węzeł LLM może być używany tylko w asynchronicznych przepływach pracy.

![](https://static-docs.nocobase.com/202503041013363.png)

## Wybór modelu

Najpierw proszę wybrać podłączoną usługę LLM. Jeśli usługa LLM nie została jeszcze podłączona, należy najpierw dodać konfigurację usługi LLM. Odniesienie: [Zarządzanie usługami LLM](/ai-employees/features/llm-service)

Po wybraniu usługi aplikacja spróbuje pobrać listę dostępnych modeli z usługi LLM do wyboru. Interfejsy niektórych usług LLM online służące do pobierania modeli mogą nie być zgodne ze standardowym protokołem API; użytkownicy mogą również ręcznie wprowadzić identyfikator modelu.

![](https://static-docs.nocobase.com/202503041013084.png)

## Ustawianie parametrów wywołania

Mogą Państwo dostosować parametry wywołania modelu LLM zgodnie z potrzebami.

![](https://static-docs.nocobase.com/202503041014778.png)

### Response format

Warto zwrócić uwagę na ustawienie **Response format**. Ta pozycja służy do określenia formatu treści odpowiedzi dużego modelu, który może być tekstem lub formatem JSON. Jeśli wybrano tryb JSON, należy pamiętać:

- Odpowiedni model LLM musi obsługiwać wywołania w trybie JSON, a użytkownik musi wyraźnie poinstruować LLM w Prompt o odpowiedzi w formacie JSON, na przykład: "Tell me a joke about cats, respond in JSON with \`setup\` and \`punchline\` keys". W przeciwnym razie może nie być wyniku odpowiedzi i wystąpi błąd `400 status code (no body)`.
- Wynik odpowiedzi jest ciągiem znaków JSON. Użytkownik musi wykorzystać możliwości innych węzłów przepływu pracy do jego przetworzenia, zanim będzie mógł użyć zawartej w nim strukturalnej treści. Można również skorzystać z funkcji [Strukturalne wyjście](/ai-employees/workflow/nodes/llm/structured-output).

## Wiadomości

Tablica wiadomości wysyłanych do modelu LLM, może zawierać zestaw wiadomości historycznych. Wiadomości obsługują trzy typy:

- System - Zazwyczaj używany do definiowania roli i zachowania modelu LLM w rozmowie.
- User - Treść wprowadzona przez użytkownika.
- Assistant - Treść odpowiedzi modelu.

Dla wiadomości użytkownika, przy założeniu, że model to obsługuje, można dodać wiele treści w jednym monicie, co odpowiada parametrowi `content`. Jeśli używany model obsługuje tylko parametr `content` w formie ciągu znaków (większość modeli nieobsługujących konwersacji multimodalnych należy do tej kategorii), proszę podzielić wiadomość na wiele monitów, z których każdy zawiera tylko jedną treść; w ten sposób węzeł wyśle treść w formie ciągu znaków.

![](https://static-docs.nocobase.com/202503041016140.png)

W treści wiadomości można używać zmiennych, aby odwoływać się do kontekstu przepływu pracy.

![](https://static-docs.nocobase.com/202503041017879.png)

## Wykorzystanie treści odpowiedzi węzła LLM

Treść odpowiedzi węzła LLM można wykorzystać jako zmienną w innych węzłach.

![](https://static-docs.nocobase.com/202503041018508.png)