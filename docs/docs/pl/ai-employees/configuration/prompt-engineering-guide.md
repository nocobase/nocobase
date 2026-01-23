:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Agent AI · Przewodnik po inżynierii promptów

> Od "jak pisać" do "jak pisać dobrze" – ten przewodnik nauczy Pana/Panią, jak tworzyć wysokiej jakości prompty w prosty, stabilny i wielokrotnego użytku sposób.

## 1. Dlaczego prompty są kluczowe

Prompt to "opis stanowiska" dla agenta AI, który bezpośrednio określa jego styl, granice działania i jakość generowanych wyników.

**Przykład porównawczy:**

❌ Nieprecyzyjny prompt:

```
Jesteś asystentem do analizy danych, pomagającym użytkownikom analizować dane.
```

✅ Jasny i kontrolowalny prompt:

```
Jesteś Viz, ekspertem w analizie danych.

Definicja roli
- Styl: wnikliwy, klarowny, zorientowany na wizualizację
- Misja: przekształcanie złożonych danych w zrozumiałe "historie z wykresów"

Przepływ pracy
1) Zrozumienie wymagań
2) Generowanie bezpiecznego kodu SQL (używając tylko SELECT)
3) Wydobywanie wniosków
4) Prezentacja za pomocą wykresów

Sztywne zasady
- MUSI: Używać tylko SELECT, nigdy nie modyfikować danych
- ZAWSZE: Domyślnie generować wizualizacje wykresów
- NIGDY: Nie fabrykować ani nie zgadywać danych

Format wyjściowy
Krótkie podsumowanie (2-3 zdania) + JSON wykresu ECharts
```

**Wniosek**: Dobry prompt jasno określa "kim jest, co ma robić, jak ma to robić i według jakich standardów", dzięki czemu działanie AI staje się stabilne i kontrolowalne.

## 2. "Dziewięć elementów" – złota formuła promptów

Sprawdzona w praktyce, skuteczna struktura:

```
Nazewnictwo + Podwójne instrukcje + Symulowane potwierdzenie + Powtórzenia + Sztywne zasady
+ Informacje kontekstowe + Pozytywne wzmocnienie + Przykłady referencyjne + Przykłady negatywne (opcjonalnie)
```

### 2.1 Opis elementów

| Element | Co rozwiązuje | Dlaczego jest skuteczny |
| ---- | ----------------- | ------------ |
| Nazewnictwo | Uściśla tożsamość i styl | Pomaga AI zbudować "poczucie roli" |
| Podwójne instrukcje | Rozróżnia "kim jestem" od "co mam zrobić" | Zmniejsza zamieszanie w pozycjonowaniu |
| Symulowane potwierdzenie | Powtarza zrozumienie przed wykonaniem | Zapobiega odchyleniom |
| Powtórzenia | Kluczowe punkty pojawiają się wielokrotnie | Zwiększa priorytet |
| Sztywne zasady | MUSI/ZAWSZE/NIGDY | Ustanawia podstawę |
| Informacje kontekstowe | Niezbędna wiedza i ograniczenia | Zmniejsza ryzyko błędnego zrozumienia |
| Pozytywne wzmocnienie | Kieruje oczekiwaniami i stylem | Bardziej stabilny ton i działanie |
| Przykłady referencyjne | Dostarcza bezpośredni model do naśladowania | Wynik jest bliższy oczekiwaniom |
| Przykłady negatywne | Pozwala uniknąć typowych pułapek | Koryguje błędy, stając się dokładniejszym z każdym użyciem |

### 2.2 Szablon szybkiego startu

```yaml
# 1) Nazewnictwo
Jesteś [Imię], doskonałym [Rola/Specjalizacja].

# 2) Podwójne instrukcje
## Rola
Styl: [Przymiotnik x2-3]
Misja: [Jednozdaniowe podsumowanie głównej odpowiedzialności]

## Przepływ pracy zadania
1) Zrozumienie: [Kluczowy punkt]
2) Wykonanie: [Kluczowy punkt]
3) Weryfikacja: [Kluczowy punkt]
4) Prezentacja: [Kluczowy punkt]

# 3) Symulowane potwierdzenie
Przed wykonaniem powtórz zrozumienie: "Rozumiem, że potrzebuje Pan/Pani... Zrealizuję to poprzez..."

# 4) Powtórzenia
Kluczowe wymaganie: [1-2 najbardziej krytyczne punkty] (pojawiają się co najmniej dwa razy na początku/w przepływie pracy/na końcu)

# 5) Sztywne zasady
MUSI: [Zasada, której nie można złamać]
ZAWSZE: [Zasada, której należy zawsze przestrzegać]
NIGDY: [Działanie wyraźnie zabronione]

# 6) Informacje kontekstowe
[Niezbędna wiedza dziedzinowa/kontekst/częste pułapki]

# 7) Pozytywne wzmocnienie
Doskonale radzi Pan/Pani sobie w [Zdolność] i jest Pan/Pani biegły/a w [Specjalność]. Proszę zachować ten styl, aby ukończyć zadanie.

# 8) Przykłady referencyjne
[Podaj zwięzły przykład "idealnego wyniku"]

# 9) Przykłady negatywne (opcjonalnie)
- [Nieprawidłowy sposób] → [Prawidłowy sposób]
```

## 3. Praktyczny przykład: Viz (Analiza danych)

Poniżej połączymy dziewięć elementów, aby stworzyć kompletny, "gotowy do użycia" przykład.

```text
# Nazewnictwo
Jesteś Viz, ekspertem w analizie danych.

# Podwójne instrukcje
【Rola】
Styl: wnikliwy, klarowny, zorientowany na wizualizację
Misja: przekształcanie złożonych danych w "historie z wykresów"

【Przepływ pracy zadania】
1) Zrozumienie: Analiza wymagań użytkownika dotyczących danych i zakresu metryk
2) Zapytanie: Generowanie bezpiecznego kodu SQL (zapytania tylko o rzeczywiste dane, tylko SELECT)
3) Analiza: Wydobywanie kluczowych wniosków (trendy/porównania/proporcje)
4) Prezentacja: Wybór odpowiedniego wykresu dla jasnego przedstawienia

# Symulowane potwierdzenie
Przed wykonaniem powtórz: "Rozumiem, że chce Pan/Pani analizować [obiekt/zakres], a wyniki przedstawię za pomocą [metody zapytania i wizualizacji]."

# Powtórzenia
Ponownie podkreślam: priorytetem jest autentyczność danych, jakość ponad ilość; jeśli dane nie są dostępne, należy to szczerze zaznaczyć.

# Sztywne zasady
MUSI: Używać tylko zapytań SELECT, nie modyfikować żadnych danych
ZAWSZE: Domyślnie generować wizualizacje wykresów
NIGDY: Nie fabrykować ani nie zgadywać danych

# Informacje kontekstowe
- ECharts wymaga konfiguracji "czystego JSON", bez komentarzy/funkcji
- Każdy wykres powinien koncentrować się na jednym temacie, unikać kumulowania wielu metryk

# Pozytywne wzmocnienie
Potrafi Pan/Pani doskonale wydobywać praktyczne wnioski z rzeczywistych danych i wyrażać je za pomocą najprostszych wykresów.

# Przykłady referencyjne
Opis (2-3 zdania) + JSON wykresu

Przykładowy opis:
W tym miesiącu dodano 127 nowych leadów, co oznacza wzrost o 23% w stosunku do poprzedniego miesiąca, głównie z kanałów zewnętrznych.

Przykładowy wykres:
{
  "title": {"text": "Trend leadów w tym miesiącu"},
  "tooltip": {"trigger": "axis"},
  "xAxis": {"type": "category", "data": ["Week1","Week2","Week3","Week4"]},
  "yAxis": {"type": "value"},
  "series": [{"type": "line", "data": [28,31,35,33]}]
}

# Przykłady negatywne (opcjonalnie)
- Mieszanie języków → Zachowaj spójność językową
- Przeładowane wykresy → Każdy wykres powinien wyrażać tylko jeden temat
- Niekompletne dane → Szczerze zaznacz "Brak dostępnych danych"
```

**Kluczowe aspekty projektu**

* "Autentyczność" pojawia się wielokrotnie w przepływie pracy, powtórzeniach i zasadach (silne przypomnienie)
* Wybór dwuczęściowego formatu wyjściowego "opis + JSON" ułatwia integrację z frontendem
* Jasne określenie "SQL tylko do odczytu" zmniejsza ryzyko

## 4. Jak doskonalić prompty w miarę upływu czasu

### 4.1 Pięcioetapowa iteracja

```
Zacznij od działającej wersji → Testuj na małą skalę → Rejestruj problemy → Dodawaj zasady/przykłady w odpowiedzi na problemy → Testuj ponownie
```

<img src="https://static-docs.nocobase.com/prompt-engineering-guide-2025-11-02-20-19-54.png" alt="Proces optymalizacji" width="50%">

Zaleca się jednoczesne przetestowanie 5–10 typowych zadań, wykonując jedną rundę w ciągu 30 minut.

### 4.2 Zasady i proporcje

* **Priorytet dla pozytywnego ukierunkowania**: Najpierw należy powiedzieć AI, co ma robić
* **Udoskonalenia oparte na problemach**: Dodawaj ograniczenia tylko wtedy, gdy pojawią się problemy
* **Umiarkowane ograniczenia**: Nie należy od razu narzucać wielu "zakazów"

Proporcja empiryczna: **80% pozytywnych : 20% negatywnych**.

### 4.3 Typowa optymalizacja

**Problem**: Przeładowane wykresy, słaba czytelność
**Optymalizacja**:

1. W "Informacjach kontekstowych" dodać: jeden temat na wykres
2. W "Przykładach referencyjnych" podać "wykres z jednym wskaźnikiem"
3. Jeśli problem powtarza się, dodać sztywne ograniczenie w "Sztywnych zasadach/Powtórzeniach"

## 5. Zaawansowane techniki

### 5.1 Użycie XML/tagów dla jaśniejszej struktury (zalecane dla długich promptów)

Gdy treść przekracza 1000 znaków lub może być myląca, użycie tagów do podziału na sekcje jest bardziej stabilne:

```xml
<Rola>Jesteś Dex, ekspertem w organizacji danych.</Rola>
<Styl>Skrupulatny, dokładny i uporządkowany.</Styl>

<Zadanie>
Musi być wykonane w następujących krokach:
1. Identyfikacja kluczowych pól
2. Ekstrakcja wartości pól
3. Standaryzacja formatu (Data RRRR-MM-DD)
4. Wyjście w formacie JSON
</Zadanie>

<Zasady>
MUSI: Zachować dokładność wartości pól
NIGDY: Nie zgadywać brakujących informacji
ZAWSZE: Oznaczać niepewne elementy
</Zasady>

<Przykład>
{"Imię i nazwisko":"Jan Kowalski","Data":"2024-01-15","Kwota":5000,"Status":"Potwierdzony"}
</Przykład>
```

### 5.2 Warstwowe podejście "Kontekst + Zadanie" (bardziej intuicyjne)

* **Kontekst** (długoterminowa stabilność): Kim jest ten agent, jaki ma styl i jakie posiada możliwości
* **Zadanie** (na żądanie): Co należy teraz zrobić, na jakie metryki się skupić i jaki jest domyślny zakres

To naturalnie pasuje do modelu NocoBase "Agent + Zadanie": **stały kontekst, elastyczne zadania**.

### 5.3 Modułowe ponowne użycie

Podziel często używane zasady na moduły, aby łączyć je i dopasowywać w razie potrzeby:

**Moduł bezpieczeństwa danych**

```
MUSI: Używać tylko SELECT
NIGDY: Nie wykonywać INSERT/UPDATE/DELETE
```

**Moduł struktury wyjściowej**

```
Wynik musi zawierać:
1) Krótki opis (2-3 zdania)
2) Główną treść (wykres/dane/kod)
3) Opcjonalne sugestie (jeśli istnieją)
```

## 6. Złote zasady (wnioski praktyczne)

1. Jeden agent AI powinien wykonywać jeden typ zadania; specjalizacja zapewnia większą stabilność
2. Przykłady są skuteczniejsze niż slogany; najpierw podaj pozytywne wzorce
3. Użyj MUSI/ZAWSZE/NIGDY, aby określić granice
4. Stosuj podejście zorientowane na proces, aby zmniejszyć niepewność
5. Działaj małymi krokami, testuj więcej, zmieniaj mniej i iteruj w sposób ciągły
6. Nie nakładaj zbyt wielu ograniczeń; unikaj "zaszywania na stałe" zachowania
7. Rejestruj problemy i zmiany, aby tworzyć wersje
8. 80/20: Najpierw wyjaśnij "jak zrobić to dobrze", a następnie ogranicz "czego nie robić źle"

## 7. Często zadawane pytania (FAQ)

**P1: Jaka jest idealna długość?**

* Podstawowy agent: 500–800 znaków
* Złożony agent: 800–1500 znaków
* Nie zaleca się >2000 znaków (może spowalniać i być zbędne)
  Standard: Wszystkie dziewięć elementów jest uwzględnionych, ale bez zbędnych słów.

**P2: Co zrobić, jeśli agent AI nie przestrzega instrukcji?**

1. Użyj MUSI/ZAWSZE/NIGDY, aby jasno określić granice
2. Powtórz kluczowe wymagania 2–3 razy
3. Użyj tagów/sekcji, aby wzmocnić strukturę
4. Podaj więcej pozytywnych przykładów, mniej abstrakcyjnych zasad
5. Oceń, czy potrzebny jest mocniejszy model

**P3: Jak zrównoważyć pozytywne i negatywne wskazówki?**
Najpierw napisz części pozytywne (rola, przepływ pracy, przykłady), a następnie dodaj ograniczenia w oparciu o błędy, ograniczając tylko te punkty, które są "wielokrotnie błędne".

**P4: Czy należy często aktualizować?**

* Kontekst (tożsamość/styl/podstawowe możliwości): Długoterminowa stabilność
* Zadanie (scenariusz/metryki/zakres): Dostosuj do potrzeb biznesowych
* W przypadku zmian utwórz nową wersję i zanotuj "dlaczego została zmieniona".

## 8. Kolejne kroki

**Praktyczne ćwiczenia**

* Wybierz prostą rolę (np. asystenta obsługi klienta), napisz "działającą wersję" z wykorzystaniem dziewięciu elementów i przetestuj ją na 5 typowych zadaniach
* Znajdź istniejącego agenta, zbierz 3–5 rzeczywistych problemów i przeprowadź małą iterację

**Dalsza lektura**

* [Agent AI · Przewodnik konfiguracji administratora](./admin-configuration.md): Wdrażanie promptów w rzeczywistej konfiguracji
* Dedykowane instrukcje dla każdego agenta AI: Zobacz kompletne szablony ról/zadań

## Podsumowanie

**Najpierw uruchom, potem dopracuj.**
Zacznij od "działającej" wersji i w ramach rzeczywistych zadań nieustannie zbieraj problemy, dodawaj przykłady i udoskonalaj zasady.
Pamiętaj: **Najpierw powiedz, jak ma robić rzeczy dobrze (pozytywne ukierunkowanie), a następnie ograniczaj, aby nie robiło ich źle (umiarkowane ograniczenie).**