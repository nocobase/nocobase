:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Översikt

NocoBase-utveckling av server-side plugin erbjuder dig som utvecklare en rad funktioner och möjligheter för att anpassa och utöka NocoBase kärnfunktioner. Nedan hittar du en översikt över de viktigaste funktionerna och tillhörande kapitel:

| Modul                                   | Beskrivning                                                              | Relaterat kapitel                               |
| :-------------------------------------- | :----------------------------------------------------------------------- | :---------------------------------------------- |
| **Plugin-klass**                        | Skapa och hantera server-side **plugin**, utöka kärnfunktionaliteten     | [plugin.md](plugin.md)                          |
| **Databasoperationer**                  | Tillhandahåller gränssnitt för databasoperationer, med stöd för CRUD och transaktionshantering | [database.md](database.md)                      |
| **Anpassade samlingar**                 | Anpassa **samlings**strukturer baserat på affärsbehov för flexibel hantering av datamodeller | [collections.md](collections.md)                |
| **Datakompatibilitet vid plugin-uppgradering** | Säkerställer att **plugin**-uppgraderingar inte påverkar befintlig data genom att hantera datamigrering och kompatibilitet | [migration.md](migration.md)                    |
| **Hantering av externa datakällor**     | Integrera och hantera externa **datakällor** för att möjliggöra datautbyte | [data-source-manager.md](data-source-manager.md) |
| **Anpassade API:er**                    | Utöka API-resurshanteringen genom att skriva anpassade gränssnitt       | [resource-manager.md](resource-manager.md)      |
| **API-behörighetshantering**            | Anpassa API-behörigheter för detaljerad åtkomstkontroll                  | [acl.md](acl.md)                                |
| **Interception och filtrering av förfrågningar/svar** | Lägg till interceptorer eller middleware för förfrågningar och svar för att hantera uppgifter som loggning, autentisering m.m. | [context.md](context.md) och [middleware.md](middleware.md) |
| **Händelselyssning**                    | Lyssna på systemhändelser (t.ex. från applikationen eller databasen) och trigga motsvarande hanterare | [event.md](event.md)                            |
| **Cachehantering**                      | Hantera cacheminnet för att förbättra applikationens prestanda och svarshastighet | [cache.md](cache.md)                            |
| **Schemalagda uppgifter**               | Skapa och hantera schemalagda uppgifter, såsom regelbunden rensning, datasynkronisering m.m. | [cron-job-manager.md](cron-job-manager.md)      |
| **Stöd för flera språk**                | Integrera stöd för flera språk för att implementera internationalisering och lokalisering | [i18n.md](i18n.md)                              |
| **Loggutdata**                          | Anpassa loggformat och utdatametoder för att förbättra felsöknings- och övervakningsmöjligheterna | [logger.md](logger.md)                          |
| **Anpassade kommandon**                 | Utöka NocoBase CLI genom att lägga till anpassade kommandon             | [command.md](command.md)                        |
| **Skriva testfall**                     | Skriv och kör testfall för att säkerställa **plugin**-stabilitet och funktionell noggrannhet | [test.md](test.md)                              |