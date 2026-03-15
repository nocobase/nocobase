:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/solution/ticket-system/index) voor nauwkeurige informatie.
:::

# Overzicht van de ticketoplossing

> **Opmerking**: Dit is een vroege preview-versie. Functionaliteiten zijn nog niet volledig en we werken continu aan verbeteringen. Feedback is welkom!

## 1. Achtergrond (Waarom)

### Welke sectoren / rollen / managementproblemen worden opgelost?

Bedrijven worden in hun dagelijkse activiteiten geconfronteerd met verschillende soorten serviceverzoeken: apparatuurherstel, IT-ondersteuning, klachten van klanten, adviesvragen, enz. Deze verzoeken komen uit verspreide bronnen (CRM-systemen, technici op locatie, e-mail, openbare formulieren, enz.), hebben verschillende verwerkingsprocessen en missen een uniform mechanisme voor tracking en beheer.

**Voorbeelden van typische bedrijfsscenario's:**

- **Apparatuurherstel**: After-sales teams verwerken reparatieverzoeken en moeten specifieke informatie registreren, zoals serienummers, foutcodes en reserveonderdelen.
- **IT-ondersteuning**: De IT-afdeling verwerkt verzoeken van interne medewerkers voor het opnieuw instellen van wachtwoorden, software-installaties en netwerkproblemen.
- **Klachten van klanten**: Klantenserviceteams verwerken klachten via meerdere kanalen, waarbij sommige emotioneel geladen verzoeken prioriteit nodig hebben.
- **Zelfservice voor klanten**: Eindklanten willen op een eenvoudige manier serviceverzoeken indienen en de voortgang van de verwerking volgen.

### Doelgroep-profiel

| Dimensie | Beschrijving |
|------|------|
| Bedrijfsomvang | Mkb tot middelgrote en grote ondernemingen met een aanzienlijke behoefte aan klantenservice |
| Rollenstructuur | Klantenserviceteams, IT-ondersteuning, after-sales teams, operationeel management |
| Digitale volwassenheid | Beginners tot gevorderden, die willen upgraden van beheer via Excel/e-mail naar systematisch beheer |

### Pijnpunten van huidige gangbare oplossingen

- **Hoge kosten / trage aanpassing**: SaaS-ticketsystemen zijn duur en aangepaste ontwikkelingstrajecten zijn lang.
- **Systeemfragmentatie, data-eilanden**: Verschillende bedrijfsgegevens zijn verspreid over verschillende systemen, wat uniforme analyse en besluitvorming bemoeilijkt.
- **Snelle zakelijke veranderingen, systemen evolueren moeilijk**: Wanneer zakelijke behoeften veranderen, zijn systemen vaak lastig snel aan te passen.
- **Trage servicerespons**: Verzoeken die tussen verschillende systemen stromen, kunnen niet tijdig worden toegewezen.
- **Ondoorzichtig proces**: Klanten kunnen de voortgang van hun ticket niet volgen; frequente navraag verhoogt de druk op de klantenservice.
- **Kwaliteit moeilijk te waarborgen**: Gebrek aan SLA-monitoring; time-outs en negatieve feedback kunnen niet tijdig worden gesignaleerd.

---

## 2. Referentieproducten en benchmarking (Benchmark)

### Gangbare producten op de markt

- **SaaS**: Zoals Salesforce, Zendesk, Odoo, enz.
- **Maatwerksystemen / Interne systemen**

### Benchmarking-dimensies

- Functionaliteitsdekking
- Flexibiliteit
- Uitbreidbaarheid
- Gebruik van AI

### Onderscheidende factoren van de NocoBase-oplossing

**Voordelen op platformniveau:**

- **Configuratie-prioriteit**: Van onderliggende gegevenstabellen tot bedrijfstypes, SLA en skill-routing; alles wordt beheerd via configuratie.
- **Snel bouwen met low-code**: Sneller dan eigen ontwikkeling, flexibeler dan SaaS.

**Wat traditionele systemen niet kunnen of waar de kosten extreem hoog zijn:**

- **AI-native integratie**: Met behulp van de AI-plugins van NocoBase wordt intelligente classificatie, hulp bij het invullen van formulieren en kennisaanbeveling gerealiseerd.
- **Alle ontwerpen kunnen door gebruikers worden gekopieerd**: Gebruikers kunnen zelf uitbreiden op basis van sjablonen.
- **T-vormige gegevensarchitectuur**: Hoofdtabel + bijbehorende bedrijfstabellen; voor een nieuw bedrijfstype hoeft u alleen een bijbehorende tabel toe te voegen.

---

## 3. Ontwerpprincipes (Principles)

- **Lage cognitieve belasting**
- **Business gaat voor technologie**
- **Evolueerbaar, niet eenmalig voltooid**
- **Configuratie eerst, code als achtervang**
- **Samenwerking tussen mens en AI, geen vervanging van de mens door AI**
- **Alle ontwerpen moeten door gebruikers kunnen worden gekopieerd**

---

## 4. Overzicht van de oplossing (Solution Overview)

### Korte introductie

Een universeel ticket-center gebouwd op het NocoBase low-code platform, dat het volgende realiseert:

- **Centraal toegangspunt**: Toegang via meerdere bronnen, gestandaardiseerde verwerking.
- **Intelligente distributie**: AI-ondersteunde classificatie, toewijzing op basis van load balancing.
- **Polymorfe business**: Kernhoofdtabel + bijbehorende bedrijfstabellen, flexibel uitbreidbaar.
- **Gesloten feedbackloop**: SLA-monitoring, klantbeoordelingen, opvolging van negatieve feedback.

### Ticket-verwerkingsproces

```
Invoer uit meerdere bronnen → Voorverwerking/AI-analyse → Intelligente toewijzing → Handmatige uitvoering → Feedbackloop
    ↓            ↓              ↓           ↓           ↓
 Ontdubbeling  Intentieherkenning  Skill-matching  Statusverloop  Tevredenheidsscore
               Sentimentanalyse    Load balancing  SLA-monitoring Opvolging negatieve feedback
               Autom. antwoord     Wachtrijbeheer  Communicatie   Gegevensarchivering
```

### Lijst met kernmodules

| Module | Toelichting |
|------|------|
| Ticket-intake | Openbare formulieren, klantportaal, handmatige invoer door agent, API/Webhook, e-mailparsing |
| Ticketbeheer | Ticket CRUD, statusverloop, toewijzing/overdracht, communicatie via opmerkingen, bewerkingslogboeken |
| Bedrijfsuitbreiding | Bijbehorende tabellen voor apparatuurherstel, IT-ondersteuning, klachten van klanten, enz. |
| SLA-beheer | SLA-configuratie, time-out waarschuwingen, time-out escalatie |
| Klantbeheer | Klantenhoofdtabel, contactbeheer, klantportaal |
| Beoordelingssysteem | Meerdimensionale scores, sneltoets-labels, NPS, waarschuwingen bij negatieve feedback |
| AI-ondersteuning | Intentieclassificatie, sentimentanalyse, kennisaanbeveling, hulp bij antwoorden, tekstverfijning |

### Weergave van de kerninterface

![ticketing-imgs-2026-01-01-00-46-12](https://static-docs.nocobase.com/ticketing-imgs-2026-01-01-00-46-12.jpg)

---

## 5. AI-medewerker (AI Employee)

### Typen AI-medewerkers en scenario's

- **Klantenservice-assistent**, **Verkoopassistent**, **Gegevensanalist**, **Auditor**
- Ondersteunt de mens, vervangt deze niet.

### Kwantificering van de waarde van AI-medewerkers

In deze oplossing kan de AI-medewerker:

| Waardedimensie | Specifieke effecten |
|----------|----------|
| Efficiëntie verhogen | Automatische classificatie vermindert handmatige sorteertijd met 50%+; kennisaanbevelingen versnellen probleemoplossing |
| Kosten verlagen | Automatische antwoorden op eenvoudige vragen verminderen de werklast van de klantenservice |
| Menselijke medewerkers versterken | Emotiewaarschuwingen helpen de klantenservice zich voor te bereiden; tekstverfijning verbetert de communicatiekwaliteit |
| Klanttevredenheid verhogen | Snellere respons, nauwkeurigere toewijzing, professionelere antwoorden |

---

## 6. Hoogtepunten (Highlights)

### 1. T-vormige gegevensarchitectuur

- Alle tickets delen een hoofdtabel met een uniforme verwerkingslogica.
- Bijbehorende bedrijfstabellen bevatten specifieke velden, wat flexibele uitbreiding mogelijk maakt.
- Voor een nieuw bedrijfstype hoeft u alleen een bijbehorende tabel toe te voegen, zonder het hoofdproces te beïnvloeden.

### 2. Volledige ticket-levenscyclus

- Nieuw → Toegewezen → In behandeling → Gepauzeerd → Opgelost → Gesloten.
- Ondersteunt complexe scenario's zoals overdracht, retournering en heropening.
- SLA-tijdmeting is nauwkeurig tot op de pauze-status.

### 3. Uniforme integratie van meerdere kanalen

- Openbare formulieren, klantportaal, API, e-mail, handmatige invoer door agent.
- Idempotentiecontrole voorkomt dubbele aanmaak.

### 4. AI-native integratie

- Geen simpele "AI-knop", maar geïntegreerd in elke stap.
- Intentieherkenning, sentimentanalyse, kennisaanbeveling, tekstverfijning.

---

## 7. Installatie & Implementatie

### Hoe te installeren en te gebruiken

Gebruik migratiebeheer om verschillende deelapplicaties te migreren en te integreren in andere applicaties.

---

## 8. Roadmap (Continu bijgewerkt)

- **Systeeminbedding**: Ondersteuning voor het inbedden van de ticketmodule in verschillende bedrijfssystemen zoals ERP, CRM, enz.
- **Ticket-interconnectie**: Ticket-integratie en status-callbacks tussen upstream- en downstream-systemen voor samenwerking over systemen heen.
- **AI-automatisering**: AI-medewerkers ingebed in workflows, met ondersteuning voor automatische uitvoering op de achtergrond voor onbeheerde verwerking.
- **Multi-tenancy ondersteuning**: Horizontale schaling via multi-space/multi-app architectuur, waardoor distributie naar verschillende serviceteams voor onafhankelijk beheer mogelijk is.
- **Kennisbank RAG**: Automatische vectorisatie van alle gegevens (tickets, klanten, producten, enz.) voor intelligente zoekopdrachten en kennisaanbevelingen.
- **Meertalige ondersteuning**: Interface en inhoud ondersteunen het schakelen tussen meerdere talen om te voldoen aan de behoeften van multinationale/regionale teamsamenwerking.