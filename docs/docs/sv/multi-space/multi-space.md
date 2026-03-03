---
pkg: "@nocobase/plugin-multi-space"
---

:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/multi-space/multi-space).
:::

# Multi-space

## Introduktion

**Pluginet Multi-space** tillåter flera oberoende datarymder inom en enda applikationsinstans genom logisk isolering.

#### Användningsområden
- **Flera butiker eller fabriker**: Affärsprocesser och systemkonfigurationer är mycket enhetliga – såsom gemensam lagerhantering, produktionsplanering, försäljningsstrategier och rapportmallar – men data för varje affärsenhet måste förbli oberoende.
- **Hantering av flera organisationer eller dotterbolag**: Flera organisationer eller dotterbolag under ett moderbolag delar samma plattform, men varje varumärke har oberoende kund-, produkt- och orderdata.


## Installation

Hitta pluginet **Multi-space** i plugin-hanteraren och aktivera det.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)


## Användarmanual

### Hantering av Multi-space

När ni har aktiverat pluginet, gå till inställningssidan för **Användare & behörigheter** och växla till panelen **Ytor** för att hantera ytor.

> Som standard finns en inbyggd **Oallokerad yta (Unassigned Space)**, som främst används för att visa äldre data som ännu inte har associerats med en yta.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Skapa yta

Klicka på knappen ”Lägg till yta” för att skapa en ny yta:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Tilldela användare

När ni har valt en skapad yta kan ni ställa in vilka användare som tillhör den ytan på höger sida:

> **Tips:** Efter att ni har tilldelat användare till en yta måste ni **uppdatera sidan manuellt** för att listan för ytbyte i det övre högra hörnet ska uppdateras och visa de senaste ytorna.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)


### Växla och visa ytor

Ni kan byta aktuell yta i det övre högra hörnet.  
När ni klickar på **ögonikonen** till höger (markerat läge) kan ni visa data från flera ytor samtidigt.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### Datahantering för Multi-space

När pluginet är aktiverat kommer systemet automatiskt att förkonfigurera ett **yt-fält** när ni skapar en samling (Collection).  
**Endast samlingar som innehåller detta fält kommer att inkluderas i logiken för hantering av ytor.**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

För befintliga samlingar kan ni manuellt lägga till ett yt-fält för att aktivera hantering av ytor:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### Standardlogik

I samlingar som innehåller ett yt-fält tillämpar systemet automatiskt följande logik:

1. När data skapas associeras den automatiskt med den för närvarande valda ytan;
2. När data filtreras begränsas den automatiskt till data från den för närvarande valda ytan.


### Kategorisering av äldre data i ytor

För data som fanns innan pluginet Multi-space aktiverades kan ni kategorisera den i ytor genom följande steg:

#### 1. Lägg till yt-fält

Lägg till ett yt-fält manuellt i den gamla samlingen:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Tilldela användare till den oallokerade ytan

Associera användarna som hanterar äldre data med alla ytor, inklusive den **oallokerade ytan (Unassigned Space)**, för att kunna se data som ännu inte har tilldelats en yta:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Växla för att visa data från alla ytor

Välj alternativet högst upp för att visa data från alla ytor:

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Konfigurera sida för tilldelning av äldre data

Skapa en ny sida för tilldelning av äldre data. Visa ”yt-fältet” i både **listblocket** och **redigeringsformuläret** för att manuellt kunna justera tilldelningen av yta.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Ställ in yt-fältet till redigerbart läge:

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Tilldela ytor manuellt

Genom att använda sidan som nämns ovan kan ni manuellt redigera data för att gradvis tilldela rätt yta till äldre data (ni kan även konfigurera massredigering själv).