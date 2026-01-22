:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Avancerat

## Introduktion

Stora språkmodeller (LLM) har ofta begränsad tillgång till den senaste informationen, vilket innebär att deras data kan vara inaktuell. Därför erbjuder online-plattformar för LLM-tjänster vanligtvis en webbsöksfunktion. Denna funktion gör det möjligt för AI:n att söka efter information med hjälp av verktyg innan den svarar, och sedan basera sitt svar på sökresultaten.

AI-medarbetare har anpassats för webbsöksfunktionen på olika online-plattformar för LLM-tjänster. Ni kan aktivera webbsöksfunktionen både i AI-medarbetarens modellkonfiguration och direkt i konversationer.

## Aktivera webbsöksfunktionen

Gå till konfigurationssidan för AI-medarbetarens `plugin`. Klicka på fliken `AI employees` för att komma till sidan för hantering av AI-medarbetare.

![20251021225643](https://static-docs.nocobase.com/20251021225643.png)

Välj den AI-medarbetare som ni vill aktivera webbsöksfunktionen för, och klicka sedan på knappen `Edit` för att komma till redigeringssidan för AI-medarbetaren.

![20251022114043](https://static-docs.nocobase.com/20251022114043.png)

På fliken `Model settings` slår ni på reglaget för `Web Search` och klickar sedan på knappen `Submit` för att spara ändringarna.

![20251022114300](https://static-docs.nocobase.com/20251022114300.png)

## Använda webbsöksfunktionen i konversationer

När en AI-medarbetare har webbsöksfunktionen aktiverad, visas en "Webb"-ikon i konversationens inmatningsfält. Webbsökning är aktiverad som standard, men ni kan klicka på ikonen för att stänga av den.

![20251022115110](https://static-docs.nocobase.com/20251022115110.png)

När webbsökning är aktiverad kommer AI-medarbetarens svar att visa webbsökresultaten.

![20251022115502](https://static-docs.nocobase.com/20251022115502.png)

## Skillnader i webbsökverktyg mellan plattformar

För närvarande är AI-medarbetarens webbsöksfunktion beroende av den online-plattform för LLM-tjänster som används, vilket kan leda till variationer i användarupplevelsen. De specifika skillnaderna beskrivs nedan:

| Plattform  | Webbsökning | tools | Svar i realtid med söktermer | Returnerar externa länkar som referenser i svaret |
| --------- | ---------- | ----- | ---------------------------- | ------------------------------------------------- |
| OpenAI    | ✅          | ✅     | ✅                            | ✅                                                 |
| Gemini    | ✅          | ❌     | ❌                            | ✅                                                 |
| Dashscope | ✅          | ✅     | ❌                            | ❌                                                 |
| Deepseek  | ❌          | ❌     | ❌                            | ❌                                                 |