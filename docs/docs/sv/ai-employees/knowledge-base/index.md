:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Översikt

## Introduktion

AI-kunskapsbas-pluginet tillhandahåller RAG-hämtningsfunktioner för AI-agenter.

RAG-hämtningsfunktioner gör att AI-agenter kan ge mer precisa, professionella och företagsrelevanta svar när de besvarar användarfrågor.

Genom att använda professionella domän- och interna företagsdokument från den administratörsunderhållna kunskapsbasen förbättras precisionen och spårbarheten i AI-agenternas svar.

### Vad är RAG

RAG (Retrieval Augmented Generation) står för "Hämtning-Förstärkt-Generering".

- Hämtning: Användarens fråga omvandlas till en vektor av en Embedding-modell (t.ex. BERT). I vektorbiblioteket hämtas de Top-K mest relevanta textblocken via tät hämtning (semantisk likhet) eller gles hämtning (nyckelordsmatchning).
- Förstärkning: Hämtningsresultaten sammanfogas med den ursprungliga frågan för att bilda en förstärkt prompt, som sedan injiceras i LLM:s kontextfönster.
- Generering: LLM kombinerar den förstärkta prompten för att generera det slutgiltiga svaret, vilket säkerställer fakticitet och spårbarhet.

## Installation

1. Gå till sidan för pluginhanteraren.
2. Hitta `AI: Knowledge base`-pluginet och aktivera det.

![20251022224818](https://static-docs.nocobase.com/20251022224818.png)