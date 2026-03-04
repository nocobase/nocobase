:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/ai-employees/features/built-in-employee).
:::

# Wbudowani pracownicy AI

NocoBase posiada wbudowanych pracowników AI dostosowanych do konkretnych scenariuszy.

Wystarczy skonfigurować usługę LLM i włączyć odpowiedniego pracownika, aby rozpocząć pracę; modele można przełączać w trakcie rozmowy w zależności od potrzeb.


## Wprowadzenie

![clipboard-image-1766653060](https://static-docs.nocobase.com/clipboard-image-1766653060.png)

| Nazwa pracownika | Rola | Kluczowe kompetencje |
| :--- | :--- | :--- |
| **Cole** | Asystent NocoBase | Pytania i odpowiedzi dot. produktu, przeszukiwanie dokumentacji |
| **Ellis** | Ekspert ds. e-mail | Pisanie wiadomości, generowanie podsumowań, sugestie odpowiedzi |
| **Dex** | Specjalista ds. porządkowania danych | Tłumaczenie pól, formatowanie, wyodrębnianie informacji |
| **Viz** | Analityk spostrzeżeń | Wnioski z danych, analiza trendów, interpretacja kluczowych wskaźników |
| **Lexi** | Asystent tłumaczeń | Tłumaczenia wielojęzyczne, wsparcie w komunikacji |
| **Vera** | Analityk badawczy | Przeszukiwanie sieci, agregacja informacji, pogłębione analizy |
| **Dara** | Ekspert ds. wizualizacji danych | Konfiguracja wykresów, generowanie raportów wizualnych |
| **Orin** | Ekspert ds. modelowania danych | Wsparcie w projektowaniu struktury kolekcji, sugestie pól |
| **Nathan** | Inżynier frontend | Wsparcie w pisaniu fragmentów kodu frontendowego, dostosowywanie stylów |


Mogą Państwo kliknąć **pływającą ikonę AI** w prawym dolnym rogu interfejsu aplikacji i wybrać potrzebnego pracownika, aby rozpocząć współpracę.


## Pracownicy AI do zadań specjalnych

Niektórzy wbudowani pracownicy AI (typu "budowniczy") nie pojawiają się na liście w prawym dolnym rogu; posiadają oni dedykowane scenariusze pracy, na przykład:

* Orin pojawia się tylko na stronie konfiguracji źródła danych;
* Dara pojawia się tylko na stronie konfiguracji wykresów;
* Nathan pojawia się tylko w edytorze JS.



---

Poniżej przedstawiamy kilka typowych scenariuszy zastosowania pracowników AI, które mogą posłużyć Państwu za inspirację. Więcej możliwości czeka na odkrycie podczas codziennej pracy biznesowej.


## Viz: Analityk spostrzeżeń

### Wprowadzenie

> Generuj wykresy i spostrzeżenia jednym kliknięciem – pozwól danym mówić za siebie.

**Viz** to wbudowany **analityk spostrzeżeń AI**.
Potrafi on odczytywać dane z bieżącej strony (np. Leady, Szanse sprzedaży, Konta), automatycznie generować wykresy trendów, porównania, karty KPI oraz zwięzłe wnioski, czyniąc analizę biznesową prostą i intuicyjną.

> Chcą Państwo wiedzieć, „dlaczego sprzedaż ostatnio spadła”?
> Wystarczy jedno zdanie skierowane do Viza, a wskaże on, w którym miejscu nastąpił spadek, jakie mogą być jego przyczyny i jakie kroki warto podjąć w następnej kolejności.

### Scenariusze użycia

Niezależnie od tego, czy chodzi o miesięczne podsumowanie działalności, ROI kanałów czy lejek sprzedaży, Viz może przeanalizować dane, wygenerować wykresy i zinterpretować wyniki.

| Scenariusz | Co chcą Państwo wiedzieć | Wynik pracy Viza |
| -------- | ------------ | ------------------- |
| **Podsumowanie miesięczne** | Czym ten miesiąc różni się od poprzedniego? | Karta KPI + Wykres trendu + Trzy sugestie ulepszeń |
| **Analiza wzrostu** | Czy wzrost przychodów wynika z wolumenu czy z ceny? | Wykres dekompozycji czynników + Tabela porównawcza |
| **Analiza kanałów** | W który kanał najbardziej warto dalej inwestować? | Wykres ROI + Krzywa retencji + Sugestie |
| **Analiza lejka** | Na którym etapie blokuje się ruch? | Wykres lejka + Wyjaśnienie wąskich gardeł |
| **Retencja klientów** | Którzy klienci są najbardziej wartościowi? | Wykres segmentacji RFM + Krzywa retencji |
| **Ocena promocji** | Jak skuteczne były ostatnie działania promocyjne? | Wykres porównawczy + Analiza elastyczności cenowej |

### Sposób użycia

**Punkty wejścia na stronie**

* **Przycisk w prawym górnym rogu (zalecane)**
  
  Na stronach takich jak Leady, Szanse sprzedaży czy Konta, należy kliknąć **ikonę Viz** w prawym górnym rogu, aby wybrać gotowe zadania, np.:

  * Konwersja etapów i trendy
  * Porównanie kanałów źródłowych
  * Analiza podsumowania miesięcznego

  ![clipboard-image-1771913319](https://static-docs.nocobase.com/clipboard-image-1771913319.png)

* **Ogólny panel w prawym dolnym rogu**
  
  Na dowolnej stronie można wywołać ogólny panel AI i zwrócić się bezpośrednio do Viza:

  ```
  Przeanalizuj zmiany w sprzedaży w ciągu ostatnich 90 dni
  ```

  Viz automatycznie uwzględni kontekst danych ze strony, na której się Państwo znajdują.

**Interakcja**

Viz obsługuje pytania w języku naturalnym i rozumie wieloetapowe dopytywanie.
Przykład:

```
Cześć Viz, wygeneruj trendy dla leadów w tym miesiącu.
```

```
Pokaż tylko wyniki z kanałów zewnętrznych.
```

```
Który region rośnie najszybciej?
```

Każde kolejne pytanie będzie pogłębiać analizę na podstawie poprzednich wyników, bez konieczności ponownego definiowania warunków danych.

### Wskazówki dotyczące rozmowy z Vizem

| Metoda | Efekt |
| ---------- | ------------------- |
| Określenie zakresu czasu | "Ostatnie 30 dni", "Poprzedni miesiąc vs obecny" daje większą dokładność |
| Wskazanie wymiarów | "Pokaż według regionu/kanału/produktu" pomaga dopasować perspektywę |
| Skupienie na trendach, nie na szczegółach | Viz świetnie radzi sobie z identyfikacją kierunków zmian i kluczowych przyczyn |
| Używanie języka naturalnego | Nie jest wymagana składnia poleceń, wystarczy pytać jak podczas zwykłej rozmowy |


---



## Dex: Specjalista ds. porządkowania danych

### Wprowadzenie

> Szybkie wyodrębnianie i wypełnianie formularzy – zamiana nieuporządkowanych informacji w dane strukturalne.

`Dex` to specjalista ds. porządkowania danych, który wyodrębnia potrzebne informacje z nieustrukturyzowanych danych lub plików i porządkuje je w formie ustrukturyzowanej. Może również korzystać z narzędzi, aby automatycznie wypełniać formularze tymi informacjami.

### Sposób użycia

Na stronie formularza należy wywołać `Dexa`, aby otworzyć okno dialogowe.

![20251022155316](https://static-docs.nocobase.com/20251022155316.png)

Kliknąć `Add work context` w polu wprowadzania i wybrać `Pick block` – strona przejdzie w tryb wyboru bloku.

![20251022155414](https://static-docs.nocobase.com/20251022155414.png)

Wybrać blok formularza na stronie.

![20251022155523](https://static-docs.nocobase.com/20251022155523.png)

W oknie dialogowym wpisać dane, które `Dex` ma uporządkować.

![20251022155555](https://static-docs.nocobase.com/20251022155555.png)

Po wysłaniu `Dex` nada danym strukturę i użyje swoich umiejętności, aby zaktualizować dane w wybranym formularzu.

![20251022155733](https://static-docs.nocobase.com/20251022155733.png)


---



## Orin: Ekspert ds. modelowania danych

### Wprowadzenie

> Inteligentne projektowanie kolekcji i optymalizacja struktury bazy danych.

`Orin` jest ekspertem w dziedzinie modelowania danych. Na stronie konfiguracji głównego źródła danych można poprosić `Orina` o pomoc w tworzeniu lub modyfikowaniu kolekcji.

![20251022160628](https://static-docs.nocobase.com/20251022160628.png)

### Sposób użycia

Należy wejść do wtyczki Menedżer źródeł danych i wybrać konfigurację głównego źródła danych.

![20251022161146](https://static-docs.nocobase.com/20251022161146.png)

Kliknąć awatar `Orina` w prawym górnym rogu, aby otworzyć okno dialogowe pracownika AI.

![20251022161641](https://static-docs.nocobase.com/20251022161641.png)

Opisać `Orinowi` swoje potrzeby w zakresie modelowania, wysłać wiadomość i poczekać na odpowiedź. 

Gdy `Orin` potwierdzi wymagania, użyje swoich umiejętności i przedstawi podgląd modelowania danych.

Po zapoznaniu się z podglądem należy kliknąć przycisk `Finish review and apply`, aby utworzyć kolekcje zgodnie z modelem przygotowanym przez `Orina`.

![20251022162142](https://static-docs.nocobase.com/20251022162142.png)


---



## Nathan: Inżynier frontend

### Wprowadzenie

> Pomaga pisać i optymalizować kod frontendowy, realizując złożoną logikę interakcji.

`Nathan` to ekspert ds. rozwoju frontendu w NocoBase. W scenariuszach wymagających użycia JavaScript, takich jak `JSBlock`, `JSField`, `JSItem`, `JSColumn`, `JSAction`, `Event Flow` czy `Linkage`, w prawym górnym rogu edytora kodu pojawi się awatar `Nathana`. Można go poprosić o napisanie lub zmodyfikowanie kodu w edytorze.

![20251022163405](https://static-docs.nocobase.com/20251022163405.png)

### Sposób użycia

W edytorze kodu należy kliknąć `Nathana`, aby otworzyć okno dialogowe. Kod z edytora zostanie automatycznie dołączony do pola wprowadzania jako kontekst aplikacji i wysłany do `Nathana`.

![20251022163935](https://static-docs.nocobase.com/20251022163935.png)

Wpisać swoje wymagania dotyczące kodowania, wysłać je do `Nathana` i poczekać na odpowiedź.

![20251022164041](https://static-docs.nocobase.com/20251022164041.png)

Kliknąć przycisk `Apply to editor` na bloku kodu przesłanym przez `Nathana`, aby nadpisać kod w edytorze jego propozycją.

![20251022164323](https://static-docs.nocobase.com/20251022164323.png)

Kliknąć przycisk `Run` w edytorze kodu, aby zobaczyć efekty w czasie rzeczywistym.

![20251022164436](https://static-docs.nocobase.com/20251022164436.png)

### Historia kodu

Klikając ikonę „Linii poleceń” w prawym górnym rogu okna dialogowego `Nathana`, mogą Państwo przejrzeć fragmenty kodu wysłane przez siebie oraz te otrzymane od `Nathana` w bieżącej sesji.

![20251022164644](https://static-docs.nocobase.com/20251022164644.png)

![20251022164713](https://static-docs.nocobase.com/20251022164713.png)