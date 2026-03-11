:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/solution/ticket-system/design) voor nauwkeurige informatie.
:::

# Gedetailleerd ontwerp van de ticketing-oplossing

> **Versie**: v2.0-beta

> **Bijgewerkt op**: 2026-01-05

> **Status**: Preview-versie

## 1. Systeemoverzicht en ontwerpfilosofie

### 1.1 Systeempositionering

Dit systeem is een **AI-gestuurd intelligent ticketbeheerplatform**, gebouwd op het NocoBase low-code platform. Het kerndoel is:

```
Laat de klantenservice zich meer concentreren op het oplossen van problemen, in plaats van op tijdrovende proceshandelingen.
```

### 1.2 Ontwerpfilosofie

#### Filosofie 1: T-vormige gegevensarchitectuur

**Wat is een T-vormige architectuur?**

Geïnspireerd door het concept van de "T-shaped professional" — horizontale breedte + verticale diepte:

- **Horizontaal (Hoofdtabel)**: Omvat universele mogelijkheden voor alle bedrijfstypen — ticketnummer, status, behandelaar, SLA en andere kernvelden.
- **Verticaal (Extensietabellen)**: Specifieke velden voor gespecialiseerde bedrijfstypen — apparatuurreparatie heeft serienummers, klachten hebben compensatieplannen.

![ticketing-imgs-2025-12-31-22-50-45](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-18-25.png)

**Waarom dit ontwerp?**

| Traditionele aanpak | T-vormige architectuur |
|---------------------|----------------------|
| Eén tabel per bedrijfstype, dubbele velden | Gemeenschappelijke velden centraal beheerd, bedrijfsvelden naar behoefte uitgebreid |
| Statistische rapporten vereisen het samenvoegen van meerdere tabellen | Eén hoofdtabel voor statistieken van alle tickets |
| Proceswijzigingen vereisen aanpassingen op meerdere plaatsen | Kernprocessen worden op slechts één plek gewijzigd |
| Nieuwe bedrijfstypen vereisen nieuwe tabellen | Alleen extensietabellen toevoegen, het hoofdproces blijft ongewijzigd |

#### Filosofie 2: AI-medewerkersteam

Geen "AI-functies", maar "AI-medewerkers". Elke AI heeft een duidelijke rol, persoonlijkheid en verantwoordelijkheden:

| AI-medewerker | Functie | Kernverantwoordelijkheden | Triggerscenario |
|-------------|----------|----------------------|------------------|
| **Sam** | Service Desk Supervisor | Ticketroutering, prioriteitsbeoordeling, escalatiebeslissingen | Automatisch bij aanmaak ticket |
| **Grace** | Customer Success Expert | Genereren van antwoorden, toonaanpassing, klachtafhandeling | Wanneer medewerker klikt op "AI-antwoord" |
| **Max** | Kennisassistent | Vergelijkbare casussen, kennisaanbevelingen, synthese van oplossingen | Automatisch op de ticketdetailpagina |
| **Lexi** | Vertaler | Meertalige vertaling, vertaling van opmerkingen | Automatisch bij detectie van vreemde taal |

**Waarom het "AI-medewerker"-model?**

- **Duidelijke verantwoordelijkheden**: Sam regelt de routering, Grace de antwoorden; geen verwarring.
- **Gemakkelijk te begrijpen**: Zeggen "Laat Sam dit analyseren" is vriendelijker dan "Roep de classificatie-API aan".
- **Uitbreidbaar**: Nieuwe AI-mogelijkheden toevoegen staat gelijk aan het aannemen van nieuwe medewerkers.

#### Filosofie 3: Zelfcirculatie van kennis

![ticketing-imgs-2025-12-31-22-51-09](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-19-13.png)

Dit vormt een gesloten cirkel van **kennisopbouw en kennistoepassing**.

---

## 2. Kernentiteiten en gegevensmodel

### 2.1 Overzicht entiteitsrelaties

![ticketing-imgs-2025-12-31-22-51-23](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-20-02.png)


### 2.2 Details kerntabellen

#### 2.2.1 Ticket-hoofdtabel (nb_tts_tickets)

Dit is de kern van het systeem, ontworpen als een "brede tabel" waarin alle veelgebruikte velden zijn opgenomen.

**Basisinformatie**

| Veld | Type | Beschrijving | Voorbeeld |
|-------|------|-------------|---------|
| id | BIGINT | Primaire sleutel | 1001 |
| ticket_no | VARCHAR | Ticketnummer | TKT-20251229-0001 |
| title | VARCHAR | Titel | Trage netwerkverbinding |
| description | TEXT | Probleembeschrijving | Sinds vanochtend is het kantoornetwerk... |
| biz_type | VARCHAR | Bedrijfstype | it_support |
| priority | VARCHAR | Prioriteit | P1 |
| status | VARCHAR | Status | processing |

**Bronherkomst**

| Veld | Type | Beschrijving | Voorbeeld |
|-------|------|-------------|---------|
| source_system | VARCHAR | Bronsysteem | crm / email / iot |
| source_channel | VARCHAR | Bronkanaal | web / phone / wechat |
| external_ref_id | VARCHAR | Extern referentie-ID | CRM-2024-0001 |

**Contactinformatie**

| Veld | Type | Beschrijving |
|-------|------|-------------|
| customer_id | BIGINT | Klant-ID |
| contact_name | VARCHAR | Naam contactpersoon |
| contact_phone | VARCHAR | Telefoonnummer |
| contact_email | VARCHAR | E-mailadres |
| contact_company | VARCHAR | Bedrijfsnaam |

**Informatie over behandelaar**

| Veld | Type | Beschrijving |
|-------|------|-------------|
| assignee_id | BIGINT | Behandelaar-ID |
| assignee_department_id | BIGINT | Afdelings-ID behandelaar |
| transfer_count | INT | Aantal overdrachten |

**Tijdstippen**

| Veld | Type | Beschrijving | Triggermoment |
|-------|------|-------------|----------------|
| submitted_at | TIMESTAMP | Tijdstip indiening | Bij aanmaak ticket |
| assigned_at | TIMESTAMP | Tijdstip toewijzing | Bij aanwijzen behandelaar |
| first_response_at | TIMESTAMP | Eerste responstijd | Bij eerste antwoord aan klant |
| resolved_at | TIMESTAMP | Tijdstip oplossing | Wanneer status wijzigt naar resolved |
| closed_at | TIMESTAMP | Tijdstip sluiting | Wanneer status wijzigt naar closed |

**SLA-gerelateerd**

| Veld | Type | Beschrijving |
|-------|------|-------------|
| sla_config_id | BIGINT | SLA-configuratie-ID |
| sla_response_due | TIMESTAMP | Deadline reactie |
| sla_resolve_due | TIMESTAMP | Deadline oplossing |
| sla_paused_at | TIMESTAMP | Starttijd SLA-pauze |
| sla_paused_duration | INT | Totale pauzeduur (minuten) |
| is_sla_response_breached | BOOLEAN | Reactietermijn overschreden |
| is_sla_resolve_breached | BOOLEAN | Oplossingstermijn overschreden |

**AI-analyseresultaten**

| Veld | Type | Beschrijving | Ingevuld door |
|-------|------|-------------|--------------|
| ai_category_code | VARCHAR | Door AI herkende categorie | Sam |
| ai_sentiment | VARCHAR | Sentimentanalyse | Sam |
| ai_urgency | VARCHAR | Urgentieniveau | Sam |
| ai_keywords | JSONB | Trefwoorden | Sam |
| ai_reasoning | TEXT | Redeneringsproces | Sam |
| ai_suggested_reply | TEXT | Voorgesteld antwoord | Sam/Grace |
| ai_confidence_score | NUMERIC | Betrouwbaarheidsscore | Sam |
| ai_analysis | JSONB | Volledig analyseresultaat | Sam |

**Meertalige ondersteuning**

| Veld | Type | Beschrijving | Ingevuld door |
|-------|------|-------------|--------------|
| source_language_code | VARCHAR | Oorspronkelijke taal | Sam/Lexi |
| target_language_code | VARCHAR | Doeltaal | Systeemstandaard (bijv. NL) |
| is_translated | BOOLEAN | Is vertaald | Lexi |
| description_translated | TEXT | Vertaalde beschrijving | Lexi |

#### 2.2.2 Bedrijfsextensietabellen

**Apparatuurreparatie (nb_tts_biz_repair)**

| Veld | Type | Beschrijving |
|-------|------|-------------|
| ticket_id | BIGINT | Gekoppeld ticket-ID |
| equipment_model | VARCHAR | Model apparatuur |
| serial_number | VARCHAR | Serienummer |
| fault_code | VARCHAR | Foutcode |
| spare_parts | JSONB | Lijst met reserveonderdelen |
| maintenance_type | VARCHAR | Type onderhoud |

**IT-ondersteuning (nb_tts_biz_it_support)**

| Veld | Type | Beschrijving |
|-------|------|-------------|
| ticket_id | BIGINT | Gekoppeld ticket-ID |
| asset_number | VARCHAR | Activumnummer |
| os_version | VARCHAR | Versie besturingssysteem |
| software_name | VARCHAR | Betrokken software |
| remote_address | VARCHAR | Extern adres |
| error_code | VARCHAR | Foutcode |

**Klantklacht (nb_tts_biz_complaint)**

| Veld | Type | Beschrijving |
|-------|------|-------------|
| ticket_id | BIGINT | Gekoppeld ticket-ID |
| related_order_no | VARCHAR | Betrokken ordernummer |
| complaint_level | VARCHAR | Klachtniveau |
| compensation_amount | DECIMAL | Compensatiebedrag |
| compensation_type | VARCHAR | Wijze van compensatie |
| root_cause | TEXT | Grondoorzaak |

#### 2.2.3 Opmerkingentabel (nb_tts_ticket_comments)

**Kernvelden**

| Veld | Type | Beschrijving |
|-------|------|-------------|
| id | BIGINT | Primaire sleutel |
| ticket_id | BIGINT | Ticket-ID |
| parent_id | BIGINT | ID bovenliggende opmerking (ondersteunt boomstructuur) |
| content | TEXT | Inhoud opmerking |
| direction | VARCHAR | Richting: inbound (klant) / outbound (medewerker) |
| is_internal | BOOLEAN | Is interne notitie |
| is_first_response | BOOLEAN | Is eerste reactie |

**AI-beoordelingsvelden (voor outbound)**

| Veld | Type | Beschrijving |
|-------|------|-------------|
| source_language_code | VARCHAR | Brontaal |
| content_translated | TEXT | Vertaalde inhoud |
| is_translated | BOOLEAN | Is vertaald |
| is_ai_blocked | BOOLEAN | Geblokkeerd door AI |
| ai_block_reason | VARCHAR | Reden van blokkade |
| ai_block_detail | TEXT | Gedetailleerde uitleg |
| ai_quality_score | NUMERIC | Kwaliteitsscore |
| ai_suggestions | TEXT | Verbetersuggesties |

#### 2.2.4 Waarderingstabel (nb_tts_ratings)

| Veld | Type | Beschrijving |
|-------|------|-------------|
| ticket_id | BIGINT | Ticket-ID (uniek) |
| overall_rating | INT | Algemene tevredenheid (1-5) |
| response_rating | INT | Reactiesnelheid (1-5) |
| professionalism_rating | INT | Professionaliteit (1-5) |
| resolution_rating | INT | Probleemoplossing (1-5) |
| nps_score | INT | NPS-score (0-10) |
| tags | JSONB | Snelkoppelingstags |
| comment | TEXT | Tekstuele toelichting |

#### 2.2.5 Kennisartikeltabel (nb_tts_qa_articles)

| Veld | Type | Beschrijving |
|-------|------|-------------|
| article_no | VARCHAR | Artikelnummer (bijv. KB-T0001) |
| title | VARCHAR | Titel |
| content | TEXT | Inhoud (Markdown) |
| summary | TEXT | Samenvatting |
| category_code | VARCHAR | Categoriecode |
| keywords | JSONB | Trefwoorden |
| source_type | VARCHAR | Bron: ticket/faq/manual |
| source_ticket_id | BIGINT | Bron ticket-ID |
| ai_generated | BOOLEAN | Door AI gegenereerd |
| ai_quality_score | NUMERIC | Kwaliteitsscore |
| status | VARCHAR | Status: draft/published/archived |
| view_count | INT | Aantal weergaven |
| helpful_count | INT | Aantal keer nuttig bevonden |

### 2.3 Lijst met gegevenstabellen

| Nr. | Tabelnaam | Beschrijving | Type record |
|-----|------------|-------------|-------------|
| 1 | nb_tts_tickets | Ticket-hoofdtabel | Bedrijfsgegevens |
| 2 | nb_tts_biz_repair | Extensie apparatuurreparatie | Bedrijfsgegevens |
| 3 | nb_tts_biz_it_support | Extensie IT-ondersteuning | Bedrijfsgegevens |
| 4 | nb_tts_biz_complaint | Extensie klantklachten | Bedrijfsgegevens |
| 5 | nb_tts_customers | Klanten-hoofdtabel | Bedrijfsgegevens |
| 6 | nb_tts_customer_contacts | Klantcontactpersonen | Bedrijfsgegevens |
| 7 | nb_tts_ticket_comments | Ticket-opmerkingen | Bedrijfsgegevens |
| 8 | nb_tts_ratings | Tevredenheidswaarderingen | Bedrijfsgegevens |
| 9 | nb_tts_qa_articles | Kennisartikelen | Kennisgegevens |
| 10 | nb_tts_qa_article_relations | Artikelrelaties | Kennisgegevens |
| 11 | nb_tts_faqs | Veelgestelde vragen | Kennisgegevens |
| 12 | nb_tts_tickets_categories | Ticketcategorieën | Configuratiegegevens |
| 13 | nb_tts_sla_configs | SLA-configuratie | Configuratiegegevens |
| 14 | nb_tts_skill_configs | Vaardigheidsconfiguratie | Configuratiegegevens |
| 15 | nb_tts_business_types | Bedrijfstypen | Configuratiegegevens |

---

## 3. Ticket-levenscyclus

### 3.1 Statusdefinities

| Status | Naam | Beschrijving | SLA-tijd | Kleur |
|--------|------|-------------|------------|-------|
| new | Nieuw | Net aangemaakt, wacht op toewijzing | Start | 🔵 Blauw |
| assigned | Toegewezen | Behandelaar aangewezen, wacht op acceptatie | Doorgaan | 🔷 Cyaan |
| processing | In behandeling | Wordt momenteel verwerkt | Doorgaan | 🟠 Oranje |
| pending | Geparkeerd | Wacht op feedback van de klant | **Gepauzeerd** | ⚫ Grijs |
| transferred | Overgedragen | Overgedragen aan iemand anders | Doorgaan | 🟣 Paars |
| resolved | Opgelost | Wacht op bevestiging van de klant | Stop | 🟢 Groen |
| closed | Gesloten | Ticket beëindigd | Stop | ⚫ Grijs |
| cancelled | Geannuleerd | Ticket geannuleerd | Stop | ⚫ Grijs |

### 3.2 Statusstroomdiagram

**Hoofdstroom (van links naar rechts)**

![ticketing-imgs-2025-12-31-22-51-45](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-21-01.png)

**Substromen**

![ticketing-imgs-2025-12-31-22-52-42](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-22-14.png)

![ticketing-imgs-2025-12-31-22-52-53](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-22-32.png)


**Volledige State Machine**

![ticketing-imgs-2025-12-31-22-54-23](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-23-13.png)

### 3.3 Belangrijke regels voor statusovergang

| Van | Naar | Trigger | Systeemactie |
|----|----|---------|---------|
| new | assigned | Behandelaar toewijzen | Registreer assigned_at |
| assigned | processing | Behandelaar klikt op "Accepteren" | Geen |
| processing | pending | Klik op "Parkeren" | Registreer sla_paused_at |
| pending | processing | Reactie klant / Handmatig hervatten | Bereken pauzeduur, wis paused_at |
| processing | resolved | Klik op "Oplossen" | Registreer resolved_at |
| resolved | closed | Bevestiging klant / 3 dagen timeout | Registreer closed_at |
| * | cancelled | Ticket annuleren | Geen |


---

## 4. SLA-beheer (Service Level Agreement)

### 4.1 Prioriteit en SLA-configuratie

| Prioriteit | Naam | Reactietijd | Oplostijd | Waarschuwingsdrempel | Typisch scenario |
|----------|------|---------------|-----------------|-----------------|------------------|
| P0 | Kritiek | 15 min | 2 uur | 80% | Systeem plat, productielijn gestopt |
| P1 | Hoog | 1 uur | 8 uur | 80% | Belangrijke functie defect |
| P2 | Gemiddeld | 4 uur | 24 uur | 80% | Algemene problemen |
| P3 | Laag | 8 uur | 72 uur | 80% | Vragen, suggesties |

### 4.2 SLA-berekeningslogica

![ticketing-imgs-2025-12-31-22-53-54](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-23-46.png)

#### Bij aanmaak ticket

```
sla_response_due = submitted_at + reactietermijn (minuten)
sla_resolve_due = submitted_at + oplostermijn (minuten)
```

#### Bij parkeren (pending)

```
SLA-pauze starttijd = Huidige tijd
```

#### Bij hervatten (van pending naar processing)

```
-- Bereken huidige pauzeduur
Huidige pauzeduur = Huidige tijd - SLA-pauze starttijd

-- Optellen bij totale pauzeduur
Totale pauzeduur = Totale pauzeduur + Huidige pauzeduur

-- Deadlines verlengen (pauzeperiode telt niet mee voor SLA)
sla_response_due = sla_response_due + Huidige pauzeduur
sla_resolve_due = sla_resolve_due + Huidige pauzeduur

-- Pauze-starttijd wissen
SLA-pauze starttijd = NULL
```

#### Vaststelling SLA-overschrijding

```
-- Reactie-overschrijding
is_sla_response_breached = (eerste_responstijd IS NULL EN Huidige tijd > sla_response_due)
                        OF (eerste_responstijd > sla_response_due)

-- Oplossings-overschrijding
is_sla_resolve_breached = (opgelost_op IS NULL EN Huidige tijd > sla_resolve_due)
                       OF (opgelost_op > sla_resolve_due)
```

### 4.3 SLA-waarschuwingsmechanisme

| Waarschuwingsniveau | Voorwaarde | Ontvanger | Methode |
|-------------|-----------|--------|--------|
| Gele waarschuwing | Resterende tijd < 20% | Behandelaar | In-app bericht |
| Rode waarschuwing | Reeds overschreden | Behandelaar + Supervisor | In-app + E-mail |
| Escalatie | 1 uur overschreden | Afdelingsmanager | E-mail + SMS |

### 4.4 SLA-dashboardindicatoren

| Indicator | Formule | Gezondheidsdrempel |
|--------|---------|------------------|
| Reactie-compliance | Tickets binnen termijn / Totaal aantal tickets | > 95% |
| Oplossings-compliance | Opgelost binnen termijn / Totaal opgelost | > 90% |
| Gemiddelde reactietijd | SOM(reactietijd) / Aantal tickets | < 50% van SLA |
| Gemiddelde oplostijd | SOM(oplostijd) / Aantal tickets | < 80% van SLA |

---

## 5. AI-mogelijkheden en medewerkerssysteem

### 5.1 AI-medewerkersteam

Het systeem is geconfigureerd met 8 AI-medewerkers, verdeeld in twee categorieën:

**Nieuwe medewerkers (specifiek voor ticketing)**

| ID | Naam | Functie | Kernvaardigheden |
|----|------|----------|-------------------|
| sam | Sam | Service Desk Supervisor | Ticketroutering, prioriteitsbeoordeling, escalatiebeslissingen, SLA-risico-identificatie |
| grace | Grace | Customer Success Expert | Professionele antwoordgeneratie, toonaanpassing, klachtafhandeling, herstel van tevredenheid |
| max | Max | Kennisassistent | Zoeken naar vergelijkbare casussen, kennisaanbevelingen, synthese van oplossingen |

**Hergebruikte medewerkers (algemene vaardigheden)**

| ID | Naam | Functie | Kernvaardigheden |
|----|------|----------|-------------------|
| dex | Dex | Gegevensorganisator | E-mail-naar-ticket, telefoon-naar-ticket, batchgewijze gegevensopschoning |
| ellis | Ellis | E-mailexpert | Sentimentanalyse van e-mail, samenvatting van threads, opstellen van antwoorden |
| lexi | Lexi | Vertaler | Ticketvertaling, antwoordvertaling, realtime gesprekvertaling |
| cole | Cole | NocoBase-expert | Begeleiding bij systeemgebruik, hulp bij workflowconfiguratie |
| vera | Vera | Onderzoeksanalist | Onderzoek naar technische oplossingen, verificatie van productinformatie |

### 5.2 AI-takenlijst

Elke AI-medewerker heeft 4 specifieke taken:

#### Taken van Sam

| Taak-ID | Naam | Triggermethode | Beschrijving |
|---------|------|----------------|-------------|
| SAM-01 | Ticketanalyse & Routering | Workflow automatisch | Automatische analyse bij nieuw ticket |
| SAM-02 | Prioriteitsherbeoordeling | Frontend interactie | Prioriteit aanpassen op basis van nieuwe info |
| SAM-03 | Escalatiebesluit | Frontend/Workflow | Bepalen of escalatie nodig is |
| SAM-04 | SLA-risicobeoordeling | Workflow automatisch | Identificeren van overschrijdingsrisico's |

#### Taken van Grace

| Taak-ID | Naam | Triggermethode | Beschrijving |
|---------|------|----------------|-------------|
| GRACE-01 | Professionele antwoordgeneratie | Frontend interactie | Antwoord genereren op basis van context |
| GRACE-02 | Toonaanpassing antwoord | Frontend interactie | Toon van bestaand antwoord optimaliseren |
| GRACE-03 | Klacht-de-escalatie | Frontend/Workflow | Klachten van klanten oplossen |
| GRACE-04 | Tevredenheidsherstel | Frontend/Workflow | Follow-up na negatieve ervaring |

#### Taken van Max

| Taak-ID | Naam | Triggermethode | Beschrijving |
|---------|------|----------------|-------------|
| MAX-01 | Zoeken vergelijkbare casussen | Frontend/Workflow | Historische vergelijkbare tickets vinden |
| MAX-02 | Kennisaanbeveling | Frontend/Workflow | Relevante kennisartikelen aanbevelen |
| MAX-03 | Oplossingssynthese | Frontend interactie | Oplossingen uit meerdere bronnen combineren |
| MAX-04 | Gids voor probleemoplossing | Frontend interactie | Systematisch stappenplan voor onderzoek maken |

#### Taken van Lexi

| Taak-ID | Naam | Triggermethode | Beschrijving |
|---------|------|----------------|-------------|
| LEXI-01 | Ticketvertaling | Workflow automatisch | Inhoud van ticket vertalen |
| LEXI-02 | Antwoordvertaling | Frontend interactie | Antwoorden van medewerkers vertalen |
| LEXI-03 | Batchvertaling | Workflow automatisch | Batchgewijze verwerking van vertalingen |
| LEXI-04 | Realtime gesprekvertaling | Frontend interactie | Realtime vertaling van dialogen |

### 5.3 AI-medewerkers en ticket-levenscyclus

![ticketing-imgs-2025-12-31-22-55-04](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-24-22.png)

### 5.4 Voorbeelden van AI-reacties

#### SAM-01 Ticketanalyserespons

```json
{
  "category_code": "COMPUTER",
  "sentiment": "NEGATIVE",
  "urgency": "HIGH",
  "keywords": ["ERP", "inloggen mislukt", "timeout", "maandafsluiting"],
  "confidence": 0.92,
  "reasoning": "Dit ticket beschrijft een inlogprobleem in het ERP-systeem dat de maandafsluiting van de financiële afdeling beïnvloedt; hoge urgentie.",
  "suggested_reply": "Geachte klant, bedankt voor het melden van dit probleem...",
  "source_language_code": "zh",
  "is_translated": true,
  "description_translated": "Hallo, ons ERP-systeem kan niet inloggen..."
}
```

#### GRACE-01 Antwoordgeneratierespons

```
Geachte heer De Vries,

Bedankt dat u contact met ons heeft opgenomen over het inlogprobleem met het ERP-systeem. Ik begrijp volledig dat dit probleem de maandafsluiting van uw bedrijf beïnvloedt. We hebben dit ticket daarom de hoogste prioriteit gegeven.

Huidige status:
- Het technische team onderzoekt momenteel de serververbindingen.
- We verwachten u binnen 30 minuten een update te kunnen geven.

In de tussentijd kunt u het volgende proberen:
1. Toegang via het reserve-adres: https://erp-backup.company.com
2. Voor dringende rapportages kunt u contact met ons opnemen voor hulp bij het exporteren.

Mocht u nog vragen hebben, aarzel dan niet om contact met mij op te nemen.

Met vriendelijke groet,
Het Technische Ondersteuningsteam
```

### 5.5 AI EQ-firewall

De kwaliteitscontrole van Grace blokkeert de volgende problemen in antwoorden:

| Type probleem | Voorbeeld origineel | AI-suggestie |
|------------|------------------|---------------|
| Negatieve toon | "Nee, dit valt niet onder de garantie" | "Dit defect valt momenteel niet onder de gratis garantie; we kunnen u een betaald reparatieplan aanbieden" |
| Klant beschuldigen | "U heeft het zelf kapot gemaakt" | "Na verificatie blijkt dit defect te zijn ontstaan door onvoorziene schade" |
| Verantwoordelijkheid afschuiven | "Niet ons probleem" | "Laat mij u helpen de oorzaak verder te onderzoeken" |
| Onverschilligheid | "Geen idee" | "Ik ga de relevante informatie direct voor u opzoeken" |
| Gevoelige informatie | "Uw wachtwoord is abc123" | [Geblokkeerd] Bevat gevoelige informatie, verzenden niet toegestaan |

---

## 6. Kennisbanksysteem

### 6.1 Kennisbronnen

![ticketing-imgs-2025-12-31-22-55-20](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-24-57.png)


### 6.2 Proces van ticket naar kennis

![ticketing-imgs-2025-12-31-22-55-38](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-25-18.png)

**Beoordelingsdimensies**:
- **Algemeenheid**: Is dit een veelvoorkomend probleem?
- **Volledigheid**: Is de oplossing helder en compleet?
- **Herhaalbaarheid**: Zijn de stappen herbruikbaar?

### 6.3 Kennisaanbevelingsmechanisme

Wanneer een medewerker de ticketdetails opent, beveelt Max automatisch relevante kennis aan:

```
┌────────────────────────────────────────────────────────────┐
│ 📚 Aanbevolen kennis                         [Uitvouwen/Inklappen] │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ KB-T0042 CNC-servosysteem foutdiagnosegids   Match: 94%  │ │
│ │ Bevat: Interpretatie alarmcodes, stappen voor controle  │ │
│ │ [Bekijken] [Toepassen op antwoord] [Markeren als nuttig] │ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ KB-T0038 XYZ-CNC3000 Onderhoudshandleiding   Match: 87%  │ │
│ │ Bevat: Veelvoorkomende fouten, preventief onderhoud      │ │
│ │ [Bekijken] [Toepassen op antwoord] [Markeren als nuttig] │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## 7. Workflow-engine

### 7.1 Workflow-categorieën

| Code | Categorie | Beschrijving | Triggermethode |
|------|----------|-------------|----------------|
| WF-T | Ticketstroom | Beheer van de ticket-levenscyclus | Formulierevents |
| WF-S | SLA-stroom | SLA-berekening en waarschuwingen | Formulierevents/Gepland |
| WF-C | Opmerkingstroom | Verwerking en vertaling van opmerkingen | Formulierevents |
| WF-R | Waarderingstroom | Uitnodigingen en statistieken voor waardering | Formulierevents/Gepland |
| WF-N | Meldingstroom | Verzenden van notificaties | Event-gestuurd |
| WF-AI | AI-stroom | AI-analyse en generatie | Formulierevents |

### 7.2 Kernworkflows

#### WF-T01: Ticket-aanmaakproces

![ticketing-imgs-2025-12-31-22-55-51](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-25-48.png)

#### WF-AI01: AI-analyse van tickets

![ticketing-imgs-2025-12-31-22-56-03](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-26-14.png)

#### WF-AI04: Vertaling en beoordeling van opmerkingen

![ticketing-imgs-2025-12-31-22-56-19](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-26-38.png)

#### WF-AI03: Kennisgeneratie

![ticketing-imgs-2025-12-31-22-56-37](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-26-54.png)

### 7.3 Geplande taken

| Taak | Frequentie | Beschrijving |
|------|-----------|-------------|
| SLA-waarschuwingscontrole | Elke 5 minuten | Controleer tickets die bijna de termijn overschrijden |
| Automatische sluiting | Dagelijks | Tickets met status 'resolved' na 3 dagen automatisch sluiten |
| Uitnodiging waardering | Dagelijks | Verzend uitnodiging 24 uur na sluiting ticket |
| Update statistieken | Elk uur | Statistieken van klanttickets bijwerken |

---

## 8. Menu- en interface-ontwerp

### 8.1 Beheerdersinterface (Backend)

![ticketing-imgs-2025-12-31-22-59-10](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-27-19.png)

### 8.2 Klantportaal

![ticketing-imgs-2025-12-31-22-59-32](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-27-35.png)

### 8.3 Dashboard-ontwerp

#### Directie-overzicht

| Component | Type | Gegevensbeschrijving |
|-----------|------|------------------|
| SLA-compliance | Meter | Reactie/oplossing-compliance van deze maand |
| Tevredenheidstrend | Lijngrafiek | Verloop van tevredenheid over de laatste 30 dagen |
| Ticketvolume-trend | Staafgrafiek | Aantal tickets over de laatste 30 dagen |
| Verdeling bedrijfstypen | Cirkeldiagram | Aandeel per bedrijfstype |

#### Supervisor-overzicht

| Component | Type | Gegevensbeschrijving |
|-----------|------|------------------|
| Overschrijdingswaarschuwingen | Lijst | Tickets die bijna of reeds overschreden zijn |
| Werkdruk team | Staafgrafiek | Aantal tickets per teamlid |
| Verdeling achterstand | Gestapelde grafiek | Aantal tickets per status |
| Verwerkingstijd | Heatmap | Verdeling van de gemiddelde verwerkingstijd |

#### Medewerker-overzicht

| Component | Type | Gegevensbeschrijving |
|-----------|------|------------------|
| Mijn taken | Getalkaart | Aantal tickets in behandeling |
| Prioriteitsverdeling | Cirkeldiagram | Verdeling P0/P1/P2/P3 |
| Statistieken vandaag | Indicator-kaart | Aantal verwerkte/opgeloste tickets vandaag |
| SLA-afteller | Lijst | Top 5 meest urgente tickets |

---

## Bijlagen

### A. Configuratie bedrijfstypen

| Typecode | Naam | Icoon | Gekoppelde extensietabel |
|-----------|------|------|---------------------------|
| repair | Apparatuurreparatie | 🔧 | nb_tts_biz_repair |
| it_support | IT-ondersteuning | 💻 | nb_tts_biz_it_support |
| complaint | Klantklacht | 📢 | nb_tts_biz_complaint |
| consultation | Advies/Vraag | ❓ | Geen |
| other | Overig | 📝 | Geen |

### B. Categoriecodes

| Code | Naam | Beschrijving |
|------|------|-------------|
| CONVEYOR | Transportsysteem | Problemen met transportsystemen |
| PACKAGING | Verpakkingsmachine | Problemen met verpakkingsmachines |
| WELDING | Lasapparatuur | Problemen met lasapparatuur |
| COMPRESSOR | Compressor | Problemen met compressoren |
| COLD_STORE | Koelcel | Problemen met koelcellen |
| CENTRAL_AC | Centrale airco | Problemen met centrale airconditioning |
| FORKLIFT | Heftruck | Problemen met heftrucks |
| COMPUTER | Computer | Hardwareproblemen computers |
| PRINTER | Printer | Problemen met printers |
| PROJECTOR | Projector | Problemen met projectoren |
| INTERNET | Netwerk | Netwerkverbindingen |
| EMAIL | E-mail | E-mailsystemen |
| ACCESS | Toegang | Account- en toegangsrechten |
| PROD_INQ | Productaanvraag | Vragen over producten |
| COMPLAINT | Algemene klacht | Algemene klachten |
| DELAY | Logistieke vertraging | Klachten over vertraagde levering |
| DAMAGE | Verpakkingsschade | Klachten over beschadigde verpakking |
| QUANTITY | Tekort in aantal | Klachten over ontbrekende aantallen |
| SVC_ATTITUDE | Servicehouding | Klachten over bejegening |
| PROD_QUALITY | Productkwaliteit | Klachten over productkwaliteit |
| TRAINING | Training | Verzoeken om training |
| RETURN | Retour | Verzoeken om retournering |

---

*Documentversie: 2.0 | Laatst bijgewerkt: 2026-01-05*