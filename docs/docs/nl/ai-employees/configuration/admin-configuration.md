:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# AI-medewerker · Beheerdersconfiguratiegids

> Dit document helpt u snel te begrijpen hoe u AI-medewerkers configureert en beheert. We begeleiden u stap voor stap door het hele proces, van modeldiensten tot taaktoewijzing.

## I. Voordat u begint

### 1. Systeemvereisten

Voordat u configureert, moet u ervoor zorgen dat uw omgeving voldoet aan de volgende voorwaarden:

*   **NocoBase 2.0 of hoger** is geïnstalleerd
*   De **AI-medewerker plugin** is ingeschakeld
*   Minstens één beschikbare **groottaalmodeldienst** (bijv. OpenAI, Claude, DeepSeek, GLM, enz.)

### 2. Het tweelaagse ontwerp van AI-medewerkers begrijpen

AI-medewerkers zijn verdeeld in twee lagen: **"Roldefinitie"** en **"Taakaanpassing"**.

| Laag | Beschrijving | Kenmerken | Functie |
|---|---|---|---|
| **Roldefinitie** | De basispersoonlijkheid en kernvaardigheden van de medewerker | Stabiel en onveranderlijk, als een "cv" | Zorgt voor rolconsistentie |
| **Taakaanpassing** | Configuratie voor verschillende bedrijfsscenario's | Flexibel en aanpasbaar | Past zich aan specifieke taken aan |

**Eenvoudig gezegd:**

> "Roldefinitie" bepaalt wie deze medewerker is,
> "Taakaanpassing" bepaalt wat deze medewerker op dit moment doet.

De voordelen van dit ontwerp zijn:

*   De rol blijft constant, maar kan verschillende scenario's aan
*   Het upgraden of vervangen van taken heeft geen invloed op de medewerker zelf
*   Achtergrond en taken zijn onafhankelijk, wat het onderhoud vergemakkelijkt

## II. Configuratieproces (in 5 stappen)

### Stap 1: Configureer de modeldienst

De modeldienst is als het brein van een AI-medewerker en moet eerst worden ingesteld.

> 💡 Voor gedetailleerde configuratie-instructies verwijzen wij u naar: [LLM-dienst configureren](/ai-employees/quick-start/llm-service)

**Pad:**
`Systeeminstellingen → AI-medewerker → Modeldienst`

![Ga naar de configuratiepagina](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

Klik op **Toevoegen** en vul de volgende informatie in:

| Item | Beschrijving | Opmerkingen |
|---|---|---|
| Interfacetype | Bijv. OpenAI, Claude, enz. | Compatibel met diensten die dezelfde specificatie gebruiken |
| API-sleutel | De sleutel die door de dienstverlener wordt geleverd | Vertrouwelijk houden en regelmatig wijzigen |
| Dienstadres | API Endpoint | Moet worden aangepast bij gebruik van een proxy |
| Modelnaam | Specifieke modelnaam (bijv. gpt-4, claude-opus) | Beïnvloedt mogelijkheden en kosten |

![Een groottaalmodel-dienst aanmaken](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

Na configuratie, gelieve de **verbinding te testen**.
Als dit mislukt, controleer dan uw netwerk, API-sleutel of modelnaam.

![Verbinding testen](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)

### Stap 2: Maak een AI-medewerker aan

> 💡 Voor gedetailleerde instructies verwijzen wij u naar: [Een AI-medewerker aanmaken](/ai-employees/quick-start/ai-employees)

Pad: `AI-medewerkerbeheer → Medewerker aanmaken`

Vul de basisinformatie in:

| Veld | Verplicht | Voorbeeld |
|---|---|---|
| Naam | ✓ | viz, dex, cole |
| Bijnaam | ✓ | Viz, Dex, Cole |
| Ingeschakelde status | ✓ | Aan |
| Biografie | - | "Data-analyse expert" |
| Hoofdprompt | ✓ | Zie Prompt Engineering Gids |
| Welkomstbericht | - | "Hallo, ik ben Viz…" |

![Basisconfiguratie](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-21-09.png)

Koppel vervolgens de zojuist geconfigureerde **modeldienst**.

![Groottaalmodel-dienst koppelen](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-22-27.png)

**Suggesties voor het schrijven van prompts:**

*   Beschrijf duidelijk de rol, toon en verantwoordelijkheden van de medewerker
*   Gebruik woorden als "moet" en "nooit" om regels te benadrukken
*   Voeg waar mogelijk voorbeelden toe om abstracte beschrijvingen te vermijden
*   Houd het tussen de 500 en 1000 tekens

> Hoe duidelijker de prompt, hoe stabieler de prestaties van de AI.
> U kunt de [Prompt Engineering Gids](./prompt-engineering-guide.md) raadplegen.

### Stap 3: Configureer vaardigheden

Vaardigheden bepalen wat een medewerker "kan doen".

> 💡 Voor gedetailleerde instructies verwijzen wij u naar: [Vaardigheden](/ai-employees/advanced/skill)

| Type | Mogelijkheidsbereik | Voorbeeld | Risiconiveau |
|---|---|---|---|
| Frontend | Pagina-interactie | Blokgegevens lezen, formulieren invullen | Laag |
| Datamodel | Gegevensquery en -analyse | Aggregatiestatistieken | Gemiddeld |
| Workflow | Bedrijfsprocessen uitvoeren | Aangepaste tools | Afhankelijk van de workflow |
| Overig | Externe extensies | Webzoekopdracht, bestandsbewerkingen | Varieert |

**Configuratiesuggesties:**

*   3-5 vaardigheden per medewerker is het meest geschikt
*   Het wordt afgeraden om alle vaardigheden te selecteren, dit kan tot verwarring leiden
*   Schakel 'Auto usage' uit vóór belangrijke bewerkingen

![Vaardigheden configureren](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-26-06.png)

### Stap 4: Configureer de kennisbank (optioneel)

Als uw AI-medewerker grote hoeveelheden materiaal moet onthouden of raadplegen, zoals producthandleidingen, FAQ's, enz., kunt u een kennisbank configureren.

> 💡 Voor gedetailleerde instructies verwijzen wij u naar:
> - [Overzicht AI-kennisbank](/ai-employees/knowledge-base/index)
> - [Vector Database](/ai-employees/knowledge-base/vector-database)
> - [Kennisbankconfiguratie](/ai-employees/knowledge-base/knowledge-base)
> - [RAG (Retrieval-Augmented Generation)](/ai-employees/knowledge-base/rag)

Hiervoor moet de vector database plugin worden geïnstalleerd.

![Kennisbank configureren](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-32-54.png)

**Toepasselijke scenario's:**

*   De AI bedrijfskennis laten begrijpen
*   Document-Q&A en -retrieval ondersteunen
*   Domeinspecifieke assistenten trainen

### Stap 5: Controleer het resultaat

Na voltooiing ziet u de avatar van de nieuwe medewerker rechtsonder op de pagina.

![Configuratie verifiëren](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-36-54.png)

Controleer elk item:

*   ✅ Wordt het pictogram correct weergegeven?
*   ✅ Kan er een basisgesprek worden gevoerd?
*   ✅ Kunnen vaardigheden correct worden aangeroepen?

Als alles is goedgekeurd, is de configuratie succesvol 🎉

## III. Taakconfiguratie: De AI aan het werk zetten

Wat we tot nu toe hebben gedaan, is "een medewerker aanmaken".
De volgende stap is om ze "aan het werk te zetten".

AI-taken definiëren het gedrag van de medewerker op een specifieke pagina of in een specifiek blok.

> 💡 Voor gedetailleerde instructies verwijzen wij u naar: [Taken](/ai-employees/advanced/task)

### 1. Taken op paginaniveau

Van toepassing op het hele paginabereik, zoals "Analyseer de gegevens op deze pagina".

**Configuratie-ingang:**
`Pagina-instellingen → AI-medewerker → Taak toevoegen`

| Veld | Beschrijving | Voorbeeld |
|---|---|---|
| Titel | Taaknaam | Analyse van faseconversie |
| Context | De context van de huidige pagina | Leads-lijstpagina |
| Standaardbericht | Vooraf ingesteld gespreksstarter | "Analyseer de trends van deze maand" |
| Standaardblok | Automatisch koppelen aan een collectie | leads tabel |
| Vaardigheden | Beschikbare tools | Gegevens opvragen, grafieken genereren |

![Configuratie van taken op paginaniveau](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-40-34.png)

**Ondersteuning voor meerdere taken:**
Eén AI-medewerker kan worden geconfigureerd met meerdere taken, die als opties aan de gebruiker worden gepresenteerd:

![Ondersteuning voor meerdere taken](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

Suggesties:

*   Eén taak moet zich richten op één doel
*   De naam moet duidelijk en gemakkelijk te begrijpen zijn
*   Houd het aantal taken binnen 5-7

### 2. Taken op blokniveau

Geschikt voor het uitvoeren van bewerkingen op een specifiek blok, zoals "Vertaal het huidige formulier".

**Configuratiemethode:**

1.  Open de blokactieconfiguratie
2.  Voeg "AI-medewerker" toe

![AI-medewerkerknop toevoegen](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-51-06.png)

3.  Koppel de doelmedewerker

![AI-medewerker selecteren](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-52-26.png)

![Configuratie van taken op blokniveau](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-53-35.png)

| Vergelijking | Paginaniveau | Blokniveau |
|---|---|---|
| Gegevensbereik | Hele pagina | Huidig blok |
| Granulariteit | Globale analyse | Gedetailleerde verwerking |
| Typisch gebruik | Trendanalyse | Formuliervertaling, veldextractie |

## IV. Best practices

### 1. Configuratie-suggesties

| Item | Suggestie | Reden |
|---|---|---|
| Aantal vaardigheden | 3-5 | Hoge nauwkeurigheid, snelle respons |
| Auto usage | Voorzichtig inschakelen | Voorkomt onbedoelde handelingen |
| Promptlengte | 500-1000 tekens | Balanceert snelheid en kwaliteit |
| Taakdoel | Enkelvoudig en duidelijk | Voorkomt verwarring bij de AI |
| Workflow | Gebruiken na het inkapselen van complexe taken | Hogere slagingskans |

### 2. Praktische suggesties

**Begin klein, optimaliseer geleidelijk:**

1.  Maak eerst basismedewerkers aan (bijv. Viz, Dex)
2.  Schakel 1-2 kernvaardigheden in voor tests
3.  Controleer of taken normaal kunnen worden uitgevoerd
4.  Breid vervolgens geleidelijk uit met meer vaardigheden en taken

**Continu optimalisatieproces:**

1.  Zorg dat de initiële versie werkt
2.  Verzamel gebruikersfeedback
3.  Optimaliseer prompts en taakconfiguraties
4.  Test en verbeter cyclisch

## V. Veelgestelde vragen

### 1. Configuratie fase

**V: Wat als opslaan mislukt?**
A: Controleer of alle verplichte velden zijn ingevuld, met name de modeldienst en de prompt.

**V: Welk model moet ik kiezen?**

*   Code-gerelateerd → Claude, GPT-4
*   Analyse-gerelateerd → Claude, DeepSeek
*   Kostenbewust → Qwen, GLM
*   Lange tekst → Gemini, Claude

### 2. Gebruiksfase

**V: De AI reageert te traag?**

*   Verminder het aantal vaardigheden
*   Optimaliseer de prompt
*   Controleer de latentie van de modeldienst
*   Overweeg een ander model

**V: De taakuitvoering is onnauwkeurig?**

*   De prompt is niet duidelijk genoeg
*   Te veel vaardigheden leiden tot verwarring
*   Splits taken op, voeg voorbeelden toe

**V: Wanneer moet 'Auto usage' worden ingeschakeld?**

*   Het kan worden ingeschakeld voor query-achtige taken
*   Het wordt aanbevolen om het uit te schakelen voor taken die gegevens wijzigen

**V: Hoe laat ik de AI een specifiek formulier verwerken?**

A: Voor configuraties op paginaniveau moet u het blok handmatig selecteren.

![Blok handmatig selecteren](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-02-22.png)

Voor taakconfiguraties op blokniveau wordt de gegevenscontext automatisch gekoppeld.

## VI. Verder lezen

Om uw AI-medewerkers krachtiger te maken, kunt u de volgende documenten lezen:

**Configuratiegerelateerd:**

*   [Prompt Engineering Gids](./prompt-engineering-guide.md) - Technieken en best practices voor het schrijven van hoogwaardige prompts
*   [LLM-dienst configureren](/ai-employees/quick-start/llm-service) - Gedetailleerde configuratie-instructies voor groottaalmodel-diensten
*   [Een AI-medewerker aanmaken](/ai-employees/quick-start/ai-employees) - Het aanmaken en de basisconfiguratie van AI-medewerkers
*   [Samenwerken met AI-medewerkers](/ai-employees/quick-start/collaborate) - Hoe u effectieve gesprekken voert met AI-medewerkers

**Geavanceerde functies:**

*   [Vaardigheden](/ai-employees/advanced/skill) - Diepgaand inzicht in de configuratie en het gebruik van verschillende vaardigheden
*   [Taken](/ai-employees/advanced/task) - Geavanceerde technieken voor taakconfiguratie
*   [Blok selecteren](/ai-employees/advanced/pick-block) - Hoe u gegevensblokken voor AI-medewerkers specificeert
*   [Gegevensbron](/ai-employees/advanced/datasource) - Configuratie en beheer van gegevensbronnen
*   [Webzoekopdracht](/ai-employees/advanced/web-search) - De webzoekfunctie voor AI-medewerkers configureren

**Kennisbank & RAG:**

*   [Overzicht AI-kennisbank](/ai-employees/knowledge-base/index) - Introductie van de kennisbankfunctie
*   [Vector Database](/ai-employees/knowledge-base/vector-database) - Configuratie van de vector database
*   [Kennisbank](/ai-employees/knowledge-base/knowledge-base) - Hoe u een kennisbank aanmaakt en beheert
*   [RAG (Retrieval-Augmented Generation)](/ai-employees/knowledge-base/rag) - Toepassing van RAG-technologie

**Workflow-integratie:**

*   [LLM-node - Tekstchat](/ai-employees/workflow/nodes/llm/chat) - Tekstchat gebruiken in workflows
*   [LLM-node - Multimodale chat](/ai-employees/workflow/nodes/llm/multimodal-chat) - Multimodale invoer zoals afbeeldingen en bestanden verwerken
*   [LLM-node - Gestructureerde uitvoer](/ai-employees/workflow/nodes/llm/structured-output) - Gestructureerde AI-antwoorden verkrijgen

## Conclusie

Het belangrijkste bij het configureren van AI-medewerkers is: **laat het eerst werken, optimaliseer daarna**.
Zorg er eerst voor dat uw eerste medewerker succesvol aan de slag gaat, en breid vervolgens geleidelijk uit en verfijn.

U kunt problemen in de volgende volgorde oplossen:

1.  Is de modeldienst verbonden?
2.  Is het aantal vaardigheden te groot?
3.  Is de prompt duidelijk?
4.  Is het taakdoel goed gedefinieerd?

Zolang u stap voor stap te werk gaat, kunt u een echt efficiënt AI-team opbouwen.