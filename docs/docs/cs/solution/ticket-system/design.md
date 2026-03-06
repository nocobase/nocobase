:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/solution/ticket-system/design).
:::

# Detailní návrh řešení tiketového systému

> **Verze**: v2.0-beta

> **Datum aktualizace**: 05. 01. 2026

> **Stav**: Náhled

## 1. Přehled systému a koncept návrhu

### 1.1 Pozicování systému

Tento systém je **inteligentní platforma pro správu tiketů poháněná AI**, postavená na low-code platformě NocoBase. Hlavním cílem je:

```
Umožnit zákaznickému servisu soustředit se na řešení problémů, nikoliv na zdlouhavé procesní operace.
```

### 1.2 Koncept návrhu

#### Koncept 1: Datová architektura typu T

**Co je architektura typu T?**

Vychází z konceptu "talentu typu T" — horizontální šířka + vertikální hloubka:

- **Horizontální (Hlavní tabulka)**: Pokrývá obecné schopnosti pro všechny typy agend — core pole jako číslo, stav, řešitel, SLA atd.
- **Vertikální (Rozšiřující tabulky)**: Specifická pole pro konkrétní agendy — opravy zařízení mají sériová čísla, stížnosti mají plány kompenzací.

![ticketing-imgs-2025-12-31-22-50-45](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-18-25.png)

**Proč tento návrh?**

| Tradiční řešení | Architektura typu T |
|----------|---------|
| Jedna tabulka pro každý typ agendy, duplicitní pole | Jednotná správa společných polí, rozšíření dle potřeby |
| Statistické reporty vyžadují spojování mnoha tabulek | Jedna hlavní tabulka přímo pro statistiku všech tiketů |
| Změna procesu vyžaduje úpravy na mnoha místech | Změna jádra procesu pouze na jednom místě |
| Nový typ agendy vyžaduje novou tabulku | Stačí přidat rozšiřující tabulku, hlavní proces zůstává |

#### Koncept 2: Tým AI zaměstnanců

Nejde o "funkce AI", ale o "AI zaměstnance". Každá AI má jasnou roli, osobnost a odpovědnost:

| AI zaměstnanec | Pozice | Hlavní odpovědnosti | Scénář spuštění |
|--------|------|----------|----------|
| **Sam** | Vedoucí service desku | Směrování tiketů, hodnocení priority, rozhodování o eskalaci | Automaticky při vytvoření tiketu |
| **Grace** | Expert na zákaznický úspěch | Generování odpovědí, úprava tónu, řešení stížností | Po kliknutí na "AI odpověď" |
| **Max** | Asistent znalostí | Podobné případy, doporučování znalostí, syntéza řešení | Automaticky na stránce detailu tiketu |
| **Lexi** | Překladatel | Vícejazyčný překlad, překlad komentářů | Automaticky při detekci cizího jazyka |

**Proč model "AI zaměstnanců"?**

- **Jasné odpovědnosti**: Sam řeší směrování, Grace řeší odpovědi, nedochází ke zmatkům.
- **Snadná pochopitelnost**: Říct uživateli "Nechte Sama provést analýzu" je přátelštější než "Volání klasifikačního API".
- **Rozšiřitelnost**: Nová schopnost AI = nábor nového zaměstnance.

#### Koncept 3: Sebecirkulace znalostí

![ticketing-imgs-2025-12-31-22-51-09](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-19-13.png)

Tím se vytváří uzavřená smyčka **akumulace znalostí – aplikace znalostí**.

---

## 2. Jádro entit a datový model

### 2.1 Přehled vztahů entit

![ticketing-imgs-2025-12-31-22-51-23](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-20-02.png)


### 2.2 Detailní popis hlavních tabulek

#### 2.2.1 Hlavní tabulka tiketů (nb_tts_tickets)

Toto je jádro systému, využívající design "široké tabulky", kde jsou všechna běžná pole umístěna v hlavní tabulce.

**Základní informace**

| Pole | Typ | Popis | Příklad |
|------|------|------|------|
| id | BIGINT | Primární klíč | 1001 |
| ticket_no | VARCHAR | Číslo tiketu | TKT-20251229-0001 |
| title | VARCHAR | Předmět | Pomalé připojení k síti |
| description | TEXT | Popis problému | Od dnešního rána v kanceláři... |
| biz_type | VARCHAR | Typ agendy | it_support |
| priority | VARCHAR | Priorita | P1 |
| status | VARCHAR | Stav | processing |

**Sledování zdroje**

| Pole | Typ | Popis | Příklad |
|------|------|------|------|
| source_system | VARCHAR | Zdrojový systém | crm / email / iot |
| source_channel | VARCHAR | Zdrojový kanál | web / phone / wechat |
| external_ref_id | VARCHAR | Externí referenční ID | CRM-2024-0001 |

**Informace o kontaktu**

| Pole | Typ | Popis |
|------|------|------|
| customer_id | BIGINT | ID zákazníka |
| contact_name | VARCHAR | Jméno kontaktní osoby |
| contact_phone | VARCHAR | Kontaktní telefon |
| contact_email | VARCHAR | Kontaktní e-mail |
| contact_company | VARCHAR | Název společnosti |

**Informace o řešiteli**

| Pole | Typ | Popis |
|------|------|------|
| assignee_id | BIGINT | ID řešitele |
| assignee_department_id | BIGINT | ID oddělení řešitele |
| transfer_count | INT | Počet předání |

**Časové uzly**

| Pole | Typ | Popis | Okamžik spuštění |
|------|------|------|----------|
| submitted_at | TIMESTAMP | Čas odeslání | Při vytvoření tiketu |
| assigned_at | TIMESTAMP | Čas přiřazení | Při určení řešitele |
| first_response_at | TIMESTAMP | Čas první odezvy | Při první odpovědi zákazníkovi |
| resolved_at | TIMESTAMP | Čas vyřešení | Při změně stavu na resolved |
| closed_at | TIMESTAMP | Čas uzavření | Při změně stavu na closed |

**Související se SLA**

| Pole | Typ | Popis |
|------|------|------|
| sla_config_id | BIGINT | ID konfigurace SLA |
| sla_response_due | TIMESTAMP | Termín odezvy |
| sla_resolve_due | TIMESTAMP | Termín vyřešení |
| sla_paused_at | TIMESTAMP | Čas zahájení pozastavení SLA |
| sla_paused_duration | INT | Kumulovaná doba pozastavení (minuty) |
| is_sla_response_breached | BOOLEAN | Zda došlo k porušení odezvy |
| is_sla_resolve_breached | BOOLEAN | Zda došlo k porušení vyřešení |

**Výsledky AI analýzy**

| Pole | Typ | Popis | Kdo vyplňuje |
|------|------|------|----------|
| ai_category_code | VARCHAR | AI rozpoznaná kategorie | Sam |
| ai_sentiment | VARCHAR | Analýza emocí | Sam |
| ai_urgency | VARCHAR | Naléhavost | Sam |
| ai_keywords | JSONB | Klíčová slova | Sam |
| ai_reasoning | TEXT | Proces uvažování | Sam |
| ai_suggested_reply | TEXT | Navrhovaná odpověď | Sam/Grace |
| ai_confidence_score | NUMERIC | Skóre spolehlivosti | Sam |
| ai_analysis | JSONB | Kompletní výsledek analýzy | Sam |

**Podpora více jazyků**

| Pole | Typ | Popis | Kdo vyplňuje |
|------|------|------|----------|
| source_language_code | VARCHAR | Původní jazyk | Sam/Lexi |
| target_language_code | VARCHAR | Cílový jazyk | Výchozí EN |
| is_translated | BOOLEAN | Zda je přeloženo | Lexi |
| description_translated | TEXT | Přeložený popis | Lexi |

#### 2.2.2 Rozšiřující tabulky agend

**Oprava zařízení (nb_tts_biz_repair)**

| Pole | Typ | Popis |
|------|------|------|
| ticket_id | BIGINT | ID souvisejícího tiketu |
| equipment_model | VARCHAR | Model zařízení |
| serial_number | VARCHAR | Sériové číslo |
| fault_code | VARCHAR | Kód poruchy |
| spare_parts | JSONB | Seznam náhradních dílů |
| maintenance_type | VARCHAR | Typ údržby |

**IT podpora (nb_tts_biz_it_support)**

| Pole | Typ | Popis |
|------|------|------|
| ticket_id | BIGINT | ID souvisejícího tiketu |
| asset_number | VARCHAR | Inventární číslo |
| os_version | VARCHAR | Verze operačního systému |
| software_name | VARCHAR | Související software |
| remote_address | VARCHAR | Vzdálená adresa |
| error_code | VARCHAR | Kód chyby |

**Stížnost zákazníka (nb_tts_biz_complaint)**

| Pole | Typ | Popis |
|------|------|------|
| ticket_id | BIGINT | ID souvisejícího tiketu |
| related_order_no | VARCHAR | Číslo související objednávky |
| complaint_level | VARCHAR | Úroveň stížnosti |
| compensation_amount | DECIMAL | Částka kompenzace |
| compensation_type | VARCHAR | Způsob kompenzace |
| root_cause | TEXT | Hlavní příčina |

#### 2.2.3 Tabulka komentářů (nb_tts_ticket_comments)

**Core pole**

| Pole | Typ | Popis |
|------|------|------|
| id | BIGINT | Primární klíč |
| ticket_id | BIGINT | ID tiketu |
| parent_id | BIGINT | ID nadřazeného komentáře (podpora stromu) |
| content | TEXT | Obsah komentáře |
| direction | VARCHAR | Směr: inbound (zákazník) / outbound (řešitel) |
| is_internal | BOOLEAN | Zda jde o interní poznámku |
| is_first_response | BOOLEAN | Zda jde o první odezvu |

**Pole pro AI audit (pro outbound)**

| Pole | Typ | Popis |
|------|------|------|
| source_language_code | VARCHAR | Zdrojový jazyk |
| content_translated | TEXT | Přeložený obsah |
| is_translated | BOOLEAN | Zda je přeloženo |
| is_ai_blocked | BOOLEAN | Zda bylo zablokováno AI |
| ai_block_reason | VARCHAR | Důvod zablokování |
| ai_block_detail | TEXT | Detailní vysvětlení |
| ai_quality_score | NUMERIC | Skóre kvality |
| ai_suggestions | TEXT | Návrhy na zlepšení |

#### 2.2.4 Tabulka hodnocení (nb_tts_ratings)

| Pole | Typ | Popis |
|------|------|------|
| ticket_id | BIGINT | ID tiketu (unikátní) |
| overall_rating | INT | Celková spokojenost (1-5) |
| response_rating | INT | Rychlost odezvy (1-5) |
| professionalism_rating | INT | Úroveň profesionality (1-5) |
| resolution_rating | INT | Vyřešení problému (1-5) |
| nps_score | INT | NPS skóre (0-10) |
| tags | JSONB | Rychlé štítky |
| comment | TEXT | Slovní hodnocení |

#### 2.2.5 Tabulka znalostních článků (nb_tts_qa_articles)

| Pole | Typ | Popis |
|------|------|------|
| article_no | VARCHAR | Číslo článku KB-T0001 |
| title | VARCHAR | Předmět |
| content | TEXT | Obsah (Markdown) |
| summary | TEXT | Souhrn |
| category_code | VARCHAR | Kód kategorie |
| keywords | JSONB | Klíčová slova |
| source_type | VARCHAR | Zdroj: ticket/faq/manual |
| source_ticket_id | BIGINT | ID zdrojového tiketu |
| ai_generated | BOOLEAN | Zda bylo generováno AI |
| ai_quality_score | NUMERIC | Skóre kvality |
| status | VARCHAR | Stav: draft/published/archived |
| view_count | INT | Počet zobrazení |
| helpful_count | INT | Počet označení jako užitečné |

### 2.3 Seznam datových tabulek

| Pořadí | Název tabulky | Popis | Typ záznamu |
|------|------|------|----------|
| 1 | nb_tts_tickets | Hlavní tabulka tiketů | Obchodní data |
| 2 | nb_tts_biz_repair | Rozšíření pro opravy zařízení | Obchodní data |
| 3 | nb_tts_biz_it_support | Rozšíření pro IT podporu | Obchodní data |
| 4 | nb_tts_biz_complaint | Rozšíření pro stížnosti zákazníků | Obchodní data |
| 5 | nb_tts_customers | Hlavní tabulka zákazníků | Obchodní data |
| 6 | nb_tts_customer_contacts | Kontaktní osoby zákazníka | Obchodní data |
| 7 | nb_tts_ticket_comments | Komentáře k tiketu | Obchodní data |
| 8 | nb_tts_ratings | Hodnocení spokojenosti | Obchodní data |
| 9 | nb_tts_qa_articles | Znalostní články | Znalostní data |
| 10 | nb_tts_qa_article_relations | Vazby článků | Znalostní data |
| 11 | nb_tts_faqs | Časté dotazy | Znalostní data |
| 12 | nb_tts_tickets_categories | Kategorie tiketů | Konfigurační data |
| 13 | nb_tts_sla_configs | Konfigurace SLA | Konfigurační data |
| 14 | nb_tts_skill_configs | Konfigurace dovedností | Konfigurační data |
| 15 | nb_tts_business_types | Typy agend | Konfigurační data |

---

## 3. Životní cyklus tiketu

### 3.1 Definice stavů

| Stav | Název | Popis | SLA časování | Barva |
|------|------|------|---------|------|
| new | Nový | Právě vytvořen, čeká na přiřazení | Start | 🔵 Modrá |
| assigned | Přiřazen | Řešitel určen, čeká na přijetí | Pokračuje | 🔷 Azurová |
| processing | V řešení | Právě se zpracovává | Pokračuje | 🟠 Oranžová |
| pending | Pozastaven | Čeká se na zpětnou vazbu zákazníka | **Pozastaveno** | ⚫ Šedá |
| transferred | Předán | Předáno jiné osobě | Pokračuje | 🟣 Fialová |
| resolved | Vyřešen | Čeká se na potvrzení zákazníka | Stop | 🟢 Zelená |
| closed | Uzavřen | Tiket ukončen | Stop | ⚫ Šedá |
| cancelled | Zrušen | Tiket zrušen | Stop | ⚫ Šedá |

### 3.2 Diagram toku stavů

**Hlavní proces (zleva doprava)**

![ticketing-imgs-2025-12-31-22-51-45](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-21-01.png)

**Větvení procesu**

![ticketing-imgs-2025-12-31-22-52-42](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-22-14.png)

![ticketing-imgs-2025-12-31-22-52-53](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-22-32.png)


**Kompletní stavový automat**

![ticketing-imgs-2025-12-31-22-54-23](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-23-13.png)

### 3.3 Klíčová pravidla přechodu stavů

| Z | Do | Podmínka spuštění | Akce systému |
|----|----|---------|---------|
| new | assigned | Určení řešitele | Záznam assigned_at |
| assigned | processing | Řešitel klikne na "Přijmout" | Žádná |
| processing | pending | Kliknutí na "Pozastavit" | Záznam sla_paused_at |
| pending | processing | Odpověď zákazníka / Ruční obnovení | Výpočet doby pozastavení, vymazání paused_at |
| processing | resolved | Kliknutí na "Vyřešit" | Záznam resolved_at |
| resolved | closed | Potvrzení zákazníka / Vypršení 3 dnů | Záznam closed_at |
| * | cancelled | Zrušení tiketu | Žádná |


---

## 4. Správa úrovně služeb SLA

### 4.1 Konfigurace priorit a SLA

| Priorita | Název | Čas odezvy | Čas vyřešení | Práh varování | Typický scénář |
|--------|------|----------|----------|----------|----------|
| P0 | Kritická | 15 minut | 2 hodiny | 80% | Výpadek systému, zastavení linky |
| P1 | Vysoká | 1 hodina | 8 hodin | 80% | Porucha důležité funkce |
| P2 | Střední | 4 hodiny | 24 hodin | 80% | Běžné problémy |
| P3 | Nízká | 8 hodin | 72 hodin | 80% | Dotazy, návrhy |

### 4.2 Logika výpočtu SLA

![ticketing-imgs-2025-12-31-22-53-54](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-23-46.png)

#### Při vytvoření tiketu

```
Termín odezvy = Čas odeslání + Limit odezvy (minuty)
Termín vyřešení = Čas odeslání + Limit vyřešení (minuty)
```

#### Při pozastavení (pending)

```
Čas zahájení pozastavení SLA = Aktuální čas
```

#### Při obnovení (z pending zpět do processing)

```
-- Výpočet aktuální doby pozastavení
Doba aktuálního pozastavení = Aktuální čas - Čas zahájení pozastavení SLA

-- Přičtení k celkové době pozastavení
Kumulovaná doba pozastavení = Kumulovaná doba pozastavení + Doba aktuálního pozastavení

-- Prodloužení termínů (doba pozastavení se do SLA nezapočítává)
Termín odezvy = Termín odezvy + Doba aktuálního pozastavení
Termín vyřešení = Termín vyřešení + Doba aktuálního pozastavení

-- Vymazání času zahájení pozastavení
Čas zahájení pozastavení SLA = Prázdné
```

#### Určení porušení SLA

```
-- Určení porušení odezvy
Zda došlo k porušení odezvy = (Čas první odezvy je prázdný A Aktuální čas > Termín odezvy)
                            NEBO (Čas první odezvy > Termín odezvy)

-- Určení porušení vyřešení
Zda došlo k porušení vyřešení = (Čas vyřešení je prázdný A Aktuální čas > Termín vyřešení)
                             NEBO (Čas vyřešení > Termín vyřešení)
```

### 4.3 Mechanismus varování SLA

| Úroveň varování | Podmínka | Příjemce oznámení | Způsob oznámení |
|----------|------|----------|----------|
| Žluté varování | Zbývající čas < 20% | Řešitel | Interní zpráva |
| Červené varování | Již po termínu | Řešitel + Vedoucí | Interní zpráva + E-mail |
| Eskalační varování | 1 hodina po termínu | Manažer oddělení | E-mail + SMS |

### 4.4 Ukazatele SLA na dashboardu

| Ukazatel | Vzorec výpočtu | Práh zdraví |
|------|----------|----------|
| Míra dodržení odezvy | Tikety bez porušení / Celkový počet tiketů | > 95% |
| Míra dodržení vyřešení | Vyřešené bez porušení / Celkem vyřešené tikety | > 90% |
| Průměrný čas odezvy | SUM(Čas odezvy) / Počet tiketů | < 50% SLA |
| Průměrný čas vyřešení | SUM(Čas vyřešení) / Počet tiketů | < 80% SLA |

---

## 5. Schopnosti AI a systém zaměstnanců

### 5.1 Tým AI zaměstnanců

Systém konfiguruje 8 AI zaměstnanců rozdělených do dvou kategorií:

**Noví zaměstnanci (specifičtí pro tiketový systém)**

| ID | Jméno | Pozice | Hlavní schopnosti |
|----|------|------|----------|
| sam | Sam | Vedoucí service desku | Směrování tiketů, hodnocení priority, rozhodování o eskalaci, identifikace rizik SLA |
| grace | Grace | Expert na zákaznický úspěch | Generování profesionálních odpovědí, úprava tónu, řešení stížností, obnova spokojenosti |
| max | Max | Asistent znalostí | Vyhledávání podobných případů, doporučování znalostí, syntéza řešení |

**Sdílení zaměstnanci (obecné schopnosti)**

| ID | Jméno | Pozice | Hlavní schopnosti |
|----|------|------|----------|
| dex | Dex | Organizátor dat | Extrakce tiketů z e-mailů, převod hovorů na tikety, hromadné čištění dat |
| ellis | Ellis | Expert na e-maily | Analýza emocí v e-mailech, souhrn vláken, návrhy odpovědí |
| lexi | Lexi | Překladatel | Překlad tiketů, překlad odpovědí, překlad konverzací v reálném čase |
| cole | Cole | Expert na NocoBase | Návody k použití systému, pomoc s konfigurací pracovních postupů |
| vera | Vera | Výzkumný analytik | Výzkum technických řešení, ověřování informací o produktech |

### 5.2 Seznam úkolů AI

Každý AI zaměstnanec má nakonfigurovány 4 konkrétní úkoly:

#### Úkoly Sama

| ID úkolu | Název | Způsob spuštění | Popis |
|--------|------|----------|------|
| SAM-01 | Analýza a směrování tiketu | Automatický pracovní postup | Automatická analýza při vytvoření nového tiketu |
| SAM-02 | Přehodnocení priority | Interakce na frontendu | Úprava priority na základě nových informací |
| SAM-03 | Rozhodnutí o eskalaci | Frontend / Pracovní postup | Posouzení, zda je nutná eskalace |
| SAM-04 | Hodnocení rizik SLA | Automatický pracovní postup | Identifikace rizika vypršení termínu |

#### Úkoly Grace

| ID úkolu | Název | Způsob spuštění | Popis |
|--------|------|----------|------|
| GRACE-01 | Generování profesionální odpovědi | Interakce na frontendu | Generování odpovědi na základě kontextu |
| GRACE-02 | Úprava tónu odpovědi | Interakce na frontendu | Optimalizace tónu stávající odpovědi |
| GRACE-03 | Deeskalace stížností | Frontend / Pracovní postup | Zmírnění a řešení stížností zákazníků |
| GRACE-04 | Obnova spokojenosti | Frontend / Pracovní postup | Následná péče po negativní zkušenosti |

#### Úkoly Maxe

| ID úkolu | Název | Způsob spuštění | Popis |
|--------|------|----------|------|
| MAX-01 | Vyhledávání podobných případů | Frontend / Pracovní postup | Vyhledání historicky podobných tiketů |
| MAX-02 | Doporučení znalostních článků | Frontend / Pracovní postup | Doporučení relevantních článků ze znalostní báze |
| MAX-03 | Syntéza řešení | Interakce na frontendu | Syntéza řešení z více zdrojů |
| MAX-04 | Průvodce odstraňováním poruch | Interakce na frontendu | Vytvoření systémového postupu kontroly |

#### Úkoly Lexi

| ID úkolu | Název | Způsob spuštění | Popis |
|--------|------|----------|------|
| LEXI-01 | Překlad tiketu | Automatický pracovní postup | Překlad obsahu tiketu |
| LEXI-02 | Překlad odpovědi | Interakce na frontendu | Překlad odpovědi řešitele |
| LEXI-03 | Hromadný překlad | Automatický pracovní postup | Hromadné zpracování překladů |
| LEXI-04 | Překlad dialogu v reálném čase | Interakce na frontendu | Překlad probíhající konverzace |

### 5.3 AI zaměstnanci a životní cyklus tiketu

![ticketing-imgs-2025-12-31-22-55-04](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-24-22.png)

### 5.4 Příklady odpovědí AI

#### SAM-01 Odpověď na analýzu tiketu

```json
{
  "category_code": "COMPUTER",
  "sentiment": "NEGATIVE",
  "urgency": "HIGH",
  "keywords": ["ERP", "chyba přihlášení", "timeout", "měsíční uzávěrka"],
  "confidence": 0.92,
  "reasoning": "Tiket popisuje problém s přihlášením do ERP systému, což ovlivňuje měsíční uzávěrku finančního oddělení, vysoká naléhavost",
  "suggested_reply": "Vážený zákazníku, děkujeme za nahlášení tohoto problému...",
  "source_language_code": "zh",
  "is_translated": true,
  "description_translated": "Dobrý den, náš ERP systém se nemůže přihlásit..."
}
```

#### GRACE-01 Odpověď na generování odpovědi

```
Vážený pane Nováku,

děkujeme, že jste nás kontaktoval ohledně problému s přihlášením do ERP. Plně chápu, že tento problém ovlivňuje vaši měsíční uzávěrku, a proto jsme tomuto tiketu přiřadili vysokou prioritu.

Aktuální stav:
- Technický tým prověřuje problémy s připojením k serveru.
- Předpokládáme, že vám poskytneme aktualizaci do 30 minut.

Mezitím můžete zkusit:
1. Přístup přes záložní adresu: https://erp-backup.company.com
2. Pokud potřebujete urgentní reporty, kontaktujte nás pro pomoc s exportem.

V případě dalších dotazů mě neváhejte kontaktovat.

S pozdravem,
Tým technické podpory
```

### 5.5 AI firewall emoční inteligence

Audit kvality odpovědí, za který odpovídá Grace, blokuje následující problémy:

| Typ problému | Příklad původního textu | Návrh AI |
|----------|----------|--------|
| Negativní tón | "Ne, toto nespadá pod záruku" | "Tato závada aktuálně nesplňuje podmínky pro bezplatnou záruční opravu, můžeme vám nabídnout placené řešení" |
| Obviňování zákazníka | "Rozbil jste si to sám" | "Po ověření bylo zjištěno, že tato závada je důsledkem náhodného poškození" |
| Zbavování se odpovědnosti | "To není náš problém" | "Dovolte mi, abych vám pomohl dále prověřit příčinu problému" |
| Chladné vyjádření | "Nevím" | "Pomohu vám vyhledat relevantní informace" |
| Citlivé informace | "Vaše heslo je abc123" | [Zablokováno] Obsahuje citlivé informace, odeslání není povoleno |

---

## 6. Systém znalostní báze

### 6.1 Zdroje znalostí

![ticketing-imgs-2025-12-31-22-55-20](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-24-57.png)


### 6.2 Proces převodu tiketu na znalost

![ticketing-imgs-2025-12-31-22-55-38](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-25-18.png)

**Dimenze hodnocení**:
- **Obecnost**: Jde o běžný problém?
- **Úplnost**: Je řešení jasné a kompletní?
- **Opakovatelnost**: Jsou kroky znovu použitelné?

### 6.3 Mechanismus doporučování znalostí

Když řešitel otevře detail tiketu, Max automaticky doporučí relevantní znalosti:

```
┌────────────────────────────────────────────────────────────┐
│ 📚 Doporučené znalosti                         [Rozbalit/Sbalit] │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ KB-T0042 Průvodce diagnostikou CNC servo systému Míra shody: 94% │
│ │ Obsahuje: Interpretace kódů alarmů, kroky kontroly pohonu      │
│ │ [Zobrazit] [Použít v odpovědi] [Označit jako užitečné]         │
│ ├────────────────────────────────────────────────────────┤ │
│ │ KB-T0038 Manuál údržby řady XYZ-CNC3000      Míra shody: 87% │
│ │ Obsahuje: Běžné závady, plán preventivní údržby                │
│ │ [Zobrazit] [Použít v odpovědi] [Označit jako užitečné]         │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## 7. Engine pracovních postupů

### 7.1 Klasifikace pracovních postupů

| Číslo | Kategorie | Popis | Způsob spuštění |
|------|------|------|----------|
| WF-T | Proces tiketu | Správa životního cyklu tiketu | Událost formuláře |
| WF-S | Proces SLA | Výpočet a varování SLA | Událost formuláře / Časovač |
| WF-C | Proces komentářů | Zpracování a překlad komentářů | Událost formuláře |
| WF-R | Proces hodnocení | Pozvánky k hodnocení a statistiky | Událost formuláře / Časovač |
| WF-N | Proces oznámení | Odesílání oznámení | Řízeno událostmi |
| WF-AI | Proces AI | Analýza a generování pomocí AI | Událost formuláře |

### 7.2 Klíčové pracovní postupy

#### WF-T01: Proces vytvoření tiketu

![ticketing-imgs-2025-12-31-22-55-51](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-25-48.png)

#### WF-AI01: AI analýza tiketu

![ticketing-imgs-2025-12-31-22-56-03](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-26-14.png)

#### WF-AI04: Překlad a audit komentářů

![ticketing-imgs-2025-12-31-22-56-19](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-26-38.png)

#### WF-AI03: Generování znalostí

![ticketing-imgs-2025-12-31-22-56-37](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-26-54.png)

### 7.3 Naplánované úlohy

| Úloha | Frekvence provádění | Popis |
|------|----------|------|
| Kontrola varování SLA | Každých 5 minut | Kontrola tiketů, kterým brzy vyprší termín |
| Automatické uzavření tiketu | Denně | Automatické uzavření po 3 dnech ve stavu resolved |
| Odeslání pozvánky k hodnocení | Denně | Odeslání pozvánky 24 hodin po uzavření |
| Aktualizace statistických dat | Každou hodinu | Aktualizace statistik tiketů zákazníků |

---

## 8. Návrh menu a rozhraní

### 8.1 Administrační rozhraní

![ticketing-imgs-2025-12-31-22-59-10](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-27-19.png)

### 8.2 Zákaznický portál

![ticketing-imgs-2025-12-31-22-59-32](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-27-35.png)

### 8.3 Návrh dashboardů

#### Pohled pro vedení

| Komponenta | Typ | Popis dat |
|------|------|----------|
| Míra dodržení SLA | Ukazatel | Míra dodržení odezvy/vyřešení v tomto měsíci |
| Trend spokojenosti | Spojnicový graf | Změna spokojenosti za posledních 30 dní |
| Trend objemu tiketů | Sloupcový graf | Objem tiketů za posledních 30 dní |
| Distribuce typů agend | Koláčový graf | Podíl jednotlivých typů agend |

#### Pohled pro vedoucího

| Komponenta | Typ | Popis dat |
|------|------|----------|
| Varování před vypršením | Seznam | Tikety, kterým brzy vyprší nebo již vypršel termín |
| Pracovní vytížení osob | Sloupcový graf | Počet tiketů členů týmu |
| Distribuce nevyřízených | Skládaný graf | Počet tiketů v jednotlivých stavech |
| Efektivita zpracování | Teplotní mapa | Distribuce průměrné doby zpracování |

#### Pohled pro řešitele

| Komponenta | Typ | Popis dat |
|------|------|----------|
| Moje úkoly | Číselná karta | Počet tiketů čekajících na zpracování |
| Distribuce priorit | Koláčový graf | Distribuce P0/P1/P2/P3 |
| Dnešní statistika | Karta ukazatelů | Počet dnes zpracovaných/vyřešených tiketů |
| Odpočet SLA | Seznam | 5 nejurgentnějších tiketů |

---

## Příloha

### A. Konfigurace typů agend

| Kód typu | Název | Ikona | Související rozšiřující tabulka |
|----------|------|------|------------|
| repair | Oprava zařízení | 🔧 | nb_tts_biz_repair |
| it_support | IT podpora | 💻 | nb_tts_biz_it_support |
| complaint | Stížnost zákazníka | 📢 | nb_tts_biz_complaint |
| consultation | Konzultace a návrhy | ❓ | Žádná |
| other | Ostatní | 📝 | Žádná |

### B. Kódy kategorií

| Kód | Název | Popis |
|------|------|------|
| CONVEYOR | Dopravní systém | Problémy s dopravním systémem |
| PACKAGING | Balicí stroj | Problémy s balicím strojem |
| WELDING | Svařovací zařízení | Problémy se svařovacím zařízením |
| COMPRESSOR | Kompresor | Problémy s kompresorem |
| COLD_STORE | Chladicí sklad | Problémy s chladicím skladem |
| CENTRAL_AC | Centrální klimatizace | Problémy s centrální klimatizací |
| FORKLIFT | Vysokozdvižný vozík | Problémy s vysokozdvižným vozíkem |
| COMPUTER | Počítač | Hardwarové problémy s počítačem |
| PRINTER | Tiskárna | Problémy s tiskárnou |
| PROJECTOR | Projektor | Problémy s projektorem |
| INTERNET | Síť | Problémy s připojením k síti |
| EMAIL | E-mail | Problémy s e-mailovým systémem |
| ACCESS | Oprávnění | Problémy s oprávněním k účtu |
| PROD_INQ | Dotaz na produkt | Dotaz na produkt |
| COMPLAINT | Obecná stížnost | Obecná stížnost |
| DELAY | Zpoždění logistiky | Stížnost na zpoždění logistiky |
| DAMAGE | Poškození obalu | Stížnost na poškození obalu |
| QUANTITY | Nedostatek množství | Stížnost na nedostatek množství |
| SVC_ATTITUDE | Přístup personálu | Stížnost na přístup personálu |
| PROD_QUALITY | Kvalita produktu | Stížnost na kvalitu produktu |
| TRAINING | Školení | Žádost o školení |
| RETURN | Vrácení zboží | Žádost o vrácení zboží |

---

*Verze dokumentu: 2.0 | Poslední aktualizace: 05. 01. 2026*