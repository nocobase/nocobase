---
pkg: "@nocobase/plugin-ai"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::



# Czat tekstowy

## Wprowadzenie

Korzystając z węzła LLM w ramach przepływu pracy, mogą Państwo zainicjować rozmowę z usługą LLM online, wykorzystując możliwości dużych modeli do wspierania realizacji szeregu procesów biznesowych.

![](https://static-docs.nocobase.com/202503041012091.png)

## Tworzenie węzła LLM

Ponieważ rozmowy z usługami LLM są często czasochłonne, węzeł LLM może być używany wyłącznie w asynchronicznych przepływach pracy.

![](https://static-docs.nocobase.com/202503041013363.png)

## Wybór modelu

Najpierw proszę wybrać podłączoną usługę LLM. Jeśli żadna usługa LLM nie jest jeszcze podłączona, należy najpierw dodać jej konfigurację. Zobacz: [Zarządzanie usługami LLM](/ai-employees/quick-start/llm-service)

Po wybraniu usługi aplikacja spróbuje pobrać listę dostępnych modeli z usługi LLM, aby mogli Państwo dokonać wyboru. Niektóre usługi LLM online mogą posiadać interfejsy API do pobierania modeli, które nie są zgodne ze standardowymi protokołami API; w takich przypadkach użytkownicy mogą również ręcznie wprowadzić ID modelu.

![](https://static-docs.nocobase.com/202503041013084.png)

## Ustawianie parametrów wywołania

Mogą Państwo dostosować parametry wywołania modelu LLM według potrzeb.

![](https://static-docs.nocobase.com/202503041014778.png)

### Format odpowiedzi

Warto zwrócić uwagę na ustawienie **Format odpowiedzi**. Ta opcja służy do określenia formatu treści odpowiedzi dużego modelu, który może być tekstowy lub JSON. Jeśli wybiorą Państwo tryb JSON, należy pamiętać o następujących kwestiach:

- Odpowiedni model LLM musi obsługiwać wywołania w trybie JSON. Dodatkowo, użytkownik musi wyraźnie wskazać w Prompt, aby LLM odpowiedział w formacie JSON, na przykład: "Tell me a joke about cats, respond in JSON with `setup` and `punchline` keys". W przeciwnym razie może nie być odpowiedzi, co skutkuje błędem `400 status code (no body)`.
- Odpowiedź będzie ciągiem znaków JSON. Użytkownik musi ją przetworzyć za pomocą innych węzłów przepływu pracy, aby móc wykorzystać jej ustrukturyzowaną zawartość. Mogą Państwo również skorzystać z funkcji [Wyjście strukturalne](/ai-employees/workflow/nodes/llm/structured-output).

## Wiadomości

Tablica wiadomości wysyłanych do modelu LLM może zawierać zestaw wiadomości historycznych. Wiadomości obsługują trzy typy:

- System – Zazwyczaj używany do definiowania roli i zachowania modelu LLM w rozmowie.
- Użytkownik – Treść wprowadzona przez użytkownika.
- Asystent – Treść odpowiedzi modelu.

W przypadku wiadomości użytkownika, o ile model to obsługuje, mogą Państwo dodać wiele treści w jednym zapytaniu (prompt), odpowiadających parametrowi `content`. Jeśli używany model obsługuje parametr `content` tylko w formie ciągu znaków (co dotyczy większości modeli, które nie wspierają rozmów multimodalnych), proszę podzielić wiadomość na wiele zapytań, z których każde będzie zawierać tylko jedną treść. W ten sposób węzeł wyśle treść jako ciąg znaków.

![](https://static-docs.nocobase.com/202503041016140.png)

W treści wiadomości mogą Państwo używać zmiennych do odwoływania się do kontekstu przepływu pracy.

![](https://static-docs.nocobase.com/202503041017879.png)

## Wykorzystanie treści odpowiedzi węzła LLM

Mogą Państwo wykorzystać treść odpowiedzi węzła LLM jako zmienną w innych węzłach.

![](https://static-docs.nocobase.com/202503041018508.png)