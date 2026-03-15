---
pkg: "@nocobase/plugin-ai"
---

:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/ai-employees/index).
:::

# Przegląd

![clipboard-image-1771905619](https://static-docs.nocobase.com/clipboard-image-1771905619.png)

Pracownicy AI (`AI Employees`) to możliwości agentów inteligentnych głęboko zintegrowane z systemami biznesowymi NocoBase.

Nie są to roboty „potrafiące tylko rozmawiać”, lecz „cyfrowi współpracownicy”, którzy mogą bezpośrednio rozumieć kontekst i wykonywać operacje w interfejsie biznesowym:

- **Rozumieją kontekst biznesowy**: postrzegają bieżącą stronę, bloki, strukturę danych i wybraną treść.
- **Mogą bezpośrednio wykonywać działania**: mogą wywoływać umiejętności w celu realizacji zadań takich jak zapytania, analiza, wypełnianie, konfiguracja i generowanie.
- **Współpraca oparta na rolach**: możliwość konfigurowania przez Państwa różnych pracowników według stanowisk i przełączania modeli w celu współpracy w ramach rozmowy.

## 5-minutowa ścieżka rozpoczęcia

Prosimy najpierw zapoznać się z sekcją [Szybki start](/ai-employees/quick-start) i wykonać minimalną konfigurację w następującej kolejności:

1. Skonfigurować co najmniej jedną [usługę LLM](/ai-employees/features/llm-service).
2. Włączyć co najmniej jednego [Pracownika AI](/ai-employees/features/enable-ai-employee).
3. Otworzyć rozmowę i rozpocząć [współpracę z Pracownikami AI](/ai-employees/features/collaborate).
4. Włączyć [wyszukiwanie w sieci](/ai-employees/features/web-search) i [szybkie zadania](/ai-employees/features/task) zgodnie z Państwa potrzebami.

## Mapa funkcji

### A. Podstawowa konfiguracja (Administrator)

- [Konfiguracja usługi LLM](/ai-employees/features/llm-service): podłączanie dostawców (Provider), konfigurowanie i zarządzanie dostępnymi modelami.
- [Włączanie Pracowników AI](/ai-employees/features/enable-ai-employee): włączanie/wyłączanie wbudowanych pracowników i kontrolowanie zakresu ich dostępności.
- [Tworzenie nowego Pracownika AI](/ai-employees/features/new-ai-employees): definiowanie roli, osobowości (Role setting), wiadomości powitalnej i granic możliwości.
- [Korzystanie z umiejętności](/ai-employees/features/tool): konfigurowanie uprawnień do umiejętności (`Ask` / `Allow`) i kontrolowanie ryzyka wykonania.

### B. Codzienna współpraca (Użytkownik biznesowy)

- [Współpraca z Pracownikami AI](/ai-employees/features/collaborate): przełączanie pracowników i modeli wewnątrz rozmowy w celu ciągłej współpracy.
- [Dodawanie kontekstu - Bloki](/ai-employees/features/pick-block): wysyłanie bloków strony jako kontekstu do AI.
- [Szybkie zadania](/ai-employees/features/task): wstępne ustawianie typowych zadań na stronach/blokach i ich wykonywanie jednym kliknięciem.
- [Wyszukiwanie w sieci](/ai-employees/features/web-search): włączanie wyszukiwania w celu uzyskania aktualnych informacji, gdy jest to potrzebne.

### C. Zaawansowane możliwości (Rozszerzenia)

- [Wbudowani Pracownicy AI](/ai-employees/features/built-in-employee): zrozumienie pozycjonowania i scenariuszy zastosowania wstępnie ustawionych pracowników.
- [Kontrola uprawnień](/ai-employees/permission): kontrolowanie dostępu do pracowników, umiejętności i danych zgodnie z modelem uprawnień organizacji.
- [Baza wiedzy AI](/ai-employees/knowledge-base/index): wprowadzanie wiedzy korporacyjnej w celu poprawy stabilności i identyfikowalności odpowiedzi.
- [Węzeł LLM w przepływie pracy](/ai-employees/workflow/nodes/llm/chat): orkiestracja możliwości AI w zautomatyzowanych procesach.

## Kluczowe pojęcia (zalecane wcześniejsze ujednolicenie)

Poniższe terminy są zgodne ze słownikiem; zaleca się, aby Państwo używali ich jednolicie w zespole:

- **Pracownik AI (AI Employee)**: wykonywalny agent składający się z ustawień roli (Role setting) i umiejętności (Tool / Skill).
- **Usługa LLM (LLM Service)**: jednostka dostępu do modeli i konfiguracji możliwości, służąca do zarządzania dostawcami (Provider) i listami modeli.
- **Dostawca (Provider)**: dostawca modelu stojący za usługą LLM.
- **Włączone modele (Enabled Models)**: zestaw modeli, które bieżąca usługa LLM pozwala wybrać w rozmowie.
- **Przełącznik Pracowników AI (AI Employee Switcher)**: przełączanie aktualnie współpracującego pracownika wewnątrz rozmowy.
- **Przełącznik modeli (Model Switcher)**: przełączanie modeli wewnątrz rozmowy i zapamiętywanie preferencji dla każdego pracownika.
- **Umiejętność (Tool / Skill)**: jednostka możliwości wykonawczych, którą AI może wywołać.
- **Uprawnienia umiejętności (Permission: Ask / Allow)**: określenie, czy przed wywołaniem umiejętności wymagane jest potwierdzenie przez człowieka.
- **Kontekst (Context)**: informacje o środowisku biznesowym, takie jak strony, bloki, struktury danych itp.
- **Rozmowa (Chat)**: proces ciągłej interakcji między użytkownikiem a Pracownikiem AI.
- **Wyszukiwanie w sieci (Web Search)**: możliwość uzupełniania odpowiedzi o informacje w czasie rzeczywistym na podstawie wyszukiwania zewnętrznego.
- **Baza wiedzy (Knowledge Base / RAG)**: wprowadzanie wiedzy korporacyjnej poprzez generowanie wspomagane wyszukiwaniem.
- **Magazyn wektorowy (Vector Store)**: zbiór danych wektorowych zapewniający możliwości wyszukiwania semantycznego dla bazy wiedzy.

## Instrukcja instalacji

Pracownicy AI to wbudowana wtyczka NocoBase (`@nocobase/plugin-ai`), gotowa do użycia bez konieczności oddzielnej instalacji.