:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/solution/crm/design).
:::

# Szczegółowy projekt systemu CRM 2.0


## 1. Przegląd systemu i filozofia projektowania

### 1.1 Pozycjonowanie systemu

Niniejszy system to **platforma zarządzania sprzedażą CRM 2.0** zbudowana w oparciu o platformę bezkodową NocoBase. Głównym celem jest:

```
Pozwól handlowcom skupić się na budowaniu relacji z klientami, a nie na wprowadzaniu danych i powtarzalnych analizach.
```

System automatyzuje rutynowe zadania poprzez przepływy pracy i wykorzystuje AI do pomocy w punktacji leadów, analizie szans sprzedaży oraz innych zadaniach, pomagając zespołom sprzedaży zwiększyć efektywność.

### 1.2 Filozofia projektowania

#### Filozofia 1: Pełny lejek sprzedaży

**Kompleksowy proces sprzedaży:**
![design-2026-02-24-00-05-26](https://static-docs.nocobase.com/design-2026-02-24-00-05-26.png)

**Dlaczego zaprojektowano to w ten sposób?**

| Metoda tradycyjna | Zintegrowany CRM |
|---------|-----------|
| Wiele systemów używanych na różnych etapach | Pojedynczy system obejmujący cały cykl życia |
| Ręczne przesyłanie danych między systemami | Zautomatyzowany przepływ i konwersja danych |
| Niespójne widoki klienta | Jednolity widok klienta 360 stopni |
| Rozproszona analiza danych | Kompleksowa analiza lejka sprzedaży |

#### Filozofia 2: Konfigurowalny lejek sprzedaży
![design-2026-02-24-00-06-04](https://static-docs.nocobase.com/design-2026-02-24-00-06-04.png)

Różne branże mogą dostosowywać etapy lejka sprzedaży bez modyfikowania kodu.

#### Filozofia 3: Budowa modułowa

- Moduły podstawowe (Klienci + Szanse sprzedaży) są obowiązkowe; inne moduły można włączyć w zależności od potrzeb.
- Wyłączenie modułów nie wymaga zmian w kodzie; odbywa się to poprzez konfigurację interfejsu NocoBase.
- Każdy moduł jest zaprojektowany niezależnie, aby zmniejszyć powiązania (coupling).

---

## 2. Architektura modułów i personalizacja

### 2.1 Przegląd modułów

System CRM przyjmuje **architekturę modułową** — każdy moduł może być niezależnie włączony lub wyłączony w zależności od wymagań biznesowych.
![design-2026-02-24-00-06-14](https://static-docs.nocobase.com/design-2026-02-24-00-06-14.png)

### 2.2 Zależności między modułami

| Moduł | Wymagany | Zależności | Warunek wyłączenia |
|-----|---------|--------|---------|
| **Zarządzanie klientami** | ✅ Tak | - | Nie można wyłączyć (Rdzeń) |
| **Zarządzanie szansami sprzedaży** | ✅ Tak | Zarządzanie klientami | Nie można wyłączyć (Rdzeń) |
| **Zarządzanie leadami** | Opcjonalnie | - | Gdy pozyskiwanie leadów nie jest wymagane |
| **Zarządzanie ofertami** | Opcjonalnie | Szanse sprzedaży, Produkty | Proste transakcje niewymagające formalnych ofert |
| **Zarządzanie zamówieniami** | Opcjonalnie | Szanse sprzedaży (lub Oferty) | Gdy śledzenie zamówień/płatności nie jest wymagane |
| **Zarządzanie produktami** | Opcjonalnie | - | Gdy katalog produktów nie jest wymagany |
| **Integracja z e-mail** | Opcjonalnie | Klienci, Kontakty | W przypadku korzystania z zewnętrznego systemu e-mail |

### 2.3 Wstępnie skonfigurowane wersje

| Wersja | Zawarte moduły | Przypadek użycia | Liczba kolekcji |
|-----|---------|---------|-----------|
| **Lite** | Klienci + Szanse sprzedaży | Proste śledzenie transakcji | 6 |
| **Standard** | Lite + Leady + Oferty + Zamówienia + Produkty | Pełny cykl sprzedaży | 15 |
| **Enterprise** | Standard + Integracja e-mail | Pełna funkcjonalność wraz z pocztą e-mail | 17 |

### 2.4 Mapowanie modułów na kolekcje

#### Kolekcje modułów podstawowych (zawsze wymagane)

| Kolekcja | Moduł | Opis |
|-------|------|------|
| nb_crm_customers | Zarządzanie klientami | Rekordy klientów/firm |
| nb_crm_contacts | Zarządzanie klientami | Kontakty |
| nb_crm_customer_shares | Zarządzanie klientami | Uprawnienia do udostępniania klientów |
| nb_crm_opportunities | Zarządzanie szansami sprzedaży | Szanse sprzedaży |
| nb_crm_opportunity_stages | Zarządzanie szansami sprzedaży | Konfiguracje etapów |
| nb_crm_opportunity_users | Zarządzanie szansami sprzedaży | Współpracownicy szansy sprzedaży |
| nb_crm_activities | Zarządzanie aktywnościami | Rekordy aktywności |
| nb_crm_comments | Zarządzanie aktywnościami | Komentarze/Notatki |
| nb_crm_tags | Rdzeń | Współdzielone tagi |
| nb_cbo_currencies | Dane podstawowe | Słownik walut |
| nb_cbo_regions | Dane podstawowe | Słownik krajów/regionów |

### 2.5 Jak wyłączyć moduły

Wystarczy ukryć wpis w menu dla danego modułu w interfejsie administracyjnym NocoBase; nie ma potrzeby modyfikowania kodu ani usuwania kolekcji.

---

## 3. Kluczowe encje i model danych

### 3.1 Przegląd relacji encji
![design-2026-02-24-00-06-40](https://static-docs.nocobase.com/design-2026-02-24-00-06-40.png)

### 3.2 Szczegóły kluczowych kolekcji

#### 3.2.1 Leady (nb_crm_leads)

Zarządzanie leadami przy użyciu uproszczonego 4-etapowego przepływu pracy.

**Proces etapowy:**
```
Nowy → W toku → Zweryfikowany → Przekonwertowany na klienta/szansę
         ↓          ↓
   Niezakwalifikowany Niezakwalifikowany
```

**Kluczowe pola:**

| Pole | Typ | Opis |
|-----|------|------|
| id | BIGINT | Klucz główny |
| lead_no | VARCHAR | Numer leadu (generowany automatycznie) |
| name | VARCHAR | Imię i nazwisko kontaktu |
| company | VARCHAR | Nazwa firmy |
| title | VARCHAR | Stanowisko |
| email | VARCHAR | E-mail |
| phone | VARCHAR | Telefon |
| mobile_phone | VARCHAR | Telefon komórkowy |
| website | TEXT | Strona internetowa |
| address | TEXT | Adres |
| source | VARCHAR | Źródło leadu: website/ads/referral/exhibition/telemarketing/email/social |
| industry | VARCHAR | Branża |
| annual_revenue | VARCHAR | Skala rocznych przychodów |
| number_of_employees | VARCHAR | Skala zatrudnienia |
| status | VARCHAR | Status: new/working/qualified/unqualified |
| rating | VARCHAR | Ocena: hot/warm/cold |
| owner_id | BIGINT | Opiekun (FK → users) |
| ai_score | INTEGER | Wynik jakości AI 0-100 |
| ai_convert_prob | DECIMAL | Prawdopodobieństwo konwersji AI |
| ai_best_contact_time | VARCHAR | Rekomendowany przez AI czas kontaktu |
| ai_tags | JSONB | Tagi wygenerowane przez AI |
| ai_scored_at | TIMESTAMP | Czas oceny AI |
| ai_next_best_action | TEXT | Sugestia AI dotycząca następnego najlepszego kroku |
| ai_nba_generated_at | TIMESTAMP | Czas wygenerowania sugestii AI |
| is_converted | BOOLEAN | Znacznik konwersji |
| converted_at | TIMESTAMP | Czas konwersji |
| converted_customer_id | BIGINT | ID przekonwertowanego klienta |
| converted_contact_id | BIGINT | ID przekonwertowanego kontaktu |
| converted_opportunity_id | BIGINT | ID przekonwertowanej szansy sprzedaży |
| lost_reason | TEXT | Powód utraty |
| disqualification_reason | TEXT | Powód dyskwalifikacji |
| description | TEXT | Opis |

#### 3.2.2 Klienci (nb_crm_customers)

Zarządzanie klientami/firmami wspierające handel międzynarodowy.

**Kluczowe pola:**

| Pole | Typ | Opis |
|-----|------|------|
| id | BIGINT | Klucz główny |
| name | VARCHAR | Nazwa klienta (wymagane) |
| account_number | VARCHAR | Numer klienta (generowany automatycznie, unikalny) |
| phone | VARCHAR | Telefon |
| website | TEXT | Strona internetowa |
| address | TEXT | Adres |
| industry | VARCHAR | Branża |
| type | VARCHAR | Typ: prospect/customer/partner/competitor |
| number_of_employees | VARCHAR | Skala zatrudnienia |
| annual_revenue | VARCHAR | Skala rocznych przychodów |
| level | VARCHAR | Poziom: normal/important/vip |
| status | VARCHAR | Status: potential/active/dormant/churned |
| country | VARCHAR | Kraj |
| region_id | BIGINT | Region (FK → nb_cbo_regions) |
| preferred_currency | VARCHAR | Preferowana waluta: CNY/USD/EUR |
| owner_id | BIGINT | Opiekun (FK → users) |
| parent_id | BIGINT | Firma macierzysta (FK → self) |
| source_lead_id | BIGINT | ID źródłowego leadu |
| ai_health_score | INTEGER | Wynik kondycji AI 0-100 |
| ai_health_grade | VARCHAR | Klasa kondycji AI: A/B/C/D |
| ai_churn_risk | DECIMAL | Ryzyko odejścia AI 0-100% |
| ai_churn_risk_level | VARCHAR | Poziom ryzyka odejścia AI: low/medium/high |
| ai_health_dimensions | JSONB | Wyniki wymiarów kondycji AI |
| ai_recommendations | JSONB | Lista rekomendacji AI |
| ai_health_assessed_at | TIMESTAMP | Czas oceny kondycji AI |
| ai_tags | JSONB | Tagi wygenerowane przez AI |
| ai_best_contact_time | VARCHAR | Rekomendowany przez AI czas kontaktu |
| ai_next_best_action | TEXT | Sugestia AI dotycząca następnego najlepszego kroku |
| ai_nba_generated_at | TIMESTAMP | Czas wygenerowania sugestii AI |
| description | TEXT | Opis |
| is_deleted | BOOLEAN | Znacznik miękkiego usunięcia |

#### 3.2.3 Szanse sprzedaży (nb_crm_opportunities)

Zarządzanie szansami sprzedaży z konfigurowalnymi etapami lejka.

**Kluczowe pola:**

| Pole | Typ | Opis |
|-----|------|------|
| id | BIGINT | Klucz główny |
| opportunity_no | VARCHAR | Numer szansy (generowany automatycznie, unikalny) |
| name | VARCHAR | Nazwa szansy (wymagane) |
| amount | DECIMAL | Przewidywana kwota |
| currency | VARCHAR | Waluta |
| exchange_rate | DECIMAL | Kurs wymiany |
| amount_usd | DECIMAL | Równowartość w USD |
| customer_id | BIGINT | Klient (FK) |
| contact_id | BIGINT | Główny kontakt (FK) |
| stage | VARCHAR | Kod etapu (FK → stages.code) |
| stage_sort | INTEGER | Kolejność sortowania etapów (nadmiarowe dla łatwego sortowania) |
| stage_entered_at | TIMESTAMP | Czas wejścia w obecny etap |
| days_in_stage | INTEGER | Dni w obecnym etapie |
| win_probability | DECIMAL | Ręczne prawdopodobieństwo wygranej |
| ai_win_probability | DECIMAL | Przewidywane przez AI prawdopodobieństwo wygranej |
| ai_analyzed_at | TIMESTAMP | Czas analizy AI |
| ai_confidence | DECIMAL | Pewność prognozy AI |
| ai_trend | VARCHAR | Trend prognozy AI: up/stable/down |
| ai_risk_factors | JSONB | Czynniki ryzyka zidentyfikowane przez AI |
| ai_recommendations | JSONB | Lista rekomendacji AI |
| ai_predicted_close | DATE | Przewidywana przez AI data zamknięcia |
| ai_next_best_action | TEXT | Sugestia AI dotycząca następnego najlepszego kroku |
| ai_nba_generated_at | TIMESTAMP | Czas wygenerowania sugestii AI |
| expected_close_date | DATE | Przewidywana data zamknięcia |
| actual_close_date | DATE | Faktyczna data zamknięcia |
| owner_id | BIGINT | Opiekun (FK → users) |
| last_activity_at | TIMESTAMP | Czas ostatniej aktywności |
| stagnant_days | INTEGER | Dni bez aktywności |
| loss_reason | TEXT | Powód utraty |
| competitor_id | BIGINT | Konkurent (FK) |
| lead_source | VARCHAR | Źródło leadu |
| campaign_id | BIGINT | ID kampanii marketingowej |
| expected_revenue | DECIMAL | Przewidywany przychód = kwota × prawdopodobieństwo |
| description | TEXT | Opis |

#### 3.2.4 Oferty (nb_crm_quotations)

Zarządzanie ofertami wspierające wiele walut i przepływy pracy zatwierdzania.

**Przepływ statusów:**
```
Szkic → Oczekuje na zatwierdzenie → Zatwierdzona → Wysłana → Zaakceptowana/Odrzucona/Wygasła
              ↓
           Odrzucona → Edycja → Szkic
```

**Kluczowe pola:**

| Pole | Typ | Opis |
|-----|------|------|
| id | BIGINT | Klucz główny |
| quotation_no | VARCHAR | Nr oferty (generowany automatycznie, unikalny) |
| name | VARCHAR | Nazwa oferty |
| version | INTEGER | Numer wersji |
| opportunity_id | BIGINT | Szansa sprzedaży (FK, wymagane) |
| customer_id | BIGINT | Klient (FK) |
| contact_id | BIGINT | Kontakt (FK) |
| owner_id | BIGINT | Opiekun (FK → users) |
| currency_id | BIGINT | Waluta (FK → nb_cbo_currencies) |
| exchange_rate | DECIMAL | Kurs wymiany |
| subtotal | DECIMAL | Suma częściowa |
| discount_rate | DECIMAL | Stawka rabatu |
| discount_amount | DECIMAL | Kwota rabatu |
| shipping_handling | DECIMAL | Wysyłka/Obsługa |
| tax_rate | DECIMAL | Stawka podatku |
| tax_amount | DECIMAL | Kwota podatku |
| total_amount | DECIMAL | Kwota całkowita |
| total_amount_usd | DECIMAL | Równowartość w USD |
| status | VARCHAR | Status: draft/pending_approval/approved/sent/accepted/rejected/expired |
| submitted_at | TIMESTAMP | Czas przesłania |
| approved_by | BIGINT | Zatwierdzający (FK → users) |
| approved_at | TIMESTAMP | Czas zatwierdzenia |
| rejected_at | TIMESTAMP | Czas odrzucenia |
| sent_at | TIMESTAMP | Czas wysłania |
| customer_response_at | TIMESTAMP | Czas odpowiedzi klienta |
| expired_at | TIMESTAMP | Czas wygaśnięcia |
| valid_until | DATE | Ważna do |
| payment_terms | TEXT | Warunki płatności |
| terms_condition | TEXT | Regulamin i warunki |
| address | TEXT | Adres wysyłki |
| description | TEXT | Opis |

#### 3.2.5 Zamówienia (nb_crm_orders)

Zarządzanie zamówieniami wraz ze śledzeniem płatności.

**Kluczowe pola:**

| Pole | Typ | Opis |
|-----|------|------|
| id | BIGINT | Klucz główny |
| order_no | VARCHAR | Numer zamówienia (generowany automatycznie, unikalny) |
| customer_id | BIGINT | Klient (FK) |
| contact_id | BIGINT | Kontakt (FK) |
| opportunity_id | BIGINT | Szansa sprzedaży (FK) |
| quotation_id | BIGINT | Oferta (FK) |
| owner_id | BIGINT | Opiekun (FK → users) |
| currency | VARCHAR | Waluta |
| exchange_rate | DECIMAL | Kurs wymiany |
| order_amount | DECIMAL | Kwota zamówienia |
| paid_amount | DECIMAL | Kwota zapłacona |
| unpaid_amount | DECIMAL | Kwota pozostała |
| status | VARCHAR | Status: pending/confirmed/in_progress/shipped/delivered/completed/cancelled |
| payment_status | VARCHAR | Status płatności: unpaid/partial/paid |
| order_date | DATE | Data zamówienia |
| delivery_date | DATE | Przewidywana data dostawy |
| actual_delivery_date | DATE | Faktyczna data dostawy |
| shipping_address | TEXT | Adres wysyłki |
| logistics_company | VARCHAR | Firma logistyczna |
| tracking_no | VARCHAR | Numer śledzenia |
| terms_condition | TEXT | Regulamin i warunki |
| description | TEXT | Opis |

### 3.3 Podsumowanie kolekcji

#### Kolekcje biznesowe CRM

| Nr | Nazwa kolekcji | Opis | Typ |
|-----|------|------|------|
| 1 | nb_crm_leads | Zarządzanie leadami | Biznesowa |
| 2 | nb_crm_customers | Klienci/Firmy | Biznesowa |
| 3 | nb_crm_contacts | Kontakty | Biznesowa |
| 4 | nb_crm_opportunities | Szanse sprzedaży | Biznesowa |
| 5 | nb_crm_opportunity_stages | Konfiguracja etapów | Konfiguracyjna |
| 6 | nb_crm_opportunity_users | Współpracownicy szansy (zespół sprzedaży) | Powiązanie |
| 7 | nb_crm_quotations | Oferty | Biznesowa |
| 8 | nb_crm_quotation_items | Pozycje oferty | Biznesowa |
| 9 | nb_crm_quotation_approvals | Rekordy zatwierdzeń | Biznesowa |
| 10 | nb_crm_orders | Zamówienia | Biznesowa |
| 11 | nb_crm_order_items | Pozycje zamówienia | Biznesowa |
| 12 | nb_crm_payments | Rekordy płatności | Biznesowa |
| 13 | nb_crm_products | Katalog produktów | Biznesowa |
| 14 | nb_crm_product_categories | Kategorie produktów | Konfiguracyjna |
| 15 | nb_crm_price_tiers | Cenniki wielopoziomowe | Konfiguracyjna |
| 16 | nb_crm_activities | Rekordy aktywności | Biznesowa |
| 17 | nb_crm_comments | Komentarze/Notatki | Biznesowa |
| 18 | nb_crm_competitors | Konkurenci | Biznesowa |
| 19 | nb_crm_tags | Tagi | Konfiguracyjna |
| 20 | nb_crm_lead_tags | Powiązanie Lead-Tag | Powiązanie |
| 21 | nb_crm_contact_tags | Powiązanie Kontakt-Tag | Powiązanie |
| 22 | nb_crm_customer_shares | Uprawnienia do udostępniania klientów | Powiązanie |
| 23 | nb_crm_exchange_rates | Historia kursów walut | Konfiguracyjna |

#### Kolekcje danych podstawowych (moduły wspólne)

| Nr | Nazwa kolekcji | Opis | Typ |
|-----|------|------|------|
| 1 | nb_cbo_currencies | Słownik walut | Konfiguracyjna |
| 2 | nb_cbo_regions | Słownik krajów/regionów | Konfiguracyjna |

### 3.4 Kolekcje pomocnicze

#### 3.4.1 Komentarze (nb_crm_comments)

Ogólna kolekcja komentarzy/notatek, którą można powiązać z różnymi obiektami biznesowymi.

| Pole | Typ | Opis |
|-----|------|------|
| id | BIGINT | Klucz główny |
| content | TEXT | Treść komentarza |
| lead_id | BIGINT | Powiązany lead (FK) |
| customer_id | BIGINT | Powiązany klient (FK) |
| opportunity_id | BIGINT | Powiązana szansa sprzedaży (FK) |
| order_id | BIGINT | Powiązane zamówienie (FK) |

#### 3.4.2 Udostępnianie klientów (nb_crm_customer_shares)

Umożliwia współpracę wielu osób i udostępnianie uprawnień do klientów.

| Pole | Typ | Opis |
|-----|------|------|
| id | BIGINT | Klucz główny |
| customer_id | BIGINT | Klient (FK, wymagane) |
| shared_with_user_id | BIGINT | Udostępniono użytkownikowi (FK, wymagane) |
| shared_by_user_id | BIGINT | Udostępnione przez użytkownika (FK) |
| permission_level | VARCHAR | Poziom uprawnień: read/write/full |
| shared_at | TIMESTAMP | Czas udostępnienia |

#### 3.4.3 Współpracownicy szansy (nb_crm_opportunity_users)

Wspiera współpracę zespołu sprzedaży nad szansami sprzedaży.

| Pole | Typ | Opis |
|-----|------|------|
| opportunity_id | BIGINT | Szansa sprzedaży (FK, złożony PK) |
| user_id | BIGINT | Użytkownik (FK, złożony PK) |
| role | VARCHAR | Rola: owner/collaborator/viewer |

#### 3.4.4 Regiony (nb_cbo_regions)

Słownik danych podstawowych krajów/regionów.

| Pole | Typ | Opis |
|-----|------|------|
| id | BIGINT | Klucz główny |
| code_alpha2 | VARCHAR | Kod ISO 3166-1 Alpha-2 (unikalny) |
| code_alpha3 | VARCHAR | Kod ISO 3166-1 Alpha-3 (unikalny) |
| code_numeric | VARCHAR | Kod numeryczny ISO 3166-1 |
| name | VARCHAR | Nazwa kraju/regionu |
| is_active | BOOLEAN | Czy aktywny |
| sort_order | INTEGER | Kolejność sortowania |

---

## 4. Cykl życia leadu

Zarządzanie leadami wykorzystuje uproszczony 4-etapowy przepływ pracy. Po utworzeniu nowego leadu przepływ pracy może automatycznie wyzwolić punktację AI, aby pomóc handlowcom szybko zidentyfikować leady wysokiej jakości.

### 4.1 Definicje statusów

| Status | Nazwa | Opis |
|-----|------|------|
| new | Nowy | Właśnie utworzony, oczekuje na kontakt |
| working | W toku | Aktywne działania następcze |
| qualified | Zweryfikowany | Gotowy do konwersji |
| unqualified | Niezakwalifikowany | Niepasujący |

### 4.2 Schemat blokowy statusów

![design-2026-02-24-00-25-32](https://static-docs.nocobase.com/design-2026-02-24-00-25-32.png)

### 4.3 Proces konwersji leadu

Interfejs konwersji oferuje jednocześnie trzy opcje; użytkownicy mogą wybrać utworzenie lub powiązanie:

- **Klient**: Utwórz nowego klienta LUB powiąż z istniejącym klientem.
- **Kontakt**: Utwórz nowy kontakt (powiązany z klientem).
- **Szansa sprzedaży**: Szansa sprzedaży musi zostać utworzona.
![design-2026-02-24-00-25-22](https://static-docs.nocobase.com/design-2026-02-24-00-25-22.png)

**Rekordy po konwersji:**
- `converted_customer_id`: ID powiązanego klienta
- `converted_contact_id`: ID powiązanego kontaktu
- `converted_opportunity_id`: ID utworzonej szansy sprzedaży

---

## 5. Cykl życia szansy sprzedaży

Zarządzanie szansami sprzedaży wykorzystuje konfigurowalne etapy lejka sprzedaży. Gdy etap szansy ulegnie zmianie, może to automatycznie wyzwolić przewidywanie prawdopodobieństwa wygranej przez AI, aby pomóc handlowcom zidentyfikować ryzyka i okazje.

### 5.1 Konfigurowalne etapy

Etapy są przechowywane w kolekcji `nb_crm_opportunity_stages` i mogą być dostosowywane:

| Kod | Nazwa | Kolejność | Domyślne prawdopodobieństwo wygranej |
|-----|------|------|---------|
| prospecting | Poszukiwanie (Prospecting) | 1 | 10% |
| analysis | Analiza potrzeb | 2 | 30% |
| proposal | Oferta/Wycena | 3 | 60% |
| negotiation | Negocjacje/Przegląd | 4 | 80% |
| won | Zamknięte - Wygrane | 5 | 100% |
| lost | Zamknięte - Przegrane | 6 | 0% |

### 5.2 Przepływ lejka
![design-2026-02-24-00-20-31](https://static-docs.nocobase.com/design-2026-02-24-00-20-31.png)

### 5.3 Wykrywanie stagnacji

Szanse sprzedaży bez aktywności zostaną oznaczone:

| Dni bez aktywności | Działanie |
|-----------|------|
| 7 dni | Żółte ostrzeżenie |
| 14 dni | Pomarańczowe przypomnienie dla opiekuna |
| 30 dni | Czerwone przypomnienie dla menedżera |

```sql
-- Oblicz dni stagnacji
UPDATE nb_crm_opportunities
SET stagnant_days = EXTRACT(DAY FROM NOW() - last_activity_at)
WHERE stage NOT IN ('won', 'lost');
```

### 5.4 Obsługa wygranej/przegranej

**W przypadku wygranej:**
1. Zaktualizuj etap na 'won'.
2. Zapisz faktyczną datę zamknięcia.
3. Zaktualizuj status klienta na 'active'.
4. Wyzwól utworzenie zamówienia (jeśli oferta została zaakceptowana).

**W przypadku przegranej:**
1. Zaktualizuj etap na 'lost'.
2. Zapisz powód utraty.
3. Zapisz ID konkurenta (jeśli przegrano z konkurencją).
4. Powiadom menedżera.

---

## 6. Cykl życia oferty

### 6.1 Definicje statusów

| Status | Nazwa | Opis |
|-----|------|------|
| draft | Szkic | W przygotowaniu |
| pending_approval | Oczekuje na zatwierdzenie | Oczekiwanie na akceptację |
| approved | Zatwierdzona | Gotowa do wysłania |
| sent | Wysłana | Wysłana do klienta |
| accepted | Zaakceptowana | Zaakceptowana przez klienta |
| rejected | Odrzucona | Odrzucona przez klienta |
| expired | Wygasła | Po terminie ważności |

### 6.2 Zasady zatwierdzania (do ustalenia)

Przepływy pracy zatwierdzania są wyzwalane na podstawie następujących warunków:

| Warunek | Poziom zatwierdzenia |
|------|---------|
| Rabat > 10% | Menedżer sprzedaży |
| Rabat > 20% | Dyrektor sprzedaży |
| Kwota > $100K | Finanse + Dyrektor Generalny |

### 6.3 Obsługa wielu walut

#### Filozofia projektowania

Używaj **USD jako jednolitej waluty bazowej** dla wszystkich raportów i analiz. Każdy rekord kwoty przechowuje:
- Oryginalną walutę i kwotę (to, co widzi klient)
- Kurs wymiany w momencie transakcji
- Równowartość w USD (do porównań wewnętrznych)

#### Słownik walut (nb_cbo_currencies)

Konfiguracja walut wykorzystuje wspólną kolekcję danych podstawowych, wspierając dynamiczne zarządzanie. Pole `current_rate` przechowuje aktualny kurs wymiany, aktualizowany przez zaplanowane zadanie na podstawie najnowszego rekordu w `nb_crm_exchange_rates`.

| Pole | Typ | Opis |
|-----|------|------|
| id | BIGINT | Klucz główny |
| code | VARCHAR | Kod waluty (unikalny): USD/CNY/EUR/GBP/JPY |
| name | VARCHAR | Nazwa waluty |
| symbol | VARCHAR | Symbol waluty |
| decimal_places | INTEGER | Miejsca po przecinku |
| current_rate | DECIMAL | Aktualny kurs względem USD (synchronizowany z historii) |
| is_active | BOOLEAN | Czy aktywna |
| sort_order | INTEGER | Kolejność sortowania |

#### Historia kursów walut (nb_crm_exchange_rates)

Rejestruje historyczne dane kursów walut. Zaplanowane zadanie synchronizuje najnowsze kursy z `nb_cbo_currencies.current_rate`.

| Pole | Typ | Opis |
|-----|------|------|
| id | BIGINT | Klucz główny |
| currency_code | VARCHAR | Kod waluty (CNY/EUR/GBP/JPY) |
| rate_to_usd | DECIMAL(10,6) | Kurs względem USD |
| effective_date | DATE | Data wejścia w życie |
| source | VARCHAR | Źródło: manual/api |
| createdAt | TIMESTAMP | Czas utworzenia |

> **Uwaga**: Oferty są powiązane z kolekcją `nb_cbo_currencies` poprzez klucz obcy `currency_id`, a kurs wymiany jest pobierany bezpośrednio z pola `current_rate`. Szanse sprzedaży i zamówienia używają pola VARCHAR `currency` do przechowywania kodu waluty.

#### Wzorzec pola kwoty

Kolekcje zawierające kwoty postępują zgodnie z tym wzorcem:

| Pole | Typ | Opis |
|-----|------|------|
| currency | VARCHAR | Waluta transakcji |
| amount | DECIMAL | Kwota oryginalna |
| exchange_rate | DECIMAL | Kurs wymiany na USD w momencie transakcji |
| amount_usd | DECIMAL | Równowartość w USD (wyliczana) |

**Zastosowano w:**
- `nb_crm_opportunities.amount` → `amount_usd`
- `nb_crm_quotations.total_amount` → `total_amount_usd`

#### Integracja z przepływem pracy
![design-2026-02-24-00-21-00](https://static-docs.nocobase.com/design-2026-02-24-00-21-00.png)

**Logika pobierania kursu wymiany:**
1. Pobierz kurs wymiany bezpośrednio z `nb_cbo_currencies.current_rate` podczas operacji biznesowych.
2. Transakcje w USD: Kurs = 1.0, wyszukiwanie nie jest wymagane.
3. `current_rate` jest synchronizowany przez zaplanowane zadanie z najnowszego rekordu `nb_crm_exchange_rates`.

### 6.4 Zarządzanie wersjami

Gdy oferta zostanie odrzucona lub wygaśnie, można ją powielić jako nową wersję:

```
QT-20260119-001 v1 → Odrzucona
QT-20260119-001 v2 → Wysłana
QT-20260119-001 v3 → Zaakceptowana
```

---

## 7. Cykl życia zamówienia

### 7.1 Przegląd zamówienia

Zamówienia są tworzone po zaakceptowaniu oferty, reprezentując potwierdzone zobowiązanie biznesowe.
![design-2026-02-24-00-21-21](https://static-docs.nocobase.com/design-2026-02-24-00-21-21.png)

### 7.2 Definicje statusów zamówienia

| Status | Kod | Opis | Dozwolone działania |
|-----|------|------|---------|
| Szkic | `draft` | Zamówienie utworzone, jeszcze niepotwierdzone | Edytuj, Potwierdź, Anuluj |
| Potwierdzone | `confirmed` | Zamówienie potwierdzone, oczekuje na realizację | Rozpocznij realizację, Anuluj |
| W toku | `in_progress` | Zamówienie w trakcie przetwarzania/produkcji | Aktualizuj postęp, Wyślij, Anuluj (wymaga zgody) |
| Wysłane | `shipped` | Produkty wysłane do klienta | Oznacz jako dostarczone |
| Dostarczone | `delivered` | Klient otrzymał towar | Zakończ zamówienie |
| Zrealizowane | `completed` | Zamówienie w pełni ukończone | Brak |
| Anulowane | `cancelled` | Zamówienie anulowane | Brak |

### 7.3 Model danych zamówienia

#### nb_crm_orders

| Pole | Typ | Opis |
|-----|------|------|
| id | BIGINT | Klucz główny |
| order_no | VARCHAR | Numer zamówienia (generowany automatycznie, unikalny) |
| customer_id | BIGINT | Klient (FK) |
| contact_id | BIGINT | Kontakt (FK) |
| opportunity_id | BIGINT | Szansa sprzedaży (FK) |
| quotation_id | BIGINT | Oferta (FK) |
| owner_id | BIGINT | Opiekun (FK → users) |
| status | VARCHAR | Status zamówienia |
| payment_status | VARCHAR | Status płatności: unpaid/partial/paid |
| order_date | DATE | Data zamówienia |
| delivery_date | DATE | Przewidywana data dostawy |
| actual_delivery_date | DATE | Faktyczna data dostawy |
| currency | VARCHAR | Waluta zamówienia |
| exchange_rate | DECIMAL | Kurs względem USD |
| order_amount | DECIMAL | Całkowita kwota zamówienia |
| paid_amount | DECIMAL | Kwota zapłacona |
| unpaid_amount | DECIMAL | Kwota pozostała |
| shipping_address | TEXT | Adres wysyłki |
| logistics_company | VARCHAR | Firma logistyczna |
| tracking_no | VARCHAR | Numer śledzenia |
| terms_condition | TEXT | Regulamin i warunki |
| description | TEXT | Opis |

#### nb_crm_order_items

| Pole | Typ | Opis |
|-----|------|------|
| id | BIGINT | Klucz główny |
| order_id | FK | Zamówienie nadrzędne |
| product_id | FK | Odniesienie do produktu |
| product_name | VARCHAR | Migawka nazwy produktu |
| quantity | INT | Zamówiona ilość |
| unit_price | DECIMAL | Cena jednostkowa |
| discount_percent | DECIMAL | Procent rabatu |
| line_total | DECIMAL | Suma pozycji |
| notes | TEXT | Uwagi do pozycji |

### 7.4 Śledzenie płatności

#### nb_crm_payments

| Pole | Typ | Opis |
|-----|------|------|
| id | BIGINT | Klucz główny |
| order_id | BIGINT | Powiązane zamówienie (FK, wymagane) |
| customer_id | BIGINT | Klient (FK) |
| payment_no | VARCHAR | Nr płatności (generowany automatycznie, unikalny) |
| amount | DECIMAL | Kwota płatności (wymagane) |
| currency | VARCHAR | Waluta płatności |
| payment_method | VARCHAR | Metoda: transfer/check/cash/credit_card/lc |
| payment_date | DATE | Data płatności |
| bank_account | VARCHAR | Numer konta bankowego |
| bank_name | VARCHAR | Nazwa banku |
| notes | TEXT | Uwagi do płatności |

---

## 8. Cykl życia klienta

### 8.1 Przegląd klienta

Klienci są tworzeni podczas konwersji leadu lub po wygraniu szansy sprzedaży. System śledzi pełny cykl życia od pozyskania do rzecznictwa (advocacy).
![design-2026-02-24-00-21-34](https://static-docs.nocobase.com/design-2026-02-24-00-21-34.png)

### 8.2 Definicje statusów klienta

| Status | Kod | Kondycja | Opis |
|-----|------|--------|------|
| Potencjalny | `prospect` | N/D | Przekonwertowany lead, brak zamówień |
| Aktywny | `active` | ≥70 | Płacący klient, dobre interakcje |
| Rozwijający się | `growing` | ≥80 | Klient z możliwościami ekspansji |
| Zagrożony | `at_risk` | <50 | Klient wykazujący oznaki odejścia |
| Utracony | `churned` | N/D | Już nieaktywny |
| Do odzyskania | `win_back` | N/D | Były klient w trakcie reaktywacji |
| Rzecznik | `advocate` | ≥90 | Wysoka satysfakcja, dostarcza polecenia |

### 8.3 Punktacja kondycji klienta (Health Scoring)

Kondycja klienta jest obliczana na podstawie wielu czynników:

| Czynnik | Waga | Miernik |
|-----|------|---------|
| Aktualność zakupu | 25% | Dni od ostatniego zamówienia |
| Częstotliwość zakupów | 20% | Liczba zamówień w okresie |
| Wartość pieniężna | 20% | Całkowita i średnia wartość zamówienia |
| Zaangażowanie | 15% | Wskaźniki otwarć e-maili, udział w spotkaniach |
| Kondycja wsparcia | 10% | Liczba zgłoszeń i wskaźnik rozwiązań |
| Użycie produktu | 10% | Metryki aktywnego użytkowania (jeśli dotyczy) |

**Progi kondycji:**

```javascript
if (health_score >= 90) status = 'advocate';
else if (health_score >= 70) status = 'active';
else if (health_score >= 50) status = 'growing';
else status = 'at_risk';
```

### 8.4 Segmentacja klientów

#### Zautomatyzowana segmentacja

| Segment | Warunek | Sugerowane działanie |
|-----|------|---------|
| VIP | LTV > $100K | Obsługa "white-glove", patronat kadry zarządzającej |
| Enterprise | Rozmiar firmy > 500 | Dedykowany opiekun klienta (Account Manager) |
| Mid-Market | Rozmiar firmy 50-500 | Regularne kontakty, wsparcie skalowalne |
| Startup | Rozmiar firmy < 50 | Zasoby samoobsługowe, społeczność |
| Uśpiony | 90+ dni bez aktywności | Marketing reaktywacyjny |

---

## 9. Integracja z e-mail

### 9.1 Przegląd

NocoBase zapewnia wbudowaną wtyczkę integracji e-mail wspierającą Gmail i Outlook. Po zsynchronizowaniu e-maili przepływy pracy mogą automatycznie wyzwalać analizę AI nastrojów i intencji wiadomości, pomagając handlowcom szybko zrozumieć nastawienie klienta.

### 9.2 Synchronizacja e-mail

**Wspierani dostawcy:**
- Gmail (przez OAuth 2.0)
- Outlook/Microsoft 365 (przez OAuth 2.0)

**Zachowanie synchronizacji:**
- Dwukierunkowa synchronizacja wysłanych i odebranych wiadomości.
- Automatyczne powiązanie e-maili z rekordami CRM (Leady, Kontakty, Szanse sprzedaży).
- Załączniki przechowywane w systemie plików NocoBase.

### 9.3 Powiązanie E-mail-CRM (do ustalenia)
![design-2026-02-24-00-21-51](https://static-docs.nocobase.com/design-2026-02-24-00-21-51.png)

### 9.4 Szablony e-mail

Handlowcy mogą korzystać z gotowych szablonów:

| Kategoria szablonu | Przykłady |
|---------|------|
| Pierwszy kontakt | Zimny e-mail, Ciepłe wprowadzenie, Follow-up po wydarzeniu |
| Kontynuacja | Follow-up po spotkaniu, Follow-up po ofercie, Przypomnienie przy braku odpowiedzi |
| Oferta | Oferta w załączniku, Rewizja oferty, Oferta wygasająca |
| Zamówienie | Potwierdzenie zamówienia, Powiadomienie o wysyłce, Potwierdzenie dostawy |
| Sukces klienta | Powitanie, Sprawdzenie zadowolenia, Prośba o opinię |

---

## 10. Możliwości wspomagane przez AI

### 10.1 Zespół pracowników AI

System CRM integruje wtyczkę NocoBase AI, wykorzystując następujących wbudowanych pracowników AI skonfigurowanych do zadań specyficznych dla CRM:

| ID | Nazwa | Wbudowana rola | Możliwości rozszerzenia CRM |
|----|------|---------|-------------|
| viz | Viz | Analityk danych | Analiza danych sprzedażowych, prognozowanie lejka |
| dara | Dara | Ekspert od wykresów | Wizualizacja danych, tworzenie raportów, projektowanie pulpitów |
| ellis | Ellis | Redaktor | Tworzenie szkiców odpowiedzi, podsumowania komunikacji, pisanie e-maili biznesowych |
| lexi | Lexi | Tłumacz | Wielojęzyczna komunikacja z klientem, tłumaczenie treści |
| orin | Orin | Organizator | Codzienne priorytety, sugestie kolejnych kroków, planowanie działań |

### 10.2 Lista zadań AI

Możliwości AI są podzielone na dwie niezależne kategorie:

#### I. Pracownicy AI (wyzwalani przez bloki interfejsu)

Użytkownicy wchodzą w bezpośrednią interakcję z AI poprzez bloki "Pracownik AI" w interfejsie, aby uzyskać analizy i sugestie.

| Pracownik | Zadanie | Opis |
|------|------|------|
| Viz | Analiza danych sprzedażowych | Analiza trendów lejka i współczynników konwersji |
| Viz | Prognozowanie lejka | Przewidywanie przychodów na podstawie ważonego lejka |
| Dara | Generowanie wykresów | Tworzenie wykresów do raportów sprzedażowych |
| Dara | Projektowanie pulpitów | Projektowanie układów pulpitów danych |
| Ellis | Tworzenie szkiców odpowiedzi | Generowanie profesjonalnych odpowiedzi e-mail |
| Ellis | Podsumowanie komunikacji | Podsumowywanie wątków e-mail |
| Ellis | Pisanie e-maili biznesowych | Zaproszenia na spotkania, follow-upy, podziękowania itp. |
| Orin | Codzienne priorytety | Generowanie priorytetowej listy zadań na dany dzień |
| Orin | Następny najlepszy krok | Rekomendowanie kolejnych kroków dla każdej szansy |
| Lexi | Tłumaczenie treści | Tłumaczenie materiałów marketingowych, ofert i e-maili |

#### II. Węzły LLM w przepływie pracy (automatyczne wykonanie w tle)

Węzły LLM osadzone w przepływach pracy, wyzwalane automatycznie przez zdarzenia kolekcji, zdarzenia akcji lub zaplanowane zadania, niezależnie od Pracowników AI.

| Zadanie | Metoda wyzwalania | Opis | Pole docelowe |
|------|---------|------|---------|
| Punktacja leadu | Zdarzenie kolekcji (Utworzenie/Aktualizacja) | Ocena jakości leadu | ai_score, ai_convert_prob |
| Przewidywanie szansy | Zdarzenie kolekcji (Zmiana etapu) | Przewidywanie prawdopodobieństwa sukcesu szansy | ai_win_probability, ai_risk_factors |

> **Uwaga**: Węzły LLM w przepływie pracy używają promptów i schematów wyjściowych dla strukturalnego formatu JSON, który jest analizowany i zapisywany w polach danych biznesowych bez interwencji użytkownika.

### 10.3 Pola AI w bazie danych

| Tabela | Pole AI | Opis |
|----|--------|------|
| nb_crm_leads | ai_score | Wynik AI 0-100 |
| | ai_convert_prob | Prawdopodobieństwo konwersji |
| | ai_best_contact_time | Najlepszy czas kontaktu |
| | ai_tags | Tagi wygenerowane przez AI (JSONB) |
| | ai_scored_at | Czas oceny |
| | ai_next_best_action | Sugestia następnego najlepszego kroku |
| | ai_nba_generated_at | Czas wygenerowania sugestii |
| nb_crm_opportunities | ai_win_probability | Przewidywane przez AI prawdopodobieństwo wygranej |
| | ai_analyzed_at | Czas analizy |
| | ai_confidence | Pewność prognozy |
| | ai_trend | Trend: up/stable/down |
| | ai_risk_factors | Czynniki ryzyka (JSONB) |
| | ai_recommendations | Lista rekomendacji (JSONB) |
| | ai_predicted_close | Przewidywana data zamknięcia |
| | ai_next_best_action | Sugestia następnego najlepszego kroku |
| | ai_nba_generated_at | Czas wygenerowania sugestii |
| nb_crm_customers | ai_health_score | Wynik kondycji 0-100 |
| | ai_health_grade | Klasa kondycji: A/B/C/D |
| | ai_churn_risk | Ryzyko odejścia 0-100% |
| | ai_churn_risk_level | Poziom ryzyka odejścia: low/medium/high |
| | ai_health_dimensions | Wyniki wymiarów (JSONB) |
| | ai_recommendations | Lista rekomendacji (JSONB) |
| | ai_health_assessed_at | Czas oceny kondycji |
| | ai_tags | Tagi wygenerowane przez AI (JSONB) |
| | ai_best_contact_time | Najlepszy czas kontaktu |
| | ai_next_best_action | Sugestia następnego najlepszego kroku |
| | ai_nba_generated_at | Czas wygenerowania sugestii |

---

## 11. Silnik przepływu pracy

### 11.1 Zaimplementowane przepływy pracy

| Nazwa przepływu pracy | Typ wyzwalacza | Status | Opis |
|-----------|---------|------|------|
| Leads Created | Zdarzenie kolekcji | Włączony | Wyzwalany po utworzeniu leadu |
| CRM Overall Analytics | Zdarzenie Pracownika AI | Włączony | Ogólna analiza danych CRM |
| Lead Conversion | Zdarzenie po akcji | Włączony | Proces konwersji leadu |
| Lead Assignment | Zdarzenie kolekcji | Włączony | Automatyczne przypisywanie leadów |
| Lead Scoring | Zdarzenie kolekcji | Wyłączony | Punktacja leadów (do ustalenia) |
| Follow-up Reminder | Zaplanowane zadanie | Wyłączony | Przypomnienia o kontakcie (do ustalenia) |

### 11.2 Przepływy pracy do zaimplementowania

| Przepływ pracy | Typ wyzwalacza | Opis |
|-------|---------|------|
| Awans etapu szansy | Zdarzenie kolekcji | Aktualizacja prawdopodobieństwa i czasu przy zmianie etapu |
| Wykrywanie stagnacji szansy | Zaplanowane zadanie | Wykrywanie nieaktywnych szans i wysyłanie przypomnień |
| Zatwierdzanie oferty | Zdarzenie po akcji | Wielopoziomowy proces zatwierdzania |
| Generowanie zamówienia | Zdarzenie po akcji | Automatyczne generowanie zamówienia po akceptacji oferty |

---

## 12. Projekt menu i interfejsu

### 12.1 Struktura administracyjna

| Menu | Typ | Opis |
|------|------|------|
| **Dashboards** | Grupa | Pulpity nawigacyjne |
| - Dashboard | Strona | Domyślny pulpit |
| - SalesManager | Strona | Widok menedżera sprzedaży |
| - SalesRep | Strona | Widok przedstawiciela handlowego |
| - Executive | Strona | Widok dyrektorski |
| **Leads** | Strona | Zarządzanie leadami |
| **Customers** | Strona | Zarządzanie klientami |
| **Opportunities** | Strona | Zarządzanie szansami sprzedaży |
| - Table | Zakładka | Lista szans sprzedaży |
| **Products** | Strona | Zarządzanie produktami |
| - Categories | Zakładka | Kategorie produktów |
| **Orders** | Strona | Zarządzanie zamówieniami |
| **Settings** | Grupa | Ustawienia |
| - Stage Settings | Strona | Konfiguracja etapów szansy |
| - Exchange Rate | Strona | Ustawienia kursów walut |
| - Activity | Strona | Rekordy aktywności |
| - Emails | Strona | Zarządzanie e-mailami |
| - Contacts | Strona | Zarządzanie kontaktami |
| - Data Analysis | Strona | Analiza danych |

### 12.2 Widoki pulpitów nawigacyjnych

#### Widok menedżera sprzedaży

| Komponent | Typ | Dane |
|-----|------|------|
| Wartość lejka | Karta KPI | Całkowita kwota lejka według etapów |
| Ranking zespołu | Tabela | Ranking wyników przedstawicieli |
| Alerty ryzyka | Lista alertów | Szanse sprzedaży o wysokim ryzyku |
| Trend współczynnika wygranych | Wykres liniowy | Miesięczny współczynnik wygranych |
| Stagnujące transakcje | Lista | Transakcje wymagające uwagi |

#### Widok przedstawiciela handlowego

| Komponent | Typ | Dane |
|-----|------|------|
| Postęp mojej kwoty | Pasek postępu | Miesięczna realizacja vs. kwota docelowa |
| Oczekujące szanse | Karta KPI | Liczba moich oczekujących szans |
| Zamykane w tym tygodniu | Lista | Transakcje, których zamknięcie planowane jest wkrótce |
| Zaległe aktywności | Alert | Przeterminowane zadania |
| Szybkie akcje | Przyciski | Zaloguj aktywność, Utwórz szansę |

#### Widok dyrektorski

| Komponent | Typ | Dane |
|-----|------|------|
| Roczny przychód | Karta KPI | Przychód od początku roku |
| Wartość lejka | Karta KPI | Całkowita kwota lejka sprzedaży |
| Współczynnik wygranych | Karta KPI | Ogólny współczynnik wygranych |
| Kondycja klientów | Rozkład | Rozkład wyników kondycji (health score) |
| Prognoza | Wykres | Miesięczna prognoza przychodów |


---

*Wersja dokumentu: v2.0 | Aktualizacja: 2026-02-06*