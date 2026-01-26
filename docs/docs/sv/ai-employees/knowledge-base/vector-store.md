:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Vektorlagring

## Introduktion

I en kunskapsbas behöver ni, både när ni sparar dokument (för att vektorisera dem) och när ni söker efter dokument (för att vektorisera söktermerna), använda en `Embedding model` för att vektorisera den ursprungliga texten.

I AI-kunskapsbas-pluginet är en vektorlagring en koppling mellan en `Embedding model` och en vektordatabas.

## Hantering av vektorlagring

Gå till konfigurationssidan för AI-medarbetar-pluginet, klicka på fliken `Vector store` och välj `Vector store` för att komma till sidan för hantering av vektorlagring.

![20251023003023](https://static-docs.nocobase.com/20251023003023.png)

Klicka på knappen `Add new` uppe till höger för att lägga till en ny vektorlagring:

- I inmatningsfältet `Name` anger ni namnet på vektorlagringen;
- Under `Vector store` väljer ni en redan konfigurerad vektordatabas. Se: [Vektordatabas](/ai-employees/knowledge-base/vector-database);
- Under `LLM service` väljer ni en redan konfigurerad LLM-tjänst. Se: [Hantering av LLM-tjänster](/ai-employees/quick-start/llm-service);
- I inmatningsfältet `Embedding model` anger ni namnet på den `Embedding`-modell som ska användas;

Klicka på knappen `Submit` för att spara informationen om vektorlagringen.

![20251023003121](https://static-docs.nocobase.com/20251023003121.png)