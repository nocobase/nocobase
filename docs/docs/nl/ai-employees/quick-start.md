:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/ai-employees/quick-start) voor nauwkeurige informatie.
:::

# Snel aan de slag

Laten we in 5 minuten de minimale configuratie voor een AI-medewerker voltooien.

## Plugin installeren

AI-medewerkers zijn ingebouwd in NocoBase (`@nocobase/plugin-ai`), dus er is geen afzonderlijke installatie vereist.

## Modellen configureren

U kunt LLM-services configureren via een van de volgende ingangen:

1. Beheerdersingang: `Systeeminstellingen -> AI-medewerkers -> LLM-service`.
2. Snelkoppeling in de frontend: Gebruik in het AI-chatvenster de `Model Switcher` om een model te kiezen en klik vervolgens op de snelkoppeling "LLM-service toevoegen" om direct naar de instellingen te gaan.

![quick-start-model-switcher-add-llm-service.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/quick-start-model-switcher-add-llm-service.png)

Meestal moet u het volgende bevestigen:
1. Selecteer de Provider.
2. Vul de API-sleutel in.
3. Configureer `Ingeschakelde modellen`; u kunt standaard "Recommend" gebruiken.

## Ingebouwde medewerkers inschakelen

Ingebouwde AI-medewerkers zijn standaard volledig ingeschakeld en hoeven meestal niet handmatig één voor één te worden geactiveerd.

Als u de beschikbaarheid wilt aanpassen (een specifieke medewerker in- of uitschakelen), kunt u de schakelaar `Ingeschakeld` wijzigen op de lijstpagina `Systeeminstellingen -> AI-medewerkers`.

![ai-employee-list-enable-switch.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-list-enable-switch.png)

## Begin de samenwerking

Beweeg op de applicatiepagina de muis over de snelkoppeling rechtsonder en kies een AI-medewerker.
![ai-employees-entry-bottom-right.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employees-entry-bottom-right.png)

Klik om het AI-chatvenster te openen:

![chat-footer-employee-switcher-and-model-switcher.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/chat-footer-employee-switcher-and-model-switcher.png)

U kunt ook:  
* Blokken toevoegen
* Bijlagen toevoegen
* Zoeken op internet inschakelen
* Wisselen van AI-medewerker
* Modellen selecteren

Ze kunnen ook automatisch de paginastructuur als context verkrijgen. Bijvoorbeeld: Dex in een formulierblok leest automatisch de veldstructuur van het formulier en roept de juiste vaardigheden aan om acties op de pagina uit te voeren.

## Snelkoppelingstaken

U kunt voor elke AI-medewerker veelvoorkomende taken vooraf instellen op de huidige locatie. Zo kunt u met één klik aan de slag, wat snel en handig is.

<video controls class="rounded shadow"><source src="https://static-docs.nocobase.com/z-2025-11-02-12.19.33-2025-11-02-12-19-49.mp4" type="video/mp4"></video>

## Overzicht van ingebouwde medewerkers

NocoBase biedt verschillende vooraf ingestelde AI-medewerkers voor specifieke scenario's.

U hoeft alleen het volgende te doen:

1. Configureer de LLM-services.
2. Pas de status van de medewerkers aan indien nodig (standaard ingeschakeld).
3. Selecteer een model in de chat en begin de samenwerking.

| Naam medewerker | Rol | Kernvaardigheden |
| :--- | :--- | :--- |
| **Cole** | NocoBase-assistent | Vraag en antwoord over productgebruik, documentatie doorzoeken |
| **Ellis** | E-mailexpert | E-mails schrijven, samenvattingen genereren, suggesties voor antwoorden |
| **Dex** | Gegevensorganisator | Veldvertaling, opmaak, informatie-extractie |
| **Viz** | Inzichtanalist | Gegevensinzicht, trendanalyse, interpretatie van kernindicatoren |
| **Lexi** | Vertaalassistent | Meertalige vertaling, communicatie-ondersteuning |
| **Vera** | Onderzoeksanalist | Zoeken op internet, informatie-aggregatie, diepgaand onderzoek |
| **Dara** | Expert in gegevensvisualisatie | Grafiekconfiguratie, genereren van visuele rapporten |
| **Orin** | Expert in gegevensmodellering | Ondersteuning bij het ontwerpen van collectiestructuren, veldsuggesties |
| **Nathan** | Frontend-engineer | Ondersteuning bij het schrijven van frontend-codefragmenten, stijlaanpassingen |

**Opmerkingen**

Sommige ingebouwde AI-medewerkers verschijnen niet in de lijst rechtsonder, omdat ze specifieke werkscenario's hebben:

- Orin: pagina's voor gegevensmodellering.
- Dara: blokken voor grafiekconfiguratie.
- Nathan: JS-blokken en vergelijkbare code-editors.