:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Versionshantering

## Introduktion

I verkliga applikationer är det vanligt att distribuera flera miljöer, som utvecklings-, förproduktions- och produktionsmiljöer, för att säkerställa både datasäkerhet och stabil drift. Detta dokument beskriver i detalj hur ni implementerar versionshantering i NocoBase, med exempel från två vanliga utvecklingsprocesser utan kod.

## Installation

För versionshantering krävs tre plugin. Se till att ni har aktiverat följande plugin.

### Miljövariabler

- Inbyggt plugin, installeras och aktiveras som standard.
- Ger centraliserad konfiguration och hantering av miljövariabler och nycklar. Används för att lagra känslig data, återanvända konfigurationsdata och isolera miljöspecifika inställningar med mera ([Se dokumentation](#)).

### Säkerhetskopieringshanterare

- Detta plugin är endast tillgängligt i Professional-utgåvan eller högre ([Läs mer](https://www.nocobase.com/en/commercial)).
- Erbjuder funktioner för säkerhetskopiering och återställning, inklusive schemalagda säkerhetskopior, för att säkerställa datasäkerhet och snabb återställning ([Se dokumentation](../backup-manager/index.mdx)).

### Migreringshanterare

- Detta plugin är endast tillgängligt i Professional-utgåvan eller högre ([Läs mer](https://www.nocobase.com/en/commercial)).
- Används för att migrera applikationskonfigurationer mellan olika applikationsmiljöer ([Se dokumentation](../migration-manager/index.md)).

## Vanliga utvecklingsprocesser utan kod

### Enkel utvecklingsmiljö, envägsversionering

Denna metod passar enkla utvecklingsprocesser. Ni har en utvecklingsmiljö, en förproduktionsmiljö och en produktionsmiljö. Ändringar flödar från utvecklingsmiljön till förproduktionsmiljön och distribueras slutligen till produktionsmiljön. I denna process är det endast utvecklingsmiljön som kan ändra konfigurationer; varken förproduktions- eller produktionsmiljön tillåter några ändringar.

![20250106234710](https://static-docs.nocobase.com/20250106234710.png)

När ni konfigurerar migreringsregler, välj regeln "Överskrivning prioriteras" för inbyggda tabeller i kärnan och plugin. För övriga kan ni behålla standardinställningarna om inga särskilda krav finns.

![20250105194845](https://static-docs.nocobase.com/20250105194845.png)

### Flera utvecklingsmiljöer, sammanslagen versionering

Denna metod passar för samarbeten med flera personer eller komplexa projekt. Flera parallella utvecklingsmiljöer kan användas oberoende, och alla ändringar slås samman till en gemensam förproduktionsmiljö för testning och verifiering innan de distribueras till produktion. Även i denna process är det endast utvecklingsmiljön som kan ändra konfigurationer; varken förproduktions- eller produktionsmiljön tillåter några ändringar.

![20250107103829](https://static-docs.nocobase.com/20250107103829.png)

När ni konfigurerar migreringsregler, välj regeln "Infoga eller uppdatera prioriteras" för inbyggda tabeller i kärnan och plugin. För övriga kan ni behålla standardinställningarna om inga särskilda krav finns.

![20250105194942](https://static-docs.nocobase.com/20250105194942.png)

## Återställning

Innan en migrering utförs skapas automatiskt en säkerhetskopia av den aktuella applikationen. Om migreringen misslyckas eller resultaten inte är som förväntat kan ni återställa via [Säkerhetskopieringshanteraren](../backup-manager/index.mdx).

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)