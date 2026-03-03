:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/ai-employees/quick-start).
:::

# Snabbstart

Låt oss slutföra en minimalt användbar konfiguration för AI-anställda på 5 minuter.

## Installera plugin

AI-anställda är inbyggda i NocoBase (`@nocobase/plugin-ai`), så ingen separat installation krävs.

## Konfigurera modeller

Ni kan konfigurera LLM-tjänster från någon av följande ingångar:

1. Administratörsingång: `Systeminställningar -> AI-anställda -> LLM-tjänst`.
2. Genväg i gränssnittet: I AI-chattpanelen, använd `Model Switcher` för att välja en modell och klicka sedan på genvägen "Lägg till LLM-tjänst" för att hoppa direkt dit.

![quick-start-model-switcher-add-llm-service.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/quick-start-model-switcher-add-llm-service.png)

Vanligtvis behöver ni bekräfta:
1. Välj leverantör (Provider).
2. Fyll i API-nyckel.
3. Konfigurera `Enabled Models`; använd helt enkelt Recommend som standard.

## Aktivera inbyggda anställda

Inbyggda AI-anställda är aktiverade som standard och behöver vanligtvis inte aktiveras en och en.

Om ni behöver justera tillgängligheten (aktivera/inaktivera en specifik anställd), ändra brytaren `Enabled` i listan under `Systeminställningar -> AI-anställda`.

![ai-employee-list-enable-switch.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-list-enable-switch.png)

## Börja samarbeta

På applikationssidan, hovra över genvägen i det nedre högra hörnet och välj en AI-anställd.
![ai-employees-entry-bottom-right.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employees-entry-bottom-right.png)

Klicka för att öppna AI-chatten:

![chat-footer-employee-switcher-and-model-switcher.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/chat-footer-employee-switcher-and-model-switcher.png)

Ni kan även:  
* Lägga till block
* Lägga till bilagor
* Aktivera webbsökning
* Byta AI-anställd
* Välja modeller

De kan också automatiskt hämta sidstrukturen som kontext. Till exempel kan Dex i ett formulärblock läsa formulärfältens struktur och anropa lämpliga färdigheter för att utföra åtgärder på sidan.

## Snabbvals-uppgifter 

Ni kan förinställa vanliga uppgifter för varje AI-anställd på den aktuella platsen, så att ni kan börja arbeta med ett enda klick, vilket är både snabbt och smidigt.

<video controls class="rounded shadow"><source src="https://static-docs.nocobase.com/z-2025-11-02-12.19.33-2025-11-02-12-19-49.mp4" type="video/mp4"></video>

## Översikt över inbyggda anställda

NocoBase tillhandahåller flera inbyggda AI-anställda för olika scenarier.

Ni behöver bara:

1. Konfigurera LLM-tjänster.
2. Justera status för aktivering av anställda vid behov (aktiverade som standard).
3. Välj modell i chatten och börja samarbeta.

| Namn på anställd | Roll/Positionering | Kärnkompetenser |
| :--- | :--- | :--- |
| **Cole** | NocoBase-assistent | Frågor och svar om produktanvändning, dokumentsökning |
| **Ellis** | E-postexpert | E-postskrivande, generering av sammanfattningar, svarsförslag |
| **Dex** | Dataorganiseringsexpert | Fältöversättning, formatering, informationsextraktion |
| **Viz** | Insiktsanalytiker | Datainsikter, trendanalys, tolkning av nyckeltal |
| **Lexi** | Översättningsassistent | Flerspråkig översättning, kommunikationsstöd |
| **Vera** | Forskningsanalytiker | Webbsökning, informationsaggregering, djupgående forskning |
| **Dara** | Datavisualiseringsexpert | Diagramkonfiguration, generering av visuella rapporter |
| **Orin** | Datamodelleringsexpert | Assisterar vid design av samlingsstrukturer, fältförslag |
| **Nathan** | Frontend-ingenjör | Assisterar vid skrivande av frontend-kodsnuttar, stiljusteringar |

**Anmärkningar**

Vissa inbyggda AI-anställda visas inte i listan nere till höger eftersom de har specifika användningsområden:

- Orin: sidor för datamodellering.
- Dara: block för diagramkonfiguration.
- Nathan: JS-block och liknande kodredigerare.