:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/ai-employees/features/built-in-employee).
:::

# Inbyggda AI-medarbetare

NocoBase levereras med flera inbyggda AI-medarbetare skräddarsydda för specifika scenarier.

Ni behöver bara konfigurera LLM-tjänsten och aktivera motsvarande medarbetare för att börja arbeta; modeller kan bytas vid behov under konversationen.


## Introduktion

![clipboard-image-1766653060](https://static-docs.nocobase.com/clipboard-image-1766653060.png)

| Medarbetarnamn | Rollpositionering | Kärnkompetenser |
| :--- | :--- | :--- |
| **Cole** | NocoBase-assistent | Frågor och svar om produkten, dokumenthämtning |
| **Ellis** | E-postexpert | E-postutkast, generering av sammanfattningar, svarsförslag |
| **Dex** | Dataorganisatör | Fältöversättning, formatering, informationsextraktion |
| **Viz** | Insiktsanalytiker | Datainsikter, trendanalys, tolkning av nyckeltal |
| **Lexi** | Översättningsassistent | Flerspråkig översättning, kommunikationsstöd |
| **Vera** | Forskningsanalytiker | Webbsökning, informationsaggregering, djupanalys |
| **Dara** | Datavisualiseringsexpert | Diagramkonfiguration, generering av visuella rapporter |
| **Orin** | Datamodelleringsexpert | Hjälper till att designa strukturer för samlingar, fältförslag |
| **Nathan** | Frontend-ingenjör | Hjälper till att skriva frontend-kodsnuttar, stiljusteringar |


Ni kan klicka på den **flytande AI-bollen** i det nedre högra hörnet av applikationsgränssnittet och välja den medarbetare ni behöver för att påbörja samarbetet.


## AI-medarbetare för dedikerade scenarier

Vissa inbyggda AI-medarbetare (av byggartyp) visas inte i listan över AI-medarbetare nere till höger; de har dedikerade arbetsytor, till exempel:

* Orin visas endast på konfigurationssidan för datakälla;
* Dara visas endast på sidan för diagramkonfiguration;
* Nathan visas endast i JS-editorn.



---

Nedan listas några typiska användningsscenarier för AI-medarbetare för att ge er inspiration. Fler möjligheter väntar på att utforskas av er i era faktiska affärsprocesser.


## Viz: Insiktsanalytiker

### Introduktion

> Generera diagram och insikter med ett klick, låt datan tala för sig själv.

**Viz** är den inbyggda **AI-insiktsanalytikern**.
Han vet hur man läser datan på er nuvarande sida (såsom Leads, Opportunities, Accounts) och genererar automatiskt trenddiagram, jämförelsediagram, KPI-kort och koncisa slutsatser, vilket gör affärsanalys enkel och intuitiv.

> Vill ni veta "Varför har försäljningen sjunkit nyligen"?
> Säg bara ett ord till Viz, så kan han berätta var minskningen skedde, vad de möjliga orsakerna är och vad nästa steg kan vara.

### Användningsscenarier

Oavsett om det gäller månatliga verksamhetsgenomgångar, kanal-ROI eller försäljningstrattar, kan ni låta Viz analysera, generera diagram och tolka resultat.

| Scenario       | Vad ni vill veta      | Viz utdata             |
| -------- | ------------ | ------------------- |
| **Månadsöversikt** | Hur är denna månad bättre än förra?   | KPI-kort + Trenddiagram + Tre förbättringsförslag |
| **Tillväxtanalys** | Beror intäktsökningen på volym eller pris? | Faktornedbrytningsdiagram + Jämförelsetabell         |
| **Kanalanalys** | Vilken kanal är mest värd fortsatta investeringar? | ROI-diagram + Retentionskurva + Förslag    |
| **Trattanalys** | Var fastnar trafiken?     | Trattdiagram + Förklaring av flaskhalsar          |
| **Kundretention** | Vilka kunder är mest värdefulla?    | RFM-segmenteringsdiagram + Retentionskurva       |
| **Kampanjutvärdering** | Hur effektiv var den stora kampanjen?     | Jämförelsediagram + Priselasticitetsanalys        |

### Användning

**Sidingångar**

* **Knapp i övre högra hörnet (Rekommenderas)**
  
  På sidor som Leads, Opportunities och Accounts, klicka på **Viz-ikonen** i det övre högra hörnet för att välja förinställda uppgifter, såsom:

  * Konvertering per steg och trender
  * Jämförelse av källkanaler
  * Månadsanalys

  ![clipboard-image-1771913319](https://static-docs.nocobase.com/clipboard-image-1771913319.png)

* **Global panel nere till höger**
  
  Oavsett vilken sida ni befinner er på kan ni anropa den globala AI-panelen och tala direkt till Viz:

  ```
  Analysera försäljningsförändringar under de senaste 90 dagarna
  ```

  Viz kommer automatiskt att inkludera datakontexten från er nuvarande sida.

**Interaktion**

Viz stöder frågor på naturligt språk och förstår uppföljningsfrågor i flera steg.
Exempel:

```
Hej Viz, generera trender för leads denna månad.
```

```
Visa endast resultat från tredjepartskanaler.
```

```
Vilken region växer snabbast?
```

Varje uppföljningsfråga kommer att fortsätta fördjupa sig baserat på föregående analysresultat, utan att ni behöver ange datavillkoren igen.

### Tips för att chatta med Viz

| Metod         | Effekt                  |
| ---------- | ------------------- |
| Ange tidsintervall   | "Senaste 30 dagarna" eller "Förra månaden vs. denna månad" är mer exakt |
| Specificera dimensioner     | "Visa per region/kanal/produkt" hjälper till att anpassa perspektiven  |
| Fokusera på trender snarare än detaljer | Viz är bra på att identifiera förändringsriktningar och nyckelorsaker   |
| Använd naturligt språk   | Inget behov av imperativ syntax, ställ bara frågor som om ni chattar  |


---



## Dex: Dataorganisatör

### Introduktion

> Extrahera och fyll i formulär snabbt, förvandla rörig information till strukturerad data.

`Dex` är en dataorganisatör som extraherar önskad information från ostrukturerad data eller filer och organiserar den till strukturerad information. Han kan även anropa verktyg för att fylla i informationen i formulär.

### Användning

Anropa `Dex` på formulärsidan för att öppna konversationsfönstret.

![20251022155316](https://static-docs.nocobase.com/20251022155316.png)

Klicka på `Add work context` i inmatningsfältet och välj `Pick block`; sidan försätts i ett läge för val av block.

![20251022155414](https://static-docs.nocobase.com/20251022155414.png)

Välj formulärblocket på sidan.

![20251022155523](https://static-docs.nocobase.com/20251022155523.png)

Ange den data ni vill att `Dex` ska organisera i dialogrutan.

![20251022155555](https://static-docs.nocobase.com/20251022155555.png)

Efter att meddelandet skickats kommer `Dex` att strukturera datan och använda sina färdigheter för att uppdatera datan i det valda formuläret.

![20251022155733](https://static-docs.nocobase.com/20251022155733.png)


---



## Orin: Datamodellerare

### Introduktion

> Designa samlingar intelligent och optimera databasstrukturer.

`Orin` är en datamodelleringsexpert. På konfigurationssidan för huvuddatakällan kan ni låta `Orin` hjälpa er att skapa eller ändra samlingar.

![20251022160628](https://static-docs.nocobase.com/20251022160628.png)

### Användning

Gå till pluginet för hantering av datakällor och välj att konfigurera huvuddatakällan.

![20251022161146](https://static-docs.nocobase.com/20251022161146.png)

Klicka på `Orin`-profilbilden i det övre högra hörnet för att öppna dialogrutan för AI-medarbetaren.

![20251022161641](https://static-docs.nocobase.com/20251022161641.png)

Beskriv era modelleringskrav för `Orin`, skicka och vänta på svar. 

När `Orin` har bekräftat era krav kommer han att använda sina färdigheter och svara med en förhandsgranskning av datamodelleringen.

Efter att ha granskat förhandsgranskningen, klicka på knappen `Finish review and apply` för att skapa samlingar enligt `Orin`s modellering.

![20251022162142](https://static-docs.nocobase.com/20251022162142.png)


---



## Nathan: Frontend-ingenjör

### Introduktion

> Hjälper er att skriva och optimera frontend-kod för att implementera komplex interaktionslogik.

`Nathan` är experten på frontend-utveckling i NocoBase. I scenarier där JavaScript krävs, såsom `JSBlock`, `JSField`, `JSItem`, `JSColumn`, `JSAction`, `Event Flow` och `Linkage`, kommer Nathans profilbild att visas i det övre högra hörnet av kodeditorn. Ni kan då be honom hjälpa till att skriva eller ändra koden i editorn.

![20251022163405](https://static-docs.nocobase.com/20251022163405.png)

### Användning

I kodeditorn, klicka på `Nathan` för att öppna dialogrutan för AI-medarbetaren. Koden i editorn kommer automatiskt att bifogas i inmatningsfältet och skickas till `Nathan` som applikationskontext.

![20251022163935](https://static-docs.nocobase.com/20251022163935.png)

Ange era kodningskrav, skicka dem till `Nathan` och vänta på hans svar.

![20251022164041](https://static-docs.nocobase.com/20251022164041.png)

Klicka på knappen `Apply to editor` på kodblocket som `Nathan` svarat med för att skriva över koden i editorn med hans kod.

![20251022164323](https://static-docs.nocobase.com/20251022164323.png)

Klicka på knappen `Run` i kodeditorn för att se effekterna i realtid.

![20251022164436](https://static-docs.nocobase.com/20251022164436.png)

### Kodhistorik

Klicka på ikonen för "Kommandorad" i det övre högra hörnet av `Nathan`s dialogruta för att se de kodsnuttar ni har skickat och de kodsnuttar som `Nathan` har svarat med i den aktuella sessionen.

![20251022164644](https://static-docs.nocobase.com/20251022164644.png)

![20251022164713](https://static-docs.nocobase.com/20251022164713.png)