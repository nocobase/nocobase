:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/solution/crm/design) voor nauwkeurige informatie.
:::

# CRM 2.0 Systeem Gedetailleerd Ontwerp

## 1. Systeemoverzicht en ontwerpfilosofie

### 1.1 Systeempositionering

Dit systeem is een **CRM 2.0 verkoopbeheerplatform** gebouwd op het NocoBase no-code platform. Het kerndoel is:

```
Laat verkoopmedewerkers zich concentreren op het opbouwen van klantrelaties, in plaats van op gegevensinvoer en herhalende analyses.
```

Het systeem automatiseert routinetaken via workflows en maakt gebruik van AI voor ondersteuning bij lead-scoring, opportunity-analyse en andere taken, waardoor verkoopteams hun efficiëntie kunnen verhogen.

### 1.2 Ontwerpfilosofie

#### Filosofie 1: Volledige verkooptrechter

**End-to-end verkoopproces:**
![design-2026-02-24-00-05-26](https://static-docs.nocobase.com/design-2026-02-24-00-05-26.png)

**Waarom is dit zo ontworpen?**

| Traditionele methode | Geïntegreerd CRM |
|---------|-----------|
| Meerdere systemen voor verschillende fasen | Eén enkel systeem dat de gehele levenscyclus dekt |
| Handmatige gegevensoverdracht tussen systemen | Geautomatiseerde gegevensstroom en conversie |
| Inconsistente klantbeelden | Uniform 360-graden klantbeeld |
| Gefragmenteerde gegevensanalyse | End-to-end analyse van de verkooppijplijn |

#### Filosofie 2: Configureerbare verkooppijplijn
![design-2026-02-24-00-06-04](https://static-docs.nocobase.com/design-2026-02-24-00-06-04.png)

Verschillende sectoren kunnen de fasen van de verkooppijplijn aanpassen zonder de code te wijzigen.

#### Filosofie 3: Modulair ontwerp

- Kernmodules (Klanten + Opportunities) zijn verplicht; andere modules kunnen naar behoefte worden ingeschakeld.
- Voor het uitschakelen van modules zijn geen codewijzigingen vereist; dit gebeurt via de configuratie-interface van NocoBase.
- Elke module is onafhankelijk ontworpen om de koppeling te verminderen.

---

## 2. Module-architectuur en aanpassing

### 2.1 Module-overzicht

Het CRM-systeem hanteert een **modulaire architectuur** — elke module kan onafhankelijk worden in- of uitgeschakeld op basis van de zakelijke behoeften.
![design-2026-02-24-00-06-14](https://static-docs.nocobase.com/design-2026-02-24-00-06-14.png)

### 2.2 Module-afhankelijkheden

| Module | Verplicht | Afhankelijkheden | Voorwaarde voor uitschakelen |
|-----|---------|--------|---------|
| **Klantbeheer** | ✅ Ja | - | Kan niet worden uitgeschakeld (Kern) |
| **Opportunity-beheer** | ✅ Ja | Klantbeheer | Kan niet worden uitgeschakeld (Kern) |
| **Leadbeheer** | Optioneel | - | Wanneer leadwerving niet vereist is |
| **Offertebeheer** | Optioneel | Opportunities, Producten | Eenvoudige transacties waarvoor geen formele offertes nodig zijn |
| **Orderbeheer** | Optioneel | Opportunities (of Offertes) | Wanneer het volgen van orders/betalingen niet vereist is |
| **Productbeheer** | Optioneel | - | Wanneer een productcatalogus niet vereist is |
| **E-mailintegratie** | Optioneel | Klanten, Contactpersonen | Bij gebruik van een extern e-mailsysteem |

### 2.3 Vooraf geconfigureerde versies

| Versie | Inbegrepen modules | Gebruiksscenario | Aantal collecties |
|-----|---------|---------|-----------|
| **Lite** | Klanten + Opportunities | Eenvoudige transactietracking | 6 |
| **Standaard** | Lite + Leads + Offertes + Orders + Producten | Volledige verkoopcyclus | 15 |
| **Enterprise** | Standaard + E-mailintegratie | Volledige functionaliteit inclusief e-mail | 17 |

### 2.4 Module-naar-collectie mapping

#### Kernmodule-collecties (Altijd vereist)

| Collectie | Module | Beschrijving |
|-------|------|------|
| nb_crm_customers | Klantbeheer | Klant-/bedrijfsrecords |
| nb_crm_contacts | Klantbeheer | Contactpersonen |
| nb_crm_customer_shares | Klantbeheer | Klantmachtigingen voor delen |
| nb_crm_opportunities | Opportunity-beheer | Verkoopkansen |
| nb_crm_opportunity_stages | Opportunity-beheer | Fase-configuraties |
| nb_crm_opportunity_users | Opportunity-beheer | Medewerkers aan opportunities |
| nb_crm_activities | Activiteitenbeheer | Activiteitenrecords |
| nb_crm_comments | Activiteitenbeheer | Reacties/Opmerkingen |
| nb_crm_tags | Kern | Gedeelde tags |
| nb_cbo_currencies | Basisgegevens | Valutawordenboek |
| nb_cbo_regions | Basisgegevens | Landen-/regiowordenboek |

### 2.5 Hoe modules uit te schakelen

Verberg eenvoudigweg de menu-ingang voor de module in de NocoBase-beheerinterface; u hoeft geen code te wijzigen of collecties te verwijderen.

---

## 3. Kernentiteiten en datamodel

### 3.1 Entiteitsrelatie-overzicht
![design-2026-02-24-00-06-40](https://static-docs.nocobase.com/design-2026-02-24-00-06-40.png)

### 3.2 Details kerncollecties

#### 3.2.1 Leads (nb_crm_leads)

Leadbeheer met een vereenvoudigde workflow van 4 fasen.

**Faseproces:**
```
Nieuw → In behandeling → Geverifieerd → Geconverteerd naar Klant/Opportunity
            ↓                ↓
       Ongeschikt       Ongeschikt
```

**Belangrijkste velden:**

| Veld | Type | Beschrijving |
|-----|------|------|
| id | BIGINT | Primaire sleutel |
| lead_no | VARCHAR | Leadnummer (automatisch gegenereerd) |
| name | VARCHAR | Naam contactpersoon |
| company | VARCHAR | Bedrijfsnaam |
| title | VARCHAR | Functietitel |
| email | VARCHAR | E-mail |
| phone | VARCHAR | Telefoon |
| mobile_phone | VARCHAR | Mobiel |
| website | TEXT | Website |
| address | TEXT | Adres |
| source | VARCHAR | Leadbron: website/ads/referral/exhibition/telemarketing/email/social |
| industry | VARCHAR | Sector |
| annual_revenue | VARCHAR | Jaarlijkse omzetomvang |
| number_of_employees | VARCHAR | Aantal werknemers |
| status | VARCHAR | Status: new/working/qualified/unqualified |
| rating | VARCHAR | Beoordeling: hot/warm/cold |
| owner_id | BIGINT | Verantwoordelijke (FK → users) |
| ai_score | INTEGER | AI-kwaliteitsscore 0-100 |
| ai_convert_prob | DECIMAL | AI-conversiewaarschijnlijkheid |
| ai_best_contact_time | VARCHAR | AI-aanbevolen contacttijd |
| ai_tags | JSONB | AI-gegenereerde tags |
| ai_scored_at | TIMESTAMP | AI-scoretijdstip |
| ai_next_best_action | TEXT | AI-suggestie voor volgende beste actie |
| ai_nba_generated_at | TIMESTAMP | AI-generatietijdstip suggestie |
| is_converted | BOOLEAN | Geconverteerd vlag |
| converted_at | TIMESTAMP | Conversietijdstip |
| converted_customer_id | BIGINT | Geconverteerd klant-ID |
| converted_contact_id | BIGINT | Geconverteerd contactpersoon-ID |
| converted_opportunity_id | BIGINT | Geconverteerde opportunity-ID |
| lost_reason | TEXT | Reden van verlies |
| disqualification_reason | TEXT | Reden voor ongeschiktheid |
| description | TEXT | Beschrijving |

#### 3.2.2 Klanten (nb_crm_customers)

Klant-/bedrijfsbeheer ter ondersteuning van internationale zaken.

**Belangrijkste velden:**

| Veld | Type | Beschrijving |
|-----|------|------|
| id | BIGINT | Primaire sleutel |
| name | VARCHAR | Klantnaam (verplicht) |
| account_number | VARCHAR | Klantnummer (automatisch gegenereerd, uniek) |
| phone | VARCHAR | Telefoon |
| website | TEXT | Website |
| address | TEXT | Adres |
| industry | VARCHAR | Sector |
| type | VARCHAR | Type: prospect/customer/partner/competitor |
| number_of_employees | VARCHAR | Aantal werknemers |
| annual_revenue | VARCHAR | Jaarlijkse omzetomvang |
| level | VARCHAR | Niveau: normal/important/vip |
| status | VARCHAR | Status: potential/active/dormant/churned |
| country | VARCHAR | Land |
| region_id | BIGINT | Regio (FK → nb_cbo_regions) |
| preferred_currency | VARCHAR | Voorkeursvaluta: CNY/USD/EUR |
| owner_id | BIGINT | Verantwoordelijke (FK → users) |
| parent_id | BIGINT | Moederbedrijf (FK → self) |
| source_lead_id | BIGINT | Bron lead-ID |
| ai_health_score | INTEGER | AI-gezondheidsscore 0-100 |
| ai_health_grade | VARCHAR | AI-gezondheidsgraad: A/B/C/D |
| ai_churn_risk | DECIMAL | AI-verlooprisico 0-100% |
| ai_churn_risk_level | VARCHAR | AI-verlooprisiconiveau: low/medium/high |
| ai_health_dimensions | JSONB | AI-gezondheidsdimensiescores |
| ai_recommendations | JSONB | AI-aanbevelingslijst |
| ai_health_assessed_at | TIMESTAMP | AI-gezondheidsbeoordelingstijdstip |
| ai_tags | JSONB | AI-gegenereerde tags |
| ai_best_contact_time | VARCHAR | AI-aanbevolen contacttijd |
| ai_next_best_action | TEXT | AI-suggestie voor volgende beste actie |
| ai_nba_generated_at | TIMESTAMP | AI-generatietijdstip suggestie |
| description | TEXT | Beschrijving |
| is_deleted | BOOLEAN | Soft delete vlag |

#### 3.2.3 Opportunities (nb_crm_opportunities)

Beheer van verkoopkansen met configureerbare pijplijnfasen.

**Belangrijkste velden:**

| Veld | Type | Beschrijving |
|-----|------|------|
| id | BIGINT | Primaire sleutel |
| opportunity_no | VARCHAR | Opportunity-nummer (automatisch gegenereerd, uniek) |
| name | VARCHAR | Opportunity-naam (verplicht) |
| amount | DECIMAL | Verwacht bedrag |
| currency | VARCHAR | Valuta |
| exchange_rate | DECIMAL | Wisselkoers |
| amount_usd | DECIMAL | USD-equivalent bedrag |
| customer_id | BIGINT | Klant (FK) |
| contact_id | BIGINT | Primaire contactpersoon (FK) |
| stage | VARCHAR | Fasecode (FK → stages.code) |
| stage_sort | INTEGER | Fase-sorteervolgorde (redundant voor eenvoudig sorteren) |
| stage_entered_at | TIMESTAMP | Tijdstip van ingang huidige fase |
| days_in_stage | INTEGER | Dagen in huidige fase |
| win_probability | DECIMAL | Handmatige winstkans |
| ai_win_probability | DECIMAL | AI-voorspelde winstkans |
| ai_analyzed_at | TIMESTAMP | AI-analysetijdstip |
| ai_confidence | DECIMAL | AI-voorspellingsbetrouwbaarheid |
| ai_trend | VARCHAR | AI-voorspellingstrend: up/stable/down |
| ai_risk_factors | JSONB | AI-geïdentificeerde risicofactoren |
| ai_recommendations | JSONB | AI-aanbevelingslijst |
| ai_predicted_close | DATE | AI-voorspelde sluitingsdatum |
| ai_next_best_action | TEXT | AI-suggestie voor volgende beste actie |
| ai_nba_generated_at | TIMESTAMP | AI-generatietijdstip suggestie |
| expected_close_date | DATE | Verwachte sluitingsdatum |
| actual_close_date | DATE | Werkelijke sluitingsdatum |
| owner_id | BIGINT | Verantwoordelijke (FK → users) |
| last_activity_at | TIMESTAMP | Laatste activiteitstijdstip |
| stagnant_days | INTEGER | Dagen zonder activiteit |
| loss_reason | TEXT | Reden van verlies |
| competitor_id | BIGINT | Concurrent (FK) |
| lead_source | VARCHAR | Leadbron |
| campaign_id | BIGINT | Marketingcampagne-ID |
| expected_revenue | DECIMAL | Verwachte omzet = bedrag × waarschijnlijkheid |
| description | TEXT | Beschrijving |

#### 3.2.4 Offertes (nb_crm_quotations)

Offertebeheer met ondersteuning voor meerdere valuta en goedkeuringsworkflows.

**Statusstroom:**
```
Concept → Wacht op goedkeuring → Goedgekeurd → Verzonden → Geaccepteerd/Geweigerd/Verlopen
               ↓
           Geweigerd → Bewerken → Concept
```

**Belangrijkste velden:**

| Veld | Type | Beschrijving |
|-----|------|------|
| id | BIGINT | Primaire sleutel |
| quotation_no | VARCHAR | Offertenummer (automatisch gegenereerd, uniek) |
| name | VARCHAR | Offertenaam |
| version | INTEGER | Versienummer |
| opportunity_id | BIGINT | Opportunity (FK, verplicht) |
| customer_id | BIGINT | Klant (FK) |
| contact_id | BIGINT | Contactpersoon (FK) |
| owner_id | BIGINT | Verantwoordelijke (FK → users) |
| currency_id | BIGINT | Valuta (FK → nb_cbo_currencies) |
| exchange_rate | DECIMAL | Wisselkoers |
| subtotal | DECIMAL | Subtotaal |
| discount_rate | DECIMAL | Kortingspercentage |
| discount_amount | DECIMAL | Kortingsbedrag |
| shipping_handling | DECIMAL | Verzending/afhandeling |
| tax_rate | DECIMAL | Belastingtarief |
| tax_amount | DECIMAL | Belastingbedrag |
| total_amount | DECIMAL | Totaalbedrag |
| total_amount_usd | DECIMAL | USD-equivalent bedrag |
| status | VARCHAR | Status: draft/pending_approval/approved/sent/accepted/rejected/expired |
| submitted_at | TIMESTAMP | Tijdstip van indiening |
| approved_by | BIGINT | Goedgekeurd door (FK → users) |
| approved_at | TIMESTAMP | Tijdstip van goedkeuring |
| rejected_at | TIMESTAMP | Tijdstip van afwijzing |
| sent_at | TIMESTAMP | Tijdstip van verzending |
| customer_response_at | TIMESTAMP | Tijdstip van reactie klant |
| expired_at | TIMESTAMP | Tijdstip van verloop |
| valid_until | DATE | Geldig tot |
| payment_terms | TEXT | Betalingsvoorwaarden |
| terms_condition | TEXT | Algemene voorwaarden |
| address | TEXT | Verzendadres |
| description | TEXT | Beschrijving |

#### 3.2.5 Orders (nb_crm_orders)

Orderbeheer inclusief het volgen van betalingen.

**Belangrijkste velden:**

| Veld | Type | Beschrijving |
|-----|------|------|
| id | BIGINT | Primaire sleutel |
| order_no | VARCHAR | Ordernummer (automatisch gegenereerd, uniek) |
| customer_id | BIGINT | Klant (FK) |
| contact_id | BIGINT | Contactpersoon (FK) |
| opportunity_id | BIGINT | Opportunity (FK) |
| quotation_id | BIGINT | Offerte (FK) |
| owner_id | BIGINT | Verantwoordelijke (FK → users) |
| currency | VARCHAR | Valuta |
| exchange_rate | DECIMAL | Wisselkoers |
| order_amount | DECIMAL | Orderbedrag |
| paid_amount | DECIMAL | Betaald bedrag |
| unpaid_amount | DECIMAL | Openstaand bedrag |
| status | VARCHAR | Status: pending/confirmed/in_progress/shipped/delivered/completed/cancelled |
| payment_status | VARCHAR | Betalingsstatus: unpaid/partial/paid |
| order_date | DATE | Orderdatum |
| delivery_date | DATE | Verwachte leverdatum |
| actual_delivery_date | DATE | Werkelijke leverdatum |
| shipping_address | TEXT | Verzendadres |
| logistics_company | VARCHAR | Logistiek bedrijf |
| tracking_no | VARCHAR | Trackingnummer |
| terms_condition | TEXT | Algemene voorwaarden |
| description | TEXT | Beschrijving |

### 3.3 Collectie-overzicht

#### CRM-bedrijfscollecties

| Nr. | Collectienaam | Beschrijving | Type |
|-----|------|------|------|
| 1 | nb_crm_leads | Leadbeheer | Bedrijf |
| 2 | nb_crm_customers | Klanten/Bedrijven | Bedrijf |
| 3 | nb_crm_contacts | Contactpersonen | Bedrijf |
| 4 | nb_crm_opportunities | Verkoopkansen | Bedrijf |
| 5 | nb_crm_opportunity_stages | Fase-configuratie | Configuratie |
| 6 | nb_crm_opportunity_users | Opportunity-medewerkers (Verkoopteam) | Associatie |
| 7 | nb_crm_quotations | Offertes | Bedrijf |
| 8 | nb_crm_quotation_items | Offerte-items | Bedrijf |
| 9 | nb_crm_quotation_approvals | Goedkeuringsrecords | Bedrijf |
| 10 | nb_crm_orders | Orders | Bedrijf |
| 11 | nb_crm_order_items | Order-items | Bedrijf |
| 12 | nb_crm_payments | Betalingsrecords | Bedrijf |
| 13 | nb_crm_products | Productcatalogus | Bedrijf |
| 14 | nb_crm_product_categories | Productcategorieën | Configuratie |
| 15 | nb_crm_price_tiers | Gestaffelde prijzen | Configuratie |
| 16 | nb_crm_activities | Activiteitenrecords | Bedrijf |
| 17 | nb_crm_comments | Reacties/Opmerkingen | Bedrijf |
| 18 | nb_crm_competitors | Concurrenten | Bedrijf |
| 19 | nb_crm_tags | Tags | Configuratie |
| 20 | nb_crm_lead_tags | Lead-Tag associatie | Associatie |
| 21 | nb_crm_contact_tags | Contactpersoon-Tag associatie | Associatie |
| 22 | nb_crm_customer_shares | Klantmachtigingen voor delen | Associatie |
| 23 | nb_crm_exchange_rates | Wisselkoershistorie | Configuratie |

#### Basisgegevenscollecties (Gemeenschappelijke modules)

| Nr. | Collectienaam | Beschrijving | Type |
|-----|------|------|------|
| 1 | nb_cbo_currencies | Valutawordenboek | Configuratie |
| 2 | nb_cbo_regions | Landen-/regiowordenboek | Configuratie |

### 3.4 Hulpcollecties

#### 3.4.1 Reacties (nb_crm_comments)

Generieke collectie voor reacties/opmerkingen die aan verschillende bedrijfsobjecten kan worden gekoppeld.

| Veld | Type | Beschrijving |
|-----|------|------|
| id | BIGINT | Primaire sleutel |
| content | TEXT | Inhoud reactie |
| lead_id | BIGINT | Gekoppelde lead (FK) |
| customer_id | BIGINT | Gekoppelde klant (FK) |
| opportunity_id | BIGINT | Gekoppelde opportunity (FK) |
| order_id | BIGINT | Gekoppelde order (FK) |

#### 3.4.2 Klantdeling (nb_crm_customer_shares)

Maakt samenwerking tussen meerdere personen en het delen van machtigingen voor klanten mogelijk.

| Veld | Type | Beschrijving |
|-----|------|------|
| id | BIGINT | Primaire sleutel |
| customer_id | BIGINT | Klant (FK, verplicht) |
| shared_with_user_id | BIGINT | Gedeeld met gebruiker (FK, verplicht) |
| shared_by_user_id | BIGINT | Gedeeld door gebruiker (FK) |
| permission_level | VARCHAR | Machtigingsniveau: read/write/full |
| shared_at | TIMESTAMP | Tijdstip van delen |

#### 3.4.3 Opportunity-medewerkers (nb_crm_opportunity_users)

Ondersteunt samenwerking van het verkoopteam aan opportunities.

| Veld | Type | Beschrijving |
|-----|------|------|
| opportunity_id | BIGINT | Opportunity (FK, samengestelde PK) |
| user_id | BIGINT | Gebruiker (FK, samengestelde PK) |
| role | VARCHAR | Rol: owner/collaborator/viewer |

#### 3.4.4 Regio's (nb_cbo_regions)

Basisgegevenswordenboek voor landen/regio's.

| Veld | Type | Beschrijving |
|-----|------|------|
| id | BIGINT | Primaire sleutel |
| code_alpha2 | VARCHAR | ISO 3166-1 Alpha-2 code (uniek) |
| code_alpha3 | VARCHAR | ISO 3166-1 Alpha-3 code (uniek) |
| code_numeric | VARCHAR | ISO 3166-1 numerieke code |
| name | VARCHAR | Naam land/regio |
| is_active | BOOLEAN | Is actief |
| sort_order | INTEGER | Sorteervolgorde |

---

## 4. Lead-levenscyclus

Leadbeheer maakt gebruik van een vereenvoudigde workflow van 4 fasen. Wanneer een nieuwe lead wordt aangemaakt, kan een workflow automatisch AI-scoring activeren om verkoopmedewerkers te helpen snel kwalitatieve leads te identificeren.

### 4.1 Statusdefinities

| Status | Naam | Beschrijving |
|-----|------|------|
| new | Nieuw | Net aangemaakt, wacht op contact |
| working | In behandeling | Actief bezig met opvolging |
| qualified | Geverifieerd | Klaar voor conversie |
| unqualified | Ongeschikt | Geen match |

### 4.2 Statusstroomdiagram

![design-2026-02-24-00-25-32](https://static-docs.nocobase.com/design-2026-02-24-00-25-32.png)

### 4.3 Lead-conversieproces

De conversie-interface biedt gelijktijdig drie opties; gebruikers kunnen kiezen om het volgende aan te maken of te koppelen:

- **Klant**: Maak een nieuwe klant aan OF koppel aan een bestaande klant.
- **Contactpersoon**: Maak een nieuwe contactpersoon aan (gekoppeld aan de klant).
- **Opportunity**: Er moet een opportunity worden aangemaakt.
![design-2026-02-24-00-25-22](https://static-docs.nocobase.com/design-2026-02-24-00-25-22.png)

**Records na conversie:**
- `converted_customer_id`: Gekoppelde klant-ID
- `converted_contact_id`: Gekoppelde contactpersoon-ID
- `converted_opportunity_id`: Aangemaakte opportunity-ID

---

## 5. Opportunity-levenscyclus

Opportunity-beheer maakt gebruik van configureerbare verkooppijplijnfasen. Wanneer een opportunityfase verandert, kan dit automatisch een AI-voorspelling van de winstkans activeren om verkoopmedewerkers te helpen risico's en kansen te identificeren.

### 5.1 Configureerbare fasen

Fasen worden opgeslagen in de collectie `nb_crm_opportunity_stages` en kunnen worden aangepast:

| Code | Naam | Volgorde | Standaard winstkans |
|-----|------|------|---------|
| prospecting | Prospecting | 1 | 10% |
| analysis | Behoeftenanalyse | 2 | 30% |
| proposal | Voorstel/Offerte | 3 | 60% |
| negotiation | Onderhandeling/Review | 4 | 80% |
| won | Gesloten Gewonnen | 5 | 100% |
| lost | Gesloten Verloren | 6 | 0% |

### 5.2 Pijplijnstroom
![design-2026-02-24-00-20-31](https://static-docs.nocobase.com/design-2026-02-24-00-20-31.png)

### 5.3 Stagnatiedetectie

Opportunities zonder activiteit worden gemarkeerd:

| Dagen zonder activiteit | Actie |
|-----------|------|
| 7 dagen | Gele waarschuwing |
| 14 dagen | Oranje herinnering aan verantwoordelijke |
| 30 dagen | Rode herinnering aan manager |

```sql
-- Bereken stagnatiedagen
UPDATE nb_crm_opportunities
SET stagnant_days = EXTRACT(DAY FROM NOW() - last_activity_at)
WHERE stage NOT IN ('won', 'lost');
```

### 5.4 Afhandeling winst/verlies

**Bij winst:**
1. Werk fase bij naar 'won'.
2. Leg de werkelijke sluitingsdatum vast.
3. Werk de klantstatus bij naar 'active'.
4. Activeer het aanmaken van een order (als een offerte is geaccepteerd).

**Bij verlies:**
1. Werk fase bij naar 'lost'.
2. Leg de reden van verlies vast.
3. Leg het concurrent-ID vast (indien verloren aan een concurrent).
4. Breng de manager op de hoogte.

---

## 6. Offerte-levenscyclus

### 6.1 Statusdefinities

| Status | Naam | Beschrijving |
|-----|------|------|
| draft | Concept | In voorbereiding |
| pending_approval | Wacht op goedkeuring | Wacht op goedkeuring |
| approved | Goedgekeurd | Klaar om te verzenden |
| sent | Verzonden | Verzonden naar klant |
| accepted | Geaccepteerd | Geaccepteerd door klant |
| rejected | Geweigerd | Geweigerd door klant |
| expired | Verlopen | Geldigheidsdatum verstreken |

### 6.2 Goedkeuringsregels (nog te finaliseren)

Goedkeuringsworkflows worden geactiveerd op basis van de volgende voorwaarden:

| Voorwaarde | Goedkeuringsniveau |
|------|---------|
| Korting > 10% | Verkoopmanager |
| Korting > 20% | Verkoopdirecteur |
| Bedrag > $100K | Financiën + Algemeen Directeur |

### 6.3 Ondersteuning voor meerdere valuta

#### Ontwerpfilosofie

Gebruik **USD als de uniforme basisvaluta** voor alle rapporten en analyses. Elk bedragrecord slaat het volgende op:
- Oorspronkelijke valuta en bedrag (wat de klant ziet)
- Wisselkoers op het moment van de transactie
- USD-equivalent bedrag (voor interne vergelijking)

#### Valutawordenboek (nb_cbo_currencies)

Valutaconfiguratie maakt gebruik van een gemeenschappelijke basisgegevenscollectie, die dynamisch beheer ondersteunt. Het veld `current_rate` slaat de huidige wisselkoers op, bijgewerkt door een geplande taak vanuit het meest recente record in `nb_crm_exchange_rates`.

| Veld | Type | Beschrijving |
|-----|------|------|
| id | BIGINT | Primaire sleutel |
| code | VARCHAR | Valutacode (uniek): USD/CNY/EUR/GBP/JPY |
| name | VARCHAR | Valutanaam |
| symbol | VARCHAR | Valutasymbool |
| decimal_places | INTEGER | Aantal decimalen |
| current_rate | DECIMAL | Huidige koers naar USD (gesynchroniseerd uit historie) |
| is_active | BOOLEAN | Is actief |
| sort_order | INTEGER | Sorteervolgorde |

#### Wisselkoershistorie (nb_crm_exchange_rates)

Legt historische wisselkoersgegevens vast. Een geplande taak synchroniseert de nieuwste koersen naar `nb_cbo_currencies.current_rate`.

| Veld | Type | Beschrijving |
|-----|------|------|
| id | BIGINT | Primaire sleutel |
| currency_code | VARCHAR | Valutacode (CNY/EUR/GBP/JPY) |
| rate_to_usd | DECIMAL(10,6) | Koers naar USD |
| effective_date | DATE | Ingangsdatum |
| source | VARCHAR | Bron: manual/api |
| createdAt | TIMESTAMP | Tijdstip van aanmaak |

> **Opmerking**: Offertes zijn gekoppeld aan de collectie `nb_cbo_currencies` via de vreemde sleutel `currency_id`, en de wisselkoers wordt rechtstreeks opgehaald uit het veld `current_rate`. Opportunities en orders gebruiken een `currency` VARCHAR-veld om de valutacode op te slaan.

#### Patroon voor bedragvelden

Collecties die bedragen bevatten, volgen dit patroon:

| Veld | Type | Beschrijving |
|-----|------|------|
| currency | VARCHAR | Transactievaluta |
| amount | DECIMAL | Oorspronkelijk bedrag |
| exchange_rate | DECIMAL | Wisselkoers naar USD bij transactie |
| amount_usd | DECIMAL | USD-equivalent (berekend) |

**Toegepast op:**
- `nb_crm_opportunities.amount` → `amount_usd`
- `nb_crm_quotations.total_amount` → `total_amount_usd`

#### Workflow-integratie
![design-2026-02-24-00-21-00](https://static-docs.nocobase.com/design-2026-02-24-00-21-00.png)

**Logica voor ophalen wisselkoers:**
1. Haal de wisselkoers rechtstreeks op uit `nb_cbo_currencies.current_rate` tijdens bedrijfsactiviteiten.
2. USD-transacties: Koers = 1.0, geen zoekopdracht vereist.
3. `current_rate` wordt gesynchroniseerd door een geplande taak vanuit het nieuwste `nb_crm_exchange_rates` record.

### 6.4 Versiebeheer

Wanneer een offerte wordt geweigerd of is verlopen, kan deze worden gedupliceerd als een nieuwe versie:

```
QT-20260119-001 v1 → Geweigerd
QT-20260119-001 v2 → Verzonden
QT-20260119-001 v3 → Geaccepteerd
```

---

## 7. Order-levenscyclus

### 7.1 Orderoverzicht

Orders worden aangemaakt wanneer een offerte wordt geaccepteerd, wat een bevestigde zakelijke toezegging vertegenwoordigt.
![design-2026-02-24-00-21-21](https://static-docs.nocobase.com/design-2026-02-24-00-21-21.png)

### 7.2 Orderstatusdefinities

| Status | Code | Beschrijving | Toegestane acties |
|-----|------|------|---------|
| Concept | `draft` | Order aangemaakt, nog niet bevestigd | Bewerken, Bevestigen, Annuleren |
| Bevestigd | `confirmed` | Order bevestigd, wacht op uitvoering | Uitvoering starten, Annuleren |
| In behandeling | `in_progress` | Order wordt verwerkt/geproduceerd | Voortgang bijwerken, Verzenden, Annuleren (vereist goedkeuring) |
| Verzonden | `shipped` | Producten verzonden naar klant | Markeren als afgeleverd |
| Afgeleverd | `delivered` | Klant heeft goederen ontvangen | Order voltooien |
| Voltooid | `completed` | Order volledig afgerond | Geen |
| Geannuleerd | `cancelled` | Order geannuleerd | Geen |

### 7.3 Orderdatamodel

#### nb_crm_orders

| Veld | Type | Beschrijving |
|-----|------|------|
| id | BIGINT | Primaire sleutel |
| order_no | VARCHAR | Ordernummer (automatisch gegenereerd, uniek) |
| customer_id | BIGINT | Klant (FK) |
| contact_id | BIGINT | Contactpersoon (FK) |
| opportunity_id | BIGINT | Opportunity (FK) |
| quotation_id | BIGINT | Offerte (FK) |
| owner_id | BIGINT | Verantwoordelijke (FK → users) |
| status | VARCHAR | Orderstatus |
| payment_status | VARCHAR | Betalingsstatus: unpaid/partial/paid |
| order_date | DATE | Orderdatum |
| delivery_date | DATE | Verwachte leverdatum |
| actual_delivery_date | DATE | Werkelijke leverdatum |
| currency | VARCHAR | Ordervaluta |
| exchange_rate | DECIMAL | Koers naar USD |
| order_amount | DECIMAL | Totaal orderbedrag |
| paid_amount | DECIMAL | Betaald bedrag |
| unpaid_amount | DECIMAL | Openstaand bedrag |
| shipping_address | TEXT | Verzendadres |
| logistics_company | VARCHAR | Logistiek bedrijf |
| tracking_no | VARCHAR | Trackingnummer |
| terms_condition | TEXT | Algemene voorwaarden |
| description | TEXT | Beschrijving |

#### nb_crm_order_items

| Veld | Type | Beschrijving |
|-----|------|------|
| id | BIGINT | Primaire sleutel |
| order_id | FK | Bovenliggende order |
| product_id | FK | Productreferentie |
| product_name | VARCHAR | Snapshot productnaam |
| quantity | INT | Bestelde hoeveelheid |
| unit_price | DECIMAL | Eenheidsprijs |
| discount_percent | DECIMAL | Kortingspercentage |
| line_total | DECIMAL | Totaal regelitem |
| notes | TEXT | Opmerkingen regelitem |

### 7.4 Betalingstracking

#### nb_crm_payments

| Veld | Type | Beschrijving |
|-----|------|------|
| id | BIGINT | Primaire sleutel |
| order_id | BIGINT | Gekoppelde order (FK, verplicht) |
| customer_id | BIGINT | Klant (FK) |
| payment_no | VARCHAR | Betalingsnummer (automatisch gegenereerd, uniek) |
| amount | DECIMAL | Betalingsbedrag (verplicht) |
| currency | VARCHAR | Betalingsvaluta |
| payment_method | VARCHAR | Methode: transfer/check/cash/credit_card/lc |
| payment_date | DATE | Betalingsdatum |
| bank_account | VARCHAR | Bankrekeningnummer |
| bank_name | VARCHAR | Banknaam |
| notes | TEXT | Betalingsopmerkingen |

---

## 8. Klant-levenscyclus

### 8.1 Klantoverzicht

Klanten worden aangemaakt tijdens de lead-conversie of wanneer een opportunity wordt gewonnen. Het systeem volgt de volledige levenscyclus van acquisitie tot ambassadeurschap.
![design-2026-02-24-00-21-34](https://static-docs.nocobase.com/design-2026-02-24-00-21-34.png)

### 8.2 Klantstatusdefinities

| Status | Code | Gezondheid | Beschrijving |
|-----|------|--------|------|
| Prospect | `prospect` | n.v.t. | Geconverteerde lead, nog geen orders |
| Actief | `active` | ≥70 | Betalende klant, goede interactie |
| Groeiend | `growing` | ≥80 | Klant met uitbreidingsmogelijkheden |
| Risicovol | `at_risk` | <50 | Klant die tekenen van verloop vertoont |
| Verloop | `churned` | n.v.t. | Niet langer actief |
| Terugwinnen | `win_back` | n.v.t. | Voormalige klant die wordt gereactiveerd |
| Ambassadeur | `advocate` | ≥90 | Hoge tevredenheid, zorgt voor aanbevelingen |

### 8.3 Klantgezondheidsscore

De klantgezondheid wordt berekend op basis van meerdere factoren:

| Factor | Gewicht | Meetwaarde |
|-----|------|---------|
| Recentheid aankoop | 25% | Dagen sinds laatste order |
| Frequentie aankoop | 20% | Aantal orders per periode |
| Geldwaarde | 20% | Totale en gemiddelde orderwaarde |
| Betrokkenheid | 15% | Openingspercentages e-mail, deelname aan vergaderingen |
| Gezondheid support | 10% | Ticketvolume en oplossingspercentage |
| Productgebruik | 10% | Actieve gebruiksstatistieken (indien van toepassing) |

**Gezondheidsdrempels:**

```javascript
if (health_score >= 90) status = 'advocate';
else if (health_score >= 70) status = 'active';
else if (health_score >= 50) status = 'growing';
else status = 'at_risk';
```

### 8.4 Klantsegmentatie

#### Geautomatiseerde segmentatie

| Segment | Voorwaarde | Voorgestelde actie |
|-----|------|---------|
| VIP | LTV > $100K | White-glove service, sponsoring door directie |
| Enterprise | Bedrijfsgrootte > 500 | Toegewezen Accountmanager |
| Middenmarkt | Bedrijfsgrootte 50-500 | Regelmatige check-ins, geschaalde ondersteuning |
| Startup | Bedrijfsgrootte < 50 | Self-service bronnen, community |
| Slapend | 90+ dagen geen activiteit | Reactiveringsmarketing |

---

## 9. E-mailintegratie

### 9.1 Overzicht

NocoBase biedt een ingebouwde plugin voor e-mailintegratie die Gmail en Outlook ondersteunt. Zodra e-mails zijn gesynchroniseerd, kunnen workflows automatisch AI-analyses van het sentiment en de intentie van de e-mail activeren, waardoor verkoopmedewerkers snel de houding van de klant kunnen begrijpen.

### 9.2 E-mailsynchronisatie

**Ondersteunde providers:**
- Gmail (via OAuth 2.0)
- Outlook/Microsoft 365 (via OAuth 2.0)

**Synchronisatiegedrag:**
- Tweerichtingssynchronisatie van verzonden en ontvangen e-mails.
- Automatische koppeling van e-mails aan CRM-records (Leads, Contactpersonen, Opportunities).
- Bijlagen worden opgeslagen in het NocoBase-bestandssysteem.

### 9.3 E-mail-CRM koppeling (nog te finaliseren)
![design-2026-02-24-00-21-51](https://static-docs.nocobase.com/design-2026-02-24-00-21-51.png)

### 9.4 E-mailsjablonen

Verkoopmedewerkers kunnen vooraf ingestelde sjablonen gebruiken:

| Sjablooncategorie | Voorbeelden |
|---------|------|
| Eerste contact | Cold e-mail, Warme introductie, Opvolging evenement |
| Opvolging | Opvolging vergadering, Opvolging voorstel, Herinnering bij geen reactie |
| Offerte | Offerte bijgevoegd, Offerteherziening, Offerte verloopt bijna |
| Order | Orderbevestiging, Verzendbericht, Afleverbevestiging |
| Customer Success | Welkomstbericht, Check-in, Verzoek om beoordeling |

---

## 10. AI-ondersteunde mogelijkheden

### 10.1 AI-medewerkersteam

Het CRM-systeem integreert de NocoBase AI-plugin en maakt gebruik van de volgende ingebouwde AI-medewerkers die zijn geconfigureerd met CRM-specifieke taken:

| ID | Naam | Ingebouwde rol | CRM-uitbreidingsmogelijkheden |
|----|------|---------|-------------|
| viz | Viz | Gegevensanalist | Analyse van verkoopgegevens, pijplijnvoorspelling |
| dara | Dara | Grafiekexpert | Gegevensvisualisatie, rapportontwikkeling, dashboardontwerp |
| ellis | Ellis | Redacteur | Opstellen van e-mailantwoorden, communicatiesamenvattingen, opstellen van zakelijke e-mails |
| lexi | Lexi | Vertaler | Meertalige klantcommunicatie, vertaling van inhoud |
| orin | Orin | Organisator | Dagelijkse prioriteiten, suggesties voor volgende stappen, opvolgingsplanning |

### 10.2 AI-takenlijst

AI-mogelijkheden zijn onderverdeeld in twee onafhankelijke categorieën:

#### I. AI-medewerkers (geactiveerd via frontend-blok)

Gebruikers communiceren rechtstreeks met AI via frontend AI-medewerkerblokken om analyses en suggesties te verkrijgen.

| Medewerker | Taak | Beschrijving |
|------|------|------|
| Viz | Analyse verkoopgegevens | Analyseer pijplijntrends en conversiepercentages |
| Viz | Pijplijnvoorspelling | Voorspel omzet op basis van gewogen pijplijn |
| Dara | Genereren grafieken | Genereer grafieken voor verkooprapporten |
| Dara | Dashboardontwerp | Ontwerp lay-outs voor gegevensdashboards |
| Ellis | Opstellen antwoorden | Genereer professionele e-mailantwoorden |
| Ellis | Communicatiesamenvatting | Vat e-mailthreads samen |
| Ellis | Opstellen zakelijke e-mail | Uitnodigingen voor vergaderingen, opvolgingen, bedankmails, etc. |
| Orin | Dagelijkse prioriteiten | Genereer een geprioriteerde takenlijst voor de dag |
| Orin | Volgende beste actie | Beveel volgende stappen aan voor elke opportunity |
| Lexi | Vertaling inhoud | Vertaal marketingmateriaal, voorstellen en e-mails |

#### II. Workflow LLM-nodes (geautomatiseerde uitvoering op de achtergrond)

LLM-nodes genest in workflows, automatisch geactiveerd door collectie-events, actie-events of geplande taken, onafhankelijk van AI-medewerkers.

| Taak | Activatiemethode | Beschrijving | Doelveld |
|------|---------|------|---------|
| Lead-scoring | Collectie-event (Aanmaken/Bijwerken) | Evalueer leadkwaliteit | ai_score, ai_convert_prob |
| Voorspelling winstkans | Collectie-event (Fasewijziging) | Voorspel de kans op succes van een opportunity | ai_win_probability, ai_risk_factors |

> **Opmerking**: Workflow LLM-nodes gebruiken prompts en Schema-output voor gestructureerde JSON, die wordt geparseerd en naar bedrijfsgegevensvelden wordt geschreven zonder tussenkomst van de gebruiker.

### 10.3 AI-velden in de database

| Tabel | AI-veld | Beschrijving |
|----|--------|------|
| nb_crm_leads | ai_score | AI-score 0-100 |
| | ai_convert_prob | Conversiewaarschijnlijkheid |
| | ai_best_contact_time | Beste contacttijd |
| | ai_tags | AI-gegenereerde tags (JSONB) |
| | ai_scored_at | Scoretijdstip |
| | ai_next_best_action | Suggestie voor volgende beste actie |
| | ai_nba_generated_at | Generatietijdstip suggestie |
| nb_crm_opportunities | ai_win_probability | AI-voorspelde winstkans |
| | ai_analyzed_at | Analysetijdstip |
| | ai_confidence | Voorspellingsbetrouwbaarheid |
| | ai_trend | Trend: up/stable/down |
| | ai_risk_factors | Risicofactoren (JSONB) |
| | ai_recommendations | Aanbevelingslijst (JSONB) |
| | ai_predicted_close | Voorspelde sluitingsdatum |
| | ai_next_best_action | Suggestie voor volgende beste actie |
| | ai_nba_generated_at | Generatietijdstip suggestie |
| nb_crm_customers | ai_health_score | Gezondheidsscore 0-100 |
| | ai_health_grade | Gezondheidsgraad: A/B/C/D |
| | ai_churn_risk | Verlooprisico 0-100% |
| | ai_churn_risk_level | Verlooprisiconiveau: low/medium/high |
| | ai_health_dimensions | Dimensiescores (JSONB) |
| | ai_recommendations | Aanbevelingslijst (JSONB) |
| | ai_health_assessed_at | Gezondheidsbeoordelingstijdstip |
| | ai_tags | AI-gegenereerde tags (JSONB) |
| | ai_best_contact_time | Beste contacttijd |
| | ai_next_best_action | Suggestie voor volgende beste actie |
| | ai_nba_generated_at | Generatietijdstip suggestie |

---

## 11. Workflow-engine

### 11.1 Geïmplementeerde workflows

| Workflownaam | Activatietype | Status | Beschrijving |
|-----------|---------|------|------|
| Leads Created | Collectie-event | Ingeschakeld | Geactiveerd wanneer een lead wordt aangemaakt |
| CRM Overall Analytics | AI-medewerker-event | Ingeschakeld | Algemene CRM-gegevensanalyse |
| Lead Conversion | Event na actie | Ingeschakeld | Lead-conversieproces |
| Lead Assignment | Collectie-event | Ingeschakeld | Geautomatiseerde leadtoewijzing |
| Lead Scoring | Collectie-event | Uitgeschakeld | Lead-scoring (nog te finaliseren) |
| Follow-up Reminder | Geplande taak | Uitgeschakeld | Opvolgingsherinneringen (nog te finaliseren) |

### 11.2 Nog te implementeren workflows

| Workflow | Activatietype | Beschrijving |
|-------|---------|------|
| Voortgang opportunityfase | Collectie-event | Winstkans bijwerken en tijd in fase vastleggen bij fasewijziging |
| Detectie stagnatie opportunity | Geplande taak | Detecteer inactieve opportunities en verzend herinneringen |
| Goedkeuring offerte | Event na actie | Goedkeuringsproces met meerdere niveaus |
| Genereren order | Event na actie | Automatisch order genereren na acceptatie offerte |

---

## 12. Menu- en interface-ontwerp

### 12.1 Beheerstructuur

| Menu | Type | Beschrijving |
|------|------|------|
| **Dashboards** | Groep | Dashboards |
| - Dashboard | Pagina | Standaard dashboard |
| - SalesManager | Pagina | Weergave verkoopmanager |
| - SalesRep | Pagina | Weergave verkoopvertegenwoordiger |
| - Executive | Pagina | Weergave directie |
| **Leads** | Pagina | Leadbeheer |
| **Customers** | Pagina | Klantbeheer |
| **Opportunities** | Pagina | Opportunity-beheer |
| - Tabel | Tab | Lijst met opportunities |
| **Products** | Pagina | Productbeheer |
| - Categorieën | Tab | Productcategorieën |
| **Orders** | Pagina | Orderbeheer |
| **Settings** | Groep | Instellingen |
| - Fase-instellingen | Pagina | Configuratie opportunityfasen |
| - Wisselkoers | Pagina | Wisselkoersinstellingen |
| - Activiteit | Pagina | Activiteitenrecords |
| - E-mails | Pagina | E-mailbeheer |
| - Contactpersonen | Pagina | Contactbeheer |
| - Gegevensanalyse | Pagina | Gegevensanalyse |

### 12.2 Dashboard-weergaven

#### Weergave verkoopmanager

| Component | Type | Gegevens |
|-----|------|------|
| Pijplijnwaarde | KPI-kaart | Totaal pijplijnbedrag per fase |
| Team-ranglijst | Tabel | Prestatieranglijst van vertegenwoordigers |
| Risicowaarschuwingen | Waarschuwingslijst | Opportunities met hoog risico |
| Trend winstpercentage | Lijngrafiek | Maandelijks winstpercentage |
| Stagnerende deals | Lijst | Deals die aandacht vereisen |

#### Weergave verkoopvertegenwoordiger

| Component | Type | Gegevens |
|-----|------|------|
| Mijn quotumvoortgang | Voortgangsbalk | Maandelijkse werkelijkheid vs. quotum |
| Openstaande opportunities | KPI-kaart | Aantal van mijn openstaande opportunities |
| Sluiting deze week | Lijst | Deals die naar verwachting binnenkort sluiten |
| Achterstallige activiteiten | Waarschuwing | Verlopen taken |
| Snelkoppelingen | Knoppen | Activiteit loggen, Opportunity aanmaken |

#### Weergave directie

| Component | Type | Gegevens |
|-----|------|------|
| Jaaromzet | KPI-kaart | Omzet van begin jaar tot nu |
| Pijplijnwaarde | KPI-kaart | Totaal pijplijnbedrag |
| Winstpercentage | KPI-kaart | Algemeen winstpercentage |
| Klantgezondheid | Distributie | Verdeling gezondheidsscores |
| Voorspelling | Grafiek | Maandelijkse omzetvoorspelling |

---

*Documentversie: v2.0 | Bijgewerkt: 2026-02-06*