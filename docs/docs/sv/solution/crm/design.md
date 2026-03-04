:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/solution/crm/design).
:::

# Detaljerad systemdesign för CRM 2.0


## 1. Systemöversikt och designfilosofi

### 1.1 Systempositionering

Detta system är en **CRM 2.0-försäljningsplattform** byggd på NocoBase-plattformen för kodlös utveckling. Kärnmålet är:

```
Låt säljarna fokusera på att bygga kundrelationer, snarare än datainmatning och repetitiv analys.
```

Systemet automatiserar rutinuppgifter via arbetsflöden och använder AI för att assistera med lead-poängsättning, analys av affärsmöjligheter och andra uppgifter, vilket hjälper säljteam att öka effektiviteten.

### 1.2 Designfilosofi

#### Princip 1: Fullständig försäljningstratt

**End-to-end försäljningsprocess:**
![design-2026-02-24-00-05-26](https://static-docs.nocobase.com/design-2026-02-24-00-05-26.png)

**Varför designa på detta sätt?**

| Traditionell metod | Integrerat CRM |
|---------|-----------|
| Flera system används för olika stadier | Ett enda system täcker hela livscykeln |
| Manuell dataöverföring mellan system | Automatiserat dataflöde och konvertering |
| Inkonsekventa kundvyer | Enhetlig 360-graders kundvy |
| Fragmenterad dataanalys | End-to-end-analys av försäljningspipelinen |

#### Princip 2: Konfigurerbar försäljningspipeline
![design-2026-02-24-00-06-04](https://static-docs.nocobase.com/design-2026-02-24-00-06-04.png)

Olika branscher kan anpassa stadierna i försäljningspipelinen utan att ändra kod.

#### Princip 3: Modulär design

- Kärnmoduler (Kunder + Affärsmöjligheter) är obligatoriska; andra moduler kan aktiveras vid behov.
- Inaktivering av moduler kräver inga kodändringar; det görs via konfiguration i NocoBase-gränssnittet.
- Varje modul är designad självständigt för att minska beroenden.

---

## 2. Modularkitektur och anpassning

### 2.1 Modulöversikt

CRM-systemet använder en **modulär arkitektur** – varje modul kan aktiveras eller inaktiveras oberoende baserat på verksamhetens behov.
![design-2026-02-24-00-06-14](https://static-docs.nocobase.com/design-2026-02-24-00-06-14.png)

### 2.2 Modulberoenden

| Modul | Obligatorisk | Beroenden | Villkor för inaktivering |
|-----|---------|--------|---------|
| **Kundhantering** | ✅ Ja | - | Kan inte inaktiveras (Kärna) |
| **Hantering av affärsmöjligheter** | ✅ Ja | Kundhantering | Kan inte inaktiveras (Kärna) |
| **Lead-hantering** | Valfri | - | När lead-insamling inte krävs |
| **Offerthantering** | Valfri | Affärsmöjligheter, Produkter | Enkla transaktioner som inte kräver formella offerter |
| **Orderhantering** | Valfri | Affärsmöjligheter (eller Offerter) | När order-/betalningsspårning inte krävs |
| **Produkthantering** | Valfri | - | När en produktkatalog inte krävs |
| **E-postintegration** | Valfri | Kunder, Kontakter | Vid användning av ett externt e-postsystem |

### 2.3 Förkonfigurerade versioner

| Version | Inkluderade moduler | Användningsområde | Antal samlingar |
|-----|---------|---------|-----------|
| **Light** | Kunder + Affärsmöjligheter | Enkel transaktionsspårning | 6 |
| **Standard** | Light + Leads + Offerter + Order + Produkter | Fullständig försäljningscykel | 15 |
| **Enterprise** | Standard + E-postintegration | Full funktionalitet inklusive e-post | 17 |

### 2.4 Mappning mellan moduler och samlingar

#### Samlingar för kärnmoduler (alltid obligatoriska)

| Samling | Modul | Beskrivning |
|-------|------|------|
| nb_crm_customers | Kundhantering | Kund-/företagsposter |
| nb_crm_contacts | Kundhantering | Kontakter |
| nb_crm_customer_shares | Kundhantering | Behörigheter för kunddelning |
| nb_crm_opportunities | Hantering av affärsmöjligheter | Försäljningsmöjligheter |
| nb_crm_opportunity_stages | Hantering av affärsmöjligheter | Konfiguration av stadier |
| nb_crm_opportunity_users | Hantering av affärsmöjligheter | Medarbetare för affärsmöjligheter |
| nb_crm_activities | Aktivitetshantering | Aktivitetsposter |
| nb_crm_comments | Aktivitetshantering | Kommentarer/anteckningar |
| nb_crm_tags | Kärna | Delade taggar |
| nb_cbo_currencies | Grunddata | Valutalexikon |
| nb_cbo_regions | Grunddata | Lexikon för länder/regioner |

### 2.5 Hur ni inaktiverar moduler

Dölj helt enkelt menyalternativet för modulen i NocoBase administrationsgränssnitt; ni behöver inte ändra kod eller radera samlingar.

---

## 3. Kärnentiteter och datamodell

### 3.1 Översikt över entitetsrelationer
![design-2026-02-24-00-06-40](https://static-docs.nocobase.com/design-2026-02-24-00-06-40.png)

### 3.2 Detaljer om kärnsamlingar

#### 3.2.1 Leads (nb_crm_leads)

Lead-hantering med ett förenklat arbetsflöde i 4 stadier.

**Stadieprocess:**
```
Ny → Pågående → Validerad → Konverterad till kund/affärsmöjlighet
         ↓          ↓
    Ej kvalificerad Ej kvalificerad
```

**Nyckelfält:**

| Fält | Typ | Beskrivning |
|-----|------|------|
| id | BIGINT | Primärnyckel |
| lead_no | VARCHAR | Lead-nummer (Autogenererat) |
| name | VARCHAR | Kontaktnamn |
| company | VARCHAR | Företagsnamn |
| title | VARCHAR | Yrkesroll |
| email | VARCHAR | E-post |
| phone | VARCHAR | Telefon |
| mobile_phone | VARCHAR | Mobil |
| website | TEXT | Webbplats |
| address | TEXT | Adress |
| source | VARCHAR | Lead-källa: website/ads/referral/exhibition/telemarketing/email/social |
| industry | VARCHAR | Bransch |
| annual_revenue | VARCHAR | Årlig omsättningsskala |
| number_of_employees | VARCHAR | Antal anställda-skala |
| status | VARCHAR | Status: new/working/qualified/unqualified |
| rating | VARCHAR | Betyg: hot/warm/cold |
| owner_id | BIGINT | Ägare (FK → users) |
| ai_score | INTEGER | AI-kvalitetspoäng 0-100 |
| ai_convert_prob | DECIMAL | AI-konverteringssannolikhet |
| ai_best_contact_time | VARCHAR | AI-rekommenderad kontakttid |
| ai_tags | JSONB | AI-genererade taggar |
| ai_scored_at | TIMESTAMP | Tid för AI-poängsättning |
| ai_next_best_action | TEXT | AI-förslag på nästa bästa åtgärd |
| ai_nba_generated_at | TIMESTAMP | Tid för generering av AI-förslag |
| is_converted | BOOLEAN | Konverteringsflagga |
| converted_at | TIMESTAMP | Konverteringstid |
| converted_customer_id | BIGINT | Konverterat kund-ID |
| converted_contact_id | BIGINT | Konverterat kontakt-ID |
| converted_opportunity_id | BIGINT | Konverterat affärsmöjlighets-ID |
| lost_reason | TEXT | Orsak till förlust |
| disqualification_reason | TEXT | Orsak till diskvalificering |
| description | TEXT | Beskrivning |

#### 3.2.2 Kunder (nb_crm_customers)

Kund-/företagshantering med stöd för internationell verksamhet.

**Nyckelfält:**

| Fält | Typ | Beskrivning |
|-----|------|------|
| id | BIGINT | Primärnyckel |
| name | VARCHAR | Kundnamn (Obligatoriskt) |
| account_number | VARCHAR | Kundnummer (Autogenererat, Unikt) |
| phone | VARCHAR | Telefon |
| website | TEXT | Webbplats |
| address | TEXT | Adress |
| industry | VARCHAR | Bransch |
| type | VARCHAR | Typ: prospect/customer/partner/competitor |
| number_of_employees | VARCHAR | Antal anställda-skala |
| annual_revenue | VARCHAR | Årlig omsättningsskala |
| level | VARCHAR | Nivå: normal/important/vip |
| status | VARCHAR | Status: potential/active/dormant/churned |
| country | VARCHAR | Land |
| region_id | BIGINT | Region (FK → nb_cbo_regions) |
| preferred_currency | VARCHAR | Föredragen valuta: CNY/USD/EUR |
| owner_id | BIGINT | Ägare (FK → users) |
| parent_id | BIGINT | Moderbolag (FK → self) |
| source_lead_id | BIGINT | Käll-lead-ID |
| ai_health_score | INTEGER | AI-hälsopoäng 0-100 |
| ai_health_grade | VARCHAR | AI-hälsograd: A/B/C/D |
| ai_churn_risk | DECIMAL | AI-risk för kundbortfall 0-100% |
| ai_churn_risk_level | VARCHAR | AI-risknivå för kundbortfall: low/medium/high |
| ai_health_dimensions | JSONB | Poäng för AI-hälsodimensioner |
| ai_recommendations | JSONB | AI-rekommendationslista |
| ai_health_assessed_at | TIMESTAMP | Tid för AI-hälsobedömning |
| ai_tags | JSONB | AI-genererade taggar |
| ai_best_contact_time | VARCHAR | AI-rekommenderad kontakttid |
| ai_next_best_action | TEXT | AI-förslag på nästa bästa åtgärd |
| ai_nba_generated_at | TIMESTAMP | Tid för generering av AI-förslag |
| description | TEXT | Beskrivning |
| is_deleted | BOOLEAN | Flagga för mjuk radering |

#### 3.2.3 Affärsmöjligheter (nb_crm_opportunities)

Hantering av försäljningsmöjligheter med konfigurerbara pipelinestadier.

**Nyckelfält:**

| Fält | Typ | Beskrivning |
|-----|------|------|
| id | BIGINT | Primärnyckel |
| opportunity_no | VARCHAR | Nummer på affärsmöjlighet (Autogenererat, Unikt) |
| name | VARCHAR | Namn på affärsmöjlighet (Obligatoriskt) |
| amount | DECIMAL | Förväntat belopp |
| currency | VARCHAR | Valuta |
| exchange_rate | DECIMAL | Växelkurs |
| amount_usd | DECIMAL | Belopp i USD-ekvivalent |
| customer_id | BIGINT | Kund (FK) |
| contact_id | BIGINT | Primär kontakt (FK) |
| stage | VARCHAR | Stadiekod (FK → stages.code) |
| stage_sort | INTEGER | Sorteringsordning för stadie (Redundant för enkel sortering) |
| stage_entered_at | TIMESTAMP | Tidpunkt för inträde i nuvarande stadie |
| days_in_stage | INTEGER | Dagar i nuvarande stadie |
| win_probability | DECIMAL | Manuell vinstsannolikhet |
| ai_win_probability | DECIMAL | AI-förutsagd vinstsannolikhet |
| ai_analyzed_at | TIMESTAMP | Tid för AI-analys |
| ai_confidence | DECIMAL | AI-konfidens för förutsägelse |
| ai_trend | VARCHAR | AI-trend för förutsägelse: up/stable/down |
| ai_risk_factors | JSONB | AI-identifierade riskfaktorer |
| ai_recommendations | JSONB | AI-rekommendationslista |
| ai_predicted_close | DATE | AI-förutsagt slutdatum |
| ai_next_best_action | TEXT | AI-förslag på nästa bästa åtgärd |
| ai_nba_generated_at | TIMESTAMP | Tid för generering av AI-förslag |
| expected_close_date | DATE | Förväntat slutdatum |
| actual_close_date | DATE | Faktiskt slutdatum |
| owner_id | BIGINT | Ägare (FK → users) |
| last_activity_at | TIMESTAMP | Tid för senaste aktivitet |
| stagnant_days | INTEGER | Dagar utan aktivitet |
| loss_reason | TEXT | Orsak till förlust |
| competitor_id | BIGINT | Konkurrent (FK) |
| lead_source | VARCHAR | Lead-källa |
| campaign_id | BIGINT | Marknadsföringskampanj-ID |
| expected_revenue | DECIMAL | Förväntad intäkt = belopp × sannolikhet |
| description | TEXT | Beskrivning |

#### 3.2.4 Offerter (nb_crm_quotations)

Offerthantering med stöd för flera valutor och godkännandearbetsflöden.

**Statusflöde:**
```
Utkast → Väntar på godkännande → Godkänd → Skickad → Accepterad/Avvisad/Utgången
              ↓
           Avvisad → Redigera → Utkast
```

**Nyckelfält:**

| Fält | Typ | Beskrivning |
|-----|------|------|
| id | BIGINT | Primärnyckel |
| quotation_no | VARCHAR | Offertnummer (Autogenererat, Unikt) |
| name | VARCHAR | Offertnamn |
| version | INTEGER | Versionsnummer |
| opportunity_id | BIGINT | Affärsmöjlighet (FK, Obligatoriskt) |
| customer_id | BIGINT | Kund (FK) |
| contact_id | BIGINT | Kontakt (FK) |
| owner_id | BIGINT | Ägare (FK → users) |
| currency_id | BIGINT | Valuta (FK → nb_cbo_currencies) |
| exchange_rate | DECIMAL | Växelkurs |
| subtotal | DECIMAL | Delsumma |
| discount_rate | DECIMAL | Rabattsats |
| discount_amount | DECIMAL | Rabattbelopp |
| shipping_handling | DECIMAL | Frakt/hantering |
| tax_rate | DECIMAL | Skattesats |
| tax_amount | DECIMAL | Skattebelopp |
| total_amount | DECIMAL | Totalbelopp |
| total_amount_usd | DECIMAL | Belopp i USD-ekvivalent |
| status | VARCHAR | Status: draft/pending_approval/approved/sent/accepted/rejected/expired |
| submitted_at | TIMESTAMP | Inskickad tidpunkt |
| approved_by | BIGINT | Godkännare (FK → users) |
| approved_at | TIMESTAMP | Godkännandetid |
| rejected_at | TIMESTAMP | Tidpunkt för avvisande |
| sent_at | TIMESTAMP | Skickad tidpunkt |
| customer_response_at | TIMESTAMP | Tid för kundsvar |
| expired_at | TIMESTAMP | Utgångstidpunkt |
| valid_until | DATE | Giltig till |
| payment_terms | TEXT | Betalningsvillkor |
| terms_condition | TEXT | Allmänna villkor |
| address | TEXT | Leveransadress |
| description | TEXT | Beskrivning |

#### 3.2.5 Order (nb_crm_orders)

Orderhantering inklusive betalningsspårning.

**Nyckelfält:**

| Fält | Typ | Beskrivning |
|-----|------|------|
| id | BIGINT | Primärnyckel |
| order_no | VARCHAR | Ordernummer (Autogenererat, Unikt) |
| customer_id | BIGINT | Kund (FK) |
| contact_id | BIGINT | Kontakt (FK) |
| opportunity_id | BIGINT | Affärsmöjlighet (FK) |
| quotation_id | BIGINT | Offert (FK) |
| owner_id | BIGINT | Ägare (FK → users) |
| currency | VARCHAR | Valuta |
| exchange_rate | DECIMAL | Växelkurs |
| order_amount | DECIMAL | Orderbelopp |
| paid_amount | DECIMAL | Betalat belopp |
| unpaid_amount | DECIMAL | Obetalat belopp |
| status | VARCHAR | Status: pending/confirmed/in_progress/shipped/delivered/completed/cancelled |
| payment_status | VARCHAR | Betalningsstatus: unpaid/partial/paid |
| order_date | DATE | Orderdatum |
| delivery_date | DATE | Förväntat leveransdatum |
| actual_delivery_date | DATE | Faktiskt leveransdatum |
| shipping_address | TEXT | Leveransadress |
| logistics_company | VARCHAR | Logistikföretag |
| tracking_no | VARCHAR | Spårningsnummer |
| terms_condition | TEXT | Allmänna villkor |
| description | TEXT | Beskrivning |

### 3.3 Sammanfattning av samlingar

#### CRM-affärssamlingar

| Nr | Samlingsnamn | Beskrivning | Typ |
|-----|------|------|------|
| 1 | nb_crm_leads | Lead-hantering | Affär |
| 2 | nb_crm_customers | Kunder/Företag | Affär |
| 3 | nb_crm_contacts | Kontakter | Affär |
| 4 | nb_crm_opportunities | Försäljningsmöjligheter | Affär |
| 5 | nb_crm_opportunity_stages | Stadiekonfiguration | Konfiguration |
| 6 | nb_crm_opportunity_users | Medarbetare för affärsmöjligheter (Säljteam) | Association |
| 7 | nb_crm_quotations | Offerter | Affär |
| 8 | nb_crm_quotation_items | Offertartiklar | Affär |
| 9 | nb_crm_quotation_approvals | Godkännandeposter | Affär |
| 10 | nb_crm_orders | Order | Affär |
| 11 | nb_crm_order_items | Orderartiklar | Affär |
| 12 | nb_crm_payments | Betalningsposter | Affär |
| 13 | nb_crm_products | Produktkatalog | Affär |
| 14 | nb_crm_product_categories | Produktkategorier | Konfiguration |
| 15 | nb_crm_price_tiers | Prisnivåer | Konfiguration |
| 16 | nb_crm_activities | Aktivitetsposter | Affär |
| 17 | nb_crm_comments | Kommentarer/anteckningar | Affär |
| 18 | nb_crm_competitors | Konkurrenter | Affär |
| 19 | nb_crm_tags | Taggar | Konfiguration |
| 20 | nb_crm_lead_tags | Association Lead-Tagg | Association |
| 21 | nb_crm_contact_tags | Association Kontakt-Tagg | Association |
| 22 | nb_crm_customer_shares | Behörigheter för kunddelning | Association |
| 23 | nb_crm_exchange_rates | Växelkurs historik | Konfiguration |

#### Grunddatasamlingar (Gemensamma moduler)

| Nr | Samlingsnamn | Beskrivning | Typ |
|-----|------|------|------|
| 1 | nb_cbo_currencies | Valutalexikon | Konfiguration |
| 2 | nb_cbo_regions | Lexikon för länder/regioner | Konfiguration |

### 3.4 Hjälpsamlingar

#### 3.4.1 Kommentarer (nb_crm_comments)

Generisk samling för kommentarer/anteckningar som kan associeras med olika affärsobjekt.

| Fält | Typ | Beskrivning |
|-----|------|------|
| id | BIGINT | Primärnyckel |
| content | TEXT | Kommentar innehåll |
| lead_id | BIGINT | Associerad Lead (FK) |
| customer_id | BIGINT | Associerad Kund (FK) |
| opportunity_id | BIGINT | Associerad Affärsmöjlighet (FK) |
| order_id | BIGINT | Associerad Order (FK) |

#### 3.4.2 Kunddelningar (nb_crm_customer_shares)

Möjliggör samarbete mellan flera personer och delning av behörigheter för kunder.

| Fält | Typ | Beskrivning |
|-----|------|------|
| id | BIGINT | Primärnyckel |
| customer_id | BIGINT | Kund (FK, Obligatoriskt) |
| shared_with_user_id | BIGINT | Delad med användare (FK, Obligatoriskt) |
| shared_by_user_id | BIGINT | Delad av användare (FK) |
| permission_level | VARCHAR | Behörighetsnivå: read/write/full |
| shared_at | TIMESTAMP | Delningstidpunkt |

#### 3.4.3 Medarbetare för affärsmöjligheter (nb_crm_opportunity_users)

Stöder säljteams samarbete kring affärsmöjligheter.

| Fält | Typ | Beskrivning |
|-----|------|------|
| opportunity_id | BIGINT | Affärsmöjlighet (FK, Sammansatt PK) |
| user_id | BIGINT | Användare (FK, Sammansatt PK) |
| role | VARCHAR | Roll: owner/collaborator/viewer |

#### 3.4.4 Regioner (nb_cbo_regions)

Grunddatalexikon för länder/regioner.

| Fält | Typ | Beskrivning |
|-----|------|------|
| id | BIGINT | Primärnyckel |
| code_alpha2 | VARCHAR | ISO 3166-1 Alpha-2-kod (Unik) |
| code_alpha3 | VARCHAR | ISO 3166-1 Alpha-3-kod (Unik) |
| code_numeric | VARCHAR | ISO 3166-1 numerisk kod |
| name | VARCHAR | Namn på land/region |
| is_active | BOOLEAN | Är aktiv |
| sort_order | INTEGER | Sorteringsordning |

---

## 4. Leads livscykel

Lead-hantering använder ett förenklat arbetsflöde i 4 stadier. När en ny lead skapas kan ett arbetsflöde automatiskt trigga AI-poängsättning för att hjälpa säljare att snabbt identifiera högkvalitativa leads.

### 4.1 Statusdefinitioner

| Status | Namn | Beskrivning |
|-----|------|------|
| new | Ny | Precis skapad, väntar på kontakt |
| working | Pågående | Aktiv uppföljning pågår |
| qualified | Validerad | Redo för konvertering |
| unqualified | Ej kvalificerad | Passar inte |

### 4.2 Statusflödesschema

![design-2026-02-24-00-25-32](https://static-docs.nocobase.com/design-2026-02-24-00-25-32.png)

### 4.3 Lead-konverteringsprocess

Konverteringsgränssnittet erbjuder tre alternativ samtidigt; användare kan välja att skapa eller associera:

- **Kund**: Skapa en ny kund ELLER associera med en befintlig kund.
- **Kontakt**: Skapa en ny kontakt (associerad med kunden).
- **Affärsmöjlighet**: En affärsmöjlighet måste skapas.
![design-2026-02-24-00-25-22](https://static-docs.nocobase.com/design-2026-02-24-00-25-22.png)

**Poster efter konvertering:**
- `converted_customer_id`: Associerat kund-ID
- `converted_contact_id`: Associerat kontakt-ID
- `converted_opportunity_id`: Skapat affärsmöjlighets-ID

---

## 5. Affärsmöjlighetens livscykel

Hantering av affärsmöjligheter använder konfigurerbara stadier i försäljningspipelinen. När ett stadie ändras kan det automatiskt trigga en AI-förutsägelse av vinstsannolikhet för att hjälpa säljare att identifiera risker och möjligheter.

### 5.1 Konfigurerbara stadier

Stadier lagras i samlingen `nb_crm_opportunity_stages` och kan anpassas:

| Kod | Namn | Ordning | Standard vinstsannolikhet |
|-----|------|------|---------|
| prospecting | Prospektering | 1 | 10% |
| analysis | Behovsanalys | 2 | 30% |
| proposal | Offert/Förslag | 3 | 60% |
| negotiation | Förhandling/Granskning | 4 | 80% |
| won | Stängd Vunnen | 5 | 100% |
| lost | Stängd Förlorad | 6 | 0% |

### 5.2 Pipeline-flöde
![design-2026-02-24-00-20-31](https://static-docs.nocobase.com/design-2026-02-24-00-20-31.png)

### 5.3 Detektering av stagnation

Affärsmöjligheter utan aktivitet kommer att flaggas:

| Dagar utan aktivitet | Åtgärd |
|-----------|------|
| 7 dagar | Gul varning |
| 14 dagar | Orange påminnelse till ägare |
| 30 dagar | Röd påminnelse till chef |

```sql
-- Beräkna stagnationsdagar
UPDATE nb_crm_opportunities
SET stagnant_days = EXTRACT(DAY FROM NOW() - last_activity_at)
WHERE stage NOT IN ('won', 'lost');
```

### 5.4 Hantering av vinst/förlust

**Vid vinst:**
1. Uppdatera stadie till 'won'.
2. Registrera faktiskt slutdatum.
3. Uppdatera kundstatus till 'active'.
4. Trigga orderskapande (om en offert accepterades).

**Vid förlust:**
1. Uppdatera stadie till 'lost'.
2. Registrera orsak till förlust.
3. Registrera konkurrent-ID (om förlorad till en konkurrent).
4. Meddela chef.

---

## 6. Offertens livscykel

### 6.1 Statusdefinitioner

| Status | Namn | Beskrivning |
|-----|------|------|
| draft | Utkast | Under förberedelse |
| pending_approval | Väntar på godkännande | Väntar på godkännande |
| approved | Godkänd | Redo att skickas |
| sent | Skickad | Skickad till kund |
| accepted | Accepterad | Accepterad av kund |
| rejected | Avvisad | Avvisad av kund |
| expired | Utgången | Giltighetstiden har passerat |

### 6.2 Godkännanderegler (Ska fastställas)

Arbetsflöden för godkännande triggas baserat på följande villkor:

| Villkor | Godkännandenivå |
|------|---------|
| Rabatt > 10% | Försäljningschef |
| Rabatt > 20% | Försäljningsdirektör |
| Belopp > $100K | Ekonomi + VD |

### 6.3 Stöd för flera valutor

#### Designfilosofi

Använd **USD som enhetlig basvaluta** för alla rapporter och analyser. Varje beloppspost lagrar:
- Ursprunglig valuta och belopp (det kunden ser)
- Växelkurs vid transaktionstillfället
- Belopp i USD-ekvivalent (för intern jämförelse)

#### Valutalexikon (nb_cbo_currencies)

Valutakonfiguration använder en gemensam grunddatasamling som stöder dynamisk hantering. Fältet `current_rate` lagrar den aktuella växelkursen, uppdaterad av en schemalagd uppgift från den senaste posten i `nb_crm_exchange_rates`.

| Fält | Typ | Beskrivning |
|-----|------|------|
| id | BIGINT | Primärnyckel |
| code | VARCHAR | Valutakod (Unik): USD/CNY/EUR/GBP/JPY |
| name | VARCHAR | Valutanamn |
| symbol | VARCHAR | Valutasymbol |
| decimal_places | INTEGER | Antal decimaler |
| current_rate | DECIMAL | Aktuell kurs mot USD (Synkad från historik) |
| is_active | BOOLEAN | Är aktiv |
| sort_order | INTEGER | Sorteringsordning |

#### Växelkurs historik (nb_crm_exchange_rates)

Registrerar historiska växelkurser. En schemalagd uppgift synkar de senaste kurserna till `nb_cbo_currencies.current_rate`.

| Fält | Typ | Beskrivning |
|-----|------|------|
| id | BIGINT | Primärnyckel |
| currency_code | VARCHAR | Valutakod (CNY/EUR/GBP/JPY) |
| rate_to_usd | DECIMAL(10,6) | Kurs mot USD |
| effective_date | DATE | Giltighetsdatum |
| source | VARCHAR | Källa: manual/api |
| createdAt | TIMESTAMP | Skapad tidpunkt |

> **Notera**: Offerter är associerade med samlingen `nb_cbo_currencies` via främmande nyckel `currency_id`, och växelkursen hämtas direkt från fältet `current_rate`. Affärsmöjligheter och order använder ett `currency` VARCHAR-fält för att lagra valutakoden.

#### Mönster för beloppsfält

Samlingar som innehåller belopp följer detta mönster:

| Fält | Typ | Beskrivning |
|-----|------|------|
| currency | VARCHAR | Transaktionsvaluta |
| amount | DECIMAL | Ursprungligt belopp |
| exchange_rate | DECIMAL | Växelkurs mot USD vid transaktion |
| amount_usd | DECIMAL | USD-ekvivalent (Beräknad) |

**Tillämpas på:**
- `nb_crm_opportunities.amount` → `amount_usd`
- `nb_crm_quotations.total_amount` → `total_amount_usd`

#### Integration i arbetsflöden
![design-2026-02-24-00-21-00](https://static-docs.nocobase.com/design-2026-02-24-00-21-00.png)

**Logik för hämtning av växelkurs:**
1. Hämta växelkurs direkt från `nb_cbo_currencies.current_rate` under affärsoperationer.
2. USD-transaktioner: Kurs = 1.0, ingen sökning krävs.
3. `current_rate` synkas av en schemalagd uppgift från den senaste `nb_crm_exchange_rates`-posten.

### 6.4 Versionshantering

När en offert avvisas eller går ut kan den dupliceras som en ny version:

```
QT-20260119-001 v1 → Avvisad
QT-20260119-001 v2 → Skickad
QT-20260119-001 v3 → Accepterad
```

---

## 7. Orderlivscykel

### 7.1 Orderöversikt

Order skapas när en offert accepteras och representerar ett bekräftat affärsåtagande.
![design-2026-02-24-00-21-21](https://static-docs.nocobase.com/design-2026-02-24-00-21-21.png)

### 7.2 Statusdefinitioner för order

| Status | Kod | Beskrivning | Tillåtna åtgärder |
|-----|------|------|---------|
| Utkast | `draft` | Order skapad, ännu inte bekräftad | Redigera, Bekräfta, Avbryt |
| Bekräftad | `confirmed` | Order bekräftad, väntar på uppfyllnad | Påbörja uppfyllnad, Avbryt |
| Pågående | `in_progress` | Order behandlas/produceras | Uppdatera framsteg, Skicka, Avbryt (kräver godkännande) |
| Skickad | `shipped` | Produkter skickade till kund | Markera som levererad |
| Levererad | `delivered` | Kund har tagit emot varor | Slutför order |
| Slutförd | `completed` | Order helt slutförd | Inga |
| Avbruten | `cancelled` | Order avbruten | Inga |

### 7.3 Orderdatamodell

#### nb_crm_orders

| Fält | Typ | Beskrivning |
|-----|------|------|
| id | BIGINT | Primärnyckel |
| order_no | VARCHAR | Ordernummer (Autogenererat, Unikt) |
| customer_id | BIGINT | Kund (FK) |
| contact_id | BIGINT | Kontakt (FK) |
| opportunity_id | BIGINT | Affärsmöjlighet (FK) |
| quotation_id | BIGINT | Offert (FK) |
| owner_id | BIGINT | Ägare (FK → users) |
| status | VARCHAR | Orderstatus |
| payment_status | VARCHAR | Betalningsstatus: unpaid/partial/paid |
| order_date | DATE | Orderdatum |
| delivery_date | DATE | Förväntat leveransdatum |
| actual_delivery_date | DATE | Faktiskt leveransdatum |
| currency | VARCHAR | Ordervaluta |
| exchange_rate | DECIMAL | Kurs mot USD |
| order_amount | DECIMAL | Totalt orderbelopp |
| paid_amount | DECIMAL | Betalat belopp |
| unpaid_amount | DECIMAL | Obetalat belopp |
| shipping_address | TEXT | Leveransadress |
| logistics_company | VARCHAR | Logistikföretag |
| tracking_no | VARCHAR | Spårningsnummer |
| terms_condition | TEXT | Allmänna villkor |
| description | TEXT | Beskrivning |

#### nb_crm_order_items

| Fält | Typ | Beskrivning |
|-----|------|------|
| id | BIGINT | Primärnyckel |
| order_id | FK | Överordnad order |
| product_id | FK | Produktreferens |
| product_name | VARCHAR | Ögonblicksbild av produktnamn |
| quantity | INT | Beställt antal |
| unit_price | DECIMAL | Enhetspris |
| discount_percent | DECIMAL | Rabattprocent |
| line_total | DECIMAL | Radtotal |
| notes | TEXT | Radanteckningar |

### 7.4 Betalningsspårning

#### nb_crm_payments

| Fält | Typ | Beskrivning |
|-----|------|------|
| id | BIGINT | Primärnyckel |
| order_id | BIGINT | Associerad order (FK, Obligatoriskt) |
| customer_id | BIGINT | Kund (FK) |
| payment_no | VARCHAR | Betalningsnummer (Autogenererat, Unikt) |
| amount | DECIMAL | Betalningsbelopp (Obligatoriskt) |
| currency | VARCHAR | Betalningsvaluta |
| payment_method | VARCHAR | Metod: transfer/check/cash/credit_card/lc |
| payment_date | DATE | Betalningsdatum |
| bank_account | VARCHAR | Bankkontonummer |
| bank_name | VARCHAR | Banknamn |
| notes | TEXT | Betalningsanteckningar |

---

## 8. Kundens livscykel

### 8.1 Kundöversikt

Kunder skapas under lead-konvertering eller när en affärsmöjlighet vinns. Systemet spårar hela livscykeln från förvärv till ambassadörskap.
![design-2026-02-24-00-21-34](https://static-docs.nocobase.com/design-2026-02-24-00-21-34.png)

### 8.2 Statusdefinitioner för kunder

| Status | Kod | Hälsa | Beskrivning |
|-----|------|--------|------|
| Prospekt | `prospect` | N/A | Konverterad lead, inga order än |
| Aktiv | `active` | ≥70 | Betalande kund, god interaktion |
| Växande | `growing` | ≥80 | Kund med expansionsmöjligheter |
| Riskkund | `at_risk` | <50 | Kund som visar tecken på bortfall |
| Förlorad | `churned` | N/A | Inte längre aktiv |
| Återvinn | `win_back` | N/A | Tidigare kund som återaktiveras |
| Ambassadör | `advocate` | ≥90 | Hög nöjdhet, ger referenser |

### 8.3 Poängsättning av kundhälsa

Kundhälsa beräknas baserat på flera faktorer:

| Faktor | Vikt | Mått |
|-----|------|---------|
| Köp-recens | 25% | Dagar sedan senaste order |
| Köpfrekvens | 20% | Antal order per period |
| Monetärt värde | 20% | Totalt och genomsnittligt ordervärde |
| Engagemang | 15% | Öppningsgrad e-post, mötesdeltagande |
| Supporthälsa | 10% | Ärendevolym och lösningsgrad |
| Produktanvändning | 10% | Aktiva användningsmått (om tillämpligt) |

**Hälso-tröskelvärden:**

```javascript
if (health_score >= 90) status = 'advocate';
else if (health_score >= 70) status = 'active';
else if (health_score >= 50) status = 'growing';
else status = 'at_risk';
```

### 8.4 Kundsegmentering

#### Automatiserad segmentering

| Segment | Villkor | Föreslagen åtgärd |
|-----|------|---------|
| VIP | LTV > $100K | White-glove-service, ledningsstöd |
| Enterprise | Företagsstorlek > 500 | Dedikerad Account Manager |
| Mid-Market | Företagsstorlek 50-500 | Regelbundna avstämningar, skalat stöd |
| Startup | Företagsstorlek < 50 | Självbetjäningsresurser, community |
| Vilande | 90+ dagar utan aktivitet | Återaktiveringsmarknadsföring |

---

## 9. E-postintegration

### 9.1 Översikt

NocoBase tillhandahåller en inbyggd plugin för e-postintegration med stöd för Gmail och Outlook. När e-postmeddelanden har synkroniserats kan arbetsflöden automatiskt trigga AI-analys av e-postens sentiment och avsikt, vilket hjälper säljare att snabbt förstå kundens attityd.

### 9.2 E-postsynkronisering

**Leverantörer som stöds:**
- Gmail (via OAuth 2.0)
- Outlook/Microsoft 365 (via OAuth 2.0)

**Synkroniseringsbeteende:**
- Dubbelriktad synk av skickade och mottagna meddelanden.
- Automatisk association av e-post till CRM-poster (Leads, Kontakter, Affärsmöjligheter).
- Bilagor lagras i NocoBase-filsystemet.

### 9.3 Association E-post-CRM (Ska fastställas)
![design-2026-02-24-00-21-51](https://static-docs.nocobase.com/design-2026-02-24-00-21-51.png)

### 9.4 E-postmallar

Säljare kan använda förinställda mallar:

| Mallkategori | Exempel |
|---------|------|
| Första kontakt | Cold email, Varm introduktion, Uppföljning efter event |
| Uppföljning | Mötesuppföljning, Offertuppföljning, Påminnelse vid uteblivet svar |
| Offert | Offert bifogad, Offertrevidering, Offert går ut snart |
| Order | Orderbekräftelse, Leveransavisering, Leveransbekräftelse |
| Kundframgång | Välkomstmeddelande, Avstämning, Begäran om recension |

---

## 10. AI-assisterade funktioner

### 10.1 AI-medarbetarteam

CRM-systemet integrerar NocoBase AI-plugin och använder följande inbyggda AI-medarbetare konfigurerade med CRM-specifika uppgifter:

| ID | Namn | Inbyggd roll | CRM-utökade förmågor |
|----|------|---------|-------------|
| viz | Viz | Dataanalytiker | Analys av försäljningsdata, pipeline-prognoser |
| dara | Dara | Diagramexpert | Datavisualisering, rapportutveckling, dashboard-design |
| ellis | Ellis | Redaktör | Utkast till e-postsvar, kommunikationssammanfattningar, affärsmejl |
| lexi | Lexi | Översättare | Kundkommunikation på flera språk, innehållsöversättning |
| orin | Orin | Organisatör | Dagliga prioriteringar, förslag på nästa steg, uppföljningsplanering |

### 10.2 AI-uppgiftslista

AI-förmågorna är uppdelade i två oberoende kategorier:

#### I. AI-medarbetare (Triggas via gränssnittsblock)

Användare interagerar direkt med AI via AI-medarbetarblock i gränssnittet för att få analyser och förslag.

| Medarbetare | Uppgift | Beskrivning |
|------|------|------|
| Viz | Analys av försäljningsdata | Analysera pipeline-trender och konverteringsgrader |
| Viz | Pipeline-prognoser | Förutsäg intäkter baserat på viktad pipeline |
| Dara | Diagramgenerering | Generera diagram för försäljningsrapporter |
| Dara | Dashboard-design | Designa layouter för datadashboards |
| Ellis | Utkast till svar | Generera professionella e-postsvar |
| Ellis | Kommunikationssammanfattning | Sammanfatta e-posttrådar |
| Ellis | Affärsmejl | Mötesinbjudningar, uppföljningar, tackmejl etc. |
| Orin | Dagliga prioriteringar | Generera en prioriterad uppgiftslista för dagen |
| Orin | Nästa bästa åtgärd | Rekommendera nästa steg för varje affärsmöjlighet |
| Lexi | Innehållsöversättning | Översätt marknadsföringsmaterial, förslag och e-post |

#### II. LLM-noder i arbetsflöden (Automatiserad körning i backend)

LLM-noder inbäddade i arbetsflöden, triggas automatiskt av samlingshändelser, åtgärdshändelser eller schemalagda uppgifter, oberoende av AI-medarbetare.

| Uppgift | Triggermetod | Beskrivning | Målfält |
|------|---------|------|---------|
| Lead-poängsättning | Samlingshändelse (Skapa/Uppdatera) | Utvärdera lead-kvalitet | ai_score, ai_convert_prob |
| Vinstprognos | Samlingshändelse (Stadieändring) | Förutsäg sannolikhet för framgång | ai_win_probability, ai_risk_factors |

> **Notera**: LLM-noder i arbetsflöden använder promptar och Schema-output för strukturerad JSON, som parsas och skrivs till affärsdatafält utan användarinteraktion.

### 10.3 AI-fält i databasen

| Tabell | AI-fält | Beskrivning |
|----|--------|------|
| nb_crm_leads | ai_score | AI-poäng 0-100 |
| | ai_convert_prob | Konverteringssannolikhet |
| | ai_best_contact_time | Bästa kontakttid |
| | ai_tags | AI-genererade taggar (JSONB) |
| | ai_scored_at | Tid för poängsättning |
| | ai_next_best_action | Förslag på nästa bästa åtgärd |
| | ai_nba_generated_at | Tid för generering av förslag |
| nb_crm_opportunities | ai_win_probability | AI-förutsagd vinstsannolikhet |
| | ai_analyzed_at | Tid för analys |
| | ai_confidence | Konfidens för förutsägelse |
| | ai_trend | Trend: up/stable/down |
| | ai_risk_factors | Riskfaktorer (JSONB) |
| | ai_recommendations | Rekommendationslista (JSONB) |
| | ai_predicted_close | Förutsagt slutdatum |
| | ai_next_best_action | Förslag på nästa bästa åtgärd |
| | ai_nba_generated_at | Tid för generering av förslag |
| nb_crm_customers | ai_health_score | Hälsopoäng 0-100 |
| | ai_health_grade | Hälsograd: A/B/C/D |
| | ai_churn_risk | Risk för kundbortfall 0-100% |
| | ai_churn_risk_level | Risknivå för kundbortfall: low/medium/high |
| | ai_health_dimensions | Dimensionspoäng (JSONB) |
| | ai_recommendations | Rekommendationslista (JSONB) |
| | ai_health_assessed_at | Tid för hälsobedömning |
| | ai_tags | AI-genererade taggar (JSONB) |
| | ai_best_contact_time | Bästa kontakttid |
| | ai_next_best_action | Förslag på nästa bästa åtgärd |
| | ai_nba_generated_at | Tid för generering av förslag |

---

## 11. Motor för arbetsflöden

### 11.1 Implementerade arbetsflöden

| Namn på arbetsflöde | Triggertyp | Status | Beskrivning |
|-----------|---------|------|------|
| Leads Created | Samlingshändelse | Aktiverad | Triggas när en lead skapas |
| CRM Overall Analytics | AI-medarbetarhändelse | Aktiverad | Övergripande CRM-dataanalys |
| Lead Conversion | Händelse efter åtgärd | Aktiverad | Process för lead-konvertering |
| Lead Assignment | Samlingshändelse | Aktiverad | Automatiserad lead-tilldelning |
| Lead Scoring | Samlingshändelse | Inaktiverad | Lead-poängsättning (Ska fastställas) |
| Follow-up Reminder | Schemalagd uppgift | Inaktiverad | Uppföljningspåminnelser (Ska fastställas) |

### 11.2 Arbetsflöden som ska implementeras

| Arbetsflöde | Triggertyp | Beskrivning |
|-------|---------|------|
| Framsteg i affärsmöjlighet | Samlingshändelse | Uppdatera vinstsannolikhet och registrera tid vid stadieändring |
| Detektering av stagnation | Schemalagd uppgift | Detektera inaktiva affärsmöjligheter och skicka påminnelser |
| Offertgodkännande | Händelse efter åtgärd | Godkännandeprocess i flera nivåer |
| Ordergenerering | Händelse efter åtgärd | Generera order automatiskt efter att offert accepterats |

---

## 12. Meny- och gränssnittsdesign

### 12.1 Administrationsstruktur

| Meny | Typ | Beskrivning |
|------|------|------|
| **Dashboards** | Grupp | Dashboards |
| - Dashboard | Sida | Standard-dashboard |
| - SalesManager | Sida | Vy för försäljningschef |
| - SalesRep | Sida | Vy för säljare |
| - Executive | Sida | Vy för ledning |
| **Leads** | Sida | Lead-hantering |
| **Customers** | Sida | Kundhantering |
| **Opportunities** | Sida | Hantering av affärsmöjligheter |
| - Table | Flik | Lista över affärsmöjligheter |
| **Products** | Sida | Produkthantering |
| - Categories | Flik | Produktkategorier |
| **Orders** | Sida | Orderhantering |
| **Settings** | Grupp | Inställningar |
| - Stage Settings | Sida | Konfiguration av stadier för affärsmöjligheter |
| - Exchange Rate | Sida | Inställningar för växelkurs |
| - Activity | Sida | Aktivitetsposter |
| - Emails | Sida | E-posthantering |
| - Contacts | Sida | Kontakthantering |
| - Data Analysis | Sida | Dataanalys |

### 12.2 Dashboard-vyer

#### Vy för försäljningschef

| Komponent | Typ | Data |
|-----|------|------|
| Pipeline-värde | KPI-kort | Totalt pipeline-belopp per stadie |
| Team-topplista | Tabell | Ranking av säljares prestationer |
| Riskvarningar | Varningslista | Affärsmöjligheter med hög risk |
| Trend för vinstgrad | Linjediagram | Månatlig vinstgrad |
| Stagnerade affärer | Lista | Affärer som kräver uppmärksamhet |

#### Vy för säljare

| Komponent | Typ | Data |
|-----|------|------|
| Mina framsteg mot kvot | Förloppsindikator | Månatligt faktiskt vs. kvot |
| Väntande affärsmöjligheter | KPI-kort | Antal av mina väntande affärsmöjligheter |
| Stängs denna vecka | Lista | Affärer som förväntas stängas snart |
| Förfallna aktiviteter | Varning | Utgångna uppgifter |
| Snabbåtgärder | Knappar | Logga aktivitet, Skapa affärsmöjlighet |

#### Vy för ledning

| Komponent | Typ | Data |
|-----|------|------|
| Årlig intäkt | KPI-kort | Intäkter hittills i år |
| Pipeline-värde | KPI-kort | Totalt pipeline-belopp |
| Vinstgrad | KPI-kort | Övergripande vinstgrad |
| Kundhälsa | Distribution | Fördelning av hälsopoäng |
| Prognos | Diagram | Månatlig intäktsprognos |

---

*Dokumentversion: v2.0 | Uppdaterad: 2026-02-06*