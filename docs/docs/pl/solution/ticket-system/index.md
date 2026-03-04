:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/solution/ticket-system/index).
:::

# Przegląd rozwiązania zgłoszeń (Ticketing)

> **Wskazówka**: To jest wczesna wersja zapoznawcza. Funkcje są wciąż udoskonalane, a my stale pracujemy nad ulepszeniami. Zapraszamy do przesyłania opinii!

## 1. Tło (Dlaczego)

### Rozwiązywane problemy branżowe / stanowiskowe / zarządcze

Przedsiębiorstwa borykają się z różnymi rodzajami zgłoszeń serwisowych w codziennej działalności: naprawy sprzętu, wsparcie IT, reklamacje klientów, zapytania ofertowe itp. Źródła tych zgłoszeń są rozproszone (systemy CRM, inżynierowie terenowi, e-maile, formularze publiczne itp.), mają różne przepływy pracy i brakuje im ujednoliconych mechanizmów śledzenia oraz zarządzania.

**Przykładowe scenariusze biznesowe:**

- **Naprawa sprzętu**: Zespół ds. obsługi posprzedażowej obsługuje zgłoszenia naprawy sprzętu, wymagające rejestracji specyficznych informacji, takich jak numery seryjne, kody błędów czy części zamienne.
- **Wsparcie IT**: Dział IT obsługuje prośby pracowników o resetowanie haseł, instalację oprogramowania lub zgłoszenia awarii sieci.
- **Reklamacje klientów**: Zespół obsługi klienta zarządza reklamacjami z wielu kanałów; zgłoszenia od klientów o silnym zabarwieniu emocjonalnym wymagają priorytetowego traktowania.
- **Samoobsługa klienta**: Klienci końcowi chcą w wygodny sposób przesyłać zgłoszenia serwisowe i śledzić postępy ich realizacji.

### Profil docelowego użytkownika

| Wymiar | Opis |
|------|------|
| Wielkość firmy | Od MŚP po duże przedsiębiorstwa ze znacznymi potrzebami w zakresie obsługi klienta |
| Struktura ról | Zespoły obsługi klienta, wsparcie IT, zespoły posprzedażowe, kadra zarządzająca operacjami |
| Dojrzałość cyfrowa | Początkująca do średniozaawansowanej, dążąca do przejścia z zarządzania przez Excel/e-mail na zarządzanie systemowe |

### Problemy obecnych rozwiązań głównego nurtu

- **Wysoki koszt / powolna personalizacja**: Systemy SaaS do obsługi zgłoszeń są drogie, a cykle programowania niestandardowego są długie.
- **Fragmentacja systemów, silosy danych**: Dane biznesowe są rozproszone w różnych systemach, co utrudnia ujednoliconą analizę i podejmowanie decyzji.
- **Szybkie zmiany biznesowe, trudność w ewolucji**: Gdy zmieniają się wymagania biznesowe, systemy trudno jest szybko dostosować.
- **Powolna reakcja serwisu**: Zgłoszenia krążące między różnymi systemami nie mogą być niezwłocznie przydzielane.
- **Nieprzejrzysty proces**: Klienci nie mogą śledzić postępów zgłoszenia, a częste zapytania zwiększają obciążenie działu obsługi.
- **Trudność w zagwarantowaniu jakości**: Brak monitorowania SLA; brak terminowych alertów o przekroczeniu czasu i negatywnych opiniach.

---

## 2. Porównanie z produktami rynkowymi (Benchmark)

### Główne produkty na rynku

- **SaaS**: np. Salesforce, Zendesk, Odoo itp.
- **Systemy dedykowane / systemy wewnętrzne**

### Wymiary porównawcze

- Zakres funkcji
- Elastyczność
- Rozszerzalność
- Sposób wykorzystania AI

### Wyróżniki rozwiązania NocoBase

**Zalety na poziomie platformy:**

- **Priorytet konfiguracji**: Od podstawowych tabel danych, przez typy biznesowe, po SLA i routing umiejętności – wszystko zarządzane poprzez konfigurację.
- **Szybkie budowanie low-code**: Szybciej niż w przypadku programowania od zera i bardziej elastycznie niż w systemach SaaS.

**Czego tradycyjne systemy nie potrafią lub co jest w nich bardzo kosztowne:**

- **Natywna integracja AI**: Wykorzystanie wtyczek AI NocoBase do inteligentnej klasyfikacji, pomocy w wypełnianiu formularzy i rekomendacji wiedzy.
- **Możliwość kopiowania projektów przez użytkowników**: Użytkownicy mogą samodzielnie rozszerzać system w oparciu o szablony.
- **Architektura danych typu T**: Tabela główna + tabele rozszerzeń biznesowych; dodanie nowego typu biznesowego wymaga jedynie dodania tabeli rozszerzenia.

---

## 3. Zasady projektowania (Principles)

- **Niski koszt poznawczy**
- **Biznes przed technologią**
- **Ewolucyjność zamiast jednorazowego wdrożenia**
- **Najpierw konfiguracja, kod jako rozwiązanie awaryjne**
- **Współpraca człowieka z AI, a nie zastępowanie ludzi przez AI**
- **Wszystkie projekty powinny być możliwe do powielenia przez użytkowników**

---

## 4. Przegląd rozwiązania (Solution Overview)

### Podsumowanie

Uniwersalne centrum zgłoszeń zbudowane na platformie low-code NocoBase, zapewniające:

- **Ujednolicony punkt wejścia**: Integracja z wielu źródeł, standaryzowane przetwarzanie.
- **Inteligentna dystrybucja**: Klasyfikacja wspomagana przez AI, przydział oparty na równoważeniu obciążenia.
- **Polimorficzny biznes**: Rdzeń w postaci tabeli głównej + elastyczne tabele rozszerzeń biznesowych.
- **Zamknięta pętla informacji zwrotnej**: Monitorowanie SLA, oceny klientów, obsługa negatywnych opinii.

### Przepływ pracy zgłoszenia

```
Wejście z wielu źródeł → Przetwarzanie wstępne/Analiza AI → Inteligentny przydział → Wykonanie ręczne → Pętla zwrotna
          ↓                          ↓                          ↓                    ↓                ↓
 Sprawdzanie duplikatów      Rozpoznawanie intencji      Dopasowanie umiejętności  Przepływ statusów  Ocena satysfakcji
                             Analiza nastrojów           Równoważenie obciążenia   Monitorowanie SLA  Obsługa negatywnych opinii
                             Automatyczna odpowiedź      Zarządzanie kolejkami     Komunikacja        Archiwizacja danych
```

### Lista kluczowych modułów

| Moduł | Opis |
|------|------|
| Przyjmowanie zgłoszeń | Formularze publiczne, portal klienta, wprowadzanie przez agenta, API/Webhook, analiza e-maili |
| Zarządzanie zgłoszeniami | CRUD zgłoszeń, przepływ statusów, przydział/przekazanie, komunikacja w komentarzach, logi operacji |
| Rozszerzenia biznesowe | Naprawa sprzętu, wsparcie IT, reklamacje i inne tabele rozszerzeń biznesowych |
| Zarządzanie SLA | Konfiguracja SLA, alerty o przekroczeniu czasu, eskalacja |
| Zarządzanie klientami | Główna tabela klientów, zarządzanie kontaktami, portal klienta |
| System ocen | Wielowymiarowa punktacja, szybkie tagi, NPS, alerty o negatywnych opiniach |
| Wsparcie AI | Klasyfikacja intencji, analiza nastrojów, rekomendacje wiedzy, pomoc w odpowiedziach, szlifowanie tonu |

### Prezentacja kluczowego interfejsu

![ticketing-imgs-2026-01-01-00-46-12](https://static-docs.nocobase.com/ticketing-imgs-2026-01-01-00-46-12.jpg)

---

## 5. Pracownicy AI (AI Employee)

### Typy i scenariusze pracowników AI

- **Asystent obsługi klienta**, **Asystent sprzedaży**, **Analityk danych**, **Audytor**
- Wspieranie ludzi, a nie ich zastępowanie

### Kwantyfikacja wartości pracowników AI

W tym rozwiązaniu pracownicy AI mogą:

| Wymiar wartości | Konkretne efekty |
|----------|----------|
| Poprawa wydajności | Automatyczna klasyfikacja skraca czas ręcznego sortowania o ponad 50%; rekomendacje wiedzy przyspieszają rozwiązywanie problemów |
| Redukcja kosztów | Automatyczne odpowiedzi na proste pytania zmniejszają obciążenie personelu obsługi klienta |
| Wsparcie pracowników | Alerty o emocjach pomagają przygotować się do rozmowy; szlifowanie odpowiedzi poprawia jakość komunikacji |
| Poprawa satysfakcji klienta | Szybsza reakcja, dokładniejszy przydział, bardziej profesjonalne odpowiedzi |

---

## 6. Najważniejsze cechy (Highlights)

### 1. Architektura danych typu T

- Wszystkie zgłoszenia współdzielą tabelę główną z ujednoliconą logiką przepływu.
- Tabele rozszerzeń biznesowych zawierają pola specyficzne dla danego typu, co pozwala na elastyczną rozbudowę.
- Dodanie nowego typu biznesowego wymaga jedynie dodania tabeli rozszerzenia, bez wpływu na główny proces.

### 2. Pełny cykl życia zgłoszenia

- Nowe → Przypisane → W trakcie → Wstrzymane → Rozwiązane → Zamknięte.
- Obsługa złożonych scenariuszy, takich jak przekazanie, zwrot czy ponowne otwarcie.
- Odmierzanie czasu SLA z precyzją uwzględniającą pauzy w stanie wstrzymania.

### 3. Ujednolicona integracja wielokanałowa

- Formularze publiczne, portal klienta, API, e-mail, wprowadzanie przez agenta.
- Sprawdzanie idempotencji zapobiega powstawaniu duplikatów zgłoszeń.

### 4. Natywna integracja AI

- To nie jest tylko „dodanie przycisku AI”, ale integracja z każdym etapem procesu.
- Rozpoznawanie intencji, analiza nastrojów, rekomendacje wiedzy, szlifowanie odpowiedzi.

---

## 7. Mapa drogowa (Roadmap - stale aktualizowana)

- **Osadzanie w systemach**: Wsparcie dla osadzania modułu zgłoszeń w różnych systemach biznesowych, takich jak ERP, CRM itp.
- **Połączenie zgłoszeń**: Integracja ze zgłoszeniami systemów nadrzędnych i podrzędnych oraz zwrotne wywołania statusów dla współpracy między systemami.
- **Automatyzacja AI**: Pracownicy AI osadzeni w przepływach pracy, wspierający automatyczne działanie w tle bez nadzoru.
- **Obsługa wielu najemców**: Skalowanie poziome poprzez architekturę wielu przestrzeni/aplikacji, umożliwiające niezależne działanie różnym zespołom serwisowym.
- **Baza wiedzy RAG**: Automatyczna wektoryzacja wszystkich danych (zgłoszenia, klienci, produkty) w celu inteligentnego wyszukiwania i rekomendacji wiedzy.
- **Obsługa wielu języków**: Interfejs i treści wspierające przełączanie języków, aby sprostać potrzebom zespołów międzynarodowych i regionalnych.