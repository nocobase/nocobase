:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/solution/ticket-system/design).
:::

# Detaljerad design för ärendehanteringslösning

> **Version**: v2.0-beta

> **Uppdateringsdatum**: 2026-01-05

> **Status**: Förhandsversion

## 1. Systemöversikt och designfilosofi

### 1.1 Systempositionering

Detta system är en **AI-driven intelligent plattform för ärendehantering**, byggd på NocoBase lågkodsplattform. Kärnmålet är:

```
Låt kundtjänst fokusera på att lösa problem, snarare än på tidskrävande processhantering
```

### 1.2 Designfilosofi

#### Filosofi ett: T-formad dataarkitektur

**Vad är en T-formad arkitektur?**

Inspirerad av konceptet "T-formad kompetens" — horisontell bredd + vertikalt djup:

- **Horisontell (huvudtabell)**: Täcker universella funktioner för alla affärstyper — ärendenummer, status, handläggare, SLA och andra kärnfält.
- **Vertikal (expansionstabeller)**: Specialiserade fält för specifika affärstyper — utrustningsreparation har serienummer, klagomål har kompensationsplaner.

![ticketing-imgs-2025-12-31-22-50-45](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-18-25.png)

**Varför denna design?**

| Traditionell lösning | T-formad arkitektur |
|----------------------|----------------------|
| En tabell per affärstyp, duplicerade fält | Gemensamma fält hanteras enhetligt, affärsfält expanderas efter behov |
| Statistiska rapporter kräver sammanslagning av flera tabeller | En huvudtabell för statistik över alla ärenden |
| Processändringar kräver modifieringar på flera ställen | Kärnprocesser ändras endast på ett ställe |
| Nya affärstyper kräver nya tabeller | Lägg endast till expansionstabeller, huvudflödet förblir oförändrat |

#### Filosofi två: AI-medarbetarteam

Inte bara "AI-funktioner", utan "AI-medarbetare". Varje AI har en tydlig roll, personlighet och ansvarsområden:

| AI-medarbetare | Roll | Kärnansvar | Utlösningsscenario |
|----------------|------|------------|--------------------|
| **Sam** | Service Desk-ansvarig | Ärendestyrning, prioritetsbedömning, eskaleringsbeslut | Automatisk vid skapande av ärende |
| **Grace** | Expert på kundframgång | Generering av svar, tonjustering, hantering av klagomål | När handläggaren klickar på "AI-svar" |
| **Max** | Kunskapsassistent | Liknande ärenden, kunskapsrekommendationer, sammanställning av lösningar | Automatisk på ärendets detaljsida |
| **Lexi** | Översättare | Flerspråkig översättning, översättning av kommentarer | Automatisk när främmande språk upptäcks |

**Varför modellen med "AI-medarbetare"?**

- **Tydliga ansvarsområden**: Sam sköter styrning, Grace sköter svar, ingen förvirring uppstår.
- **Lätt att förstå**: Att säga "Låt Sam analysera detta" är vänligare än "Anropa klassificerings-API:et".
- **Skalbarhet**: Att lägga till nya AI-funktioner motsvarar att anställa nya medarbetare.

#### Filosofi tre: Kunskapens självcirkulation

![ticketing-imgs-2025-12-31-22-51-09](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-19-13.png)

Detta skapar ett slutet kretslopp för **kunskapsackumulering och kunskapsapplikation**.

---

## 2. Kärnentiteter och datamodell

### 2.1 Översikt över entitetsrelationer

![ticketing-imgs-2025-12-31-22-51-23](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-20-02.png)


### 2.2 Detaljer om kärntabeller

#### 2.2.1 Huvudtabell för ärenden (nb_tts_tickets)

Detta är systemets kärna, som använder en design med "bred tabell" där alla vanligt förekommande fält placeras i huvudtabellen.

**Grundläggande information**

| Fält | Typ | Beskrivning | Exempel |
|------|-----|-------------|---------|
| id | BIGINT | Primärnyckel | 1001 |
| ticket_no | VARCHAR | Ärendenummer | TKT-20251229-0001 |
| title | VARCHAR | Rubrik | Långsam nätverksanslutning |
| description | TEXT | Problembeskrivning | Sedan i morse har kontorets nätverk... |
| biz_type | VARCHAR | Affärstyp | it_support |
| priority | VARCHAR | Prioritet | P1 |
| status | VARCHAR | Status | processing |

**Källspårning**

| Fält | Typ | Beskrivning | Exempel |
|------|-----|-------------|---------|
| source_system | VARCHAR | Källsystem | crm / email / iot |
| source_channel | VARCHAR | Källkanal | web / phone / wechat |
| external_ref_id | VARCHAR | Externt referens-ID | CRM-2024-0001 |

**Kontaktinformation**

| Fält | Typ | Beskrivning |
|------|-----|-------------|
| customer_id | BIGINT | Kund-ID |
| contact_name | VARCHAR | Kontaktpersonens namn |
| contact_phone | VARCHAR | Telefonnummer |
| contact_email | VARCHAR | E-postadress |
| contact_company | VARCHAR | Företagsnamn |

**Information om handläggare**

| Fält | Typ | Beskrivning |
|------|-----|-------------|
| assignee_id | BIGINT | Handläggar-ID |
| assignee_department_id | BIGINT | Avdelnings-ID för handläggare |
| transfer_count | INT | Antal överlämningar |

**Tidspunkter**

| Fält | Typ | Beskrivning | Utlösningstidpunkt |
|------|-----|-------------|--------------------|
| submitted_at | TIMESTAMP | Inskickat tid | Vid skapande av ärende |
| assigned_at | TIMESTAMP | Tilldelat tid | När handläggare utses |
| first_response_at | TIMESTAMP | Första svarstid | Vid första svar till kund |
| resolved_at | TIMESTAMP | Löst tid | När status ändras till resolved |
| closed_at | TIMESTAMP | Stängt tid | När status ändras till closed |

**SLA-relaterat**

| Fält | Typ | Beskrivning |
|------|-----|-------------|
| sla_config_id | BIGINT | SLA-konfigurations-ID |
| sla_response_due | TIMESTAMP | Deadline för svar |
| sla_resolve_due | TIMESTAMP | Deadline för lösning |
| sla_paused_at | TIMESTAMP | Starttid för SLA-paus |
| sla_paused_duration | INT | Ackumulerad paustid (minuter) |
| is_sla_response_breached | BOOLEAN | Svarsfrist överskriden |
| is_sla_resolve_breached | BOOLEAN | Lösningsfrist överskriden |

**AI-analysresultat**

| Fält | Typ | Beskrivning | Fylls i av |
|------|-----|-------------|------------|
| ai_category_code | VARCHAR | AI-identifierad kategori | Sam |
| ai_sentiment | VARCHAR | Känsloanalys | Sam |
| ai_urgency | VARCHAR | Brådskandegrad | Sam |
| ai_keywords | JSONB | Nyckelord | Sam |
| ai_reasoning | TEXT | Resonemangsprocess | Sam |
| ai_suggested_reply | TEXT | Föreslaget svar | Sam/Grace |
| ai_confidence_score | NUMERIC | Konfidensgrad | Sam |
| ai_analysis | JSONB | Fullständigt analysresultat | Sam |

**Flerspråkigt stöd**

| Fält | Typ | Beskrivning | Fylls i av |
|------|-----|-------------|------------|
| source_language_code | VARCHAR | Ursprungsspråk | Sam/Lexi |
| target_language_code | VARCHAR | Målspråk | Systemstandard EN |
| is_translated | BOOLEAN | Är översatt | Lexi |
| description_translated | TEXT | Översatt beskrivning | Lexi |

#### 2.2.2 Affärsexpansionstabeller

**Utrustningsreparation (nb_tts_biz_repair)**

| Fält | Typ | Beskrivning |
|------|-----|-------------|
| ticket_id | BIGINT | Associerat ärende-ID |
| equipment_model | VARCHAR | Utrustningsmodell |
| serial_number | VARCHAR | Serienummer |
| fault_code | VARCHAR | Felkod |
| spare_parts | JSONB | Reservdelslista |
| maintenance_type | VARCHAR | Underhållstyp |

**IT-support (nb_tts_biz_it_support)**

| Fält | Typ | Beskrivning |
|------|-----|-------------|
| ticket_id | BIGINT | Associerat ärende-ID |
| asset_number | VARCHAR | Tillgångsnummer |
| os_version | VARCHAR | Operativsystemversion |
| software_name | VARCHAR | Berörd programvara |
| remote_address | VARCHAR | Fjärradress |
| error_code | VARCHAR | Felkod |

**Kundklagomål (nb_tts_biz_complaint)**

| Fält | Typ | Beskrivning |
|------|-----|-------------|
| ticket_id | BIGINT | Associerat ärende-ID |
| related_order_no | VARCHAR | Berört ordernummer |
| complaint_level | VARCHAR | Klagomålsnivå |
| compensation_amount | DECIMAL | Ersättningsbelopp |
| compensation_type | VARCHAR | Ersättningstyp |
| root_cause | TEXT | Grundorsak |

#### 2.2.3 Kommentarstabell (nb_tts_ticket_comments)

**Kärnfält**

| Fält | Typ | Beskrivning |
|------|-----|-------------|
| id | BIGINT | Primärnyckel |
| ticket_id | BIGINT | Ärende-ID |
| parent_id | BIGINT | Överordnad kommentar (stöder trädstruktur) |
| content | TEXT | Kommentar innehåll |
| direction | VARCHAR | Riktning: inbound (kund) / outbound (handläggare) |
| is_internal | BOOLEAN | Är intern anteckning |
| is_first_response | BOOLEAN | Är första svar |

**AI-granskningsfält (för outbound)**

| Fält | Typ | Beskrivning |
|------|-----|-------------|
| source_language_code | VARCHAR | Ursprungsspråk |
| content_translated | TEXT | Översatt innehåll |
| is_translated | BOOLEAN | Är översatt |
| is_ai_blocked | BOOLEAN | Blockad av AI |
| ai_block_reason | VARCHAR | Orsak till blockering |
| ai_block_detail | TEXT | Detaljerad förklaring |
| ai_quality_score | NUMERIC | Kvalitetspoäng |
| ai_suggestions | TEXT | Förbättringsförslag |

#### 2.2.4 Utvärderingstabell (nb_tts_ratings)

| Fält | Typ | Beskrivning |
|------|-----|-------------|
| ticket_id | BIGINT | Ärende-ID (unikt) |
| overall_rating | INT | Övergripande nöjdhet (1-5) |
| response_rating | INT | Svarshastighet (1-5) |
| professionalism_rating | INT | Professionalism (1-5) |
| resolution_rating | INT | Problemlösning (1-5) |
| nps_score | INT | NPS-poäng (0-10) |
| tags | JSONB | Snabbtaggar |
| comment | TEXT | Skriftlig utvärdering |

#### 2.2.5 Kunskapsartikeltabell (nb_tts_qa_articles)

| Fält | Typ | Beskrivning |
|------|-----|-------------|
| article_no | VARCHAR | Artikelnummer KB-T0001 |
| title | VARCHAR | Rubrik |
| content | TEXT | Innehåll (Markdown) |
| summary | TEXT | Sammanfattning |
| category_code | VARCHAR | Kategorikod |
| keywords | JSONB | Nyckelord |
| source_type | VARCHAR | Källa: ticket/faq/manual |
| source_ticket_id | BIGINT | Ursprungligt ärende-ID |
| ai_generated | BOOLEAN | AI-genererad |
| ai_quality_score | NUMERIC | Kvalitetspoäng |
| status | VARCHAR | Status: draft/published/archived |
| view_count | INT | Antal visningar |
| helpful_count | INT | Antal "hjälpsam" |

### 2.3 Lista över datatabeller

| Nr | Tabellnamn | Beskrivning | Posttyp |
|----|------------|-------------|----------|
| 1 | nb_tts_tickets | Huvudtabell för ärenden | Affärsdata |
| 2 | nb_tts_biz_repair | Expansion för utrustningsreparation | Affärsdata |
| 3 | nb_tts_biz_it_support | Expansion för IT-support | Affärsdata |
| 4 | nb_tts_biz_complaint | Expansion för kundklagomål | Affärsdata |
| 5 | nb_tts_customers | Huvudtabell för kunder | Affärsdata |
| 6 | nb_tts_customer_contacts | Kundkontakter | Affärsdata |
| 7 | nb_tts_ticket_comments | Ärendekommentarer | Affärsdata |
| 8 | nb_tts_ratings | Nöjdhetsutvärdering | Affärsdata |
| 9 | nb_tts_qa_articles | Kunskapsartiklar | Kunskapsdata |
| 10 | nb_tts_qa_article_relations | Artikelrelationer | Kunskapsdata |
| 11 | nb_tts_faqs | Vanliga frågor | Kunskapsdata |
| 12 | nb_tts_tickets_categories | Ärendekategorier | Konfigurationsdata |
| 13 | nb_tts_sla_configs | SLA-konfiguration | Konfigurationsdata |
| 14 | nb_tts_skill_configs | Kompetenskonfiguration | Konfigurationsdata |
| 15 | nb_tts_business_types | Affärstyper | Konfigurationsdata |

---

## 3. Ärendets livscykel

### 3.1 Statusdefinitioner

| Status | Namn | Beskrivning | SLA-tidtagning | Färg |
|--------|------|-------------|----------------|------|
| new | Nytt | Precis skapat, väntar på tilldelning | Startar | 🔵 Blå |
| assigned | Tilldelat | Handläggare utsedd, väntar på acceptans | Fortsätter | 🔷 Cyan |
| processing | Behandlas | Bearbetning pågår | Fortsätter | 🟠 Orange |
| pending | Väntande | Väntar på feedback från kund | **Pausad** | ⚫ Grå |
| transferred | Överfört | Överlämnat till annan person | Fortsätter | 🟣 Lila |
| resolved | Löst | Väntar på bekräftelse från kund | Stoppas | 🟢 Grön |
| closed | Stängt | Ärendet avslutat | Stoppas | ⚫ Grå |
| cancelled | Avbrutet | Ärendet makulerat | Stoppas | ⚫ Grå |

### 3.2 Statusflödesdiagram

**Huvudflöde (från vänster till höger)**

![ticketing-imgs-2025-12-31-22-51-45](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-21-01.png)

**Sidoflöden**

![ticketing-imgs-2025-12-31-22-52-42](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-22-14.png)

![ticketing-imgs-2025-12-31-22-52-53](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-22-32.png)


**Fullständig tillståndsmaskin**

![ticketing-imgs-2025-12-31-22-54-23](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-23-13.png)

### 3.3 Regler för statusövergångar

| Från | Till | Utlösningsvillkor | Systemåtgärd |
|------|------|-------------------|---------------|
| new | assigned | Handläggare utses | Registrera assigned_at |
| assigned | processing | Handläggare klickar på "Acceptera" | Ingen |
| processing | pending | Klickar på "Pausa" | Registrera sla_paused_at |
| pending | processing | Kund svarar / Manuell återgång | Beräkna paustid, rensa paused_at |
| processing | resolved | Klickar på "Lös" | Registrera resolved_at |
| resolved | closed | Kund bekräftar / 3 dagars timeout | Registrera closed_at |
| * | cancelled | Avbryt ärende | Ingen |


---

## 4. SLA-hantering (Service Level Agreement)

### 4.1 Prioritet och SLA-konfiguration

| Prioritet | Namn | Svarstid | Lösningstid | Varningströskel | Typiskt scenario |
|-----------|------|----------|-------------|-----------------|------------------|
| P0 | Kritisk | 15 minuter | 2 timmar | 80% | Systemavbrott, produktionsstopp |
| P1 | Hög | 1 timme | 8 timmar | 80% | Fel i viktig funktion |
| P2 | Medium | 4 timmar | 24 timmar | 80% | Allmänna problem |
| P3 | Låg | 8 timmar | 72 timmar | 80% | Frågor, förslag |

### 4.2 SLA-beräkningslogik

![ticketing-imgs-2025-12-31-22-53-54](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-23-46.png)

#### Vid skapande av ärende

```
Deadline för svar = Inskickat tid + Svarsfrist (minuter)
Deadline för lösning = Inskickat tid + Lösningsfrist (minuter)
```

#### Vid paus (pending)

```
Starttid för SLA-paus = Aktuell tid
```

#### Vid återgång (från pending till processing)

```
-- Beräkna aktuell paustid
Aktuell paustid = Aktuell tid - Starttid för SLA-paus

-- Ackumulera till total paustid
Ackumulerad paustid = Ackumulerad paustid + Aktuell paustid

-- Förläng deadlines (paustid räknas inte in i SLA)
Deadline för svar = Deadline för svar + Aktuell paustid
Deadline för lösning = Deadline för lösning + Aktuell paustid

-- Rensa starttid för paus
Starttid för SLA-paus = Tom
```

#### Fastställande av SLA-överträdelse

```
-- Kontroll av svarsöverträdelse
Svarsfrist överskriden = (Första svarstid är tom OCH Aktuell tid > Deadline för svar)
                        ELLER (Första svarstid > Deadline för svar)

-- Kontroll av lösningsöverträdelse
Lösningsfrist överskriden = (Löst tid är tom OCH Aktuell tid > Deadline för lösning)
                         ELLER (Löst tid > Deadline för lösning)
```

### 4.3 SLA-varningsmekanism

| Varningsnivå | Villkor | Mottagare | Metod |
|--------------|---------|-----------|-------|
| Gul varning | Återstående tid < 20% | Handläggare | Systemmeddelande |
| Röd varning | Tiden har gått ut | Handläggare + Ansvarig | Systemmeddelande + E-post |
| Eskaleringsvarning | 1 timme efter timeout | Avdelningschef | E-post + SMS |

### 4.4 SLA-indikatorer på instrumentpanelen

| Indikator | Beräkningsformel | Tröskelvärde för hälsa |
|-----------|------------------|------------------------|
| Svarsmåluppfyllelse | Ärenden utan överträdelse / Totalt antal ärenden | > 95% |
| Lösningsmåluppfyllelse | Lösta ärenden utan överträdelse / Totalt antal lösta ärenden | > 90% |
| Genomsnittlig svarstid | SUM(Svarstid) / Antal ärenden | < 50% av SLA |
| Genomsnittlig lösningstid | SUM(Lösningstid) / Antal ärenden | < 80% av SLA |

---

## 5. AI-kapacitet och medarbetarsystem

### 5.1 AI-medarbetarteam

Systemet är konfigurerat med 8 AI-medarbetare, uppdelade i två kategorier:

**Nya medarbetare (specifika för ärendehanteringssystemet)**

| ID | Namn | Roll | Kärnkompetens |
|----|------|------|---------------|
| sam | Sam | Service Desk-ansvarig | Ärendestyrning, prioritetsbedömning, eskaleringsbeslut, identifiering av SLA-risker |
| grace | Grace | Expert på kundframgång | Generering av professionella svar, tonjustering, hantering av klagomål, återställning av nöjdhet |
| max | Max | Kunskapsassistent | Sökning efter liknande fall, kunskapsrekommendationer, sammanställning av lösningar |

**Återanvända medarbetare (allmän kompetens)**

| ID | Namn | Roll | Kärnkompetens |
|----|------|------|---------------|
| dex | Dex | Dataorganisatör | Extrahera ärenden från e-post, omvandla samtal till ärenden, batch-datarensning |
| ellis | Ellis | E-postexpert | Känsloanalys i e-post, trådsammanfattning, utkast till svar |
| lexi | Lexi | Översättare | Översättning av ärenden, svar och realtidskonversationer |
| cole | Cole | NocoBase-expert | Vägledning i systemanvändning, hjälp med konfiguration av arbetsflöden |
| vera | Vera | Forskningsanalytiker | Research av tekniska lösningar, verifiering av produktinformation |

### 5.2 AI-uppgiftslista

Varje AI-medarbetare har 4 specifika uppgifter:

#### Sams uppgifter

| Uppgifts-ID | Namn | Utlösningsmetod | Beskrivning |
|-------------|------|-----------------|-------------|
| SAM-01 | Ärendeanalys och styrning | Automatiskt arbetsflöde | Automatisk analys vid nytt ärende |
| SAM-02 | Omvärdering av prioritet | Gränssnittsinteraktion | Justera prioritet baserat på ny info |
| SAM-03 | Eskaleringsbeslut | Gränssnitt/Arbetsflöde | Bedöma om eskalering krävs |
| SAM-04 | SLA-riskbedömning | Automatiskt arbetsflöde | Identifiera risk för timeout |

#### Graces uppgifter

| Uppgifts-ID | Namn | Utlösningsmetod | Beskrivning |
|-------------|------|-----------------|-------------|
| GRACE-01 | Professionell svarsgenerering | Gränssnittsinteraktion | Generera svar baserat på sammanhang |
| GRACE-02 | Justering av svarston | Gränssnittsinteraktion | Optimera tonen i befintliga svar |
| GRACE-03 | Hantering av klagomål | Gränssnitt/Arbetsflöde | Mildra och lösa kundklagomål |
| GRACE-04 | Återställning av nöjdhet | Gränssnitt/Arbetsflöde | Uppföljning efter negativ upplevelse |

#### Max uppgifter

| Uppgifts-ID | Namn | Utlösningsmetod | Beskrivning |
|-------------|------|-----------------|-------------|
| MAX-01 | Sökning efter liknande fall | Gränssnitt/Arbetsflöde | Hitta historiskt liknande ärenden |
| MAX-02 | Rekommendation av artiklar | Gränssnitt/Arbetsflöde | Rekommendera relevanta kunskapsartiklar |
| MAX-03 | Sammanställning av lösning | Gränssnittsinteraktion | Sammanställ lösning från flera källor |
| MAX-04 | Felsökningsguide | Gränssnittsinteraktion | Skapa systematiska felsökningsprocesser |

#### Lexis uppgifter

| Uppgifts-ID | Namn | Utlösningsmetod | Beskrivning |
|-------------|------|-----------------|-------------|
| LEXI-01 | Översättning av ärende | Automatiskt arbetsflöde | Översätt ärendets innehåll |
| LEXI-02 | Översättning av svar | Gränssnittsinteraktion | Översätt handläggarens svar |
| LEXI-03 | Batch-översättning | Automatiskt arbetsflöde | Hantera batch-översättningar |
| LEXI-04 | Realtidsöversättning | Gränssnittsinteraktion | Översätt dialoger i realtid |

### 5.3 AI-medarbetare och ärendets livscykel

![ticketing-imgs-2025-12-31-22-55-04](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-24-22.png)

### 5.4 Exempel på AI-svar

#### SAM-01 Svar på ärendeanalys

```json
{
  "category_code": "COMPUTER",
  "sentiment": "NEGATIVE",
  "urgency": "HIGH",
  "keywords": ["ERP", "inloggningsfel", "timeout", "månadsbokslut"],
  "confidence": 0.92,
  "reasoning": "Ärendet beskriver inloggningsproblem i ERP-systemet som påverkar ekonomiavdelningens månadsbokslut, hög brådskandegrad",
  "suggested_reply": "Bästa kund, tack för att ni rapporterar detta problem...",
  "source_language_code": "zh",
  "is_translated": true,
  "description_translated": "Hej, vårt ERP-system kan inte logga in..."
}
```

#### GRACE-01 Svar på svarsgenerering

```
Bästa Herr Zhang,

Tack för att ni kontaktar oss angående inloggningsproblemen i ERP-systemet. Jag har full förståelse för att detta påverkar ert arbete med månadsbokslutet, och vi har gett detta ärende högsta prioritet.

Aktuell status:
- Det tekniska teamet undersöker anslutningsproblem med servern
- Vi förväntar oss att ge er en uppdatering inom 30 minuter

Under tiden kan ni prova följande:
1. Använd reservadressen: https://erp-backup.company.com
2. Om ni har akuta behov av rapporter, kontakta oss så hjälper vi er med export

Tveka inte att kontakta mig om ni har ytterligare frågor.

Med vänlig hälsning,
Teknisk support
```

### 5.5 AI-brandvägg för emotionell intelligens

Grace ansvarar för kvalitetsgranskning av svar och blockerar följande problem:

| Problemtyp | Exempel på originaltext | AI-förslag |
|------------|-------------------------|------------|
| Negativ ton | "Nej, det ingår inte i garantin" | "Detta fel omfattas tyvärr inte av garantin, men vi kan erbjuda en betald reparationsplan" |
| Beskylla kunden | "Ni har sönder den själv" | "Vid kontroll har vi konstaterat att felet beror på en olyckshändelse" |
| Frånsäga sig ansvar | "Det är inte vårt problem" | "Låt mig hjälpa er att undersöka orsaken till problemet ytterligare" |
| Likgiltighet | "Vet inte" | "Jag ska hjälpa er att ta fram relevant information" |
| Känslig info | "Ert lösenord är abc123" | [Blockerat] Innehåller känslig information, får ej skickas |

---

## 6. Kunskapsbassystem

### 6.1 Kunskapskällor

![ticketing-imgs-2025-12-31-22-55-20](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-24-57.png)


### 6.2 Flöde för att omvandla ärende till kunskap

![ticketing-imgs-2025-12-31-22-55-38](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-25-18.png)

**Utvärderingsdimensioner**:
- **Allmängiltighet**: Är detta ett vanligt problem?
- **Fullständighet**: Är lösningen tydlig och komplett?
- **Repeterbarhet**: Kan stegen återanvändas?

### 6.3 Mekanism för kunskapsrekommendation

När en handläggare öppnar ärendedetaljer rekommenderar Max automatiskt relevant kunskap:

```
┌────────────────────────────────────────────────────────────┐
│ 📚 Rekommenderad kunskap                      [Visa/Dölj]  │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ KB-T0042 CNC-servosystem felsökningsguide  Matchning: 94%│ │
│ │ Innehåller: Tolkning av larmkoder, kontroll av drivsteg  │ │
│ │ [Visa] [Använd i svar] [Markera som hjälpsam]            │ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ KB-T0038 XYZ-CNC3000-serien underhållsmanual Matchning: 87%│ │
│ │ Innehåller: Vanliga fel, förebyggande underhållsplan     │ │
│ │ [Visa] [Använd i svar] [Markera som hjälpsam]            │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## 7. Motor för arbetsflöden

### 7.1 Kategorisering av arbetsflöden

| Nr | Kategori | Beskrivning | Utlösningsmetod |
|----|----------|-------------|-----------------|
| WF-T | Ärendeflöde | Hantering av ärendets livscykel | Formulärhändelse |
| WF-S | SLA-flöde | SLA-beräkning och varningar | Formulärhändelse/Schema |
| WF-C | Kommentarflöde | Hantering och översättning av kommentarer | Formulärhändelse |
| WF-R | Utvärderingsflöde | Inbjudan till utvärdering och statistik | Formulärhändelse/Schema |
| WF-N | Aviseringsflöde | Skicka aviseringar | Händelsestyrd |
| WF-AI | AI-flöde | AI-analys och generering | Formulärhändelse |

### 7.2 Kärnarbetsflöden

#### WF-T01: Flöde för skapande av ärende

![ticketing-imgs-2025-12-31-22-55-51](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-25-48.png)

#### WF-AI01: AI-analys av ärende

![ticketing-imgs-2025-12-31-22-56-03](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-26-14.png)

#### WF-AI04: Översättning och granskning av kommentarer

![ticketing-imgs-2025-12-31-22-56-19](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-26-38.png)

#### WF-AI03: Kunskapsgenerering

![ticketing-imgs-2025-12-31-22-56-37](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-26-54.png)

### 7.3 Schemalagda uppgifter

| Uppgift | Frekvens | Beskrivning |
|---------|----------|-------------|
| SLA-varningskontroll | Var 5:e minut | Kontrollera ärenden som närmar sig timeout |
| Automatisk stängning | Dagligen | Stäng ärenden i status resolved efter 3 dagar |
| Skicka utvärderingsinbjudan | Dagligen | Skicka inbjudan 24 timmar efter stängning |
| Uppdatering av statistik | Varje timme | Uppdatera kundärendestatistik |

---

## 8. Meny- och gränssnittsdesign

### 8.1 Administrationsgränssnitt

![ticketing-imgs-2025-12-31-22-59-10](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-27-19.png)

### 8.2 Kundportal

![ticketing-imgs-2025-12-31-22-59-32](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-27-35.png)

### 8.3 Design av instrumentpaneler

#### Ledningsvy

| Komponent | Typ | Databeskrivning |
|-----------|-----|-----------------|
| SLA-måluppfyllelse | Mätare | Svars-/lösningsgrad för innevarande månad |
| Nöjdhetstrend | Linjediagram | Förändring i nöjdhet senaste 30 dagarna |
| Ärendevolymtrend | Stapeldiagram | Ärendevolym senaste 30 dagarna |
| Fördelning av affärstyper | Cirkeldiagram | Andel för varje affärstyp |

#### Ansvarigvy

| Komponent | Typ | Databeskrivning |
|-----------|-----|-----------------|
| Timeout-varningar | Lista | Ärenden som närmar sig eller har nått timeout |
| Personalens arbetsbelastning | Stapeldiagram | Antal ärenden per teammedlem |
| Fördelning av eftersläpning | Staplat diagram | Antal ärenden per status |
| Ledtid för hantering | Värmekarta | Fördelning av genomsnittlig hanteringstid |

#### Handläggarvy

| Komponent | Typ | Databeskrivning |
|-----------|-----|-----------------|
| Mina uppgifter | Sifferkort | Antal väntande ärenden |
| Prioritetsfördelning | Cirkeldiagram | Fördelning av P0/P1/P2/P3 |
| Dagens statistik | Indikatorkort | Antal hanterade/lösta ärenden idag |
| SLA-nedräkning | Lista | De 5 mest brådskande ärendena |

---

## Bilaga

### A. Konfiguration av affärstyper

| Typkod | Namn | Ikon | Kopplad expansionstabell |
|--------|------|------|--------------------------|
| repair | Utrustningsreparation | 🔧 | nb_tts_biz_repair |
| it_support | IT-support | 💻 | nb_tts_biz_it_support |
| complaint | Kundklagomål | 📢 | nb_tts_biz_complaint |
| consultation | Konsultation/Förslag | ❓ | Ingen |
| other | Övrigt | 📝 | Ingen |

### B. Kategorikoder

| Kod | Namn | Beskrivning |
|-----|------|-------------|
| CONVEYOR | Transportbandssystem | Problem med transportband |
| PACKAGING | Förpackningsmaskin | Problem med förpackningsmaskin |
| WELDING | Svetsutrustning | Problem med svetsutrustning |
| COMPRESSOR | Luftkompressor | Problem med luftkompressor |
| COLD_STORE | Kylrum | Problem med kylrum |
| CENTRAL_AC | Central luftkonditionering | Problem med central AC |
| FORKLIFT | Gaffeltruck | Problem med gaffeltruck |
| COMPUTER | Dator | Problem med datorhårdvara |
| PRINTER | Skrivare | Problem med skrivare |
| PROJECTOR | Projektor | Problem med projektor |
| INTERNET | Nätverk | Problem med nätverksanslutning |
| EMAIL | E-post | Problem med e-postsystem |
| ACCESS | Behörighet | Problem med kontobehörighet |
| PROD_INQ | Produktförfrågan | Frågor om produkter |
| COMPLAINT | Allmänt klagomål | Allmänna klagomål |
| DELAY | Logistikfördröjning | Klagomål på försenad leverans |
| DAMAGE | Skadat emballage | Klagomål på skadat emballage |
| QUANTITY | Antalsbrist | Klagomål på saknade varor |
| SVC_ATTITUDE | Servicebemötande | Klagomål på serviceattityd |
| PROD_QUALITY | Produktkvalitet | Klagomål på produktkvalitet |
| TRAINING | Utbildning | Begäran om utbildning |
| RETURN | Retur | Begäran om retur |

---

*Dokumentversion: 2.0 | Senast uppdaterad: 2026-01-05*