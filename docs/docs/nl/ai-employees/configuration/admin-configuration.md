:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/ai-employees/configuration/admin-configuration) voor nauwkeurige informatie.
:::

# AI-medewerker · Beheerdersconfiguratiegids

> Dit document helpt u snel te begrijpen hoe u AI-medewerkers configureert en beheert, en begeleidt u stap voor stap door het hele proces, van modeldiensten tot taaktoewijzing.


## I. Voordat u begint

### 1. Systeemvereisten

Controleer voordat u begint met configureren of uw omgeving aan de volgende voorwaarden voldoet:

*   **NocoBase 2.0 of hoger** is geïnstalleerd
*   De **AI-medewerker plugin** is ingeschakeld
*   Minstens één beschikbare **groottaalmodeldienst** (zoals OpenAI, Claude, DeepSeek, GLM, enz.)


### 2. Het tweelaagse ontwerp van AI-medewerkers begrijpen

AI-medewerkers zijn verdeeld in twee lagen: **"Roldefinitie"** en **"Taakaanpassing"**.

| Niveau | Beschrijving | Kenmerken | Functie |
| -------- | ------------ | ---------- | ------- |
| **Roldefinitie** | De basispersoonlijkheid en kernvaardigheden van de medewerker | Stabiel en onveranderlijk, als een "cv" | Zorgt voor rolconsistentie |
| **Taakaanpassing** | Configuratie voor verschillende bedrijfsscenario's | Flexibel aanpasbaar | Afgestemd op specifieke taken |

**Eenvoudig begrepen:**

> "Roldefinitie" bepaalt wie deze medewerker is,
> "Taakaanpassing" bepaalt wat hij op dit moment moet doen.

De voordelen van dit ontwerp zijn:

*   De rol blijft ongewijzigd, maar kan verschillende scenario's aan
*   Het upgraden of vervangen van taken heeft geen invloed op de medewerker zelf
*   Achtergrond en taken zijn onafhankelijk van elkaar, wat onderhoud vergemakkelijkt


## II. Configuratieproces (in 5 stappen)

### Stap 1: Configureer de modeldienst

De modeldienst fungeert als het brein van de AI-medewerker en moet eerst worden ingesteld.

> 💡 Raadpleeg voor gedetailleerde configuratie-instructies: [LLM-dienst configureren](/ai-employees/features/llm-service)

**Pad:**
`Systeeminstellingen → AI-medewerker → LLM service`

![Ga naar de configuratiepagina](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

Klik op **Toevoegen** en vul de volgende informatie in:

| Item | Beschrijving | Opmerkingen |
| ------ | -------------------------- | --------- |
| Provider | Bijv. OpenAI, Claude, Gemini, Kimi, enz. | Compatibel met diensten volgens dezelfde specificatie |
| API-sleutel | De door de provider verstrekte sleutel | Geheimhouden en regelmatig vervangen |
| Base URL | API Endpoint (optioneel) | Aanpassen bij gebruik van een proxy |
| Enabled Models | Aanbevolen modellen / Modellen selecteren / Handmatige invoer | Bepaalt de modellen waartussen in de chat gewisseld kan worden |

![Groottaalmodel-dienst aanmaken](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

Gebruik na configuratie `Test flight` om de **verbinding te testen**.
Als dit mislukt, controleer dan het netwerk, de sleutel of de modelnaam.

![Verbinding testen](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)


### Stap 2: Maak een AI-medewerker aan

> 💡 Raadpleeg voor gedetailleerde instructies: [AI-medewerker aanmaken](/ai-employees/features/new-ai-employees)

Pad: `AI-medewerkerbeheer → Medewerker aanmaken`

Vul de basisinformatie in:

| Veld | Verplicht | Voorbeeld |
| ----- | -- | -------------- |
| Naam | ✓ | viz, dex, cole |
| Bijnaam | ✓ | Viz, Dex, Cole |
| Ingeschakelde status | ✓ | Aan |
| Introductie | - | "Data-analyse expert" |
| Belangrijkste prompt | ✓ | Zie Prompt Engineering Gids |
| Welkomstbericht | - | "Hallo, ik ben Viz…" |

![Basisconfiguratie](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-21-09.png)

Tijdens de aanmaakfase van de medewerker worden voornamelijk de rol en vaardigheden geconfigureerd. Het daadwerkelijke model kan tijdens het gesprek worden gekozen via de `Model Switcher`.

**Suggesties voor het schrijven van prompts:**

*   Wees duidelijk over de rol, toon en verantwoordelijkheden van de medewerker
*   Gebruik woorden als "moet" en "nooit" om regels te benadrukken
*   Voeg zoveel mogelijk voorbeelden toe en vermijd abstracte beschrijvingen
*   Houd de lengte tussen de 500 en 1000 tekens

> Hoe duidelijker de prompt, hoe stabieler de prestaties van de AI.
> U kunt de [Prompt Engineering Gids](./prompt-engineering-guide.md) raadplegen.


### Stap 3: Configureer vaardigheden

Vaardigheden bepalen wat de medewerker "kan doen".

> 💡 Raadpleeg voor gedetailleerde instructies: [Vaardigheden](/ai-employees/features/tool)

| Type | Mogelijkheidsbereik | Voorbeeld | Risiconiveau |
| ---- | ------- | --------- | ------ |
| Frontend | Pagina-interactie | Blokgegevens lezen, formulier invullen | Laag |
| Datamodel | Gegevensquery en -analyse | Aggregatiestatistieken | Gemiddeld |
| Workflow | Bedrijfsprocessen uitvoeren | Aangepaste tools | Afhankelijk van de workflow |
| Overig | Externe uitbreidingen | Webzoekopdracht, bestandsbewerkingen | Afhankelijk van de situatie |

**Configuratiesuggesties:**

*   3–5 vaardigheden per medewerker is optimaal
*   Het wordt afgeraden om alles te selecteren, dit leidt tot verwarring
*   Gebruik voor belangrijke handelingen de `Ask` (Vragen) machtiging in plaats van `Allow` (Toestaan)

![Vaardigheden configureren](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-26-06.png)


### Stap 4: Configureer de kennisbank (optioneel)

Als uw AI-medewerker grote hoeveelheden informatie moet onthouden of raadplegen, zoals producthandleidingen of FAQ's, kunt u een kennisbank configureren.

> 💡 Raadpleeg voor gedetailleerde instructies:
> - [Overzicht AI-kennisbank](/ai-employees/knowledge-base/index)
> - [Vector Database](/ai-employees/knowledge-base/vector-database)
> - [Kennisbankconfiguratie](/ai-employees/knowledge-base/knowledge-base)
> - [RAG (Retrieval-Augmented Generation)](/ai-employees/knowledge-base/rag)

Hiervoor moet de vector database plugin worden geïnstalleerd.

![Kennisbank configureren](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-32-54.png)

**Toepasselijke scenario's:**

*   De AI bedrijfskennis laten begrijpen
*   Ondersteuning van document-Q&A en zoekopdrachten
*   Trainen van domeinspecifieke assistenten


### Stap 5: Controleer het resultaat

Na voltooiing ziet u de avatar van de nieuwe medewerker rechtsonder op de pagina.

![Configuratie verifiëren](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-36-54.png)

Controleer de volgende punten:

*   ✅ Wordt het pictogram correct weergegeven?
*   ✅ Kan er een basisgesprek worden gevoerd?
*   ✅ Kunnen vaardigheden correct worden aangeroepen?

Als alles in orde is, is de configuratie succesvol 🎉


## III. Taakconfiguratie: De AI echt aan het werk zetten

De voorgaande stappen betroffen het "aanmaken van de medewerker",
nu moeten we ze "aan het werk zetten".

AI-taken definiëren het gedrag van de medewerker op een specifieke pagina of in een specifiek blok.

> 💡 Raadpleeg voor gedetailleerde instructies: [Taken](/ai-employees/features/task)


### 1. Taken op paginaniveau

Geschikt voor het bereik van de gehele pagina, zoals "Analyseer de gegevens op deze pagina".

**Configuratie-ingang:**
`Pagina-instellingen → AI-medewerker → Taak toevoegen`

| Veld | Beschrijving | Voorbeeld |
| ---- | -------- | --------- |
| Titel | Taaknaam | Analyse faseconversie |
| Context | Context van de huidige pagina | Leads-lijstpagina |
| Standaardbericht | Vooraf ingesteld gesprek | "Analyseer de trends van deze maand" |
| Standaardblok | Automatisch koppelen aan collectie | leads tabel |
| Vaardigheden | Beschikbare tools | Gegevens opvragen, grafieken genereren |

![Configuratie taken op paginaniveau](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-40-34.png)

**Ondersteuning voor meerdere taken:**
Eén AI-medewerker kan worden geconfigureerd met meerdere taken, die als opties aan de gebruiker worden getoond:

![Ondersteuning voor meerdere taken](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

Suggesties:

*   Focus per taak op één doel
*   Zorg voor duidelijke en begrijpelijke namen
*   Houd het aantal taken beperkt tot 5–7


### 2. Taken op blokniveau

Geschikt voor handelingen in een specifiek blok, zoals "Vertaal het huidige formulier".

**Configuratiemethode:**

1. Open de blokactieconfiguratie
2. Voeg "AI-medewerker" toe

![AI-medewerkerknop toevoegen](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-51-06.png)

3. Koppel de doelmedewerker

![AI-medewerker selecteren](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-52-26.png)

![Configuratie taken op blokniveau](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-53-35.png)

| Vergelijkingspunt | Paginaniveau | Blokniveau |
| ---- | ---- | --------- |
| Gegevensbereik | Hele pagina | Huidig blok |
| Granulariteit | Globale analyse | Detailverwerking |
| Typisch gebruik | Trendanalyse | Formuliervertaling, veldextractie |


## IV. Best practices

### 1. Configuratie-suggesties

| Item | Suggestie | Reden |
| ---------- | ----------- | -------- |
| Aantal vaardigheden | 3–5 stuks | Hoge nauwkeurigheid, snelle respons |
| Machtigingsmodus (Ask / Allow) | Wijzigen van gegevens bij voorkeur Ask | Voorkomt onbedoelde handelingen |
| Promptlengte | 500–1000 tekens | Balans tussen snelheid en kwaliteit |
| Taakdoel | Enkelvoudig en duidelijk | Voorkomt verwarring bij de AI |
| Workflow | Gebruik na inkapseling van complexe taken | Hoger succespercentage |


### 2. Praktische suggesties

**Begin klein, optimaliseer geleidelijk:**

1. Maak eerst basismedewerkers aan (zoals Viz, Dex)
2. Schakel 1–2 kernvaardigheden in om te testen
3. Bevestig dat taken normaal kunnen worden uitgevoerd
4. Breid vervolgens geleidelijk uit met meer vaardigheden en taken

**Continu optimalisatieproces:**

1. Zorg dat de eerste versie werkt
2. Verzamel feedback over het gebruik
3. Optimaliseer prompts en taakconfiguraties
4. Test en verbeter cyclisch


## V. Veelgestelde vragen

### 1. Configuratiefase

**V: Wat als opslaan mislukt?**
A: Controleer of alle verplichte velden zijn ingevuld, vooral de modeldienst en de prompt.

**V: Welk model moet ik kiezen?**

*   Code-gerelateerd → Claude, GPT-4
*   Analyse-gerelateerd → Claude, DeepSeek
*   Kostenbewust → Qwen, GLM
*   Lange tekst → Gemini, Claude


### 2. Gebruiksfase

**V: AI-antwoord is te traag?**

*   Verminder het aantal vaardigheden
*   Optimaliseer de prompt
*   Controleer de latentie van de modeldienst
*   Overweeg een ander model

**V: Taakuitvoering is onnauwkeurig?**

*   Prompt is niet duidelijk genoeg
*   Te veel vaardigheden leiden tot verwarring
*   Splits taken op, voeg voorbeelden toe

**V: Wanneer kies ik Ask / Allow?**

*   Bij query-taken kunt u `Allow` gebruiken
*   Bij taken die gegevens wijzigen wordt `Ask` aanbevolen

**V: Hoe laat ik de AI een specifiek formulier verwerken?**

A: Bij configuratie op paginaniveau moet u het blok handmatig selecteren.

![Blok handmatig selecteren](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-02-22.png)

Bij taakconfiguratie op blokniveau wordt de gegevenscontext automatisch gekoppeld.


## VI. Verder lezen

Lees de volgende documenten om uw AI-medewerkers krachtiger te maken:

**Configuratiegerelateerd:**

*   [Prompt Engineering Gids](./prompt-engineering-guide.md) - Technieken en best practices voor hoogwaardige prompts
*   [LLM-dienst configureren](/ai-employees/features/llm-service) - Gedetailleerde instructies voor groottaalmodel-diensten
*   [AI-medewerker aanmaken](/ai-employees/features/new-ai-employees) - Aanmaak en basisconfiguratie van AI-medewerkers
*   [Samenwerken met AI-medewerkers](/ai-employees/features/collaborate) - Hoe u effectieve gesprekken voert met AI-medewerkers

**Geavanceerde functies:**

*   [Vaardigheden](/ai-employees/features/tool) - Diepgaande informatie over configuratie en gebruik van vaardigheden
*   [Taken](/ai-employees/features/task) - Geavanceerde technieken voor taakconfiguratie
*   [Blok selecteren](/ai-employees/features/pick-block) - Hoe u gegevensblokken specificeert voor AI-medewerkers
*   Gegevensbron - Raadpleeg de configuratiedocumentatie van de betreffende plugin-gegevensbron
*   [Webzoekopdracht](/ai-employees/features/web-search) - Webzoekfunctionaliteit voor AI-medewerkers configureren

**Kennisbank & RAG:**

*   [Overzicht AI-kennisbank](/ai-employees/knowledge-base/index) - Introductie van de kennisbankfunctie
*   [Vector Database](/ai-employees/knowledge-base/vector-database) - Configuratie van de vector database
*   [Kennisbank](/ai-employees/knowledge-base/knowledge-base) - Hoe u een kennisbank aanmaakt en beheert
*   [RAG (Retrieval-Augmented Generation)](/ai-employees/knowledge-base/rag) - Toepassing van RAG-technologie

**Workflow-integratie:**

*   [LLM-node - Tekstchat](/ai-employees/workflow/nodes/llm/chat) - Tekstchat gebruiken in een workflow
*   [LLM-node - Multimodale chat](/ai-employees/workflow/nodes/llm/multimodal-chat) - Verwerken van afbeeldingen, bestanden en andere multimodale invoer
*   [LLM-node - Gestructureerde uitvoer](/ai-employees/workflow/nodes/llm/structured-output) - Verkrijgen van gestructureerde AI-antwoorden


##结语

Het belangrijkste bij het configureren van AI-medewerkers is: **eerst laten werken, dan optimaliseren**.
Zorg dat de eerste medewerker succesvol aan de slag gaat en breid daarna geleidelijk uit.

Volg deze volgorde bij het oplossen van problemen:

1. Is de modeldienst verbonden?
2. Zijn er te veel vaardigheden?
3. Is de prompt duidelijk?
4. Is het taakdoel helder?

Door stap voor stap te werk te gaan, bouwt u een echt efficiënt AI-team op.