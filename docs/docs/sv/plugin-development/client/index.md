:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Översikt

NocoBase klient-sidiga plugin-utveckling erbjuder olika funktioner och möjligheter för att hjälpa utvecklare att anpassa och utöka NocoBase:s frontend-funktionalitet. Nedan följer de huvudsakliga funktionerna och relaterade kapitel för NocoBase klient-sidiga plugin-utveckling:

| Funktionsmodul                  | Beskrivning                                           | Relaterat kapitel                                      |
|---------------------------------|-------------------------------------------------------|--------------------------------------------------------|
| **Plugin-klass**                | Skapa och hantera klient-sidiga plugins, utöka frontend-funktionaliteten | [Plugin-klass](plugin.md)                       |
| **Routhantering**               | Anpassa frontend-routing, implementera sidnavigering och omdirigeringar | [Routhantering](router.md)                       |
| **Resurshantering**             | Hantera frontend-resurser, hantera datahämtning och operationer | [Resurshantering](resource.md)                   |
| **Begäranshantering**           | Anpassa HTTP-förfrågningar, hantera API-anrop och dataöverföring | [Begäranshantering](request.md)                     |
| **Kontexthantering**            | Hämta och använda applikationskontext, få åtkomst till globalt tillstånd och tjänster | [Kontexthantering](context.md)                     |
| **Åtkomstkontroll (ACL)**       | Implementera frontend-åtkomstkontroll, kontrollera åtkomsträttigheter för sidor och funktioner | [Åtkomstkontroll (ACL)](acl.md)                             |
| **Datakällshantering**          | Hantera och använda flera datakällor, implementera växling och åtkomst av datakällor | [Datakällshantering](data-source-manager.md) |
| **Stilar och teman**            | Anpassa stilar och teman, implementera UI-anpassning och försköning | [Stilar och teman](styles-themes.md)          |
| **Flerspråksstöd (I18n)**       | Integrera flerspråksstöd, implementera internationalisering och lokalisering | [Flerspråksstöd (I18n)](i18n.md)                            |
| **Loggning**                    | Anpassa loggformat och utmatningsmetoder, förbättra felsöknings- och övervakningsförmågan | [Loggning](logger.md)                        |
| **Skriva testfall**             | Skriva och köra testfall, säkerställa plugin-stabilitet och funktionell noggrannhet | [Skriva testfall](test.md)                            |

UI-utökningar

| Funktionsmodul      | Beskrivning                                                                                   | Relaterat kapitel                                      |
|---------------------|-----------------------------------------------------------------------------------------------|--------------------------------------------------------|
| **UI-konfiguration**| Använd FlowEngine och flödesmodeller för att implementera dynamisk konfiguration och orkestrering av komponentegenskaper, vilket stöder visuell anpassning av komplexa sidor och interaktioner | [FlowEngine](../../flow-engine/index.md) och [Flödesmodeller](../../flow-engine/flow-model.md) |
| **Blockutökningar** | Anpassa sidblock, skapa återanvändbara UI-moduler och layouter                                         | [Blockutökningar](../../ui-development-block/index.md) |
| **Fältutökningar**  | Anpassa fälttyper, implementera visning och redigering av komplex data  | [Fältutökningar](../../ui-development-field/index.md) |
| **Åtgärdsutökningar** | Anpassa åtgärdstyper, implementera komplex logik och interaktionshantering  | [Åtgärdsutökningar](../../ui-development-action/index.md) |