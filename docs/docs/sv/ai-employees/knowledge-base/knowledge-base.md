:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Kunskapsbas

## Introduktion

Kunskapsbasen är grunden för RAG-hämtning. Den organiserar dokument i kategorier och bygger ett index. När en AI-medarbetare svarar på en fråga kommer den att prioritera att söka efter svar i kunskapsbasen.

## Hantering av kunskapsbaser

Gå till konfigurationssidan för AI-medarbetarens `plugin`. Klicka på fliken `Knowledge base` för att komma till sidan för hantering av kunskapsbaser.

![20251023095649](https://static-docs.nocobase.com/20251023095649.png)

Klicka på knappen `Add new` i det övre högra hörnet för att lägga till en `Local` kunskapsbas.

![20251023095826](https://static-docs.nocobase.com/20251023095826.png)

Ange nödvändig information för den nya kunskapsbasen:

- I fältet `Name` anger ni namnet på kunskapsbasen;
- Under `File storage` väljer ni lagringsplats för filerna;
- Under `Vector store` väljer ni vektorlagring, se [Vektorlagring](/ai-employees/knowledge-base/vector-store);
- I fältet `Description` anger ni en beskrivning av kunskapsbasen;

Klicka på knappen `Submit` för att skapa kunskapsbasen.

![20251023095909](https://static-docs.nocobase.com/20251023095909.png)

## Hantering av dokument i kunskapsbasen

När ni har skapat kunskapsbasen, klicka på den nyskapade kunskapsbasen på listan över kunskapsbaser för att komma till sidan för hantering av dokument i kunskapsbasen.

![20251023100458](https://static-docs.nocobase.com/2025100458.png)

![20251023100527](https://static-docs.nocobase.com/2025100527.png)

Klicka på knappen `Upload` för att ladda upp dokument. Efter att dokumenten har laddats upp startar vektoriseringen automatiskt. Vänta tills `Status` ändras från `Pending` till `Success`.

För närvarande stöder kunskapsbasen följande dokumenttyper: txt, pdf, doc, docx, ppt, pptx; PDF stöder endast ren text.

![20251023100901](https://static-docs.nocobase.com/2025100901.png)

## Typer av kunskapsbaser

### Lokal kunskapsbas

En lokal kunskapsbas är en kunskapsbas som lagras lokalt i NocoBase. Både dokumenten och deras vektordata lagras lokalt av NocoBase.

![20251023101620](https://static-docs.nocobase.com/2025101620.png)

### Skrivskyddad kunskapsbas

En skrivskyddad kunskapsbas är en kunskapsbas där dokument och vektordata underhålls externt. Endast en anslutning till vektordatabasen skapas i NocoBase (för närvarande stöds endast PGVector).

![20251023101743](https://static-docs.nocobase.com/2025101743.png)

### Extern kunskapsbas

En extern kunskapsbas är en kunskapsbas där dokument och vektordata underhålls externt. Hämtning från vektordatabasen behöver utökas av utvecklare, vilket möjliggör användning av vektordatabaser som för närvarande inte stöds av NocoBase.

![20251023101949](https://static-docs.nocobase.com/2025101949.png)