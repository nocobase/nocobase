---
pkg: "@nocobase/plugin-data-source-main"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Ärvd samling

## Introduktion

:::warning
Stöds endast när huvuddatabasen är PostgreSQL.
:::

Ni kan skapa en föräldrasamling och sedan härleda barnsamlingar från den. Barnsamlingen kommer att ärva föräldrasamlingens struktur, men kan också definiera sina egna kolumner. Detta designmönster hjälper till att organisera och hantera data med liknande strukturer men med möjliga skillnader.

Här är några vanliga egenskaper för ärvda samlingar:

- Föräldrasamling: Föräldrasamlingen innehåller gemensamma kolumner och data, och definierar den grundläggande strukturen för hela arvhierarkin.
- Barnsamling: Barnsamlingen ärver föräldrasamlingens struktur, men kan också definiera sina egna kolumner. Detta gör att varje barnsamling kan ha föräldrasamlingens gemensamma egenskaper samtidigt som den innehåller attribut som är specifika för underklassen.
- Frågor: När ni gör frågor kan ni välja att fråga hela arvhierarkin, bara föräldrasamlingen, eller en specifik barnsamling. Detta gör det möjligt att hämta och bearbeta data på olika nivåer efter behov.
- Arvsrelation: En arvsrelation etableras mellan föräldrasamlingen och barnsamlingen, vilket innebär att föräldrasamlingens struktur kan användas för att definiera konsekventa attribut, samtidigt som barnsamlingen kan utöka eller åsidosätta dessa attribut.

Detta designmönster hjälper till att minska dataredundans, förenkla databasmodellen och göra data lättare att underhålla. Det måste dock användas med försiktighet, eftersom ärvda samlingar kan öka komplexiteten i frågor, särskilt när hela arvhierarkin hanteras. Databassystem som stöder ärvda samlingar tillhandahåller vanligtvis specifik syntax och verktyg för att hantera och fråga dessa samlingsstrukturer.

## Användarmanual

![20240324085907](https://static-docs.nocobase.com/20240324085907.png)