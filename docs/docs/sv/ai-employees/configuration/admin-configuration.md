:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# AI-medarbetare · Administratörsguide för konfiguration

> Det här dokumentet hjälper dig att snabbt förstå hur du konfigurerar och hanterar AI-medarbetare, och guidar dig steg för steg genom hela processen, från modelltjänster till uppgiftsfördelning.

## I. Innan ni börjar

### 1. Systemkrav

Innan ni konfigurerar, se till att er miljö uppfyller följande villkor:

*   **NocoBase 2.0 eller högre** är installerat
*   **AI-medarbetare plugin** är aktiverat
*   Minst en tillgänglig **stor språkmodell-tjänst** (t.ex. OpenAI, Claude, DeepSeek, GLM, etc.)

### 2. Förstå AI-medarbetares tvåskiktsdesign

AI-medarbetare är uppdelade i två skikt: **"Rolldefinition"** och **"Uppgiftsanpassning"**.

| Skikt            | Beskrivning                           | Egenskaper                        | Funktion                  |
| :--------------- | :------------------------------------ | :-------------------------------- | :------------------------ |
| **Rolldefinition** | Medarbetarens grundläggande personlighet och kärnkompetenser | Stabil och oföränderlig, som ett "CV" | Säkerställer rollkonsistens |
| **Uppgiftsanpassning** | Konfiguration för olika affärsscenarier | Flexibel och justerbar            | Anpassar till specifika uppgifter |

**Enkelt uttryckt:**

> "Rolldefinition" bestämmer vem medarbetaren är,
> "Uppgiftsanpassning" bestämmer vad den gör just nu.

Fördelarna med denna design är:

*   Rollen förblir konstant, men kan hantera olika scenarier
*   Uppgradering eller byte av uppgifter påverkar inte medarbetaren i sig
*   Bakgrund och uppgifter är oberoende, vilket underlättar underhåll

## II. Konfigurationsprocess (i 5 steg)

### Steg 1: Konfigurera modelltjänst

Modelltjänsten är som AI-medarbetarens hjärna och måste ställas in först.

> 💡 För detaljerade konfigurationsinstruktioner, se: [Konfigurera LLM-tjänst](/ai-employees/quick-start/llm-service)

**Sökväg:**
`Systeminställningar → AI-medarbetare → Modelltjänst`

![Enter configuration page](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

Klicka på **Lägg till** och fyll i följande information:

| Objekt         | Beskrivning                               | Anmärkningar                       |
| :------------- | :---------------------------------------- | :--------------------------------- |
| Gränssnittstyp | t.ex. OpenAI, Claude, etc.                | Kompatibel med tjänster med samma specifikation |
| API-nyckel     | Nyckeln som tillhandahålls av tjänsteleverantören | Håll den konfidentiell och byt den regelbundet |
| Tjänstadress   | API-slutpunkt                             | Måste ändras vid användning av proxy |
| Modellnamn     | Specifikt modellnamn (t.ex. gpt-4, claude-opus) | Påverkar kapacitet och kostnad     |

![Create a large model service](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

Efter konfigurationen, vänligen **testa anslutningen**.
Om det misslyckas, kontrollera ert nätverk, API-nyckel eller modellnamn.

![Test connection](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)

### Steg 2: Skapa en AI-medarbetare

> 💡 För detaljerade instruktioner, se: [Skapa en AI-medarbetare](/ai-employees/quick-start/ai-employees)

Sökväg: `AI-medarbetarhantering → Skapa medarbetare`

Fyll i grundläggande information:

| Fält         | Obligatoriskt | Exempel              |
| :----------- | :------------ | :------------------- |
| Namn         | ✓             | viz, dex, cole       |
| Smeknamn     | ✓             | Viz, Dex, Cole       |
| Aktiverad status | ✓             | På                   |
| Biografi     | -             | "Dataanalysspecialist" |
| Huvudprompt  | ✓             | Se prompt-engineering-guide |
| Välkomstmeddelande | -             | "Hej, jag är Viz…"   |

![Basic information configuration](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-21-09.png)

Bind sedan den **modelltjänst** ni just konfigurerade.

![Bind large model service](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-22-27.png)

**Förslag för promptskrivning:**

*   Förklara tydligt medarbetarens roll, ton och ansvar
*   Använd ord som "måste" och "aldrig" för att betona regler
*   Inkludera exempel när det är möjligt för att undvika abstrakta beskrivningar
*   Håll det mellan 500–1000 tecken

> Ju tydligare prompten är, desto stabilare blir AI:ns prestanda.
> Ni kan hänvisa till [Prompt Engineering Guide](./prompt-engineering-guide.md).

### Steg 3: Konfigurera färdigheter

Färdigheter bestämmer vad en medarbetare "kan göra".

> 💡 För detaljerade instruktioner, se: [Färdigheter](/ai-employees/advanced/skill)

| Typ         | Kapacitetsomfång       | Exempel                 | Risknivå          |
| :---------- | :--------------------- | :---------------------- | :---------------- |
| Frontend    | Sidinteraktion         | Läs blockdata, fyll i formulär | Låg               |
| Datamodell  | Datafrågor och analys  | Aggregera statistik     | Medel             |
| Arbetsflöde | Utför affärsprocesser  | Anpassade verktyg       | Beror på arbetsflödet |
| Övrigt      | Externa utökningar     | Webbsökning, filoperationer | Varierar          |

**Konfigurationsförslag:**

*   3–5 färdigheter per medarbetare är mest lämpligt
*   Det rekommenderas inte att välja alla färdigheter, då det kan orsaka förvirring
*   Inaktivera Auto usage före viktiga operationer

![Configure skills](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-26-06.png)

### Steg 4: Konfigurera kunskapsbas (valfritt)

Om er AI-medarbetare behöver komma ihåg eller referera till en stor mängd material, såsom produktmanualer, FAQ:er etc., kan ni konfigurera en kunskapsbas.

> 💡 För detaljerade instruktioner, se:
> - [Översikt över AI-kunskapsbas](/ai-employees/knowledge-base/index)
> - [Vektordatabas](/ai-employees/knowledge-base/vector-database)
> - [Konfiguration av kunskapsbas](/ai-employees/knowledge-base/knowledge-base)
> - [RAG (Retrieval-Augmented Generation)](/ai-employees/knowledge-base/rag)

Detta kräver installation av vektordatabas-pluginet.

![Configure knowledge base](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-32-54.png)

**Tillämpliga scenarier:**

*   För att få AI:n att förstå företagets kunskap
*   För att stödja dokumentfrågor och -sökning
*   För att träna domänspecifika assistenter

### Steg 5: Verifiera effekten

Efter slutförandet kommer ni att se den nya medarbetarens avatar i det nedre högra hörnet av sidan.

![Verify configuration](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-36-54.png)

Kontrollera varje punkt:

*   ✅ Visas ikonen korrekt?
*   ✅ Kan den genomföra en grundläggande konversation?
*   ✅ Kan färdigheter anropas korrekt?

Om allt godkänns är konfigurationen lyckad 🎉

## III. Uppgiftskonfiguration: Få AI:n att arbeta

Vad vi har gjort hittills är att "skapa en medarbetare".
Nästa steg är att få dem "att arbeta".

AI-uppgifter definierar medarbetarens beteende på en specifik sida eller ett specifikt block.

> 💡 För detaljerade instruktioner, se: [Uppgifter](/ai-employees/advanced/task)

### 1. Sidnivåuppgifter

Tillämpligt för hela sidans omfång, till exempel "Analysera data på denna sida".

**Konfigurationsingång:**
`Sidinställningar → AI-medarbetare → Lägg till uppgift`

| Fält         | Beskrivning                 | Exempel               |
| :----------- | :-------------------------- | :-------------------- |
| Titel        | Uppgiftsnamn                | Analys av stegkonvertering |
| Kontext      | Kontexten för den aktuella sidan | Leads-listningssida   |
| Standardmeddelande | Förinställd konversationsstartare | "Vänligen analysera månadens trender" |
| Standardblock | Associera automatiskt med en samling | leads-tabell          |
| Färdigheter  | Tillgängliga verktyg        | Fråga data, generera diagram |

![Page-level task configuration](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-40-34.png)

**Stöd för flera uppgifter:**
En enskild AI-medarbetare kan konfigureras med flera uppgifter, som presenteras som alternativ för användaren att välja mellan:

![Multi-task support](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

Förslag:

*   En uppgift bör fokusera på ett mål
*   Namnet ska vara tydligt och lätt att förstå
*   Håll antalet uppgifter inom 5–7

### 2. Blocknivåuppgifter

Lämpligt för att arbeta med ett specifikt block, till exempel "Översätt det aktuella formuläret".

**Konfigurationsmetod:**

1.  Öppna blockåtgärdskonfigurationen
2.  Lägg till "AI-medarbetare"

![Add AI Employee button](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-51-06.png)

3.  Bind den avsedda medarbetaren

![Select AI Employee](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-52-26.png)

![Block-level task configuration](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-53-35.png)

| Jämförelse | Sidnivå     | Blocknivå        |
| :--------- | :---------- | :--------------- |
| Dataomfång | Hela sidan  | Aktuellt block   |
| Granularitet | Global analys | Detaljerad bearbetning |
| Typisk användning | Trendanalys | Formuläröversättning, fältutvinning |

## IV. Bästa praxis

### 1. Konfigurationsförslag

| Objekt          | Förslag                  | Anledning               |
| :-------------- | :----------------------- | :---------------------- |
| Antal färdigheter | 3–5                      | Hög noggrannhet, snabb respons |
| Auto usage      | Aktivera med försiktighet | Förhindrar oavsiktliga operationer |
| Promptlängd     | 500–1000 tecken          | Balanserar hastighet och kvalitet |
| Uppgiftsmål     | Enkelt och tydligt       | Undviker att förvirra AI:n |
| Arbetsflöde     | Använd efter att ha kapslat in komplexa uppgifter | Högre framgångsfrekvens |

### 2. Praktiska förslag

**Börja smått, optimera gradvis:**

1.  Skapa först grundläggande medarbetare (t.ex. Viz, Dex)
2.  Aktivera 1–2 kärnfärdigheter för testning
3.  Bekräfta att uppgifter kan utföras normalt
4.  Utöka sedan gradvis med fler färdigheter och uppgifter

**Kontinuerlig optimeringsprocess:**

1.  Få den första versionen att fungera
2.  Samla in användarfeedback
3.  Optimera prompter och uppgiftskonfigurationer
4.  Testa och iterera

## V. Vanliga frågor och svar

### 1. Konfigurationsfasen

**F: Vad händer om det misslyckas att spara?**
S: Kontrollera om alla obligatoriska fält är ifyllda, särskilt modelltjänsten och prompten.

**F: Vilken modell ska jag välja?**

*   Kodrelaterat → Claude, GPT-4
*   Analysrelaterat → Claude, DeepSeek
*   Kostnadskänsligt → Qwen, GLM
*   Lång text → Gemini, Claude

### 2. Användningsfasen

**F: AI-svaret är för långsamt?**

*   Minska antalet färdigheter
*   Optimera prompten
*   Kontrollera modelltjänstens latens
*   Överväg att byta modell

**F: Uppgiftsutförandet är felaktigt?**

*   Prompten är inte tillräckligt tydlig
*   För många färdigheter orsakar förvirring
*   Dela upp uppgiften i mindre delar, lägg till exempel

**F: När ska Auto usage aktiveras?**

*   Det kan aktiveras för frågebaserade uppgifter
*   Det rekommenderas att inaktivera det för dataändrings-uppgifter

**F: Hur får jag AI:n att bearbeta ett specifikt formulär?**

S: Om det är en sidnivåkonfiguration måste ni manuellt välja blocket.

![Manually select block](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-02-22.png)

För blocknivåuppgiftskonfigurationer binds datakontexten automatiskt.

## VI. Vidare läsning

För att göra era AI-medarbetare ännu kraftfullare kan ni fortsätta läsa följande dokument:

**Konfigurationsrelaterat:**

*   [Prompt Engineering Guide](./prompt-engineering-guide.md) - Tekniker och bästa praxis för att skriva högkvalitativa prompter
*   [Konfigurera LLM-tjänst](/ai-employees/quick-start/llm-service) - Detaljerade konfigurationsinstruktioner för stora modelltjänster
*   [Skapa en AI-medarbetare](/ai-employees/quick-start/ai-employees) - Skapande och grundläggande konfiguration av AI-medarbetare
*   [Samarbeta med AI-medarbetare](/ai-employees/quick-start/collaborate) - Hur man för effektiva samtal med AI-medarbetare

**Avancerade funktioner:**

*   [Färdigheter](/ai-employees/advanced/skill) - Fördjupad förståelse för konfiguration och användning av olika färdigheter
*   [Uppgifter](/ai-employees/advanced/task) - Avancerade tekniker för uppgiftskonfiguration
*   [Välj block](/ai-employees/advanced/pick-block) - Hur man specificerar datablock för AI-medarbetare
*   [Datakälla](/ai-employees/advanced/datasource) - Konfiguration och hantering av datakällor
*   [Webbsökning](/ai-employees/advanced/web-search) - Konfigurera AI-medarbetares webbsökningsförmåga

**Kunskapsbas & RAG:**

*   [Översikt över AI-kunskapsbas](/ai-employees/knowledge-base/index) - Introduktion till kunskapsbasfunktionen
*   [Vektordatabas](/ai-employees/knowledge-base/vector-database) - Konfiguration av vektordatabasen
*   [Kunskapsbas](/ai-employees/knowledge-base/knowledge-base) - Hur man skapar och hanterar en kunskapsbas
*   [RAG (Retrieval-Augmented Generation)](/ai-employees/knowledge-base/rag) - Tillämpning av RAG-teknik

**Arbetsflödesintegration:**

*   [LLM-nod - Textkonversation](/ai-employees/workflow/nodes/llm/chat) - Använda textkonversation i arbetsflöden
*   [LLM-nod - Multimodal konversation](/ai-employees/workflow/nodes/llm/multimodal-chat) - Hantera multimodala indata som bilder och filer
*   [LLM-nod - Strukturerad utdata](/ai-employees/workflow/nodes/llm/structured-output) - Få strukturerade AI-svar

## Slutsats

Det viktigaste när ni konfigurerar AI-medarbetare är: **få det att fungera först, sedan optimera**.
Låt den första medarbetaren lyckas med sin uppgift, och utöka och finjustera sedan gradvis.

Felsökning kan göras i följande ordning:

1.  Är modelltjänsten ansluten?
2.  Är antalet färdigheter för många?
3.  Är prompten tydlig?
4.  Är uppgiftsmålet väl definierat?

Så länge ni går steg för steg kan ni bygga ett verkligt effektivt AI-team.