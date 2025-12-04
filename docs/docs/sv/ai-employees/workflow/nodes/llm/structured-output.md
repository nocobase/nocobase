---
pkg: "@nocobase/plugin-ai-ee"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::



# Strukturerad utdata

## Introduktion

I vissa applikationsscenarier kan ni vilja att LLM-modellen svarar med strukturerat innehåll i JSON-format. Detta kan uppnås genom att konfigurera "Strukturerad utdata".

![](https://static-docs.nocobase.com/202503041306405.png)

## Konfiguration

-   **JSON Schema** – Ni kan specificera den förväntade strukturen för modellens svar genom att konfigurera ett [JSON Schema](https://json-schema.org/).
-   **Namn** – _Valfritt_, används för att hjälpa modellen att bättre förstå objektet som JSON Schema representerar.
-   **Beskrivning** – _Valfritt_, används för att hjälpa modellen att bättre förstå syftet med JSON Schema.
-   **Strict** – Kräver att modellen genererar ett svar strikt enligt JSON Schema-strukturen. För närvarande stöder endast vissa nya modeller från OpenAI denna parameter. Vänligen bekräfta att er modell är kompatibel innan ni aktiverar den.

## Metod för generering av strukturerat innehåll

Hur en modell genererar strukturerat innehåll beror på den **modell** som används och dess konfiguration för **svarsformat** (Response format):

1.  Modeller där svarsformatet (Response format) endast stöder `text`
    -   Vid anrop kommer noden att binda ett verktyg (Tool) som genererar JSON-formaterat innehåll baserat på JSON Schema, vilket vägleder modellen att generera ett strukturerat svar genom att anropa detta verktyg.

2.  Modeller där svarsformatet (Response format) stöder JSON-läge (`json_object`)
    -   Om JSON-läge väljs vid anrop måste ni i Prompten tydligt instruera modellen att svara i JSON-format och tillhandahålla beskrivningar för svarsfälten.
    -   I detta läge används JSON Schema endast för att tolka den JSON-sträng som returneras av modellen och konvertera den till det önskade JSON-objektet.

3.  Modeller där svarsformatet (Response format) stöder JSON Schema (`json_schema`)
    -   JSON Schema används direkt för att specificera modellens önskade svarsstruktur.
    -   Den valfria parametern **Strict** kräver att modellen strikt följer JSON Schema när svaret genereras.

4.  Lokala Ollama-modeller
    -   Om ett JSON Schema är konfigurerat, kommer noden vid anrop att skicka det som parametern `format` till modellen.

## Använda resultatet från strukturerad utdata

Modellens strukturerade innehåll sparas som ett JSON-objekt i nodens fält för strukturerat innehåll (Structured content) och kan användas av efterföljande noder.

![](https://static-docs.nocobase.com/202503041330291.png)

![](https://static-docs.nocobase.com/202503041331279.png)