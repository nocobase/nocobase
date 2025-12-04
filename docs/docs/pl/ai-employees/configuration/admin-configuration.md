:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Pracownik AI · Przewodnik konfiguracji dla administratora

Ten dokument pomoże Panu/Pani szybko zrozumieć, jak skonfigurować i zarządzać Pracownikami AI, prowadząc krok po kroku przez cały proces – od usług modelowych po przydzielanie zadań.

## I. Zanim zaczniemy

### 1. Wymagania systemowe

Przed przystąpieniem do konfiguracji proszę upewnić się, że środowisko spełnia następujące warunki:

* Zainstalowany **NocoBase 2.0 lub nowszy**
* Włączona **wtyczka Pracownik AI**
* Dostępna co najmniej jedna **usługa dużego modelu językowego** (np. OpenAI, Claude, DeepSeek, GLM itp.)

### 2. Zrozumienie dwuwarstwowej architektury Pracowników AI

Pracownicy AI są podzieleni na dwie warstwy: **„Definicja roli”** i **„Dostosowanie zadań”**.

| Warstwa | Opis | Charakterystyka | Funkcja |
|---|---|---|---|
| **Definicja roli** | Podstawowa osobowość i kluczowe umiejętności pracownika | Stabilna i niezmienna, jak „CV” | Zapewnia spójność roli |
| **Dostosowanie zadań** | Konfiguracja dla różnych scenariuszy biznesowych | Elastyczna i regulowana | Dostosowuje się do konkretnych zadań |

**Mówiąc prościej:**

> „Definicja roli” określa, kim jest dany pracownik,
> a „Dostosowanie zadań” – co ma aktualnie robić.

Korzyści z takiego podejścia to:

* Rola pozostaje stała, ale może być wykorzystywana w różnych scenariuszach
* Aktualizacja lub zmiana zadań nie wpływa na samego pracownika
* Kontekst i zadania są niezależne, co ułatwia konserwację

## II. Proces konfiguracji (5 kroków)

### Krok 1: Konfiguracja usługi modelowej

Usługa modelowa jest jak mózg Pracownika AI i musi zostać najpierw skonfigurowana.

> 💡 Szczegółowe instrukcje konfiguracji znajdzie Pan/Pani w: [Konfiguracja usługi LLM](/ai-employees/quick-start/llm-service)

**Ścieżka:**
`Ustawienia systemowe → Pracownik AI → Usługa modelowa`

![Wejście na stronę konfiguracji](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

Proszę kliknąć **Dodaj** i wypełnić następujące informacje:

| Element | Opis | Uwagi |
|---|---|---|
| Typ interfejsu | Np. OpenAI, Claude itp. | Kompatybilny z usługami używającymi tej samej specyfikacji |
| Klucz API | Klucz dostarczony przez dostawcę usługi | Proszę zachować poufność i regularnie zmieniać |
| Adres usługi | Endpoint API | Wymaga modyfikacji przy użyciu proxy |
| Nazwa modelu | Konkretna nazwa modelu (np. gpt-4, claude-opus) | Wpływa na możliwości i koszty |

![Tworzenie usługi dużego modelu](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

Po konfiguracji proszę **przetestować połączenie**.
W przypadku niepowodzenia proszę sprawdzić sieć, klucz API lub nazwę modelu.

![Test połączenia](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)

### Krok 2: Tworzenie Pracownika AI

> 💡 Szczegółowe instrukcje znajdzie Pan/Pani w: [Tworzenie Pracownika AI](/ai-employees/quick-start/ai-employees)

Ścieżka: `Zarządzanie Pracownikami AI → Utwórz pracownika`

Proszę wypełnić podstawowe informacje:

| Pole | Wymagane | Przykład |
|---|---|---|
| Nazwa | ✓ | viz, dex, cole |
| Pseudonim | ✓ | Viz, Dex, Cole |
| Status włączenia | ✓ | Włączony |
| Opis | - | „Ekspert ds. analizy danych” |
| Główny prompt | ✓ | Patrz Przewodnik inżynierii promptów |
| Wiadomość powitalna | - | „Witaj, jestem Viz…” |

![Konfiguracja podstawowych informacji](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-21-09.png)

Następnie proszę powiązać właśnie skonfigurowaną **usługę modelową**.

![Wiązanie usługi dużego modelu](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-22-27.png)

**Sugestie dotyczące pisania promptów:**

* Proszę jasno określić rolę, ton i obowiązki pracownika
* Proszę używać słów takich jak „musi” i „nigdy”, aby podkreślić zasady
* Proszę w miarę możliwości dołączać przykłady, aby unikać abstrakcyjnych opisów
* Proszę zachować długość między 500 a 1000 znaków

> Im jaśniejszy prompt, tym stabilniejsze działanie AI.
> Może Pan/Pani zapoznać się z [Przewodnikiem inżynierii promptów](./prompt-engineering-guide.md).

### Krok 3: Konfiguracja umiejętności

Umiejętności określają, co pracownik „może robić”.

> 💡 Szczegółowe instrukcje znajdzie Pan/Pani w: [Umiejętności](/ai-employees/advanced/skill)

| Typ | Zakres możliwości | Przykład | Poziom ryzyka |
|---|---|---|---|
| Frontend | Interakcja ze stroną | Odczytywanie danych z bloku, wypełnianie formularzy | Niski |
| Model danych | Zapytania i analiza danych | Statystyki agregowane | Średni |
| Przepływ pracy | Wykonywanie procesów biznesowych | Niestandardowe narzędzia | Zależy od przepływu pracy |
| Inne | Rozszerzenia zewnętrzne | Wyszukiwanie w sieci, operacje na plikach | Zależy od sytuacji |

**Sugestie dotyczące konfiguracji:**

* Optymalna liczba umiejętności na pracownika to 3–5
* Nie zaleca się wybierania wszystkich umiejętności, ponieważ może to prowadzić do zamieszania
* Proszę wyłączyć automatyczne użycie (Auto usage) przed ważnymi operacjami

![Konfiguracja umiejętności](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-26-06.png)

### Krok 4: Konfiguracja bazy wiedzy (opcjonalnie)

Jeśli Pracownik AI potrzebuje zapamiętywać lub odwoływać się do dużej ilości materiałów, takich jak instrukcje produktów, FAQ itp., może Pan/Pani skonfigurować bazę wiedzy.

> 💡 Szczegółowe instrukcje znajdzie Pan/Pani w:
> - [Przegląd bazy wiedzy AI](/ai-employees/knowledge-base/index)
> - [Wektorowa baza danych](/ai-employees/knowledge-base/vector-database)
> - [Konfiguracja bazy wiedzy](/ai-employees/knowledge-base/knowledge-base)
> - [RAG (Retrieval-Augmented Generation)](/ai-employees/knowledge-base/rag)

Wymaga to dodatkowej instalacji wtyczki wektorowej bazy danych.

![Konfiguracja bazy wiedzy](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-32-54.png)

**Scenariusze zastosowania:**

* Umożliwienie AI zrozumienia wiedzy korporacyjnej
* Wsparcie dla pytań i odpowiedzi oraz wyszukiwania w dokumentach
* Szkolenie asystentów specjalizujących się w danej dziedzinie

### Krok 5: Weryfikacja efektów

Po zakończeniu zobaczy Pan/Pani awatar nowego pracownika w prawym dolnym rogu strony.

![Weryfikacja konfiguracji](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-36-54.png)

Proszę sprawdzić każdy element:

* ✅ Czy ikona wyświetla się poprawnie?
* ✅ Czy możliwe jest prowadzenie podstawowej rozmowy?
* ✅ Czy umiejętności mogą być poprawnie wywoływane?

Jeśli wszystkie punkty są zgodne, konfiguracja zakończyła się sukcesem 🎉

## III. Konfiguracja zadań: Uruchomienie Pracownika AI

Do tej pory zakończyliśmy „tworzenie pracownika”.
Następnym krokiem jest „przekazanie im pracy”.

Zadania AI definiują zachowanie pracownika na konkretnej stronie lub w bloku.

> 💡 Szczegółowe instrukcje znajdzie Pan/Pani w: [Zadania](/ai-employees/advanced/task)

### 1. Zadania na poziomie strony

Dotyczy całego zakresu strony, np. „Analiza danych na tej stronie”.

**Punkt wejścia konfiguracji:**
`Ustawienia strony → Pracownik AI → Dodaj zadanie`

| Pole | Opis | Przykład |
|---|---|---|
| Tytuł | Nazwa zadania | Analiza konwersji etapów |
| Kontekst | Kontekst bieżącej strony | Strona listy leadów |
| Domyślna wiadomość | Wstępnie ustawiona rozmowa | „Proszę przeanalizować trendy z tego miesiąca” |
| Domyślny blok | Automatyczne powiązanie z **kolekcją** | tabela leadów |
| Umiejętności | Dostępne narzędzia | Zapytania o dane, generowanie wykresów |

![Konfiguracja zadań na poziomie strony](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-40-34.png)

**Obsługa wielu zadań:**
Jeden Pracownik AI może mieć skonfigurowanych wiele zadań, które są prezentowane użytkownikowi w formie opcji do wyboru:

![Obsługa wielu zadań](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

Sugestie:

* Jedno zadanie powinno koncentrować się na jednym celu
* Nazwa powinna być jasna i łatwa do zrozumienia
* Proszę ograniczyć liczbę zadań do 5–7

### 2. Zadania na poziomie bloku

Odpowiednie do operacji na konkretnym bloku, np. „Przetłumacz bieżący formularz”.

**Metoda konfiguracji:**

1. Otworzyć konfigurację akcji bloku
2. Dodać „Pracownika AI”

![Przycisk Dodaj Pracownika AI](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-51-06.png)

3. Powiązać docelowego pracownika

![Wybór Pracownika AI](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-52-26.png)

![Konfiguracja zadań na poziomie bloku](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-53-35.png)

| Porównanie | Poziom strony | Poziom bloku |
|---|---|---|
| Zakres danych | Cała strona | Bieżący blok |
| Granularność | Analiza globalna | Szczegółowe przetwarzanie |
| Typowe zastosowanie | Analiza trendów | Tłumaczenie formularzy, ekstrakcja pól |

## IV. Najlepsze praktyki

### 1. Sugestie dotyczące konfiguracji

| Element | Sugestia | Powód |
|---|---|---|
| Liczba umiejętności | 3–5 | Wysoka dokładność, szybka reakcja |
| Automatyczne użycie | Włączać ostrożnie | Zapobiega przypadkowym operacjom |
| Długość promptu | 500–1000 znaków | Równowaga między szybkością a jakością |
| Cel zadania | Pojedynczy i jasny | Zapobiega dezorientacji AI |
| Przepływ pracy | Używać po hermetyzacji złożonych zadań | Wyższa skuteczność |

### 2. Praktyczne sugestie

**Zaczynać od małych kroków, optymalizować stopniowo:**

1. Najpierw utworzyć podstawowych pracowników (np. Viz, Dex)
2. Włączyć 1–2 kluczowe umiejętności do testowania
3. Potwierdzić, że zadania są wykonywane prawidłowo
4. Następnie stopniowo rozszerzać o więcej umiejętności i zadań

**Ciągły proces optymalizacji:**

1. Uruchomić wersję początkową
2. Zbieranie opinii użytkowników
3. Optymalizacja promptów i konfiguracji zadań
4. Testowanie i cykliczne ulepszanie

## V. Często zadawane pytania

### 1. Etap konfiguracji

**P: Co zrobić, jeśli zapisywanie się nie powiedzie?**
O: Proszę sprawdzić, czy wszystkie wymagane pola zostały wypełnione, zwłaszcza usługa modelowa i prompt.

**P: Który model powinienem wybrać?**

* Związane z kodem → Claude, GPT-4
* Związane z analizą → Claude, DeepSeek
* Wrażliwe na koszty → Qwen, GLM
* Długi tekst → Gemini, Claude

### 2. Etap użytkowania

**P: Odpowiedź AI jest zbyt wolna?**

* Zmniejszyć liczbę umiejętności
* Zoptymalizować prompt
* Sprawdzić opóźnienie usługi modelowej
* Rozważyć zmianę modelu

**P: Wykonanie zadania jest niedokładne?**

* Prompt jest niewystarczająco jasny
* Zbyt wiele umiejętności powoduje zamieszanie
* Podzielić zadanie na mniejsze części, dodać przykłady

**P: Kiedy należy włączyć automatyczne użycie (Auto usage)?**

* Można włączyć dla zadań typu zapytania
* Zaleca się wyłączenie dla zadań modyfikujących dane

**P: Jak sprawić, by AI przetwarzała konkretny formularz?**

O: W przypadku konfiguracji na poziomie strony, należy ręcznie wybrać blok.

![Ręczne wybieranie bloku](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-02-22.png)

W przypadku konfiguracji zadań na poziomie bloku, kontekst danych jest automatycznie wiązany.

## VI. Dalsza lektura

Aby Pracownicy AI byli jeszcze potężniejsi, może Pan/Pani kontynuować lekturę następujących dokumentów:

**Związane z konfiguracją:**

* [Przewodnik inżynierii promptów](./prompt-engineering-guide.md) - Techniki i najlepsze praktyki pisania wysokiej jakości promptów
* [Konfiguracja usługi LLM](/ai-employees/quick-start/llm-service) - Szczegółowe instrukcje konfiguracji usług dużych modeli
* [Tworzenie Pracownika AI](/ai-employees/quick-start/ai-employees) - Tworzenie i podstawowa konfiguracja Pracowników AI
* [Współpraca z Pracownikiem AI](/ai-employees/quick-start/collaborate) - Jak prowadzić efektywne rozmowy z Pracownikami AI

**Funkcje zaawansowane:**

* [Umiejętności](/ai-employees/advanced/skill) - Dogłębne zrozumienie konfiguracji i użycia różnych umiejętności
* [Zadania](/ai-employees/advanced/task) - Zaawansowane techniki konfiguracji zadań
* [Wybór bloku](/ai-employees/advanced/pick-block) - Jak przypisać bloki danych Pracownikom AI
* [Źródło danych](/ai-employees/advanced/datasource) - Konfiguracja i zarządzanie **źródłami danych**
* [Wyszukiwanie w sieci](/ai-employees/advanced/web-search) - Konfiguracja możliwości wyszukiwania w sieci dla Pracowników AI

**Baza wiedzy i RAG:**

* [Przegląd bazy wiedzy AI](/ai-employees/knowledge-base/index) - Wprowadzenie do funkcji bazy wiedzy
* [Wektorowa baza danych](/ai-employees/knowledge-base/vector-database) - Konfiguracja wektorowej bazy danych
* [Baza wiedzy](/ai-employees/knowledge-base/knowledge-base) - Jak tworzyć i zarządzać bazą wiedzy
* [RAG (Retrieval-Augmented Generation)](/ai-employees/knowledge-base/rag) - Zastosowanie technologii RAG

**Integracja z przepływami pracy:**

* [Węzeł LLM - Czat tekstowy](/ai-employees/workflow/nodes/llm/chat) - Użycie czatu tekstowego w **przepływach pracy**
* [Węzeł LLM - Czat multimodalny](/ai-employees/workflow/nodes/llm/multimodal-chat) - Obsługa wejść multimodalnych, takich jak obrazy i pliki
* [Węzeł LLM - Strukturalne wyjście](/ai-employees/workflow/nodes/llm/structured-output) - Uzyskiwanie strukturalnych odpowiedzi AI

## Zakończenie

Najważniejsza rzecz podczas konfiguracji Pracowników AI to: **najpierw uruchomić, potem optymalizować**.
Najpierw proszę sprawić, aby pierwszy pracownik pomyślnie rozpoczął pracę, a następnie stopniowo rozszerzać i dostosowywać.

Kierunki rozwiązywania problemów można ustalić w następującej kolejności:

1. Czy usługa modelowa jest połączona?
2. Czy liczba umiejętności nie jest zbyt duża?
3. Czy prompt jest jasny?
4. Czy cel zadania jest jasno określony?

Postępując krok po kroku, może Pan/Pani zbudować naprawdę efektywny zespół AI.