:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/solution/crm/design).
:::

# Detailní návrh systému CRM 2.0


## 1. Přehled systému a filozofie návrhu

### 1.1 Pozicování systému

Tento systém je **platforma pro správu prodeje CRM 2.0** postavená na no-code platformě NocoBase. Hlavním cílem je:

```
Umožnit obchodníkům soustředit se na budování vztahů se zákazníky, nikoli na zadávání dat a opakující se analýzy.
```

Systém automatizuje běžné úkoly prostřednictvím pracovních postupů a využívá AI k asistenci při skórování leadů, analýze obchodních případů a dalších činnostech, čímž pomáhá prodejním týmům zvyšovat efektivitu.

### 1.2 Filozofie návrhu

#### Filozofie 1: Kompletní prodejní trychtýř

**End-to-end prodejní proces:**
![design-2026-02-24-00-05-26](https://static-docs.nocobase.com/design-2026-02-24-00-05-26.png)

**Proč tento návrh?**

| Tradiční způsob | Integrované CRM |
|---------|-----------|
| Používání více systémů pro různé fáze | Jediný systém pokrývající celý životní cyklus |
| Manuální přenos dat mezi systémy | Automatizovaný tok dat a konverze |
| Nejednotné pohledy na zákazníka | Jednotný 360stupňový pohled na zákazníka |
| Fragmentovaná analýza dat | End-to-end analýza prodejní pipeline |

#### Filozofie 2: Konfigurovatelná prodejní pipeline
![design-2026-02-24-00-06-04](https://static-docs.nocobase.com/design-2026-02-24-00-06-04.png)

Různá odvětví si mohou přizpůsobit fáze prodejní pipeline bez nutnosti úpravy kódu.

#### Filozofie 3: Modulární design

- Základní moduly (Zákazníci + Obchodní případy) jsou povinné; ostatní moduly lze povolit podle potřeby.
- Deaktivace modulů nevyžaduje změny v kódu; provádí se prostřednictvím konfigurace rozhraní NocoBase.
- Každý modul je navržen nezávisle, aby se snížila provázanost (coupling).

---

## 2. Architektura modulů a přizpůsobení

### 2.1 Přehled modulů

Systém CRM využívá **modulární architekturu** – každý modul lze nezávisle povolit nebo zakázat na základě obchodních požadavků.
![design-2026-02-24-00-06-14](https://static-docs.nocobase.com/design-2026-02-24-00-06-14.png)

### 2.2 Závislosti modulů

| Modul | Povinný | Závislosti | Podmínka pro deaktivaci |
|-----|---------|--------|---------|
| **Správa zákazníků** | ✅ Ano | - | Nelze zakázat (jádro) |
| **Správa obchodních případů** | ✅ Ano | Správa zákazníků | Nelze zakázat (jádro) |
| **Správa leadů** | Volitelný | - | Pokud není vyžadováno získávání leadů |
| **Správa cenových nabídek** | Volitelný | Obchodní případy, Produkty | Jednoduché transakce nevyžadující formální nabídky |
| **Správa objednávek** | Volitelný | Obchodní případy (nebo Nabídky) | Pokud není vyžadováno sledování objednávek/plateb |
| **Správa produktů** | Volitelný | - | Pokud není vyžadován katalog produktů |
| **Integrace e-mailu** | Volitelný | Zákazníci, Kontakty | Při používání externího e-mailového systému |

### 2.3 Předkonfigurované verze

| Verze | Obsažené moduly | Scénář použití | Počet kolekcí |
|-----|---------|---------|-----------|
| **Lite** | Zákazníci + Obchodní případy | Sledování jednoduchých transakcí | 6 |
| **Standard** | Lite + Leady + Nabídky + Objednávky + Produkty | Kompletní prodejní cyklus | 15 |
| **Enterprise** | Standard + Integrace e-mailu | Plná funkčnost včetně e-mailu | 17 |

### 2.4 Mapování modulů na kolekce

#### Kolekce hlavních modulů (vždy vyžadovány)

| Kolekce | Modul | Popis |
|-------|------|------|
| nb_crm_customers | Správa zákazníků | Záznamy zákazníků/společností |
| nb_crm_contacts | Správa zákazníků | Kontakty |
| nb_crm_customer_shares | Správa zákazníků | Oprávnění ke sdílení zákazníků |
| nb_crm_opportunities | Správa obchodních případů | Prodejní obchodní případy |
| nb_crm_opportunity_stages | Správa obchodních případů | Konfigurace fází |
| nb_crm_opportunity_users | Správa obchodních případů | Spolupracovníci na obchodním případu |
| nb_crm_activities | Správa aktivit | Záznamy aktivit |
| nb_crm_comments | Správa aktivit | Komentáře/poznámky |
| nb_crm_tags | Jádro | Sdílené štítky |
| nb_cbo_currencies | Základní data | Číselník měn |
| nb_cbo_regions | Základní data | Číselník zemí/regionů |

### 2.5 Jak zakázat moduly

Stačí skrýt položku menu pro daný modul v administraci NocoBase; není třeba upravovat kód ani mazat kolekce.

---

## 3. Hlavní entity a datový model

### 3.1 Přehled vztahů mezi entitami
![design-2026-02-24-00-06-40](https://static-docs.nocobase.com/design-2026-02-24-00-06-40.png)

### 3.2 Podrobnosti o hlavních kolekcích

#### 3.2.1 Leady (nb_crm_leads)

Správa leadů využívající zjednodušený pracovní postup o 4 fázích.

**Proces fází:**
```
Nový → V řešení → Kvalifikovaný → Převeden na zákazníka/obchodní případ
         ↓            ↓
    Nekvalifikovaný Nekvalifikovaný
```

**Klíčová pole:**

| Pole | Typ | Popis |
|-----|------|------|
| id | BIGINT | Primární klíč |
| lead_no | VARCHAR | Číslo leadu (automaticky generováno) |
| name | VARCHAR | Jméno kontaktu |
| company | VARCHAR | Název společnosti |
| title | VARCHAR | Pracovní pozice |
| email | VARCHAR | E-mail |
| phone | VARCHAR | Telefon |
| mobile_phone | VARCHAR | Mobil |
| website | TEXT | Webové stránky |
| address | TEXT | Adresa |
| source | VARCHAR | Zdroj leadu: web/reklama/doporučení/veletrh/telemarketing/email/sociální sítě |
| industry | VARCHAR | Odvětví |
| annual_revenue | VARCHAR | Rozsah ročních tržeb |
| number_of_employees | VARCHAR | Rozsah počtu zaměstnanců |
| status | VARCHAR | Stav: new/working/qualified/unqualified |
| rating | VARCHAR | Hodnocení: hot/warm/cold |
| owner_id | BIGINT | Vlastník (FK → users) |
| ai_score | INTEGER | AI skóre kvality 0-100 |
| ai_convert_prob | DECIMAL | AI pravděpodobnost konverze |
| ai_best_contact_time | VARCHAR | AI doporučený čas kontaktu |
| ai_tags | JSONB | AI generované štítky |
| ai_scored_at | TIMESTAMP | Čas AI skórování |
| ai_next_best_action | TEXT | AI návrh dalšího nejlepšího kroku |
| ai_nba_generated_at | TIMESTAMP | Čas generování AI návrhu |
| is_converted | BOOLEAN | Příznak převedení |
| converted_at | TIMESTAMP | Čas převedení |
| converted_customer_id | BIGINT | ID převedeného zákazníka |
| converted_contact_id | BIGINT | ID převedeného kontaktu |
| converted_opportunity_id | BIGINT | ID vytvořeného obchodního případu |
| lost_reason | TEXT | Důvod ztráty |
| disqualification_reason | TEXT | Důvod diskvalifikace |
| description | TEXT | Popis |

#### 3.2.2 Zákazníci (nb_crm_customers)

Správa zákazníků/společností podporující mezinárodní obchod.

**Klíčová pole:**

| Pole | Typ | Popis |
|-----|------|------|
| id | BIGINT | Primární klíč |
| name | VARCHAR | Název zákazníka (povinné) |
| account_number | VARCHAR | Číslo účtu/zákazníka (automatické, unikátní) |
| phone | VARCHAR | Telefon |
| website | TEXT | Webové stránky |
| address | TEXT | Adresa |
| industry | VARCHAR | Odvětví |
| type | VARCHAR | Typ: prospect/customer/partner/competitor |
| number_of_employees | VARCHAR | Rozsah počtu zaměstnanců |
| annual_revenue | VARCHAR | Rozsah ročních tržeb |
| level | VARCHAR | Úroveň: normal/important/vip |
| status | VARCHAR | Stav: potential/active/dormant/churned |
| country | VARCHAR | Země |
| region_id | BIGINT | Region (FK → nb_cbo_regions) |
| preferred_currency | VARCHAR | Preferovaná měna: CNY/USD/EUR |
| owner_id | BIGINT | Vlastník (FK → users) |
| parent_id | BIGINT | Mateřská společnost (FK → self) |
| source_lead_id | BIGINT | ID zdrojového leadu |
| ai_health_score | INTEGER | AI skóre zdraví 0-100 |
| ai_health_grade | VARCHAR | AI stupeň zdraví: A/B/C/D |
| ai_churn_risk | DECIMAL | AI riziko odchodu 0-100% |
| ai_churn_risk_level | VARCHAR | AI úroveň rizika odchodu: low/medium/high |
| ai_health_dimensions | JSONB | AI skóre jednotlivých dimenzí zdraví |
| ai_recommendations | JSONB | Seznam AI doporučení |
| ai_health_assessed_at | TIMESTAMP | Čas AI posouzení zdraví |
| ai_tags | JSONB | AI generované štítky |
| ai_best_contact_time | VARCHAR | AI doporučený čas kontaktu |
| ai_next_best_action | TEXT | AI návrh dalšího nejlepšího kroku |
| ai_nba_generated_at | TIMESTAMP | Čas generování AI návrhu |
| description | TEXT | Popis |
| is_deleted | BOOLEAN | Příznak smazání (soft delete) |

#### 3.2.3 Obchodní případy (nb_crm_opportunities)

Správa prodejních obchodních případů s konfigurovatelnými fázemi pipeline.

**Klíčová pole:**

| Pole | Typ | Popis |
|-----|------|------|
| id | BIGINT | Primární klíč |
| opportunity_no | VARCHAR | Číslo obchodního případu (automatické, unikátní) |
| name | VARCHAR | Název obchodního případu (povinné) |
| amount | DECIMAL | Předpokládaná částka |
| currency | VARCHAR | Měna |
| exchange_rate | DECIMAL | Směnný kurz |
| amount_usd | DECIMAL | Ekvivalentní částka v USD |
| customer_id | BIGINT | Zákazník (FK) |
| contact_id | BIGINT | Hlavní kontakt (FK) |
| stage | VARCHAR | Kód fáze (FK → stages.code) |
| stage_sort | INTEGER | Pořadí fáze (redundantní pro snadné řazení) |
| stage_entered_at | TIMESTAMP | Čas vstupu do aktuální fáze |
| days_in_stage | INTEGER | Počet dní v aktuální fázi |
| win_probability | DECIMAL | Manuální pravděpodobnost výhry |
| ai_win_probability | DECIMAL | AI předpověď pravděpodobnosti výhry |
| ai_analyzed_at | TIMESTAMP | Čas AI analýzy |
| ai_confidence | DECIMAL | Spolehlivost AI předpovědi |
| ai_trend | VARCHAR | AI trend předpovědi: up/stable/down |
| ai_risk_factors | JSONB | AI identifikované rizikové faktory |
| ai_recommendations | JSONB | Seznam AI doporučení |
| ai_predicted_close | DATE | AI předpokládané datum uzavření |
| ai_next_best_action | TEXT | AI návrh dalšího nejlepšího kroku |
| ai_nba_generated_at | TIMESTAMP | Čas generování AI návrhu |
| expected_close_date | DATE | Očekávané datum uzavření |
| actual_close_date | DATE | Skutečné datum uzavření |
| owner_id | BIGINT | Vlastník (FK → users) |
| last_activity_at | TIMESTAMP | Čas poslední aktivity |
| stagnant_days | INTEGER | Počet dní bez aktivity |
| loss_reason | TEXT | Důvod ztráty |
| competitor_id | BIGINT | Konkurent (FK) |
| lead_source | VARCHAR | Zdroj leadu |
| campaign_id | BIGINT | ID marketingové kampaně |
| expected_revenue | DECIMAL | Očekávaný výnos = částka × pravděpodobnost |
| description | TEXT | Popis |

#### 3.2.4 Cenové nabídky (nb_crm_quotations)

Správa cenových nabídek s podporou více měn a schvalovacích pracovních postupů.

**Tok stavů:**
```
Koncept → Čeká na schválení → Schváleno → Odesláno → Přijato/Odmítnuto/Expirováno
               ↓
           Odmítnuto → Upravit → Koncept
```

**Klíčová pole:**

| Pole | Typ | Popis |
|-----|------|------|
| id | BIGINT | Primární klíč |
| quotation_no | VARCHAR | Číslo nabídky (automatické, unikátní) |
| name | VARCHAR | Název nabídky |
| version | INTEGER | Číslo verze |
| opportunity_id | BIGINT | Obchodní případ (FK, povinné) |
| customer_id | BIGINT | Zákazník (FK) |
| contact_id | BIGINT | Kontakt (FK) |
| owner_id | BIGINT | Vlastník (FK → users) |
| currency_id | BIGINT | Měna (FK → nb_cbo_currencies) |
| exchange_rate | DECIMAL | Směnný kurz |
| subtotal | DECIMAL | Mezisoučet |
| discount_rate | DECIMAL | Sazba slevy |
| discount_amount | DECIMAL | Částka slevy |
| shipping_handling | DECIMAL | Doprava a balné |
| tax_rate | DECIMAL | Sazba daně |
| tax_amount | DECIMAL | Částka daně |
| total_amount | DECIMAL | Celková částka |
| total_amount_usd | DECIMAL | Ekvivalentní částka v USD |
| status | VARCHAR | Stav: draft/pending_approval/approved/sent/accepted/rejected/expired |
| submitted_at | TIMESTAMP | Čas odeslání ke schválení |
| approved_by | BIGINT | Schvalovatel (FK → users) |
| approved_at | TIMESTAMP | Čas schválení |
| rejected_at | TIMESTAMP | Čas zamítnutí |
| sent_at | TIMESTAMP | Čas odeslání zákazníkovi |
| customer_response_at | TIMESTAMP | Čas reakce zákazníka |
| expired_at | TIMESTAMP | Čas vypršení platnosti |
| valid_until | DATE | Platnost do |
| payment_terms | TEXT | Platební podmínky |
| terms_condition | TEXT | Smluvní podmínky |
| address | TEXT | Dodací adresa |
| description | TEXT | Popis |

#### 3.2.5 Objednávky (nb_crm_orders)

Správa objednávek včetně sledování plateb.

**Klíčová pole:**

| Pole | Typ | Popis |
|-----|------|------|
| id | BIGINT | Primární klíč |
| order_no | VARCHAR | Číslo objednávky (automatické, unikátní) |
| customer_id | BIGINT | Zákazník (FK) |
| contact_id | BIGINT | Kontakt (FK) |
| opportunity_id | BIGINT | Obchodní případ (FK) |
| quotation_id | BIGINT | Nabídka (FK) |
| owner_id | BIGINT | Vlastník (FK → users) |
| currency | VARCHAR | Měna |
| exchange_rate | DECIMAL | Směnný kurz |
| order_amount | DECIMAL | Částka objednávky |
| paid_amount | DECIMAL | Zaplacená částka |
| unpaid_amount | DECIMAL | Nezaplacená částka |
| status | VARCHAR | Stav: pending/confirmed/in_progress/shipped/delivered/completed/cancelled |
| payment_status | VARCHAR | Stav platby: unpaid/partial/paid |
| order_date | DATE | Datum objednávky |
| delivery_date | DATE | Předpokládané datum doručení |
| actual_delivery_date | DATE | Skutečné datum doručení |
| shipping_address | TEXT | Dodací adresa |
| logistics_company | VARCHAR | Logistická společnost |
| tracking_no | VARCHAR | Sledovací číslo |
| terms_condition | TEXT | Smluvní podmínky |
| description | TEXT | Popis |

### 3.3 Souhrn kolekcí

#### Obchodní kolekce CRM

| Č. | Název kolekce | Popis | Typ |
|-----|------|------|------|
| 1 | nb_crm_leads | Správa leadů | Obchodní |
| 2 | nb_crm_customers | Zákazníci/Společnosti | Obchodní |
| 3 | nb_crm_contacts | Kontakty | Obchodní |
| 4 | nb_crm_opportunities | Prodejní obchodní případy | Obchodní |
| 5 | nb_crm_opportunity_stages | Konfigurace fází | Konfigurační |
| 6 | nb_crm_opportunity_users | Spolupracovníci (prodejní tým) | Asociační |
| 7 | nb_crm_quotations | Cenové nabídky | Obchodní |
| 8 | nb_crm_quotation_items | Položky nabídky | Obchodní |
| 9 | nb_crm_quotation_approvals | Záznamy o schválení | Obchodní |
| 10 | nb_crm_orders | Objednávky | Obchodní |
| 11 | nb_crm_order_items | Položky objednávky | Obchodní |
| 12 | nb_crm_payments | Záznamy o platbách | Obchodní |
| 13 | nb_crm_products | Katalog produktů | Obchodní |
| 14 | nb_crm_product_categories | Kategorie produktů | Konfigurační |
| 15 | nb_crm_price_tiers | Stupňovité ceny | Konfigurační |
| 16 | nb_crm_activities | Záznamy aktivit | Obchodní |
| 17 | nb_crm_comments | Komentáře/poznámky | Obchodní |
| 18 | nb_crm_competitors | Konkurenti | Obchodní |
| 19 | nb_crm_tags | Štítky | Konfigurační |
| 20 | nb_crm_lead_tags | Vazba Lead-Štítek | Asociační |
| 21 | nb_crm_contact_tags | Vazba Kontakt-Štítek | Asociační |
| 22 | nb_crm_customer_shares | Oprávnění ke sdílení zákazníků | Asociační |
| 23 | nb_crm_exchange_rates | Historie směnných kurzů | Konfigurační |

#### Kolekce základních dat (společné moduly)

| Č. | Název kolekce | Popis | Typ |
|-----|------|------|------|
| 1 | nb_cbo_currencies | Číselník měn | Konfigurační |
| 2 | nb_cbo_regions | Číselník zemí/regionů | Konfigurační |

### 3.4 Pomocné kolekce

#### 3.4.1 Komentáře (nb_crm_comments)

Univerzální kolekce komentářů/poznámek, kterou lze přiřadit k různým obchodním objektům.

| Pole | Typ | Popis |
|-----|------|------|
| id | BIGINT | Primární klíč |
| content | TEXT | Obsah komentáře |
| lead_id | BIGINT | Související lead (FK) |
| customer_id | BIGINT | Související zákazník (FK) |
| opportunity_id | BIGINT | Související obchodní případ (FK) |
| order_id | BIGINT | Související objednávka (FK) |

#### 3.4.2 Sdílení zákazníků (nb_crm_customer_shares)

Umožňuje spolupráci více osob a sdílení oprávnění k zákazníkům.

| Pole | Typ | Popis |
|-----|------|------|
| id | BIGINT | Primární klíč |
| customer_id | BIGINT | Zákazník (FK, povinné) |
| shared_with_user_id | BIGINT | Sdíleno s uživatelem (FK, povinné) |
| shared_by_user_id | BIGINT | Sdílel uživatel (FK) |
| permission_level | VARCHAR | Úroveň oprávnění: read/write/full |
| shared_at | TIMESTAMP | Čas sdílení |

#### 3.4.3 Spolupracovníci na obchodním případu (nb_crm_opportunity_users)

Podporuje spolupráci prodejního týmu na obchodních případech.

| Pole | Typ | Popis |
|-----|------|------|
| opportunity_id | BIGINT | Obchodní případ (FK, složený PK) |
| user_id | BIGINT | Uživatel (FK, složený PK) |
| role | VARCHAR | Role: owner/collaborator/viewer |

#### 3.4.4 Regiony (nb_cbo_regions)

Základní číselník zemí a regionů.

| Pole | Typ | Popis |
|-----|------|------|
| id | BIGINT | Primární klíč |
| code_alpha2 | VARCHAR | ISO 3166-1 Alpha-2 kód (unikátní) |
| code_alpha3 | VARCHAR | ISO 3166-1 Alpha-3 kód (unikátní) |
| code_numeric | VARCHAR | ISO 3166-1 číselný kód |
| name | VARCHAR | Název země/regionu |
| is_active | BOOLEAN | Je aktivní |
| sort_order | INTEGER | Pořadí řazení |

---

## 4. Životní cyklus leadu

Správa leadů využívá zjednodušený pracovní postup o 4 fázích. Při vytvoření nového leadu může pracovní postup automaticky spustit AI skórování, které obchodníkům pomůže rychle identifikovat vysoce kvalitní leady.

### 4.1 Definice stavů

| Stav | Název | Popis |
|-----|------|------|
| new | Nový | Právě vytvořen, čeká na kontaktování |
| working | V řešení | Aktivní následná komunikace |
| qualified | Kvalifikovaný | Připraven ke konverzi |
| unqualified | Nekvalifikovaný | Nevhodný kandidát |

### 4.2 Diagram stavů

![design-2026-02-24-00-25-32](https://static-docs.nocobase.com/design-2026-02-24-00-25-32.png)

### 4.3 Proces konverze leadu

Rozhraní pro konverzi nabízí tři možnosti současně; uživatelé si mohou vybrat, co vytvořit nebo přiřadit:

- **Zákazník**: Vytvořit nového zákazníka NEBO přiřadit ke stávajícímu.
- **Kontakt**: Vytvořit nový kontakt (přiřazený k zákazníkovi).
- **Obchodní případ**: Obchodní případ musí být vytvořen.
![design-2026-02-24-00-25-22](https://static-docs.nocobase.com/design-2026-02-24-00-25-22.png)

**Záznamy po konverzi:**
- `converted_customer_id`: ID přiřazeného zákazníka
- `converted_contact_id`: ID přiřazeného kontaktu
- `converted_opportunity_id`: ID vytvořeného obchodního případu

---

## 5. Životní cyklus obchodního případu

Správa obchodních případů využívá konfigurovatelné fáze prodejní pipeline. Při změně fáze může dojít k automatickému spuštění AI předpovědi pravděpodobnosti výhry, což obchodníkům pomáhá identifikovat rizika a příležitosti.

### 5.1 Konfigurovatelné fáze

Fáze jsou uloženy v kolekci `nb_crm_opportunity_stages` a lze je přizpůsobit:

| Kód | Název | Pořadí | Výchozí pravděpodobnost výhry |
|-----|------|------|---------|
| prospecting | Vyhledávání | 1 | 10% |
| analysis | Analýza potřeb | 2 | 30% |
| proposal | Návrh / Cenová nabídka | 3 | 60% |
| negotiation | Vyjednávání / Revize | 4 | 80% |
| won | Uzavřeno - Získáno | 5 | 100% |
| lost | Uzavřeno - Ztraceno | 6 | 0% |

### 5.2 Průběh pipeline
![design-2026-02-24-00-20-31](https://static-docs.nocobase.com/design-2026-02-24-00-20-31.png)

### 5.3 Detekce stagnace

Obchodní případy bez aktivity budou označeny:

| Dny bez aktivity | Akce |
|-----------|------|
| 7 dní | Žluté varování |
| 14 dní | Oranžové připomenutí vlastníkovi |
| 30 dní | Červené připomenutí manažerovi |

```sql
-- Výpočet dní stagnace
UPDATE nb_crm_opportunities
SET stagnant_days = EXTRACT(DAY FROM NOW() - last_activity_at)
WHERE stage NOT IN ('won', 'lost');
```

### 5.4 Zpracování výhry/ztráty

**Při výhře (Won):**
1. Aktualizace fáze na 'won'.
2. Záznam skutečného data uzavření.
3. Aktualizace stavu zákazníka na 'active'.
4. Spuštění vytvoření objednávky (pokud byla přijata cenová nabídka).

**Při ztrátě (Lost):**
1. Aktualizace fáze na 'lost'.
2. Záznam důvodu ztráty.
3. Záznam ID konkurenta (pokud bylo ztraceno ve prospěch konkurence).
4. Upozornění manažera.

---

## 6. Životní cyklus cenové nabídky

### 6.1 Definice stavů

| Stav | Název | Popis |
|-----|------|------|
| draft | Koncept | V přípravě |
| pending_approval | Čeká na schválení | Čeká na schválení nadřízeným |
| approved | Schváleno | Připraveno k odeslání |
| sent | Odesláno | Odesláno zákazníkovi |
| accepted | Přijato | Zákazník nabídku přijal |
| rejected | Odmítnuto | Zákazník nabídku odmítl |
| expired | Expirováno | Po datu platnosti |

### 6.2 Pravidla schvalování (k dopracování)

Schvalovací pracovní postupy se spouštějí na základě následujících podmínek:

| Podmínka | Úroveň schválení |
|------|---------|
| Sleva > 10% | Manažer prodeje |
| Sleva > 20% | Ředitel prodeje |
| Částka > $100K | Finanční oddělení + Generální ředitel |

### 6.3 Podpora více měn

#### Filozofie návrhu

Použití **USD jako jednotné základní měny** pro všechny reporty a analýzy. Každý záznam částky ukládá:
- Původní měnu a částku (to, co vidí zákazník)
- Směnný kurz v době transakce
- Ekvivalentní částku v USD (pro interní porovnání)

#### Číselník měn (nb_cbo_currencies)

Konfigurace měn využívá společnou kolekci základních dat podporující dynamickou správu. Pole `current_rate` ukládá aktuální směnný kurz, který je aktualizován plánovanou úlohou z nejnovějšího záznamu v `nb_crm_exchange_rates`.

| Pole | Typ | Popis |
|-----|------|------|
| id | BIGINT | Primární klíč |
| code | VARCHAR | Kód měny (unikátní): USD/CNY/EUR/GBP/JPY |
| name | VARCHAR | Název měny |
| symbol | VARCHAR | Symbol měny |
| decimal_places | INTEGER | Počet desetinných míst |
| current_rate | DECIMAL | Aktuální kurz vůči USD (synchronizováno z historie) |
| is_active | BOOLEAN | Je aktivní |
| sort_order | INTEGER | Pořadí řazení |

#### Historie směnných kurzů (nb_crm_exchange_rates)

Zaznamenává historická data směnných kurzů. Plánovaná úloha synchronizuje nejnovější kurzy do `nb_cbo_currencies.current_rate`.

| Pole | Typ | Popis |
|-----|------|------|
| id | BIGINT | Primární klíč |
| currency_code | VARCHAR | Kód měny (CNY/EUR/GBP/JPY) |
| rate_to_usd | DECIMAL(10,6) | Kurz vůči USD |
| effective_date | DATE | Datum účinnosti |
| source | VARCHAR | Zdroj: manual/api |
| createdAt | TIMESTAMP | Čas vytvoření |

> **Poznámka**: Cenové nabídky jsou propojeny s kolekcí `nb_cbo_currencies` přes cizí klíč `currency_id` a směnný kurz je získáván přímo z pole `current_rate`. Obchodní případy a objednávky používají pole `currency` typu VARCHAR pro uložení kódu měny.

#### Vzor polí pro částky

Kolekce obsahující částky následují tento vzor:

| Pole | Typ | Popis |
|-----|------|------|
| currency | VARCHAR | Měna transakce |
| amount | DECIMAL | Původní částka |
| exchange_rate | DECIMAL | Směnný kurz vůči USD v době transakce |
| amount_usd | DECIMAL | Ekvivalent v USD (vypočteno) |

**Aplikováno na:**
- `nb_crm_opportunities.amount` → `amount_usd`
- `nb_crm_quotations.total_amount` → `total_amount_usd`

#### Integrace do pracovního postupu
![design-2026-02-24-00-21-00](https://static-docs.nocobase.com/design-2026-02-24-00-21-00.png)

**Logika získávání směnného kurzu:**
1. Během obchodních operací se směnný kurz získá přímo z `nb_cbo_currencies.current_rate`.
2. Transakce v USD: Kurz = 1.0, vyhledávání není nutné.
3. `current_rate` je synchronizován plánovanou úlohou z nejnovějšího záznamu `nb_crm_exchange_rates`.

### 6.4 Správa verzí

Pokud je cenová nabídka odmítnuta nebo vyprší její platnost, lze ji duplikovat jako novou verzi:

```
QT-20260119-001 v1 → Odmítnuto
QT-20260119-001 v2 → Odesláno
QT-20260119-001 v3 → Přijato
```

---

## 7. Životní cyklus objednávky

### 7.1 Přehled objednávek

Objednávky se vytvářejí při přijetí cenové nabídky a představují potvrzený obchodní závazek.
![design-2026-02-24-00-21-21](https://static-docs.nocobase.com/design-2026-02-24-00-21-21.png)

### 7.2 Definice stavů objednávky

| Stav | Kód | Popis | Povolené akce |
|-----|------|------|---------|
| Koncept | `draft` | Objednávka vytvořena, dosud nepotvrzena | Upravit, Potvrdit, Zrušit |
| Potvrzeno | `confirmed` | Objednávka potvrzena, čeká na vyřízení | Zahájit plnění, Zrušit |
| V řešení | `in_progress` | Objednávka se zpracovává/vyrábí | Aktualizovat stav, Odeslat, Zrušit (vyžaduje schválení) |
| Odesláno | `shipped` | Produkty odeslány zákazníkovi | Označit jako doručené |
| Doručeno | `delivered` | Zákazník zboží převzal | Dokončit objednávku |
| Dokončeno | `completed` | Objednávka plně dokončena | Žádné |
| Zrušeno | `cancelled` | Objednávka byla zrušena | Žádné |

### 7.3 Datový model objednávky

#### nb_crm_orders

| Pole | Typ | Popis |
|-----|------|------|
| id | BIGINT | Primární klíč |
| order_no | VARCHAR | Číslo objednávky (automatické, unikátní) |
| customer_id | BIGINT | Zákazník (FK) |
| contact_id | BIGINT | Kontakt (FK) |
| opportunity_id | BIGINT | Obchodní případ (FK) |
| quotation_id | BIGINT | Nabídka (FK) |
| owner_id | BIGINT | Vlastník (FK → users) |
| status | VARCHAR | Stav objednávky |
| payment_status | VARCHAR | Stav platby: unpaid/partial/paid |
| order_date | DATE | Datum objednávky |
| delivery_date | DATE | Předpokládané datum doručení |
| actual_delivery_date | DATE | Skutečné datum doručení |
| currency | VARCHAR | Měna objednávky |
| exchange_rate | DECIMAL | Kurz vůči USD |
| order_amount | DECIMAL | Celková částka objednávky |
| paid_amount | DECIMAL | Zaplacená částka |
| unpaid_amount | DECIMAL | Nezaplacená částka |
| shipping_address | TEXT | Dodací adresa |
| logistics_company | VARCHAR | Logistická společnost |
| tracking_no | VARCHAR | Sledovací číslo |
| terms_condition | TEXT | Smluvní podmínky |
| description | TEXT | Popis |

#### nb_crm_order_items

| Pole | Typ | Popis |
|-----|------|------|
| id | BIGINT | Primární klíč |
| order_id | FK | Nadřazená objednávka |
| product_id | FK | Odkaz na produkt |
| product_name | VARCHAR | Název produktu (snapshot) |
| quantity | INT | Objednané množství |
| unit_price | DECIMAL | Jednotková cena |
| discount_percent | DECIMAL | Procento slevy |
| line_total | DECIMAL | Celkem za položku |
| notes | TEXT | Poznámky k položce |

### 7.4 Sledování plateb

#### nb_crm_payments

| Pole | Typ | Popis |
|-----|------|------|
| id | BIGINT | Primární klíč |
| order_id | BIGINT | Související objednávka (FK, povinné) |
| customer_id | BIGINT | Zákazník (FK) |
| payment_no | VARCHAR | Číslo platby (automatické, unikátní) |
| amount | DECIMAL | Částka platby (povinné) |
| currency | VARCHAR | Měna platby |
| payment_method | VARCHAR | Metoda: převod/šek/hotovost/karta/akreditiv |
| payment_date | DATE | Datum platby |
| bank_account | VARCHAR | Číslo bankovního účtu |
| bank_name | VARCHAR | Název banky |
| notes | TEXT | Poznámky k platbě |

---

## 8. Životní cyklus zákazníka

### 8.1 Přehled zákazníků

Zákazníci se vytvářejí během konverze leadu nebo při vyhraném obchodním případu. Systém sleduje celý životní cyklus od akvizice až po loajálního ambasadora.
![design-2026-02-24-00-21-34](https://static-docs.nocobase.com/design-2026-02-24-00-21-34.png)

### 8.2 Definice stavů zákazníka

| Stav | Kód | Zdraví | Popis |
|-----|------|--------|------|
| Potenciální | `prospect` | N/A | Převedený lead, zatím bez objednávek |
| Aktivní | `active` | ≥70 | Platící zákazník, dobrá interakce |
| Rostoucí | `growing` | ≥80 | Zákazník s příležitostmi k expanzi |
| Ohrožený | `at_risk` | <50 | Zákazník vykazující známky odchodu |
| Ztracený | `churned` | N/A | Již není aktivní |
| Znovuzískání | `win_back` | N/A | Bývalý zákazník v procesu reaktivace |
| Ambasador | `advocate` | ≥90 | Vysoká spokojenost, poskytuje doporučení |

### 8.3 Skórování zdraví zákazníka

Zdraví zákazníka se vypočítává na základě několika faktorů:

| Faktor | Váha | Metrika |
|-----|------|---------|
| Recence nákupu | 25% | Počet dní od poslední objednávky |
| Frekvence nákupů | 20% | Počet objednávek za období |
| Peněžní hodnota | 20% | Celková a průměrná hodnota objednávek |
| Angažovanost | 15% | Míra otevření e-mailů, účast na schůzkách |
| Zdraví podpory | 10% | Objem požadavků a míra jejich vyřešení |
| Používání produktu | 10% | Metriky aktivního používání (pokud jsou k dispozici) |

**Prahové hodnoty zdraví:**

```javascript
if (health_score >= 90) status = 'advocate';
else if (health_score >= 70) status = 'active';
else if (health_score >= 50) status = 'growing';
else status = 'at_risk';
```

### 8.4 Segmentace zákazníků

#### Automatizovaná segmentace

| Segment | Podmínka | Navrhovaná akce |
|-----|------|---------|
| VIP | LTV > $100K | Prémiový servis (white-glove), exekutivní sponzoring |
| Enterprise | Velikost spol. > 500 | Vyhrazený Account Manager |
| Střední trh | Velikost spol. 50-500 | Pravidelné kontroly, škálovaná podpora |
| Startup | Velikost spol. < 50 | Samoobslužné zdroje, komunita |
| Spící | 90+ dní bez aktivity | Reaktivní marketing |

---

## 9. Integrace e-mailu

### 9.1 Přehled

NocoBase poskytuje vestavěný plugin pro integraci e-mailu podporující Gmail a Outlook. Po synchronizaci e-mailů mohou pracovní postupy automaticky spustit AI analýzu sentimentu a záměru e-mailu, což obchodníkům pomůže rychle pochopit postoje zákazníků.

### 9.2 Synchronizace e-mailů

**Podporovaní poskytovatelé:**
- Gmail (přes OAuth 2.0)
- Outlook/Microsoft 365 (přes OAuth 2.0)

**Chování synchronizace:**
- Obousměrná synchronizace odeslaných a přijatých e-mailů.
- Automatické přiřazení e-mailů k záznamům v CRM (Leady, Kontakty, Obchodní případy).
- Přílohy uložené v souborovém systému NocoBase.

### 9.3 Vazba E-mail-CRM (k dopracování)
![design-2026-02-24-00-21-51](https://static-docs.nocobase.com/design-2026-02-24-00-21-51.png)

### 9.4 E-mailové šablony

Obchodníci mohou používat přednastavené šablony:

| Kategorie šablon | Příklady |
|---------|------|
| Prvotní oslovení | Cold email, vřelé představení, follow-up po akci |
| Následná komunikace | Follow-up po schůzce, follow-up po nabídce, urgence při neodpovídání |
| Nabídka | Nabídka v příloze, revize nabídky, končící platnost nabídky |
| Objednávka | Potvrzení objednávky, oznámení o odeslání, potvrzení doručení |
| Úspěch zákazníka | Uvítání, kontrolní dotaz, žádost o recenzi |

---

## 10. Funkce s podporou AI

### 10.1 Tým AI zaměstnanců

Systém CRM integruje AI plugin NocoBase a využívá následující vestavěné AI zaměstnance nakonfigurované pro specifické úkoly v CRM:

| ID | Název | Vestavěná role | Rozšířené schopnosti pro CRM |
|----|------|---------|-------------|
| viz | Viz | Datový analytik | Analýza prodejních dat, prognózování pipeline |
| dara | Dara | Expert na grafy | Vizualizace dat, vývoj reportů, návrh nástěnek |
| ellis | Ellis | Editor | Koncepty odpovědí na e-maily, shrnutí komunikace, psaní obchodních e-mailů |
| lexi | Lexi | Překladatel | Vícejazyčná komunikace se zákazníky, překlad obsahu |
| orin | Orin | Organizátor | Denní priority, návrhy dalších kroků, plánování následných aktivit |

### 10.2 Seznam AI úkolů

Schopnosti AI jsou rozděleny do dvou nezávislých kategorií:

#### I. AI zaměstnanci (spouštěno front-endovým blokem)

Uživatelé komunikují přímo s AI prostřednictvím front-endových bloků AI zaměstnanců za účelem získání analýz a návrhů.

| Zaměstnanec | Úkol | Popis |
|------|------|------|
| Viz | Analýza prodejních dat | Analýza trendů v pipeline a konverzních poměrů |
| Viz | Prognózování pipeline | Předpověď výnosů na základě vážené pipeline |
| Dara | Generování grafů | Generování grafů pro prodejní reporty |
| Dara | Návrh nástěnek | Návrh rozvržení datových nástěnek |
| Ellis | Koncepty odpovědí | Generování profesionálních odpovědí na e-maily |
| Ellis | Shrnutí komunikace | Shrnutí e-mailových vláken |
| Ellis | Psaní obchodních e-mailů | Pozvánky na schůzky, follow-upy, děkovné e-maily atd. |
| Orin | Denní priority | Generování prioritního seznamu úkolů pro daný den |
| Orin | Další nejlepší krok | Doporučení dalších kroků pro každý obchodní případ |
| Lexi | Překlad obsahu | Překlad marketingových materiálů, návrhů a e-mailů |

#### II. LLM uzly v pracovním postupu (automatické spuštění na pozadí)

LLM uzly vložené do pracovních postupů, spouštěné automaticky událostmi v kolekcích, akcemi nebo plánovanými úlohami, nezávisle na AI zaměstnancích.

| Úkol | Metoda spuštění | Popis | Cílové pole |
|------|---------|------|---------|
| Skórování leadů | Událost v kolekci (Vytvoření/Aktualizace) | Posouzení kvality leadu | ai_score, ai_convert_prob |
| Předpověď výhry | Událost v kolekci (Změna fáze) | Předpověď pravděpodobnosti úspěchu obchodního případu | ai_win_probability, ai_risk_factors |

> **Poznámka**: LLM uzly v pracovním postupu využívají prompty a Schema výstup pro strukturovaný JSON, který je analyzován a zapsán do polí obchodních dat bez zásahu uživatele.

### 10.3 AI pole v databázi

| Tabulka | AI pole | Popis |
|----|--------|------|
| nb_crm_leads | ai_score | AI skóre 0-100 |
| | ai_convert_prob | Pravděpodobnost konverze |
| | ai_best_contact_time | Nejlepší čas pro kontakt |
| | ai_tags | AI generované štítky (JSONB) |
| | ai_scored_at | Čas skórování |
| | ai_next_best_action | AI návrh dalšího nejlepšího kroku |
| | ai_nba_generated_at | Čas generování návrhu |
| nb_crm_opportunities | ai_win_probability | AI předpověď pravděpodobnosti výhry |
| | ai_analyzed_at | Čas analýzy |
| | ai_confidence | Spolehlivost předpovědi |
| | ai_trend | Trend: up/stable/down |
| | ai_risk_factors | Rizikové faktory (JSONB) |
| | ai_recommendations | Seznam doporučení (JSONB) |
| | ai_predicted_close | Předpokládané datum uzavření |
| | ai_next_best_action | AI návrh dalšího nejlepšího kroku |
| | ai_nba_generated_at | Čas generování návrhu |
| nb_crm_customers | ai_health_score | Skóre zdraví 0-100 |
| | ai_health_grade | Stupeň zdraví: A/B/C/D |
| | ai_churn_risk | Riziko odchodu 0-100% |
| | ai_churn_risk_level | Úroveň rizika odchodu: low/medium/high |
| | ai_health_dimensions | Skóre dimenzí (JSONB) |
| | ai_recommendations | Seznam doporučení (JSONB) |
| | ai_health_assessed_at | Čas posouzení zdraví |
| | ai_tags | AI generované štítky (JSONB) |
| | ai_best_contact_time | Nejlepší čas pro kontakt |
| | ai_next_best_action | AI návrh dalšího nejlepšího kroku |
| | ai_nba_generated_at | Čas generování návrhu |

---

## 11. Engine pracovních postupů

### 11.1 Implementované pracovní postupy

| Název pracovního postupu | Typ spouštěče | Stav | Popis |
|-----------|---------|------|------|
| Leads Created | Událost v kolekci | Povoleno | Spustí se při vytvoření leadu |
| CRM Overall Analytics | Událost AI zaměstnance | Povoleno | Celková analýza dat CRM |
| Lead Conversion | Událost po akci | Povoleno | Proces konverze leadu |
| Lead Assignment | Událost v kolekci | Povoleno | Automatické přidělování leadů |
| Lead Scoring | Událost v kolekci | Zakázáno | Skórování leadů (k dopracování) |
| Follow-up Reminder | Plánovaná úloha | Zakázáno | Připomenutí následných aktivit (k dopracování) |

### 11.2 Pracovní postupy k implementaci

| Pracovní postup | Typ spouštěče | Popis |
|-------|---------|------|
| Posun fáze obchodního případu | Událost v kolekci | Aktualizace pravděpodobnosti výhry a záznam času při změně fáze |
| Detekce stagnace obchodního případu | Plánovaná úloha | Detekce neaktivních obchodních případů a zasílání připomenutí |
| Schvalování cenové nabídky | Událost po akci | Víceúrovňový schvalovací proces |
| Generování objednávky | Událost po akci | Automatické generování objednávky po přijetí nabídky |

---

## 12. Návrh menu a rozhraní

### 12.1 Struktura administrace

| Menu | Typ | Popis |
|------|------|------|
| **Nástěnky** | Skupina | Nástěnky |
| - Nástěnka | Stránka | Výchozí nástěnka |
| - Manažer prodeje | Stránka | Pohled pro manažera prodeje |
| - Obchodní zástupce | Stránka | Pohled pro obchodního zástupce |
| - Vedení | Stránka | Pohled pro vedení společnosti |
| **Leady** | Stránka | Správa leadů |
| **Zákazníci** | Stránka | Správa zákazníků |
| **Obchodní případy** | Stránka | Správa obchodních případů |
| - Tabulka | Karta | Seznam obchodních případů |
| **Produkty** | Stránka | Správa produktů |
| - Kategorie | Karta | Kategorie produktů |
| **Objednávky** | Stránka | Správa objednávek |
| **Nastavení** | Skupina | Nastavení |
| - Nastavení fází | Stránka | Konfigurace fází obchodních případů |
| - Směnný kurz | Stránka | Nastavení směnných kurzů |
| - Aktivity | Stránka | Záznamy aktivit |
| - E-maily | Stránka | Správa e-mailů |
| - Kontakty | Stránka | Správa kontaktů |
| - Analýza dat | Stránka | Analýza dat |

### 12.2 Zobrazení nástěnek

#### Pohled pro manažera prodeje

| Komponenta | Typ | Data |
|-----|------|------|
| Hodnota pipeline | KPI karta | Celková částka v pipeline podle fází |
| Žebříček týmu | Tabulka | Pořadí výkonu obchodních zástupců |
| Riziková varování | Seznam varování | Vysoce rizikové obchodní případy |
| Trend míry výher | Čárový graf | Měsíční míra výher |
| Stagnující obchody | Seznam | Obchody vyžadující pozornost |

#### Pohled pro obchodního zástupce

| Komponenta | Typ | Data |
|-----|------|------|
| Plnění mé kvóty | Ukazatel průběhu | Měsíční skutečnost vs. kvóta |
| Nevyřízené obchodní případy | KPI karta | Počet mých nevyřízených obchodních případů |
| Uzavírané tento týden | Seznam | Obchody, které mají být brzy uzavřeny |
| Aktivity po termínu | Varování | Úkoly po termínu platnosti |
| Rychlé akce | Tlačítka | Zaznamenat aktivitu, Vytvořit obchodní případ |

#### Pohled pro vedení (Executive)

| Komponenta | Typ | Data |
|-----|------|------|
| Roční výnosy | KPI karta | Výnosy od začátku roku (YTD) |
| Hodnota pipeline | KPI karta | Celková částka v pipeline |
| Míra výher | KPI karta | Celková míra výher |
| Zdraví zákazníků | Distribuce | Rozdělení skóre zdraví |
| Prognóza | Graf | Měsíční prognóza výnosů |


---

*Verze dokumentu: v2.0 | Aktualizováno: 2026-02-06*