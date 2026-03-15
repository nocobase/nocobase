:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/ai-employees/quick-start).
:::

# Szybki start

Skonfigurujmy minimalną działającą konfigurację Pracowników AI w 5 minut.

## Instalacja wtyczki

Pracownicy AI są wbudowani w NocoBase (wtyczka `@nocobase/plugin-ai`), więc nie jest wymagana oddzielna instalacja.

## Konfiguracja modeli

Mogą Państwo skonfigurować usługi LLM z poziomu jednego z poniższych wejść:

1. Wejście administracyjne: `Ustawienia systemowe -> Pracownicy AI -> Usługa LLM`.
2. Skrót w interfejsie użytkownika: W panelu czatu AI, podczas wybierania modelu za pomocą przełącznika `Model Switcher`, należy kliknąć skrót „Dodaj usługę LLM”, aby przejść bezpośrednio do ustawień.

![quick-start-model-switcher-add-llm-service.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/quick-start-model-switcher-add-llm-service.png)

Zazwyczaj należy:
1. Wybrać dostawcę (Provider).
2. Wprowadzić klucz API (API Key).
3. Skonfigurować „Włączone modele” (`Enabled Models`); domyślnie można użyć opcji „Polecane” (Recommend).

## Włączanie wbudowanych pracowników

Wbudowani Pracownicy AI są domyślnie włączeni i zazwyczaj nie trzeba ich aktywować pojedynczo.

Jeśli muszą Państwo dostosować zakres dostępności (włączyć/wyłączyć konkretnego pracownika), można to zrobić za pomocą przełącznika „Włączone” (`Enabled`) na liście w `Ustawienia systemowe -> Pracownicy AI`.

![ai-employee-list-enable-switch.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-list-enable-switch.png)

## Rozpoczęcie współpracy

Na stronie aplikacji należy najechać kursorem na skrót w prawym dolnym rogu i wybrać Pracownika AI.
![ai-employees-entry-bottom-right.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employees-entry-bottom-right.png)

Kliknąć, aby otworzyć okno dialogowe czatu AI:

![chat-footer-employee-switcher-and-model-switcher.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/chat-footer-employee-switcher-and-model-switcher.png)

Mogą Państwo również:  
* Dodawać bloki
* Dodawać załączniki
* Włączyć wyszukiwanie w sieci
* Przełączać Pracowników AI
* Wybierać modele

Potrafią oni również automatycznie pobierać strukturę strony jako kontekst. Na przykład Dex w bloku formularza automatycznie pobiera strukturę pól formularza i wywołuje odpowiednie umiejętności, aby wykonać operacje na stronie.

## Szybkie zadania

Mogą Państwo ustawić predefiniowane zadania dla każdego Pracownika AI w bieżącej lokalizacji, co pozwala na rozpoczęcie pracy jednym kliknięciem – szybko i wygodnie.

<video controls class="rounded shadow"><source src="https://static-docs.nocobase.com/z-2025-11-02-12.19.33-2025-11-02-12-19-49.mp4" type="video/mp4"></video>

## Przegląd wbudowanych pracowników

NocoBase oferuje wielu wbudowanych Pracowników AI dostosowanych do różnych scenariuszy.

Wystarczy:

1. Skonfigurować usługi LLM.
2. Dostosować status włączenia pracowników (domyślnie są włączeni).
3. Wybrać model w rozmowie i rozpocząć współpracę.

| Nazwa pracownika | Rola | Kluczowe umiejętności |
| :--- | :--- | :--- |
| **Cole** | Asystent NocoBase | Pytania i odpowiedzi dotyczące produktu, przeszukiwanie dokumentacji |
| **Ellis** | Ekspert ds. e-mail | Pisanie wiadomości, generowanie podsumowań, sugestie odpowiedzi |
| **Dex** | Ekspert ds. porządkowania danych | Tłumaczenie pól, formatowanie, wyodrębnianie informacji |
| **Viz** | Analityk wglądów | Wgląd w dane, analiza trendów, interpretacja kluczowych wskaźników |
| **Lexi** | Asystent tłumaczeń | Tłumaczenia wielojęzyczne, wsparcie w komunikacji |
| **Vera** | Analityk badawczy | Wyszukiwanie w sieci, agregacja informacji, pogłębione badania |
| **Dara** | Ekspert ds. wizualizacji danych | Konfiguracja wykresów, generowanie raportów wizualnych |
| **Orin** | Ekspert ds. modelowania danych | Wsparcie w projektowaniu struktur kolekcji, sugestie pól |
| **Nathan** | Inżynier frontend | Wsparcie w pisaniu fragmentów kodu frontendowego, dostosowywanie stylów |

**Uwagi**

Niektórzy wbudowani Pracownicy AI nie pojawiają się na liście w prawym dolnym rogu, ponieważ mają dedykowane scenariusze pracy:

- Orin: strony modelowania danych.
- Dara: bloki konfiguracji wykresów.
- Nathan: JS Block i inne edytory kodu.