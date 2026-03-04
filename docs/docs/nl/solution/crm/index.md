:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/solution/crm/index) voor nauwkeurige informatie.
:::

# NocoBase CRM 2.0-oplossing

> Modulair verkoopbeheersysteem gebaseerd op het NocoBase low-code platform, met AI-medewerkers die ondersteunen bij de besluitvorming.

## 1. Achtergrond

### Uitdagingen voor verkoopteams

Verkoopteams van bedrijven komen in hun dagelijkse werkzaamheden vaak de volgende problemen tegen: de kwaliteit van leads is wisselend en lastig snel te filteren, opvolging van verkoopkansen wordt gemakkelijk vergeten, klantgegevens staan verspreid in e-mails en verschillende systemen, verkoopprognoses zijn volledig gebaseerd op ervaring en goedkeuringsprocessen voor offertes zijn niet gestandaardiseerd.

**Typische scenario's:** Snelle evaluatie en toewijzing van leads, monitoring van de gezondheid van verkoopkansen, waarschuwingen voor klantverloop, goedkeuring van offertes op meerdere niveaus, koppeling van e-mail aan klanten/verkoopkansen.

### Doelgebruikers

B2B-verkoopteams, projectmatige verkoopteams en teams voor buitenlandse handel in kleine tot middelgrote en middelgrote tot grote ondernemingen. Deze bedrijven stappen over van beheer via Excel/e-mail naar gesystematiseerd beheer en stellen hoge eisen aan de beveiliging van klantgegevens.

### Tekortkomingen van bestaande oplossingen

- **Hoge kosten**: Salesforce/HubSpot rekenen kosten per gebruiker, wat voor het MKB moeilijk op te brengen is.
- **Overdaad aan functies**: Grote CRM-systemen hebben talloze functies en een hoge leercurve; minder dan 20% van de functies wordt daadwerkelijk gebruikt.
- **Moeilijk aan te passen**: SaaS-systemen zijn lastig af te stemmen op de eigen bedrijfsprocessen; zelfs het wijzigen van een veld vereist een formeel proces.
- **Gegevensbeveiliging**: Klantgegevens worden opgeslagen op servers van derden, wat risico's voor naleving en veiligheid met zich meebrengt.
- **Hoge kosten voor eigen ontwikkeling**: Traditionele eigen ontwikkeling heeft een lange cyclus en hoge onderhoudskosten, waardoor het moeilijk is om snel aan te passen bij veranderingen in de bedrijfsvoering.

---

## 2. Onderscheidende voordelen

**Belangrijkste producten op de markt:** Salesforce, HubSpot, Zoho CRM, Fxiaoke, Odoo CRM, SuiteCRM, etc.

**Voordelen op platformniveau:**

- **Configuratie eerst**: Datamodellen, paginalay-outs en bedrijfsprocessen kunnen allemaal via de UI worden geconfigureerd zonder code te schrijven.
- **Snel bouwen met low-code**: Sneller dan eigen ontwikkeling en flexibeler dan SaaS.
- **Modulair afbreekbaar**: Elk onderdeel is onafhankelijk ontworpen en kan naar behoefte worden aangepast; de minimaal levensvatbare versie vereist slechts twee modules: Klanten + Verkoopkansen.

**Wat traditionele CRM's niet kunnen of waar de kosten extreem hoog zijn:**

- **Datasoevereiniteit**: Zelf-gehoste implementatie waarbij klantgegevens op uw eigen servers worden opgeslagen om aan de nalevingsvereisten te voldoen.
- **Native integratie van AI-medewerkers**: AI-medewerkers zijn diep ingebed in de bedrijfspagina's en herkennen automatisch de context van de gegevens; het is meer dan alleen een "AI-knop".
- **Alle ontwerpen zijn kopieerbaar**: Gebruikers kunnen de oplossing zelfstandig uitbreiden op basis van sjablonen, zonder afhankelijk te zijn van de leverancier.

---

## 3. Ontwerpprincipes

- **Lage cognitieve kosten**: De interface is eenvoudig en de kernfuncties zijn in één oogopslag duidelijk.
- **Bedrijfsvoering gaat voor techniek**: Focus op verkoopscenario's in plaats van technisch vertoon.
- **Evolueerbaar**: Ondersteunt gefaseerde lancering en stapsgewijze verbetering.
- **Configuratie eerst**: Schrijf geen code voor zaken die geconfigureerd kunnen worden.
- **Samenwerking tussen mens en AI**: AI-medewerkers ondersteunen de besluitvorming in plaats van het oordeel van het verkooppersoneel te vervangen.

---

## 4. Overzicht van de oplossing

### Kerncapaciteiten

- **Beheer van het volledige proces**: Lead → Verkoopkans → Offerte → Order → Customer Success.
- **Aanpasbare modules**: De volledige versie bevat 7 modules, de minimaal levensvatbare versie heeft slechts 2 kernmodules nodig.
- **Ondersteuning voor meerdere valuta**: Automatische omrekening tussen CNY/USD/EUR/GBP/JPY.
- **AI-ondersteuning**: Leadscoring, voorspelling van winstkansen, suggesties voor de volgende actie.

### Kernmodules

| Module | Vereist | Toelichting | AI-ondersteuning |
|------|:----:|------|--------|
| Klantbeheer | ✅ | Klantdossiers, contactpersonen, klantniveaus | Gezondheidsevaluatie, waarschuwing voor verloop |
| Beheer van verkoopkansen | ✅ | Verkooppijplijn, fasevoortgang, activiteitsregistratie | Winstkansvoorspelling, suggesties voor volgende stap |
| Leadbeheer | - | Leadregistratie, statusverloop, conversietracking | Intelligente scoring |
| Offertebeheer | - | Meerdere valuta, versiebeheer, goedkeuringsprocessen | - |
| Orderbeheer | - | Ordergeneratie, opvolging van betalingen | - |
| Productbeheer | - | Productcatalogus, categorieën, staffelprijzen | - |
| E-mailintegratie | - | E-mail verzenden/ontvangen, CRM-koppeling | Sentimentanalyse, samenvatting genereren |

### Aanpassing van de oplossing

- **Volledige versie** (alle 7 modules): Voor B2B-verkoopteams met een volledig proces.
- **Standaardversie** (Klanten + Verkoopkansen + Offertes + Orders + Producten): Voor verkoopbeheer in het MKB.
- **Light-versie** (Klanten + Verkoopkansen): Voor het eenvoudig volgen van klanten en verkoopkansen.
- **Versie voor buitenlandse handel** (Klanten + Verkoopkansen + Offertes + E-mail): Voor bedrijven in de buitenlandse handel.

---

## 5. AI-medewerkers

Het CRM-systeem is vooraf uitgerust met 5 AI-medewerkers die diep in de bedrijfspagina's zijn ingebed. In tegenstelling tot gewone AI-chattools herkennen zij automatisch de gegevens die u momenteel bekijkt — of het nu gaat om een lijst met leads, details van een verkoopkans of e-mailrecords — zonder dat u handmatig hoeft te kopiëren en plakken.

**Gebruikswijze**: Klik op de AI-zwevende bol rechtsonder op de pagina, of klik direct op het AI-icoon naast een blok om de betreffende medewerker op te roepen. U kunt ook voor elke medewerker veelvoorkomende taken vooraf instellen, zodat u deze de volgende keer met één klik kunt activeren.

| Medewerker | Verantwoordelijkheid | Typisch gebruik in CRM |
|------|------|-----------------|
| **Viz** | Inzichtanalist | Analyse van leadkanalen, verkooptrends, gezondheid van de pijplijn |
| **Ellis** | E-mailexpert | Opstellen van opvolgingsmails, genereren van communicatiesamenvattingen |
| **Lexi** | Vertaalassistent | Meertalige e-mails, communicatie met buitenlandse klanten |
| **Dara** | Visualisatie-expert | Configuratie van rapporten en grafieken, opbouw van dashboards |
| **Orin** | Taakplanner | Dagelijkse prioriteiten, suggesties voor de volgende actie |

### Bedrijfswaarde van AI-medewerkers

| Waardedimensie | Concreet effect |
|----------|----------|
| Efficiëntie verhogen | Leadscoring gebeurt automatisch, wat handmatige filtering bespaart; opvolgingsmails worden met één klik opgesteld. |
| Medewerkers versterken | Analyse van verkoopgegevens is altijd binnen handbereik, zonder te hoeven wachten op rapporten van het datateam. |
| Kwaliteit van communicatie | Professionele e-mails + AI-verfijning, probleemloze meertalige communicatie voor teams in de buitenlandse handel. |
| Besluitvormingsondersteuning | Realtime beoordeling van winstkansen en suggesties voor de volgende stap verminderen het verlies van verkoopkansen door gemiste opvolging. |

---

## 6. Hoogtepunten

**Modulair afbreekbaar** — Elk onderdeel is onafhankelijk ontworpen en kan afzonderlijk worden in- of uitgeschakeld. De minimale configuratie vereist slechts de twee kernmodules Klanten + Verkoopkansen; gebruik wat u nodig heeft, niets is verplicht.

**Volledige verkoopcyclus** — Lead → Verkoopkans → Offerte → Order → Betaling → Customer Success. Gegevens zijn over de hele keten verbonden, waardoor u niet tussen meerdere systemen hoeft te schakelen.

**Native integratie van AI-medewerkers** — Geen simpele "AI-knop", maar 5 AI-medewerkers die in elke bedrijfspagina zijn geïntegreerd, automatisch de huidige gegevenscontext verkrijgen en met één klik analyses en suggesties activeren.

**Diepe e-mailintegratie** — E-mails worden automatisch gekoppeld aan klanten, contactpersonen en verkoopkansen. Ondersteunt Gmail en Outlook, met meerdere Engelse e-mailsjablonen voor veelvoorkomende verkoopscenario's.

**Ondersteuning voor buitenlandse handel met meerdere valuta** — Ondersteunt CNY/USD/EUR/GBP/JPY, met configureerbare wisselkoersomrekening, geschikt voor buitenlandse handel en internationale verkoopteams.

---

## 7. Installatie en gebruik

Gebruik de migratiebeheerfunctie van NocoBase om het CRM-toepassingspakket met één klik naar de doelomgeving te migreren.

**Direct klaar voor gebruik:** Vooraf ingestelde collecties, workflows, dashboards en weergaven voor meerdere rollen (verkoopmanager/verkoopvertegenwoordiger/directie). 37 e-mailsjablonen dekken veelvoorkomende verkoopscenario's.

---

## 8. Toekomstige planning

- **Automatisering van verkoopkansen**: Meldingen bij faseovergangen en automatische waarschuwingen bij stagnerende verkoopkansen om handmatige controle te verminderen.
- **Goedkeuringsprocessen**: Workflow voor goedkeuring van offertes op meerdere niveaus, met ondersteuning voor mobiele goedkeuring.
- **AI-automatisering**: AI-medewerkers ingebed in workflows, met ondersteuning voor automatische uitvoering op de achtergrond voor onbeheerde leadscoring en analyse van verkoopkansen.
- **Mobiele aanpassing**: Mobielvriendelijke interface om klanten altijd en overal op te volgen.
- **Ondersteuning voor multi-tenancy**: Horizontale uitbreiding naar meerdere ruimtes/applicaties voor onafhankelijk beheer door verschillende verkoopteams.

---

*Documentversie: v2.0 | Bijgewerkt op: 06-02-2026*