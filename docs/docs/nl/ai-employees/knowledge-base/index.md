:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Overzicht

## Introductie

De AI Kennisbank plugin biedt RAG-zoekmogelijkheden voor AI-medewerkers.

Met RAG-zoekmogelijkheden kunnen AI-medewerkers nauwkeurigere, professionelere en bedrijfsintern relevantere antwoorden geven op gebruikersvragen.

Door gebruik te maken van de professionele domein- en interne bedrijfsdocumenten uit de door de beheerder onderhouden kennisbank, verbetert u de nauwkeurigheid en traceerbaarheid van de antwoorden van AI-medewerkers.

### Wat is RAG

RAG (Retrieval Augmented Generation) staat voor "Retrieval-Augmented-Generation".

- **Retrieval (Ophalen)**: De vraag van de gebruiker wordt door een Embedding-model (bijv. BERT) omgezet in een vector. De Top-K relevante tekstblokken worden vervolgens uit de vectorbibliotheek opgehaald via dense retrieval (semantische gelijkenis) of sparse retrieval (trefwoordmatching).
- **Augmentation (Verrijking)**: De opgehaalde resultaten worden samengevoegd met de oorspronkelijke vraag om een verrijkte prompt te vormen, die vervolgens in het contextvenster van de LLM wordt geïnjecteerd.
- **Generation (Generatie)**: De LLM combineert de verrijkte prompt om het uiteindelijke antwoord te genereren, wat de feitelijkheid en traceerbaarheid waarborgt.

## Installatie

1. Ga naar de pagina voor pluginbeheer.
2. Zoek de `AI: Knowledge base` plugin en schakel deze in.

![20251022224818](https://static-docs.nocobase.com/20251022224818.png)