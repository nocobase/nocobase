---
pkg: "@nocobase/plugin-data-source-main"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Huvuddatabas

## Introduktion

NocoBases huvuddatabas kan användas för att lagra både affärsdata och applikationens metadata, inklusive systemtabelldata och anpassad tabelldata. Huvuddatabasen stöder relationsdatabaser som MySQL, PostgreSQL med flera. När du installerar NocoBase-applikationen måste huvuddatabasen installeras samtidigt och kan inte tas bort.

## Installation

Detta är en inbyggd plugin och kräver ingen separat installation.

## Samlingshantering

Huvuddatakällan erbjuder fullständig samlingshantering, vilket gör att du kan skapa nya tabeller via NocoBase och synkronisera befintliga tabellstrukturer från databasen.

![20240322230134](https://static-docs.nocobase.com/20240322230134.png)

### Synkronisera befintliga tabeller från databasen

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

En viktig funktion hos huvuddatakällan är möjligheten att synkronisera tabeller som redan finns i databasen till NocoBase för hantering. Detta innebär:

- **Skydda befintliga investeringar**: Om du redan har många affärstabeller i din databas behöver du inte återskapa dem – du kan synkronisera och använda dem direkt.
- **Flexibel integration**: Tabeller som skapats med andra verktyg (som SQL-skript, databashanteringsverktyg etc.) kan inkluderas i NocoBases hantering.
- **Progressiv migrering**: Stöd för att gradvis migrera befintliga system till NocoBase, snarare än att omstrukturera allt på en gång.

Med funktionen "Ladda från databas" kan du:
1. Bläddra bland alla tabeller i databasen
2. Välja de tabeller du vill synkronisera
3. Automatiskt identifiera tabellstrukturer och fälttyper
4. Importera dem till NocoBase för hantering med ett klick

### Stöd för flera samlingstyper

![nocobase_doc-2025-10-29-19-47-14](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-47-14.png)

NocoBase stöder skapande och hantering av olika typer av samlingar:
- **Allmän samling**: Inbyggda vanliga systemfält.
- **Ärvd samling**: Gör det möjligt att skapa en föräldratabell från vilken undertabeller kan härledas. Undertabeller ärver föräldratabellens struktur och kan definiera sina egna kolumner.
- **Trädsamling**: Trädstrukturerad tabell, stöder för närvarande endast design med intilliggande lista.
- **Kalendersamling**: För att skapa kalenderrelaterade händelsetabeller.
- **Filsamling**: För hantering av fillagring.
- **Uttryckssamling**: För dynamiska uttrycksscenarier i arbetsflöden.
- **SQL-samling**: Inte en faktisk databastabell, utan presenterar snabbt SQL-frågor på ett strukturerat sätt.
- **Databasvy-samling**: Ansluter till befintliga databasvyer.
- **FDW-samling**: Tillåter databassystemet att direkt komma åt och fråga data i externa datakällor, baserat på FDW-teknik.

### Stöd för klassificeringshantering av samlingar

![20240322231520](https://static-docs.nocobase.com/20240322231520.png)

### Rika fälttyper

![nocobase_doc-2025-10-29-19-48-51](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-48-51.png)

#### Flexibel fälttypkonvertering

NocoBase stöder flexibel fälttypkonvertering baserat på samma databastyp.

**Exempel: Konverteringsalternativ för fält av typen String**

När ett databasfält är av typen String kan det konverteras till någon av följande former i NocoBase:

- **Grundläggande**: Enradstext, Flerradstext, Telefonnummer, E-post, URL, Lösenord, Färg, Ikon
- **Val**: Enkelval (drop-down), Radioknappsgrupp
- **Media**: Markdown, Markdown (Vditor), Rich Text, Bilaga (URL)
- **Datum & Tid**: Datumtid (med tidszon), Datumtid (utan tidszon)
- **Avancerat**: Sekvens, Samlingsväljare, Kryptering

Denna flexibla konverteringsmekanism innebär:
- **Ingen ändring av databasstrukturen krävs**: Fältets underliggande lagringstyp förblir oförändrad; endast dess representation i NocoBase ändras.
- **Anpassning till affärsförändringar**: När affärsbehoven utvecklas kan du snabbt justera fältets visning och interaktionsmetoder.
- **Datasäkerhet**: Konverteringsprocessen påverkar inte integriteten hos befintlig data.

### Flexibel synkronisering på fältnivå

NocoBase synkroniserar inte bara hela tabeller utan stöder också detaljerad synkroniseringshantering på fältnivå:

![nocobase_doc-2025-10-29-19-49-56](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-49-56.png)

#### Funktioner för fältsynkronisering:

1. **Realtidssynkronisering**: När databastabellstrukturen ändras kan nyligen tillagda fält synkroniseras när som helst.
2. **Selektiv synkronisering**: Du kan selektivt synkronisera de fält du behöver, snarare än alla fält.
3. **Automatisk typidentifiering**: Identifierar automatiskt databasfälttyper och mappar dem till NocoBases fälttyper.
4. **Bibehållen dataintegritet**: Synkroniseringsprocessen påverkar inte befintlig data.

#### Användningsfall:

- **Utveckling av databasschema**: När affärsbehoven ändras och nya fält behöver läggas till i databasen kan de snabbt synkroniseras till NocoBase.
- **Teamarbete**: När andra teammedlemmar eller databasadministratörer (DBA) lägger till fält i databasen kan de synkroniseras omgående.
- **Hybrid hanteringsläge**: Vissa fält hanteras via NocoBase, andra via traditionella metoder – flexibla kombinationer.

Denna flexibla synkroniseringsmekanism gör att NocoBase kan integreras väl i befintliga tekniska arkitekturer, utan att kräva ändringar av befintliga databashanteringsmetoder, samtidigt som du kan dra nytta av den bekvämlighet som NocoBase erbjuder för lågkodutveckling.

Se mer i avsnittet "[Samlingsfält / Översikt](/data-sources/data-modeling/collection-fields)".