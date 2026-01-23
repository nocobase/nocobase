:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Zaawansowane

## Wprowadzenie

Duże modele językowe (LLM) często mają nieaktualne dane i brakuje im najnowszych informacji. Z tego powodu platformy usługowe LLM online zazwyczaj oferują funkcję wyszukiwania w sieci, umożliwiając sztucznej inteligencji wyszukiwanie informacji za pomocą narzędzi przed udzieleniem odpowiedzi, a następnie formułowanie odpowiedzi na podstawie uzyskanych wyników.

Pracownicy AI zostali przystosowani do funkcji wyszukiwania w sieci dostępnej na różnych platformach usługowych LLM online. Mogą Państwo włączyć tę funkcję w konfiguracji modelu pracownika AI oraz podczas rozmów.

## Włączanie funkcji wyszukiwania w sieci

Proszę przejść do strony konfiguracji wtyczki Pracowników AI, a następnie kliknąć zakładkę `AI employees`, aby przejść do strony zarządzania Pracownikami AI.

![20251021225643](https://static-docs.nocobase.com/20251021225643.png)

Proszę wybrać pracownika AI, dla którego chcą Państwo włączyć funkcję wyszukiwania w sieci, a następnie kliknąć przycisk `Edit`, aby przejść do strony edycji pracownika AI.

![20251022114043](https://static-docs.nocobase.com/20251022114043.png)

Na zakładce `Model settings` proszę włączyć przełącznik `Web Search` i kliknąć przycisk `Submit`, aby zapisać zmiany.

![20251022114300](https://static-docs.nocobase.com/20251022114300.png)

## Korzystanie z funkcji wyszukiwania w sieci podczas rozmów

Po włączeniu funkcji wyszukiwania w sieci dla pracownika AI, w polu wprowadzania rozmowy pojawi się ikona „Sieć”. Domyślnie wyszukiwanie w sieci jest włączone, ale mogą Państwo je wyłączyć, klikając ikonę.

![20251022115110](https://static-docs.nocobase.com/20251022115110.png)

Gdy wyszukiwanie w sieci jest aktywne, odpowiedź pracownika AI będzie zawierać wyniki wyszukiwania w sieci.

![20251022115502](https://static-docs.nocobase.com/20251022115502.png)

## Różnice w narzędziach wyszukiwania w sieci na różnych platformach

Obecnie funkcja wyszukiwania w sieci dla pracowników AI zależy od platformy usługowej LLM online, która ją udostępnia. Dlatego doświadczenie użytkownika może się różnić. Poniżej przedstawiono szczegółowe różnice:

| Platforma | Wyszukiwanie w sieci | Narzędzia | Odpowiedź w czasie rzeczywistym z terminami wyszukiwania | Zwraca linki zewnętrzne jako odnośniki w odpowiedzi |
| --------- | -------------------- | --------- | -------------------------------------------------------- | ---------------------------------------------------- |
| OpenAI    | ✅                   | ✅        | ✅                                                       | ✅                                                   |
| Gemini    | ✅                   | ❌        | ❌                                                       | ✅                                                   |
| Dashscope | ✅                   | ✅        | ❌                                                       | ❌                                                   |
| Deepseek  | ❌                   | ❌        | ❌                                                       | ❌                                                   |