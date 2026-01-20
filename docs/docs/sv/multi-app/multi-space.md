---
pkg: "@nocobase/plugin-multi-space"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::



pkg: "@nocobase/plugin-multi-space"
---

# Flera utrymmen

## Introduktion

**Plugin-programmet för flera utrymmen** möjliggör skapandet av flera oberoende datautrymmen genom logisk isolering inom en enda applikationsinstans.

#### Användningsområden
- **Flera butiker eller fabriker**: Affärsprocesser och systemkonfigurationer är mycket konsekventa, till exempel enhetlig lagerhantering, produktionsplanering, försäljningsstrategier och rapportmallar, men det är nödvändigt att säkerställa att data för varje affärsenhet inte stör varandra.
- **Hantering av flera organisationer eller dotterbolag**: Flera organisationer eller dotterbolag inom en koncern delar samma plattform, men varje varumärke har oberoende kund-, produkt- och orderdata.

## Installation

I plugin-hanteraren hittar ni **Multi-Space** plugin-programmet och aktiverar det.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)

## Användarmanual

### Hantering av flera utrymmen

Efter att ni har aktiverat plugin-programmet, gå till inställningssidan **"Användare & Behörigheter"** och växla till panelen **Utrymmen** för att hantera utrymmen.

> Initialt finns det ett inbyggt **Oallokerat utrymme (Unassigned Space)**, som främst används för att visa äldre data som inte är kopplade till något utrymme.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Skapa ett utrymme

Klicka på knappen "Lägg till utrymme" för att skapa ett nytt utrymme:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Tilldela användare

Efter att ni har valt ett skapat utrymme kan ni tilldela användare som tillhör det utrymmet på höger sida:

> **Tips:** Efter att ni har tilldelat användare till ett utrymme behöver ni **manuellt uppdatera sidan** för att listan för utrymmesväxling i det övre högra hörnet ska uppdateras och visa det senaste utrymmet.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)

### Växla och visa flera utrymmen

Ni kan växla det aktuella utrymmet i det övre högra hörnet.
När ni klickar på **ögonikonen** till höger (i dess markerade tillstånd) kan ni samtidigt visa data från flera utrymmen.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### Hantering av data i flera utrymmen

Efter att ni har aktiverat plugin-programmet kommer systemet automatiskt att lägga till ett **Utrymmesfält** när ni skapar en samling.
**Endast samlingar som innehåller detta fält kommer att inkluderas i logiken för utrymmeshantering.**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

För befintliga samlingar kan ni manuellt lägga till ett Utrymmesfält för att aktivera utrymmeshantering:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### Standardlogik

I samlingar som innehåller Utrymmesfältet kommer systemet automatiskt att tillämpa följande logik:

1. När ni skapar data kopplas den automatiskt till det för närvarande valda utrymmet;
2. När ni filtrerar data begränsas den automatiskt till data från det för närvarande valda utrymmet.

### Klassificera äldre data i flera utrymmen

För data som fanns innan plugin-programmet för flera utrymmen aktiverades kan ni klassificera den i utrymmen genom att följa dessa steg:

#### 1. Lägg till Utrymmesfältet

Lägg manuellt till Utrymmesfältet i den gamla samlingen:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Tilldela användare till det oallokerade utrymmet

Koppla användaren som hanterar äldre data till alla utrymmen, inklusive det **Oallokerade utrymmet (Unassigned Space)**, för att kunna visa data som ännu inte har tilldelats ett utrymme:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Växla för att visa data från alla utrymmen

Välj att visa data från alla utrymmen högst upp:

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Konfigurera en sida för tilldelning av äldre data

Skapa en ny sida för tilldelning av äldre data. Visa "Utrymmesfältet" på **listningssidan** och **redigeringssidan** för att manuellt justera utrymmestilldelningen.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Gör Utrymmesfältet redigerbart

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Tilldela data till utrymmen manuellt

Via den sida som skapats ovan kan ni manuellt redigera data för att gradvis tilldela rätt utrymme till den äldre datan (ni kan också konfigurera massredigering själva).