---
pkg: "@nocobase/plugin-ai-ee"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::



# Wyjście Strukturalne

## Wprowadzenie

W niektórych scenariuszach zastosowań użytkownicy mogą chcieć, aby model LLM odpowiadał treścią strukturalną w formacie JSON. Można to osiągnąć, konfigurując funkcję „Wyjście Strukturalne”.

![](https://static-docs.nocobase.com/202503041306405.png)

## Konfiguracja

-   **JSON Schema** - Mogą Państwo określić oczekiwaną strukturę odpowiedzi modelu, konfigurując [schemat JSON](https://json-schema.org/).
-   **Nazwa** - _Opcjonalnie_, służy do lepszego zrozumienia przez model obiektu reprezentowanego przez schemat JSON.
-   **Opis** - _Opcjonalnie_, służy do lepszego zrozumienia przez model przeznaczenia schematu JSON.
-   **Strict** - Wymaga od modelu wygenerowania odpowiedzi ściśle zgodnej ze strukturą schematu JSON. Obecnie tylko niektóre nowe modele OpenAI obsługują ten parametr. Przed włączeniem proszę sprawdzić, czy Państwa model jest kompatybilny.

## Metoda generowania treści strukturalnej

Sposób, w jaki model generuje treści strukturalne, zależy od używanego **modelu** oraz jego konfiguracji **formatu odpowiedzi** (Response format):

1.  Modele, w których format odpowiedzi (Response format) obsługuje tylko `text`

    -   Podczas wywołania węzeł powiąże narzędzie (Tool), które generuje treści w formacie JSON na podstawie schematu JSON, kierując model do wygenerowania strukturalnej odpowiedzi poprzez wywołanie tego narzędzia.

2.  Modele, w których format odpowiedzi (Response format) obsługuje tryb JSON (`json_object`)

    -   Jeśli podczas wywołania wybrano tryb JSON, użytkownik musi wyraźnie poinstruować model w Prompcie, aby zwrócił dane w formacie JSON i podał opisy dla pól odpowiedzi.
    -   W tym trybie schemat JSON jest używany wyłącznie do parsowania ciągu JSON zwróconego przez model i konwertowania go na docelowy obiekt JSON.

3.  Modele, w których format odpowiedzi (Response format) obsługuje schemat JSON (`json_schema`)

    -   Schemat JSON jest bezpośrednio używany do określania docelowej struktury odpowiedzi dla modelu.
    -   Opcjonalny parametr **Strict** wymaga od modelu ścisłego przestrzegania schematu JSON podczas generowania odpowiedzi.

4.  Lokalne modele Ollama

    -   Jeśli skonfigurowano schemat JSON, węzeł przekaże go jako parametr `format` do modelu podczas wywołania.

## Korzystanie z wyniku wyjścia strukturalnego

Strukturalna treść odpowiedzi modelu jest zapisywana jako obiekt JSON w polu „Structured content” węzła i może być wykorzystana przez kolejne węzły.

![](https://static-docs.nocobase.com/202503041330291.png)

![](https://static-docs.nocobase.com/202503041331279.png)