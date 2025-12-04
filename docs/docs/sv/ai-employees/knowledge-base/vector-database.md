:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Vektordatabas

## Introduktion

I en kunskapsbas lagrar vektordatabasen vektoriserade dokument från kunskapsbasen. Dessa vektoriserade dokument fungerar som ett index för dokumenten.

När RAG-hämtning (Retrieval-Augmented Generation) är aktiverat i en AI-agentkonversation, vektoriseras användarens meddelande. Därefter hämtas fragment av kunskapsbasdokument från vektordatabasen för att matcha relevanta dokumentstycken och originaltext.

För närvarande har `AI Knowledge Base`-`plugin`-en endast inbyggt stöd för PGVector, som är en PostgreSQL-databas-`plugin`.

## Hantering av vektordatabas

Gå till konfigurationssidan för `AI Agent`-`plugin`-en, klicka på fliken `Vector store` och välj `Vector database` för att komma till sidan för hantering av vektordatabasen.

![20251022233704](https://static-docs.nocobase.com/20251022233704.png)

Klicka på knappen `Add new` i det övre högra hörnet för att lägga till en ny `PGVector`-vektordatabasanslutning:

- I fältet `Name` anger du anslutningsnamnet.
- I fältet `Host` anger du vektordatabasens IP-adress.
- I fältet `Port` anger du vektordatabasens portnummer.
- I fältet `Username` anger du användarnamnet för vektordatabasen.
- I fältet `Password` anger du lösenordet för vektordatabasen.
- I fältet `Database` anger du databasnamnet.
- I fältet `Table name` anger du tabellnamnet, vilket används när du skapar en ny tabell för att lagra vektordata.

När du har fyllt i all nödvändig information klickar du på knappen `Test` för att testa om vektordatabastjänsten är tillgänglig, och sedan på knappen `Submit` för att spara anslutningsinformationen.

![20251022234644](https://static-docs.nocobase.com/20251022234644.png)