:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/solution/ticket-system/design).
:::

# Szczegółowy projekt rozwiązania zgłoszeń

> **Wersja**: v2.0-beta

> **Data aktualizacji**: 2026-01-05

> **Status**: Wersja zapoznawcza

## 1. Przegląd systemu i koncepcja projektowa

### 1.1 Pozycjonowanie systemu

System ten jest **inteligentną platformą do zarządzania zgłoszeniami napędzaną przez AI**, zbudowaną w oparciu o platformę low-code NocoBase. Głównym celem jest:

```
Pozwolenie pracownikom obsługi klienta skupić się na rozwiązywaniu problemów, a nie na żmudnych operacjach procesowych
```

### 1.2 Koncepcja projektowa

#### Koncepcja pierwsza: Architektura danych typu T

**Czym jest architektura typu T?**

Nawiązuje ona do koncepcji "talentu typu T" — pozioma szerokość + pionowa głębokość:

- **Poziomo (Tabela główna)**: Obejmuje uniwersalne możliwości dla wszystkich typów biznesowych — numer zgłoszenia, status, osoba przypisana, SLA i inne kluczowe pola.
- **Pionowo (Tabele rozszerzeń)**: Specjalistyczne pola dla konkretnych rodzajów działalności — naprawa sprzętu zawiera numery seryjne, a reklamacje zawierają plany rekompensat.

![ticketing-imgs-2025-12-31-22-50-45](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-18-25.png)

**Dlaczego taka konstrukcja?**

| Tradycyjne rozwiązanie | Architektura typu T |
|------------------------|---------------------|
| Jedna tabela na każdy typ biznesu, powielone pola | Wspólne pola zarządzane centralnie, pola biznesowe rozszerzane wg potrzeb |
| Raporty statystyczne wymagają łączenia wielu tabel | Jedna główna tabela bezpośrednio zlicza wszystkie zgłoszenia |
| Zmiana procesu wymaga modyfikacji w wielu miejscach | Kluczowy proces zmieniany tylko w jednym miejscu |
| Nowy typ biznesu wymaga nowej tabeli | Wystarczy dodać tabelę rozszerzeń, główny przepływ pozostaje bez zmian |

#### Koncepcja druga: Zespół pracowników AI

To nie tylko "funkcje AI", ale "pracownicy AI". Każdy AI ma określoną rolę, osobowość i obowiązki:

| Pracownik AI | Stanowisko | Kluczowe obowiązki | Scenariusz wyzwalający |
|--------------|------------|-------------------|------------------------|
| **Sam** | Kierownik Service Desk | Kierowanie zgłoszeń, ocena priorytetów, decyzje o eskalacji | Automatycznie przy utworzeniu zgłoszenia |
| **Grace** | Ekspert ds. sukcesu klienta | Generowanie odpowiedzi, dostosowanie tonu, obsługa reklamacji | Po kliknięciu przez agenta "Odpowiedź AI" |
| **Max** | Asystent wiedzy | Podobne przypadki, rekomendacje wiedzy, synteza rozwiązań | Automatycznie na stronie szczegółów zgłoszenia |
| **Lexi** | Tłumacz | Tłumaczenie wielojęzyczne, tłumaczenie komentarzy | Automatycznie po wykryciu języka obcego |

**Dlaczego model "Pracownika AI"?**

- **Jasne obowiązki**: Sam zajmuje się dystrybucją, Grace odpowiedziami — brak zamieszania.
- **Łatwość zrozumienia**: Powiedzenie użytkownikowi "Niech Sam to przeanalizuje" jest bardziej przyjazne niż "Wywołaj API klasyfikacji".
- **Skalowalność**: Nowe możliwości AI = zatrudnienie nowego pracownika.

#### Koncepcja trzecia: Samoobieg wiedzy

![ticketing-imgs-2025-12-31-22-51-09](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-19-13.png)

Tworzy to zamkniętą pętlę **gromadzenia wiedzy i jej stosowania**.

---

## 2. Kluczowe encje i model danych

### 2.1 Przegląd relacji encji

![ticketing-imgs-2025-12-31-22-51-23](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-20-02.png)


### 2.2 Szczegóły kluczowych tabel

#### 2.2.1 Główna tabela zgłoszeń (nb_tts_tickets)

Jest to rdzeń systemu, wykorzystujący konstrukcję "szerokiej tabeli", w której wszystkie często używane pola znajdują się w tabeli głównej.

**Informacje podstawowe**

| Pole | Typ | Opis | Przykład |
|------|-----|------|----------|
| id | BIGINT | Klucz główny | 1001 |
| ticket_no | VARCHAR | Numer zgłoszenia | TKT-20251229-0001 |
| title | VARCHAR | Tytuł | Powolne połączenie sieciowe |
| description | TEXT | Opis problemu | Od rana sieć w biurze... |
| biz_type | VARCHAR | Typ biznesowy | it_support |
| priority | VARCHAR | Priorytet | P1 |
| status | VARCHAR | Status | processing |

**Śledzenie źródła**

| Pole | Typ | Opis | Przykład |
|------|-----|------|----------|
| source_system | VARCHAR | System źródłowy | crm / email / iot |
| source_channel | VARCHAR | Kanał źródłowy | web / phone / wechat |
| external_ref_id | VARCHAR | Zewnętrzny identyfikator | CRM-2024-0001 |

**Informacje kontaktowe**

| Pole | Typ | Opis |
|------|-----|------|
| customer_id | BIGINT | ID klienta |
| contact_name | VARCHAR | Imię i nazwisko kontaktu |
| contact_phone | VARCHAR | Telefon kontaktowy |
| contact_email | VARCHAR | E-mail kontaktowy |
| contact_company | VARCHAR | Nazwa firmy |

**Informacje o osobie obsługującej**

| Pole | Typ | Opis |
|------|-----|------|
| assignee_id | BIGINT | ID osoby przypisanej |
| assignee_department_id | BIGINT | ID departamentu osoby przypisanej |
| transfer_count | INT | Liczba przekazań |

**Punkty czasowe**

| Pole | Typ | Opis | Moment wyzwolenia |
|------|-----|------|-----------------|
| submitted_at | TIMESTAMP | Czas przesłania | Przy utworzeniu zgłoszenia |
| assigned_at | TIMESTAMP | Czas przypisania | Przy wyznaczeniu osoby obsługującej |
| first_response_at | TIMESTAMP | Czas pierwszej odpowiedzi | Przy pierwszej odpowiedzi do klienta |
| resolved_at | TIMESTAMP | Czas rozwiązania | Przy zmianie statusu na resolved |
| closed_at | TIMESTAMP | Czas zamknięcia | Przy zmianie statusu na closed |

**Powiązane z SLA**

| Pole | Typ | Opis |
|------|-----|------|
| sla_config_id | BIGINT | ID konfiguracji SLA |
| sla_response_due | TIMESTAMP | Termin odpowiedzi |
| sla_resolve_due | TIMESTAMP | Termin rozwiązania |
| sla_paused_at | TIMESTAMP | Czas rozpoczęcia wstrzymania SLA |
| sla_paused_duration | INT | Skumulowany czas wstrzymania (minuty) |
| is_sla_response_breached | BOOLEAN | Czy naruszono termin odpowiedzi |
| is_sla_resolve_breached | BOOLEAN | Czy naruszono termin rozwiązania |

**Wyniki analizy AI**

| Pole | Typ | Opis | Przez kogo wypełniane |
|------|-----|------|----------------------|
| ai_category_code | VARCHAR | Klasyfikacja rozpoznana przez AI | Sam |
| ai_sentiment | VARCHAR | Analiza nastroju | Sam |
| ai_urgency | VARCHAR | Poziom pilności | Sam |
| ai_keywords | JSONB | Słowa kluczowe | Sam |
| ai_reasoning | TEXT | Proces wnioskowania | Sam |
| ai_suggested_reply | TEXT | Sugerowana odpowiedź | Sam/Grace |
| ai_confidence_score | NUMERIC | Wynik ufności | Sam |
| ai_analysis | JSONB | Pełny wynik analizy | Sam |

**Wsparcie wielojęzyczności**

| Pole | Typ | Opis | Przez kogo wypełniane |
|------|-----|------|----------------------|
| source_language_code | VARCHAR | Język oryginalny | Sam/Lexi |
| target_language_code | VARCHAR | Język docelowy | Domyślnie systemowy EN |
| is_translated | BOOLEAN | Czy przetłumaczono | Lexi |
| description_translated | TEXT | Przetłumaczony opis | Lexi |

#### 2.2.2 Biznesowe tabele rozszerzeń

**Naprawa sprzętu (nb_tts_biz_repair)**

| Pole | Typ | Opis |
|------|-----|------|
| ticket_id | BIGINT | Powiązane ID zgłoszenia |
| equipment_model | VARCHAR | Model urządzenia |
| serial_number | VARCHAR | Numer seryjny |
| fault_code | VARCHAR | Kod usterki |
| spare_parts | JSONB | Lista części zamiennych |
| maintenance_type | VARCHAR | Typ konserwacji |

**Wsparcie IT (nb_tts_biz_it_support)**

| Pole | Typ | Opis |
|------|-----|------|
| ticket_id | BIGINT | Powiązane ID zgłoszenia |
| asset_number | VARCHAR | Numer środka trwałego |
| os_version | VARCHAR | Wersja systemu operacyjnego |
| software_name | VARCHAR | Dotyczy oprogramowania |
| remote_address | VARCHAR | Adres zdalny |
| error_code | VARCHAR | Kod błędu |

**Reklamacja klienta (nb_tts_biz_complaint)**

| Pole | Typ | Opis |
|------|-----|------|
| ticket_id | BIGINT | Powiązane ID zgłoszenia |
| related_order_no | VARCHAR | Powiązany numer zamówienia |
| complaint_level | VARCHAR | Poziom reklamacji |
| compensation_amount | DECIMAL | Kwota rekompensaty |
| compensation_type | VARCHAR | Rodzaj rekompensaty |
| root_cause | TEXT | Przyczyna źródłowa |

#### 2.2.3 Tabela komentarzy (nb_tts_ticket_comments)

**Kluczowe pola**

| Pole | Typ | Opis |
|------|-----|------|
| id | BIGINT | Klucz główny |
| ticket_id | BIGINT | ID zgłoszenia |
| parent_id | BIGINT | ID komentarza nadrzędnego (struktura drzewiasta) |
| content | TEXT | Treść komentarza |
| direction | VARCHAR | Kierunek: inbound (klient) / outbound (agent) |
| is_internal | BOOLEAN | Czy notatka wewnętrzna |
| is_first_response | BOOLEAN | Czy pierwsza odpowiedź |

**Pola audytu AI (dla outbound)**

| Pole | Typ | Opis |
|------|-----|------|
| source_language_code | VARCHAR | Język źródłowy |
| content_translated | TEXT | Przetłumaczona treść |
| is_translated | BOOLEAN | Czy przetłumaczono |
| is_ai_blocked | BOOLEAN | Czy zablokowane przez AI |
| ai_block_reason | VARCHAR | Powód blokady |
| ai_block_detail | TEXT | Szczegółowe wyjaśnienie |
| ai_quality_score | NUMERIC | Ocena jakości |
| ai_suggestions | TEXT | Sugestie poprawy |

#### 2.2.4 Tabela ocen (nb_tts_ratings)

| Pole | Typ | Opis |
|------|-----|------|
| ticket_id | BIGINT | ID zgłoszenia (unikalne) |
| overall_rating | INT | Ogólna satysfakcja (1-5) |
| response_rating | INT | Szybkość odpowiedzi (1-5) |
| professionalism_rating | INT | Profesjonalizm (1-5) |
| resolution_rating | INT | Rozwiązanie problemu (1-5) |
| nps_score | INT | Wynik NPS (0-10) |
| tags | JSONB | Szybkie tagi |
| comment | TEXT | Komentarz pisemny |

#### 2.2.5 Tabela artykułów wiedzy (nb_tts_qa_articles)

| Pole | Typ | Opis |
|------|-----|------|
| article_no | VARCHAR | Numer artykułu KB-T0001 |
| title | VARCHAR | Tytuł |
| content | TEXT | Treść (Markdown) |
| summary | TEXT | Podsumowanie |
| category_code | VARCHAR | Kod kategorii |
| keywords | JSONB | Słowa kluczowe |
| source_type | VARCHAR | Źródło: ticket/faq/manual |
| source_ticket_id | BIGINT | ID źródłowego zgłoszenia |
| ai_generated | BOOLEAN | Czy wygenerowane przez AI |
| ai_quality_score | NUMERIC | Ocena jakości |
| status | VARCHAR | Status: draft/published/archived |
| view_count | INT | Liczba wyświetleń |
| helpful_count | INT | Liczba głosów "pomocne" |

### 2.3 Lista tabel danych

| Lp. | Nazwa tabeli | Opis | Typ rekordu |
|-----|--------------|------|--------------|
| 1 | nb_tts_tickets | Główna tabela zgłoszeń | Dane biznesowe |
| 2 | nb_tts_biz_repair | Rozszerzenie: Naprawa sprzętu | Dane biznesowe |
| 3 | nb_tts_biz_it_support | Rozszerzenie: Wsparcie IT | Dane biznesowe |
| 4 | nb_tts_biz_complaint | Rozszerzenie: Reklamacja klienta | Dane biznesowe |
| 5 | nb_tts_customers | Główna tabela klientów | Dane biznesowe |
| 6 | nb_tts_customer_contacts | Kontakty klientów | Dane biznesowe |
| 7 | nb_tts_ticket_comments | Komentarze do zgłoszeń | Dane biznesowe |
| 8 | nb_tts_ratings | Oceny satysfakcji | Dane biznesowe |
| 9 | nb_tts_qa_articles | Artykuły wiedzy | Dane wiedzy |
| 10 | nb_tts_qa_article_relations | Powiązania artykułów | Dane wiedzy |
| 11 | nb_tts_faqs | Często zadawane pytania | Dane wiedzy |
| 12 | nb_tts_tickets_categories | Kategorie zgłoszeń | Dane konfiguracyjne |
| 13 | nb_tts_sla_configs | Konfiguracja SLA | Dane konfiguracyjne |
| 14 | nb_tts_skill_configs | Konfiguracja umiejętności | Dane konfiguracyjne |
| 15 | nb_tts_business_types | Typy biznesowe | Dane konfiguracyjne |

---

## 3. Cykl życia zgłoszenia

### 3.1 Definicje statusów

| Status | Nazwa | Opis | Pomiar SLA | Kolor |
|--------|-------|------|------------|-------|
| new | Nowe | Właśnie utworzone, oczekuje na przypisanie | Start | 🔵 Niebieski |
| assigned | Przypisane | Wyznaczono osobę, oczekuje na przyjęcie | Kontynuacja | 🔷 Cyjan |
| processing | W trakcie | Przetwarzanie w toku | Kontynuacja | 🟠 Pomarańczowy |
| pending | Oczekujące | Oczekiwanie na informację od klienta | **Wstrzymano** | ⚫ Szary |
| transferred | Przekazane | Przekazane do innej osoby | Kontynuacja | 🟣 Fioletowy |
| resolved | Rozwiązane | Oczekiwanie na potwierdzenie klienta | Stop | 🟢 Zielony |
| closed | Zamknięte | Zgłoszenie zakończone | Stop | ⚫ Szary |
| cancelled | Anulowane | Zgłoszenie anulowane | Stop | ⚫ Szary |

### 3.2 Schemat przepływu statusów

**Główny proces (od lewej do prawej)**

![ticketing-imgs-2025-12-31-22-51-45](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-21-01.png)

**Procesy poboczne**

![ticketing-imgs-2025-12-31-22-52-42](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-22-14.png)

![ticketing-imgs-2025-12-31-22-52-53](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-22-32.png)


**Pełny automat stanów**

![ticketing-imgs-2025-12-31-22-54-23](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-23-13.png)

### 3.3 Kluczowe reguły zmiany statusu

| Z | Do | Warunek wyzwalający | Akcja systemowa |
|---|----|--------------------|-----------------|
| new | assigned | Wyznaczenie osoby obsługującej | Zapisanie assigned_at |
| assigned | processing | Kliknięcie "Przyjmij zgłoszenie" | Brak |
| processing | pending | Kliknięcie "Wstrzymaj" | Zapisanie sla_paused_at |
| pending | processing | Odpowiedź klienta / Ręczne wznowienie | Obliczenie czasu wstrzymania, wyczyszczenie paused_at |
| processing | resolved | Kliknięcie "Rozwiąż" | Zapisanie resolved_at |
| resolved | closed | Potwierdzenie klienta / Timeout 3 dni | Zapisanie closed_at |
| * | cancelled | Anulowanie zgłoszenia | Brak |


---

## 4. Zarządzanie poziomem usług SLA

### 4.1 Priorytety i konfiguracja SLA

| Priorytet | Nazwa | Czas odpowiedzi | Czas rozwiązania | Próg ostrzegawczy | Typowy scenariusz |
|-----------|-------|-----------------|------------------|-------------------|-------------------|
| P0 | Krytyczny | 15 minut | 2 godziny | 80% | Awaria systemu, zatrzymanie linii |
| P1 | Wysoki | 1 godzina | 8 godzin | 80% | Awaria ważnej funkcji |
| P2 | Średni | 4 godziny | 24 godziny | 80% | Ogólne problemy |
| P3 | Niski | 8 godzin | 72 godziny | 80% | Zapytania, sugestie |

### 4.2 Logika obliczeń SLA

![ticketing-imgs-2025-12-31-22-53-54](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-23-46.png)

#### Przy tworzeniu zgłoszenia

```
Termin odpowiedzi = Czas przesłania + Limit odpowiedzi (minuty)
Termin rozwiązania = Czas przesłania + Limit rozwiązania (minuty)
```

#### Przy wstrzymaniu (pending)

```
Czas rozpoczęcia wstrzymania SLA = Aktualny czas
```

#### Przy wznowieniu (powrót z pending do processing)

```
-- Obliczenie czasu trwania bieżącego wstrzymania
Czas bieżącego wstrzymania = Aktualny czas - Czas rozpoczęcia wstrzymania SLA

-- Dodanie do skumulowanego czasu wstrzymania
Skumulowany czas wstrzymania = Skumulowany czas wstrzymania + Czas bieżącego wstrzymania

-- Przedłużenie terminów (okres wstrzymania nie wlicza się do SLA)
Termin odpowiedzi = Termin odpowiedzi + Czas bieżącego wstrzymania
Termin rozwiązania = Termin rozwiązania + Czas bieżącego wstrzymania

-- Wyczyszczenie czasu rozpoczęcia wstrzymania
Czas rozpoczęcia wstrzymania SLA = Puste
```

#### Rozstrzyganie naruszenia SLA

```
-- Naruszenie terminu odpowiedzi
Czy naruszono odpowiedź = (Czas pierwszej odpowiedzi jest pusty ORAZ Aktualny czas > Termin odpowiedzi)
                         LUB (Czas pierwszej odpowiedzi > Termin odpowiedzi)

-- Naruszenie terminu rozwiązania
Czy naruszono rozwiązanie = (Czas rozwiązania jest pusty ORAZ Aktualny czas > Termin rozwiązania)
                          LUB (Czas rozwiązania > Termin rozwiązania)
```

### 4.3 Mechanizm ostrzegania SLA

| Poziom ostrzeżenia | Warunek | Odbiorca | Sposób powiadomienia |
|--------------------|---------|----------|----------------------|
| Żółty alert | Pozostały czas < 20% | Obsługujący | Wiadomość wewnątrz systemu |
| Czerwony alert | Przekroczono czas | Obsługujący + Kierownik | Wiadomość + E-mail |
| Alert eskalacji | Przekroczenie o 1h | Menedżer działu | E-mail + SMS |

### 4.4 Wskaźniki SLA na pulpicie nawigacyjnym

| Wskaźnik | Wzór obliczeniowy | Próg zdrowia |
|----------|-------------------|--------------|
| Wskaźnik terminowości odpowiedzi | Zgłoszenia bez naruszeń / Wszystkie zgłoszenia | > 95% |
| Wskaźnik terminowości rozwiązań | Rozwiązane bez naruszeń / Rozwiązane zgłoszenia | > 90% |
| Średni czas odpowiedzi | SUMA(czas odpowiedzi) / Liczba zgłoszeń | < 50% limitu SLA |
| Średni czas rozwiązania | SUMA(czas rozwiązania) / Liczba zgłoszeń | < 80% limitu SLA |

---

## 5. Możliwości AI i system pracowników

### 5.1 Zespół pracowników AI

System konfiguruje 8 pracowników AI, podzielonych na dwie kategorie:

**Nowi pracownicy (dedykowani do systemu zgłoszeń)**

| ID | Imię | Stanowisko | Kluczowe umiejętności |
|----|------|------------|-----------------------|
| sam | Sam | Kierownik Service Desk | Kierowanie zgłoszeń, ocena priorytetów, decyzje o eskalacji, identyfikacja ryzyka SLA |
| grace | Grace | Ekspert ds. sukcesu klienta | Generowanie profesjonalnych odpowiedzi, korekta tonu, obsługa reklamacji, przywracanie satysfakcji |
| max | Max | Asystent wiedzy | Wyszukiwanie podobnych przypadków, rekomendacje wiedzy, synteza rozwiązań |

**Pracownicy współdzieleni (umiejętności ogólne)**

| ID | Imię | Stanowisko | Kluczowe umiejętności |
|----|------|------------|-----------------------|
| dex | Dex | Organizator danych | Wyodrębnianie zgłoszeń z e-maili/telefonów, masowe czyszczenie danych |
| ellis | Ellis | Ekspert ds. e-mail | Analiza nastroju e-maili, podsumowanie wątków, szkicowanie odpowiedzi |
| lexi | Lexi | Tłumacz | Tłumaczenie zgłoszeń, odpowiedzi oraz rozmów w czasie rzeczywistym |
| cole | Cole | Ekspert NocoBase | Instruktaż obsługi systemu, pomoc w konfiguracji przepływów pracy |
| vera | Vera | Analityk badawczy | Badanie rozwiązań technicznych, weryfikacja informacji o produktach |

### 5.2 Lista zadań AI

Każdy pracownik AI ma skonfigurowane 4 konkretne zadania:

#### Zadania Sama

| ID zadania | Nazwa | Sposób wyzwolenia | Opis |
|------------|-------|-------------------|------|
| SAM-01 | Analiza i kierowanie | Przepływ pracy (auto) | Automatyczna analiza nowych zgłoszeń |
| SAM-02 | Ponowna ocena priorytetu | Interakcja frontend | Korekta priorytetu na podstawie nowych danych |
| SAM-03 | Decyzja o eskalacji | Frontend/Przepływ pracy | Ocena konieczności eskalacji |
| SAM-04 | Ocena ryzyka SLA | Przepływ pracy (auto) | Identyfikacja ryzyka przekroczenia czasu |

#### Zadania Grace

| ID zadania | Nazwa | Sposób wyzwolenia | Opis |
|------------|-------|-------------------|------|
| GRACE-01 | Generowanie odpowiedzi | Interakcja frontend | Tworzenie odpowiedzi na podstawie kontekstu |
| GRACE-02 | Korekta tonu | Interakcja frontend | Optymalizacja tonu istniejącej odpowiedzi |
| GRACE-03 | Deeskalacja reklamacji | Frontend/Przepływ pracy | Łagodzenie konfliktów z klientami |
| GRACE-04 | Przywracanie satysfakcji | Frontend/Przepływ pracy | Działania po negatywnym doświadczeniu |

#### Zadania Maxa

| ID zadania | Nazwa | Sposób wyzwolenia | Opis |
|------------|-------|-------------------|------|
| MAX-01 | Podobne przypadki | Frontend/Przepływ pracy | Wyszukiwanie historycznych zgłoszeń |
| MAX-02 | Rekomendacja wiedzy | Frontend/Przepływ pracy | Polecanie artykułów z bazy wiedzy |
| MAX-03 | Synteza rozwiązań | Interakcja frontend | Łączenie rozwiązań z wielu źródeł |
| MAX-04 | Przewodnik rozwiązywania | Interakcja frontend | Tworzenie systematycznych kroków diagnostycznych |

#### Zadania Lexi

| ID zadania | Nazwa | Sposób wyzwolenia | Opis |
|------------|-------|-------------------|------|
| LEXI-01 | Tłumaczenie zgłoszenia | Przepływ pracy (auto) | Tłumaczenie treści zgłoszenia |
| LEXI-02 | Tłumaczenie odpowiedzi | Interakcja frontend | Tłumaczenie odpowiedzi agenta |
| LEXI-03 | Tłumaczenie masowe | Przepływ pracy (auto) | Przetwarzanie wielu tłumaczeń |
| LEXI-04 | Tłumaczenie rozmowy | Interakcja frontend | Tłumaczenie dialogu na żywo |

### 5.3 Pracownicy AI w cyklu życia zgłoszenia

![ticketing-imgs-2025-12-31-22-55-04](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-24-22.png)

### 5.4 Przykłady odpowiedzi AI

#### SAM-01 Odpowiedź z analizy zgłoszenia

```json
{
  "category_code": "COMPUTER",
  "sentiment": "NEGATIVE",
  "urgency": "HIGH",
  "keywords": ["ERP", "błąd logowania", "timeout", "zamknięcie miesiąca"],
  "confidence": 0.92,
  "reasoning": "Zgłoszenie dotyczy problemów z logowaniem do systemu ERP, co wpływa na zamknięcie miesiąca w dziale finansowym. Wysoka pilność.",
  "suggested_reply": "Szanowny Kliencie, dziękujemy za zgłoszenie tego problemu...",
  "source_language_code": "pl",
  "is_translated": true,
  "description_translated": "Hello, our ERP system cannot login..."
}
```

#### GRACE-01 Odpowiedź wygenerowana

```
Szanowny Panie Mariuszu,

Dziękujemy za kontakt w sprawie problemów z logowaniem do systemu ERP. W pełni rozumiemy, że sytuacja ta wpływa na prace związane z zamknięciem miesiąca w Państwa firmie. Zgłoszenie otrzymało wysoki priorytet.

Aktualny status:
- Zespół techniczny sprawdza połączenie z serwerem.
- Przewidywany czas kolejnej aktualizacji: za 30 minut.

W międzyczasie mogą Państwo spróbować:
1. Skorzystać z adresu zapasowego: https://erp-backup.company.com
2. W przypadku pilnej potrzeby wygenerowania raportów, prosimy o kontakt — pomożemy w eksporcie danych.

W razie dalszych pytań pozostaję do dyspozycji.

Z poważaniem,
Zespół Wsparcia Technicznego
```

### 5.5 Firewall inteligencji emocjonalnej AI

Grace odpowiada za audyt jakości odpowiedzi, blokując następujące problemy:

| Typ problemu | Przykład oryginału | Sugestia AI |
|--------------|-------------------|-------------|
| Ton negatywny | "Nie da się, to nie podlega gwarancji" | "Ta usterka nie jest objęta bezpłatną gwarancją, możemy zaproponować płatną naprawę" |
| Obwinianie klienta | "Sam Pan to zepsuł" | "Po weryfikacji stwierdzono, że usterka powstała w wyniku przypadkowego uszkodzenia" |
| Unikanie odpowiedzialności | "To nie nasz problem" | "Pozwoli Pan, że pomogę w dalszej diagnostyce przyczyny problemu" |
| Oziębłość | "Nie wiem" | "Już sprawdzam dla Pana odpowiednie informacje" |
| Dane wrażliwe | "Pana hasło to abc123" | [ZABLOKOWANO] Zawiera dane wrażliwe, wysyłka niedozwolona |

---

## 6. System bazy wiedzy

### 6.1 Źródła wiedzy

![ticketing-imgs-2025-12-31-22-55-20](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-24-57.png)


### 6.2 Proces przekształcania zgłoszenia w wiedzę

![ticketing-imgs-2025-12-31-22-55-38](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-25-18.png)

**Wymiary oceny**:
- **Uniwersalność**: Czy to częsty problem?
- **Kompletność**: Czy rozwiązanie jest jasne i pełne?
- **Powtarzalność**: Czy kroki można wykorzystać ponownie?

### 6.3 Mechanizm rekomendacji wiedzy

Gdy agent otwiera szczegóły zgłoszenia, Max automatycznie rekomenduje wiedzę:

```
┌────────────────────────────────────────────────────────────┐
│ 📚 Rekomendowana wiedza                       [Rozwiń/Zwiń] │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ KB-T0042 Diagnostyka układu serwo CNC     Dopasowanie: 94%│ │
│ │ Zawiera: kody alarmów, kroki sprawdzania napędu         │ │
│ │ [Zobacz] [Zastosuj w odpowiedzi] [Oznacz jako pomocne]  │ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ KB-T0038 Instrukcja konserwacji XYZ-CNC3000 Dopasowanie: 87%│ │
│ │ Zawiera: typowe usterki, plan konserwacji zapobiegawczej│ │
│ │ [Zobacz] [Zastosuj w odpowiedzi] [Oznacz jako pomocne]  │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## 7. Silnik przepływu pracy

### 7.1 Klasyfikacja przepływów pracy

| Kod | Kategoria | Opis | Sposób wyzwolenia |
|-----|-----------|------|-------------------|
| WF-T | Przepływ zgłoszeń | Zarządzanie cyklem życia zgłoszenia | Zdarzenia formularza |
| WF-S | Przepływ SLA | Obliczenia i ostrzeżenia SLA | Zdarzenia / Harmonogram |
| WF-C | Przepływ komentarzy | Przetwarzanie i tłumaczenie komentarzy | Zdarzenia formularza |
| WF-R | Przepływ ocen | Zaproszenia do ocen i statystyki | Zdarzenia / Harmonogram |
| WF-N | Przepływ powiadomień | Wysyłka powiadomień | Sterowane zdarzeniami |
| WF-AI | Przepływ AI | Analiza i generowanie przez AI | Zdarzenia formularza |

### 7.2 Kluczowe przepływy pracy

#### WF-T01: Proces tworzenia zgłoszenia

![ticketing-imgs-2025-12-31-22-55-51](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-25-48.png)

#### WF-AI01: Analiza zgłoszenia przez AI

![ticketing-imgs-2025-12-31-22-56-03](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-26-14.png)

#### WF-AI04: Tłumaczenie i audyt komentarzy

![ticketing-imgs-2025-12-31-22-56-19](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-26-38.png)

#### WF-AI03: Generowanie wiedzy

![ticketing-imgs-2025-12-31-22-56-37](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-26-54.png)

### 7.3 Zadania zaplanowane

| Zadanie | Częstotliwość | Opis |
|---------|---------------|------|
| Sprawdzenie ostrzeżeń SLA | Co 5 minut | Sprawdzanie zgłoszeń bliskich przekroczenia czasu |
| Automatyczne zamykanie | Codziennie | Zamykanie zgłoszeń resolved po 3 dniach |
| Wysyłka zaproszeń do oceny | Codziennie | Wysyłka zaproszenia 24h po zamknięciu |
| Aktualizacja statystyk | Co godzinę | Aktualizacja statystyk zgłoszeń klientów |

---

## 8. Projekt menu i interfejsu

### 8.1 Panel administracyjny

![ticketing-imgs-2025-12-31-22-59-10](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-27-19.png)

### 8.2 Portal klienta

![ticketing-imgs-2025-12-31-22-59-32](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-27-35.png)

### 8.3 Projekt pulpitów nawigacyjnych

#### Widok kadry zarządzającej

| Komponent | Typ | Opis danych |
|-----------|-----|-------------|
| Wskaźnik SLA | Licznik | Terminowość odpowiedzi/rozwiązań w tym miesiącu |
| Trend satysfakcji | Wykres liniowy | Zmiany satysfakcji w ostatnich 30 dniach |
| Wolumen zgłoszeń | Wykres słupkowy | Liczba zgłoszeń w ostatnich 30 dniach |
| Rozkład typów biznesowych | Wykres kołowy | Udział poszczególnych typów biznesu |

#### Widok kierownika

| Komponent | Typ | Opis danych |
|-----------|-----|-------------|
| Ostrzeżenia o czasie | Lista | Zgłoszenia bliskie przekroczenia lub po terminie |
| Obciążenie zespołu | Wykres słupkowy | Liczba zgłoszeń na członka zespołu |
| Rozkład zaległości | Wykres skumulowany | Liczba zgłoszeń według statusów |
| Efektywność obsługi | Mapa ciepła | Rozkład średniego czasu obsługi |

#### Widok agenta

| Komponent | Typ | Opis danych |
|-----------|-----|-------------|
| Moje zadania | Karta liczbowa | Liczba zgłoszeń do obsłużenia |
| Rozkład priorytetów | Wykres kołowy | Udział P0/P1/P2/P3 |
| Statystyki dzisiejsze | Karta wskaźników | Liczba obsłużonych/rozwiązanych dzisiaj |
| Odliczanie SLA | Lista | 5 najpilniejszych zgłoszeń |

---

## Dodatek

### A. Konfiguracja typów biznesowych

| Kod typu | Nazwa | Ikona | Powiązana tabela rozszerzeń |
|----------|-------|-------|----------------------------|
| repair | Naprawa sprzętu | 🔧 | nb_tts_biz_repair |
| it_support | Wsparcie IT | 💻 | nb_tts_biz_it_support |
| complaint | Reklamacja klienta | 📢 | nb_tts_biz_complaint |
| consultation | Konsultacja/Sugestia | ❓ | Brak |
| other | Inne | 📝 | Brak |

### B. Kody kategorii

| Kod | Nazwa | Opis |
|-----|-------|------|
| CONVEYOR | System przenośników | Problemy z systemem transportowym |
| PACKAGING | Maszyna pakująca | Problemy z maszynami pakującymi |
| WELDING | Sprzęt spawalniczy | Problemy ze sprzętem spawalniczym |
| COMPRESSOR | Sprężarka powietrza | Problemy ze sprężarkami |
| COLD_STORE | Chłodnia | Problemy z chłodniami |
| CENTRAL_AC | Klimatyzacja centralna | Problemy z klimatyzacją |
| FORKLIFT | Wózek widłowy | Problemy z wózkami widłowymi |
| COMPUTER | Komputer | Problemy ze sprzętem komputerowym |
| PRINTER | Drukarka | Problemy z drukarkami |
| PROJECTOR | Projektor | Problemy z projektorami |
| INTERNET | Sieć | Problemy z połączeniem sieciowym |
| EMAIL | E-mail | Problemy z systemem pocztowym |
| ACCESS | Uprawnienia | Problemy z dostępem do konta |
| PROD_INQ | Zapytanie o produkt | Informacje o produktach |
| COMPLAINT | Reklamacja ogólna | Ogólne skargi |
| DELAY | Opóźnienie logistyczne | Skargi na opóźnienia w dostawie |
| DAMAGE | Uszkodzenie paczki | Skargi na uszkodzone opakowania |
| QUANTITY | Brak ilościowy | Skargi na niekompletne dostawy |
| SVC_ATTITUDE | Postawa obsługi | Skargi na zachowanie personelu |
| PROD_QUALITY | Jakość produktu | Skargi na jakość towaru |
| TRAINING | Szkolenie | Prośba o szkolenie |
| RETURN | Zwrot | Prośba o zwrot towaru |

---

*Wersja dokumentu: 2.0 | Ostatnia aktualizacja: 2026-01-05*