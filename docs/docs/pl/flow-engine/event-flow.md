:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Przepływ zdarzeń

W FlowEngine wszystkie komponenty interfejsu są **sterowane zdarzeniami (event-driven)**.
Zachowanie, interakcje oraz zmiany danych komponentów są wywoływane przez zdarzenia i wykonywane w ramach przepływu.

## Przepływ statyczny a przepływ dynamiczny

W FlowEngine przepływy można podzielić na dwa typy:

### **1. Przepływ statyczny**

- Definiowany przez deweloperów w kodzie;
- Działa na **wszystkie instancje klasy modelu**;
- Często używany do obsługi ogólnej logiki klasy modelu;

### **2. Przepływ dynamiczny**

- Konfigurowany przez użytkowników w interfejsie;
- Działa tylko dla konkretnej instancji;
- Często używany do spersonalizowanych zachowań w określonych scenariuszach;

Krótko mówiąc: **przepływ statyczny to szablon logiki zdefiniowany na klasie, natomiast przepływ dynamiczny to spersonalizowana logika zdefiniowana na instancji.**

## Reguły powiązań a przepływ dynamiczny

W systemie konfiguracji FlowEngine istnieją dwa sposoby implementacji logiki zdarzeń:

### **1. Reguły powiązań**

- Są **enkapsulacjami wbudowanych kroków przepływu zdarzeń**;
- Prostsze w konfiguracji i bardziej semantyczne;
- Zasadniczo są one uproszczoną formą **przepływu zdarzeń (Flow)**.

### **2. Przepływ dynamiczny**

- Oferują pełne możliwości konfiguracji przepływu;
- Możliwość dostosowania:
  - **Wyzwalacz (on)**: definiuje, kiedy ma nastąpić wyzwolenie;
  - **Kroki wykonania (steps)**: definiują logikę do wykonania;
- Odpowiednie dla bardziej złożonej i elastycznej logiki biznesowej.

Zatem **reguły powiązań ≈ uproszczony przepływ zdarzeń**, a ich podstawowe mechanizmy są spójne.

## Spójność FlowAction

Zarówno **reguły powiązań**, jak i **przepływy zdarzeń** powinny używać tego samego zestawu **FlowAction**.
Oznacza to, że:

- **FlowAction** definiuje akcje, które mogą być wywołane przez przepływ;
- Obie współdzielą jeden system akcji, zamiast implementować dwa oddzielne;
- Zapewnia to ponowne wykorzystanie logiki i spójne rozszerzanie.

## Hierarchia pojęć

Koncepcyjnie, podstawowa abstrakcyjna relacja FlowModel jest następująca:

```bash
FlowModel
 └── FlowDefinition
      ├── FlowEventDefinition
      │     ├── Zdarzenia globalne (Global Events)
      │     └── Zdarzenia lokalne (Local Events)
      └── FlowActionDefinition
            ├── Akcje globalne (Global Actions)
            └── Akcje lokalne (Local Actions)
```

### Opis hierarchii

- **FlowModel**
  Reprezentuje encję modelu z konfigurowalną i wykonywalną logiką przepływu.

- **FlowDefinition**
  Definiuje kompletny zestaw logiki przepływu (zawierający warunki wyzwalania i kroki wykonania).

- **FlowEventDefinition**
  Definiuje źródło wyzwalania przepływu, w tym:
  - **Zdarzenia globalne**: takie jak uruchomienie aplikacji, zakończenie ładowania danych;
  - **Zdarzenia lokalne**: takie jak zmiany pól, kliknięcia przycisków.

- **FlowActionDefinition**
  Definiuje akcje, które mogą być wykonane przez przepływ, w tym:
  - **Akcje globalne**: takie jak odświeżenie strony, globalne powiadomienia;
  - **Akcje lokalne**: takie jak modyfikacja wartości pól, zmiana stanu komponentów.

## Podsumowanie

| Koncepcja | Cel | Zakres działania |
|------|------|-----------|
| **Przepływ statyczny (Static Flow)** | Logika przepływu zdefiniowana w kodzie | Wszystkie instancje XXModel |
| **Przepływ dynamiczny (Dynamic Flow)** | Logika przepływu zdefiniowana w interfejsie | Pojedyncza instancja FlowModel |
| **FlowEvent** | Definiuje wyzwalacz (kiedy wyzwolić) | Globalny lub lokalny |
| **FlowAction** | Definiuje logikę wykonania | Globalny lub lokalny |
| **Reguła powiązań (Linkage Rule)** | Uproszczona enkapsulacja kroków przepływu zdarzeń | Poziom bloku, akcji |