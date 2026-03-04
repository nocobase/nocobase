:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/ai-employees/configuration/admin-configuration).
:::

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
| -------- | ------------ | ---------- | ------- |
| **Definicja roli** | Podstawowa osobowość i kluczowe umiejętności pracownika | Stabilna i niezmienna, jak „CV” | Zapewnia spójność roli |
| **Dostosowanie zadań** | Konfiguracja dla różnych scenariuszy biznesowych | Elastyczna i regulowana | Dostosowuje się do konkretnych zadań |

**Mówiąc prościej:**

> „Definicja roli” określa, kim jest dany pracownik,
> a „Dostosowanie zadań” – co ma aktualnie robić.

Korzyści z takiego podejścia to:

* Rola pozostaje stała, ale może勝任 być wykorzystywana w różnych scenariuszach
* Aktualizacja lub zmiana zadań nie wpływa na samego pracownika
* Kontekst i zadania są niezależne, co ułatwia konserwację


## II. Proces konfiguracji (5 kroków)

### Krok 1: Konfiguracja usługi modelowej

Usługa modelowa jest jak mózg Pracownika AI i musi zostać najpierw skonfigurowana.

> 💡 Szczegółowe instrukcje konfiguracji znajdzie Pan/Pani w: [Konfiguracja usługi LLM](/ai-employees/features/llm-service)

**Ścieżka:**
`Ustawienia systemowe → Pracownik AI → LLM service`

![Wejście na stronę konfiguracji](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

Proszę kliknąć **Dodaj** i wypełnić następujące informacje:

| Element | Opis | Uwagi |
| ------ | -------------------------- | --------- |
| Provider | Np. OpenAI, Claude, Gemini, Kimi itp. | Kompatybilny z usługami używającymi tej samej specyfikacji |
| Klucz API | Klucz dostarczony przez dostawcę usługi | Proszę zachować poufność i regularnie zmieniać |
| Base URL | API Endpoint (opcjonalnie) | Wymaga modyfikacji przy użyciu proxy |
| Enabled Models | Rekomendowane modele / Wybór modeli / Ręczne wprowadzanie | Określa zakres modeli dostępnych w czacie |

![Tworzenie usługi dużego modelu](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

Po konfiguracji proszę użyć `Test flight`, aby **przetestować połączenie**.
W przypadku niepowodzenia proszę sprawdzić sieć, klucz API lub nazwę modelu.

![Test połączenia](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)


### Krok 2: Tworzenie Pracownika AI

> 💡 Szczegółowe instrukcje znajdzie Pan/Pani w: [Tworzenie Pracownika AI](/ai-employees/features/new-ai-employees)

Ścieżka: `Zarządzanie Pracownikami AI → Utwórz pracownika`

Proszę wypełnić podstawowe informacje:

| Pole | Wymagane | Przykład |
| ----- | -- | -------------- |
| Nazwa | ✓ | viz, dex, cole |
| Pseudonim | ✓ | Viz, Dex, Cole |
| Status włączenia | ✓ | Włączony |
| Biogram | - | „Ekspert ds. analizy danych” |
| Główny prompt | ✓ | Patrz Przewodnik inżynierii promptów |
| Wiadomość powitalna | - | „Witaj, jestem Viz…” |

![Konfiguracja podstawowych informacji](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-21-09.png)

Na etapie tworzenia pracownika konfiguruje się głównie rolę i umiejętności. Konkretny model można wybrać podczas rozmowy za pomocą `Model Switcher`.

**Sugestie dotyczące pisania promptów:**

* Proszę jasno określić rolę, ton i obowiązki pracownika
* Proszę używać słów takich jak „musi” i „nigdy”, aby podkreślić zasady
* Proszę w miarę możliwości dołączać przykłady, aby unikać abstrakcyjnych opisów
* Proszę zachować długość między 500 a 1000 znaków

> Im jaśniejszy prompt, tym stabilniejsze działanie AI.
> Może Pan/Pani zapoznać się z [Przewodnikiem inżynierii promptów](./prompt-engineering-guide.md).


### Krok 3: Konfiguracja umiejętności

Umiejętności określają, co pracownik „może robić”.

> 💡 Szczegółowe instrukcje znajdzie Pan/Pani w: [Umiejętności](/ai-employees/features/tool)

| Typ | Zakres możliwości | Przykład | Poziom ryzyka |
| ---- | ------- | --------- | ------ |
| Frontend | Interakcja ze stroną | Odczytywanie danych z bloku, wypełnianie formularzy | Niski |
| Model danych | Zapytania i analiza danych | Statystyki agregowane | Średni |
| Przepływ pracy | Wykonywanie procesów biznesowych | Niestandardowe narzędzia | Zależy od przepływu pracy |
| Inne | Rozszerzenia zewnętrzne | Wyszukiwanie w sieci, operacje na plikach | Zależy od sytuacji |

**Sugestie dotyczące konfiguracji:**

* Optymalna liczba umiejętności na pracownika to 3–5
* Nie zaleca się wybierania wszystkich umiejętności, ponieważ może to prowadzić do zamieszania
* Dla ważnych operacji zaleca się używanie uprawnienia `Ask` zamiast `Allow`

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

> 💡 Szczegółowe instrukcje znajdzie Pan/Pani w: [Zadania](/ai-employees/features/task)


### 1. Zadania na poziomie strony

Dotyczy całego zakresu strony, np. „Analiza danych na tej stronie”.

**Punkt wejścia konfiguracji:**
`Ustawienia strony → Pracownik AI → Dodaj zadanie`

| Pole | Opis | Przykład |
| ---- | -------- | --------- |
| Tytuł | Nazwa zadania | Analiza konwersji etapów |
| Kontekst | Kontekst bieżącej strony | Strona listy leadów |
| Domyślna wiadomość | Wstępnie ustawiona rozmowa | „Proszę przeanalizować trendy z tego miesiąca” |
| Domyślny blok | Automatyczne powiązanie z kolekcją | tabela leads |
| Umiejętności | Dostępne narzędzia | Zapytania o dane, generowanie wykresów |

![Konfiguracja zadań na poziomie strony](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-40-34.png)

**Obsługa wielu zadań:**
Jeden Pracownik AI może mieć skonfigurowanych wiele zadań, które są prezentowane użytkownikowi w formie opcji do wyboru:

![Obsługa wielu zadań](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

Sugestie:

* Jedno zadanie powinno koncentrować się na jednym celu
* Nazwa powinna