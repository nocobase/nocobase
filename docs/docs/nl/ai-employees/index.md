---
pkg: "@nocobase/plugin-ai"
---

:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/ai-employees/index) voor nauwkeurige informatie.
:::

# Overzicht

![clipboard-image-1771905619](https://static-docs.nocobase.com/clipboard-image-1771905619.png)

AI-medewerkers (`AI Employees`) zijn intelligente agent-mogelijkheden die diep zijn geïntegreerd in de bedrijfssystemen van NocoBase.

Het zijn geen robots die "alleen maar kunnen chatten", maar "digitale collega's" die direct in de bedrijfsinterface de context begrijpen en acties uitvoeren:

- **Begrijpen de bedrijfscontext**: nemen de huidige pagina, blokken, datastructuur en geselecteerde inhoud waar.
- **Kunnen direct acties uitvoeren**: kunnen vaardigheden aanroepen om taken zoals opvragen, analyseren, invullen, configureren en genereren te voltooien.
- **Samenwerking op basis van rollen**: configureer verschillende medewerkers per functie en wissel van model tijdens het gesprek.

## 5 minuten aan de slag

Bekijk eerst [Snel aan de slag](/ai-employees/quick-start) en voltooi de minimale configuratie in de volgende volgorde:

1. Configureer ten minste één [LLM-service](/ai-employees/features/llm-service).
2. Schakel ten minste één [AI-medewerker](/ai-employees/features/enable-ai-employee) in.
3. Open een gesprek en begin met [samenwerken met AI-medewerkers](/ai-employees/features/collaborate).
4. Schakel naar behoefte [Zoeken op het web](/ai-employees/features/web-search) en [Snelkoppelingstaken](/ai-employees/features/task) in.

## Functiekaart

### A. Basisconfiguratie (Beheerder)

- [LLM-service configureren](/ai-employees/features/llm-service): Providers koppelen, beschikbare modellen configureren en beheren.
- [AI-medewerkers inschakelen](/ai-employees/features/enable-ai-employee): Ingebouwde medewerkers in- of uitschakelen, beschikbaarheidsbereik beheren.
- [Nieuwe AI-medewerker maken](/ai-employees/features/new-ai-employees): Definieer rol, karakter, welkomstbericht en vaardigheidsgrenzen.
- [Vaardigheden gebruiken](/ai-employees/features/tool): Configureer vaardigheidsmachtigingen (`Ask` / `Allow`), beheers uitvoeringsrisico's.

### B. Dagelijkse samenwerking (Zakelijke gebruikers)

- [Samenwerken met AI-medewerkers](/ai-employees/features/collaborate): Wissel van medewerker en model binnen het gesprek voor continue samenwerking.
- [Context toevoegen - Blokken](/ai-employees/features/pick-block): Stuur paginablokken als context naar de AI.
- [Snelkoppelingstaken](/ai-employees/features/task): Stel veelvoorkomende taken in op pagina's/blokken en voer ze met één klik uit.
- [Zoeken op het web](/ai-employees/features/web-search): Schakel zoekmachine-ondersteunde antwoorden in wanneer actuele informatie nodig is.

### C. Geavanceerde mogelijkheden (Uitbreidingen)

- [Ingebouwde AI-medewerkers](/ai-employees/features/built-in-employee): Begrijp de positionering en toepassingsscenario's van vooraf ingestelde medewerkers.
- [Toegangscontrole](/ai-employees/permission): Beheer toegang tot medewerkers, vaardigheden en gegevens volgens het machtigingsmodel van de organisatie.
- [AI-kennisbank](/ai-employees/knowledge-base/index): Introduceer bedrijfskennis om de stabiliteit en traceerbaarheid van antwoorden te verbeteren.
- [Workflow LLM-node](/ai-employees/workflow/nodes/llm/chat): Integreer AI-mogelijkheden in geautomatiseerde processen.

## Kernbegrippen (Aanbevolen om eerst af te stemmen)

De volgende termen zijn consistent met de begrippenlijst; het wordt aanbevolen deze uniform binnen het team te gebruiken:

- **AI-medewerker (AI Employee)**: Een uitvoerbare agent bestaande uit een karakterinstelling (Role setting) en vaardigheden (Tool / Skill).
- **LLM-service (LLM Service)**: Eenheid voor modeltoegang en configuratie van mogelijkheden, gebruikt voor het beheren van providers en modellijsten.
- **Provider (Provider)**: De modelleverancier achter de LLM-service.
- **Ingeschakelde modellen (Enabled Models)**: De verzameling modellen die de huidige LLM-service toestaat om in gesprekken te selecteren.
- **Medewerker-wisselaar (AI Employee Switcher)**: Wisselen van de huidige samenwerkende medewerker binnen een gesprek.
- **Model-wisselaar (Model Switcher)**: Wisselen van model binnen een gesprek en voorkeuren onthouden per medewerker.
- **Vaardigheid (Tool / Skill)**: Een uitvoerbare eenheid van mogelijkheden die de AI kan aanroepen.
- **Vaardigheidsmachtiging (Permission: Ask / Allow)**: Of menselijke bevestiging vereist is voordat een vaardigheid wordt aangeroepen.
- **Context (Context)**: Informatie over de zakelijke omgeving zoals pagina's, blokken en datastructuren.
- **Gesprek (Chat)**: Een continue interactie tussen de gebruiker en een AI-medewerker.
- **Zoeken op het web (Web Search)**: De mogelijkheid om antwoorden aan te vullen met realtime informatie op basis van externe zoekopdrachten.
- **Kennisbank (Knowledge Base / RAG)**: Het introduceren van bedrijfskennis via Retrieval-Augmented Generation.
- **Vectoropslag (Vector Store)**: Gevectoriseerde opslag die semantische zoekmogelijkheden biedt voor de kennisbank.

## Installatie-instructies

AI-medewerkers zijn een ingebouwde plugin van NocoBase (`@nocobase/plugin-ai`), direct klaar voor gebruik zonder aparte installatie.