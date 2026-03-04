:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/ai-employees/configuration/admin-configuration).
:::

# AI-medarbetare · Administratörsguide för konfiguration

> Detta dokument hjälper er att snabbt förstå hur ni konfigurerar och hanterar AI-medarbetare, från modelltjänster till arbetsstart, och guidar er steg för steg genom hela processen.


## I. Innan ni börjar

### 1. Systemkrav

Innan ni konfigurerar, se till att er miljö uppfyller följande villkor:

*   **NocoBase 2.0 eller högre** är installerat
*   **AI-medarbetare plugin** är aktiverat
*   Minst en tillgänglig **stor språkmodell-tjänst** (t.ex. OpenAI, Claude, DeepSeek, GLM, etc.)


### 2. Förstå AI-medarbetares tvåskiktsdesign

AI-medarbetare är uppdelade i två skikt: **"Rolldefinition"** och **"Uppgiftsanpassning"**.

| Skikt | Beskrivning | Egenskaper | Funktion |
| -------- | ------------ | ---------- | ------- |
| **Rolldefinition** | Medarbetarens grundläggande personlighet och kärnkompetenser | Stabil och oföränderlig, som ett "CV" | Säkerställer rollkonsistens |
| **Uppgiftsanpassning** | Konfiguration för olika affärsscenarier | Flexibel och justerbar | Anpassar till specifika uppgifter |

**Enkelt uttryckt:**

> "Rolldefinition" bestämmer vem denna medarbetare är,
> "Uppgiftsanpassning" bestämmer vad hen ska göra just nu.

Fördelarna med denna design är:

*   Rollen är oförändrad, men kan hantera olika scenarier
*   Uppgradering eller utbyte av uppgifter påverkar inte medarbetaren själv
*   Bakgrund och uppgifter är oberoende av varandra, vilket förenklar underhåll


## II. Konfigurationsflöde (5 steg)

### Steg 1: Konfigurera modelltjänst

Modelltjänsten motsvarar AI-medarbetarens hjärna och måste ställas in först.

> 💡 För detaljerade konfigurationsinstruktioner, se: [Konfigurera LLM-tjänst](/ai-employees/features/llm-service)

**Sökväg:**
`Systeminställningar → AI-medarbetare → LLM service`

![Gå till konfigurationssidan](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

Klicka på **Lägg till** och fyll i följande information:

| Objekt | Beskrivning | Anmärkningar |
| ------ | -------------------------- | --------- |
| Provider | t.ex. OpenAI, Claude, Gemini, Kimi etc. | Kompatibel med tjänster som följer samma specifikation |
| API-nyckel | Nyckel tillhandahållen av tjänsteleverantören | Håll den hemlig och byt ut den regelbundet |
| Base URL | API Endpoint (valfritt) | Behöver ändras vid användning av proxy |
| Enabled Models | Rekommenderade modeller / Välj modeller / Manuell inmatning | Bestämmer vilka modeller som är valbara i konversationer |

![Skapa modelltjänst](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

Efter konfiguration, använd `Test flight` för att **testa anslutningen**.
Om det misslyckas, kontrollera nätverk, nyckel eller modellnamn.

![Testa anslutning](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)


### Steg 2: Skapa AI-medarbetare

> 💡 För detaljerade instruktioner, se: [Skapa AI-medarbetare](/ai-employees/features/new-ai-employees)

Sökväg: `AI-medarbetarhantering → Skapa medarbetare`

Fyll i grundläggande information:

| Fält | Obligatorisk | Exempel |
| ----- | -- | -------------- |
| Namn | ✓ | viz, dex, cole |
| Smeknamn | ✓ | Viz, Dex, Cole |
| Aktiveringsstatus | ✓ | På |
| Biografi | - | "Dataanalysexpert" |
| Huvudprompt | ✓ | Se guide för prompt-engineering |
| Välkomstmeddelande | - | "Hej, jag är Viz…" |

![Konfiguration av grundläggande information](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-21-09.png)

I skapandefasen fokuseras främst på roll- och färdighetskonfiguration. Den faktiska modellen som används kan väljas i konversationen via `Model Switcher`.

**Förslag för promptskrivning:**

*   Var tydlig med medarbetarens roll, tonfall och ansvarsområden
*   Använd ord som "måste" och "aldrig" för att betona regler
*   Inkludera exempel så långt som möjligt för att undvika abstrakta instruktioner
*   Håll den mellan 500–1000 tecken

> Ju tydligare prompten är, desto stabilare blir AI:ns prestation.
> Se [Guide för prompt-engineering](./prompt-engineering-guide.md).


### Steg 3: Konfigurera färdigheter

Färdigheter bestämmer vad medarbetaren kan "göra".

> 💡 För detaljerade instruktioner, se: [Färdigheter](/ai-employees/features/tool)

| Typ | Kapacitetsområde | Exempel | Risknivå |
| ---- | ------- | --------- | ------ |
| Frontend | Sidinteraktion | Läsa blockdata, fylla i formulär | Låg |
| Datamodell | Datafrågor och analys | Aggregerad statistik | Medel |
| Arbetsflöde | Utföra affärsprocesser | Anpassade verktyg | Beror på arbetsflödet |
| Övrigt | Externa utökningar | Webbsökning, filhantering | Beror på situationen |

**Konfigurationsförslag:**

*   3–5 färdigheter per medarbetare är mest lämpligt
*   Vi rekommenderar inte att välja alla, då det lätt skapar förvirring
*   För viktiga åtgärder rekommenderas behörigheten `Ask` istället för `Allow`

![Konfigurera färdigheter](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-26-06.png)


### Steg 4: Konfigurera kunskapsbas (valfritt)

Om er AI-medarbetare behöver minnas eller referera till stora mängder material, som produktmanualer eller FAQ, kan ni konfigurera en kunskapsbas.

> 💡 För detaljerade instruktioner, se:
> - [Översikt över AI-kunskapsbas](/ai-employees/knowledge-base/index)
> - [Vektordatabas](/ai-employees/knowledge-base/vector-database)
> - [Konfiguration av kunskapsbas](/ai-employees/knowledge-base/knowledge-base)
> - [RAG (Retrieval-Augmented Generation)](/ai-employees/knowledge-base/rag)

Detta kräver att vektordatabas-pluginet är installerat.

![Konfigurera kunskapsbas](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-32-54.png)

**Användningsområden:**

*   Låta AI:n förstå företagsspecifik kunskap
*   Stödja dokumentbaserade frågor och svar samt sökning
*   Träna domänspecifika assistenter


### Steg 5: Verifiera effekten

När det är klart ser ni den nya medarbetarens avatar i sidans nedre högra hörn.

![Verifiera konfiguration](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-36-54.png)

Kontrollera följande punkter:

*   ✅ Visas ikonen korrekt
*   ✅ Kan grundläggande konversationer genomföras
*   ✅ Kan färdigheter anropas korrekt

Om allt fungerar är konfigurationen lyckad 🎉


## III. Uppgiftskonfiguration: Få AI:n att börja arbeta

Det vi gjort hittills är att "skapa en medarbetare",
nästa steg är att låta dem "gå till jobbet".

AI-uppgifter definierar medarbetarens beteende på en specifik sida eller i ett specifikt block.

> 💡 För detaljerade instruktioner, se: [Uppgifter](/ai-employees/features/task)


### 1. Uppgifter på sidnivå

Gäller för hela sidans omfång, till exempel "Analysera data på denna sida".

**Konfigurationsingång:**
`Sidinställningar → AI-medarbetare → Lägg till uppgift`

| Fält | Beskrivning | Exempel |
| ---- | -------- | --------- |
| Titel | Uppgiftens namn | Analys av stegkonvertering |
| Bakgrund | Kontext för den aktuella sidan | Leads-listningssida |
| Standardmeddelande | Förinställd dialog | "Analysera trenden för denna månad" |
| Standardblock | Automatisk koppling till datatabell | leads-tabell |
| Färdigheter | Tillgängliga verktyg | Fråga data, generera diagram |

![Konfiguration av uppgift på sidnivå](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-40-34.png)

**Stöd för flera uppgifter:**
Samma AI-medarbetare kan konfigureras med flera uppgifter, som visas som alternativ för användaren:

![Stöd för flera uppgifter](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

Förslag:

*   En uppgift bör fokusera på ett mål
*   Namnet ska vara tydligt och lättförståeligt
*   Håll antalet uppgifter inom 5–7 stycken


### 2. Uppgifter på blocknivå

Lämpligt för åtgärder i ett specifikt block, som "Översätt aktuellt formulär".

**Konfigurationsmetod:**

1.  Öppna konfigurationen för blockåtgärder
2.  Lägg till "AI-medarbetare"

![Knapp för att lägga till AI-medarbetare](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-51-06.png)

3.  Koppla till målmedarbetaren

![Välj AI-medarbetare](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-52-26.png)

![Konfiguration av uppgift på blocknivå](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-53-35.png)

| Jämförelse | Sidnivå | Blocknivå |
| ---- | ---- | --------- |
| Dataomfång | Hela sidan | Aktuellt block |
| Granularitet | Global analys | Detaljerad hantering |
| Typisk användning | Trendanalys | Formuläröversättning, fältextraktion |


## IV. Bästa praxis

### 1. Konfigurationsförslag

| Objekt | Förslag | Anledning |
| ---------- | ----------- | -------- |
| Antal färdigheter | 3–5 stycken | Hög precision, snabb respons |
| Behörighetsläge (Ask / Allow) | Rekommendera Ask vid dataändring | Förhindra felaktiga åtgärder |
| Promptlängd | 500–1000 tecken | Balanserar hastighet och kvalitet |
| Uppgiftsmål | Enkelt och tydligt | Undvik att AI:n blir förvirrad |
| Arbetsflöde | Använd efter inkapsling av komplexa uppgifter | Högre framgångsgrad |


### 2. Praktiska råd

**Börja smått, optimera gradvis:**

1.  Skapa först grundläggande medarbetare (t.ex. Viz, Dex)
2.  Aktivera 1–2 kärnfärdigheter för testning
3.  Bekräfta att uppgifter kan utföras normalt
4.  Utöka sedan gradvis med fler färdigheter och uppgifter

**Kontinuerlig optimering av flödet:**

1.  Få den första versionen att fungera
2.  Samla in feedback från användning
3.  Optimera prompter och uppgiftskonfigurationer
4.  Testa och förbättra cykliskt


## V. Vanliga frågor och svar

### 1. Konfigurationsfasen

**F: Vad gör jag om det inte går att spara?**
S: Kontrollera om alla obligatoriska fält är ifyllda, särskilt modelltjänst och prompt.

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

**F: Uppgiften utförs inte korrekt?**

*   Prompten är inte tillräckligt tydlig
*   För många färdigheter skapar förvirring
*   Dela upp i mindre uppgifter, lägg till exempel

**F: När ska jag välja Ask / Allow?**

*   För sökrelaterade uppgifter kan `Allow` användas
*   För dataändringar rekommenderas `Ask`

**F: Hur får jag AI:n att hantera ett specifikt formulär?**

S: Om det är en konfiguration på sidnivå måste ni manuellt välja blocket.

![Välj block manuellt](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-02-22.png)

Om det är en konfiguration på blocknivå binds datakontexten automatiskt.


## VI. Vidare läsning

För att göra era AI-medarbetare mer kraftfulla kan ni läsa följande dokument:

**Relaterat till konfiguration:**

*   [Guide för prompt-engineering](./prompt-engineering-guide.md) - Tekniker och bästa praxis för att skriva högkvalitativa prompter
*   [Konfigurera LLM-tjänst](/ai-employees/features/llm-service) - Detaljerad beskrivning av konfiguration för stora modelltjänster
*   [Skapa AI-medarbetare](/ai-employees/features/new-ai-employees) - Skapande och grundläggande konfiguration av AI-medarbetare
*   [Samarbeta med AI-medarbetare](/ai-employees/features/collaborate) - Hur ni för effektiva dialoger med AI-medarbetare

**Avancerade funktioner:**

*   [Färdigheter](/ai-employees/features/tool) - Fördjupning i konfiguration och användning av olika färdigheter
*   [Uppgifter](/ai-employees/features/task) - Avancerade tekniker för uppgiftskonfiguration
*   [Välj block](/ai-employees/features/pick-block) - Hur ni anger datablock för AI-medarbetare
*   Datakälla - Se dokumentationen för datakällskonfiguration i motsvarande plugin
*   [Webbsökning](/ai-employees/features/web-search) - Konfigurera AI-medarbetarens förmåga till webbsökning

**Kunskapsbas och RAG:**

*   [Översikt över AI-kunskapsbas](/ai-employees/knowledge-base/index) - Introduktion till kunskapsbasfunktioner
*   [Vektordatabas](/ai-employees/knowledge-base/vector-database) - Konfiguration av vektordatabas
*   [Kunskapsbas](/ai-employees/knowledge-base/knowledge-base) - Hur ni skapar och hanterar kunskapsbaser
*   [RAG (Retrieval-Augmented Generation)](/ai-employees/knowledge-base/rag) - Tillämpning av RAG-teknik

**Arbetsflödesintegration:**

*   [LLM-nod - Textdialog](/ai-employees/workflow/nodes/llm/chat) - Använda textdialog i arbetsflöden
*   [LLM-nod - Multimodal dialog](/ai-employees/workflow/nodes/llm/multimodal-chat) - Hantera bilder, filer och annan multimodal indata
*   [LLM-nod - Strukturerad utdata](/ai-employees/workflow/nodes/llm/structured-output) - Erhåll strukturerade AI-svar


##结语

Det viktigaste vid konfiguration av AI-medarbetare är: **få det att fungera först, optimera sedan**.
Låt den första medarbetaren börja arbeta framgångsrikt, och utöka samt finjustera därefter stegvis.

Felsökning kan göras i följande ordning:

1.  Är modelltjänsten ansluten
2.  Är antalet färdigheter för många
3.  Är prompten tydlig
4.  Är uppgiftsmålet tydligt

Genom att gå framåt stegvis kan ni bygga ett verkligt effektivt AI-team.