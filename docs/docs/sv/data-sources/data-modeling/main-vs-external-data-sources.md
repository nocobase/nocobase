:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Huvuddatabas kontra externa databaser

Skillnaderna mellan huvuddatabasen och externa databaser i NocoBase märks främst inom fyra områden: stöd för databastyper, stöd för samlingstyper, stöd för fälttyper samt funktioner för säkerhetskopiering och migrering.

## 1. Stöd för databastyper

För mer information, se: [Hantering av datakällor](https://docs.nocobase.com/data-sources/data-source-manager)

### Databastyper

| Databastyp | Stöd för huvuddatabas | Stöd för extern databas |
|-----------|-----------------------|-------------------------|
| PostgreSQL | ✅ | ✅ |
| MySQL | ✅ | ✅ |
| MariaDB | ✅ | ✅ |
| KingbaseES | ✅ | ✅ |
| MSSQL | ❌ | ✅ |
| Oracle | ❌ | ✅ |

### Samlingshantering

| Samlingshantering | Stöd för huvuddatabas | Stöd för extern databas |
|-------------------|-----------------------|-------------------------|
| Grundläggande hantering | ✅ | ✅ |
| Visuell hantering | ✅ | ❌ |

## 2. Stöd för samlingstyper

För mer information, se: [Samlingar](https://docs.nocobase.com/data-sources/data-modeling/collection)

| Samlingstyp | Huvuddatabas | Extern databas | Beskrivning |
|-----------|--------------|----------------|-------------|
| Grundläggande samling | ✅ | ✅ | Grundläggande samling |
| Vysamling | ✅ | ✅ | Datakällvy |
| Ärftlig samling | ✅ | ❌ | Stöder datamodellsarv, endast för huvuddatakällan |
| Filsamling | ✅ | ❌ | Stöder filuppladdningar, endast för huvuddatakällan |
| Kommentarsamling | ✅ | ❌ | Inbyggt kommentarsystem, endast för huvuddatakällan |
| Kalendersamling | ✅ | ❌ | Samling för kalendervyer |
| Uttryckssamling | ✅ | ❌ | Stöder formelberäkningar |
| Trädsamling | ✅ | ❌ | För datamodellering av trädstrukturer |
| SQL-samling | ✅ | ❌ | Samling definierad via SQL |
| Extern anslutningssamling | ✅ | ❌ | Anslutningssamling för externa datakällor, begränsad funktionalitet |

## 3. Stöd för fälttyper

För mer information, se: [Samlingsfält](https://docs.nocobase.com/data-sources/data-modeling/collection-fields)

### Grundläggande typer

| Fälttyp | Huvuddatabas | Extern databas |
|---------|--------------|----------------|
| Enradig text | ✅ | ✅ |
| Fleradigt text | ✅ | ✅ |
| Telefonnummer | ✅ | ✅ |
| E-post | ✅ | ✅ |
| URL | ✅ | ✅ |
| Heltal | ✅ | ✅ |
| Tal | ✅ | ✅ |
| Procent | ✅ | ✅ |
| Lösenord | ✅ | ✅ |
| Färg | ✅ | ✅ |
| Ikon | ✅ | ✅ |

### Valtyper

| Fälttyp | Huvuddatabas | Extern databas |
|---------|--------------|----------------|
| Kryssruta | ✅ | ✅ |
| Rullgardinsmeny (enkelval) | ✅ | ✅ |
| Rullgardinsmeny (flerval) | ✅ | ✅ |
| Radioknappsgrupp | ✅ | ✅ |
| Kryssrutegrupp | ✅ | ✅ |
| Kinesisk region | ✅ | ❌ |

### Mediatyper

| Fälttyp | Huvuddatabas | Extern databas |
|---------|--------------|----------------|
| Media | ✅ | ✅ |
| Markdown | ✅ | ✅ |
| Markdown (Vditor) | ✅ | ✅ |
| Rik text | ✅ | ✅ |
| Bilaga (koppling) | ✅ | ❌ |
| Bilaga (URL) | ✅ | ✅ |

### Datum- och tidtyper

| Fälttyp | Huvuddatabas | Extern databas |
|---------|--------------|----------------|
| Datum och tid (med tidszon) | ✅ | ✅ |
| Datum och tid (utan tidszon) | ✅ | ✅ |
| Unix-tidsstämpel | ✅ | ✅ |
| Datum (utan tid) | ✅ | ✅ |
| Tid | ✅ | ✅ |

### Geometriska typer

| Fälttyp | Huvuddatabas | Extern databas |
|---------|--------------|----------------|
| Punkt | ✅ | ✅ |
| Linje | ✅ | ✅ |
| Cirkel | ✅ | ✅ |
| Polygon | ✅ | ✅ |

### Avancerade typer

| Fälttyp | Huvuddatabas | Extern databas |
|---------|--------------|----------------|
| UUID | ✅ | ✅ |
| Nano ID | ✅ | ✅ |
| Sortering | ✅ | ✅ |
| Beräkningsformel | ✅ | ✅ |
| Sekvens | ✅ | ✅ |
| JSON | ✅ | ✅ |
| Samlingsväljare | ✅ | ❌ |
| Kryptering | ✅ | ✅ |

### Systeminformationsfält

| Fälttyp | Huvuddatabas | Extern databas |
|---------|--------------|----------------|
| Skapad den | ✅ | ✅ |
| Senast uppdaterad den | ✅ | ✅ |
| Skapad av | ✅ | ❌ |
| Senast uppdaterad av | ✅ | ❌ |
| Tabell-OID | ✅ | ❌ |

### Relationstyper

| Fälttyp | Huvuddatabas | Extern databas |
|---------|--------------|----------------|
| En-till-en | ✅ | ✅ |
| En-till-många | ✅ | ✅ |
| Många-till-en | ✅ | ✅ |
| Många-till-många | ✅ | ✅ |
| Många-till-många (array) | ✅ | ✅ |

:::info
Bilagefält är beroende av filsamingar, vilka endast stöds av huvuddatabaser. Därför har externa databaser för närvarande inte stöd för bilagefält.
:::

## 4. Jämförelse av stöd för säkerhetskopiering och migrering

| Funktion | Huvuddatabas | Extern databas |
|----------|--------------|----------------|
| Säkerhetskopiering och återställning | ✅ | ❌ (Användaren hanterar själv) |
| Migreringshantering | ✅ | ❌ (Användaren hanterar själv) |

:::info
NocoBase erbjuder funktioner för säkerhetskopiering, återställning och strukturmigrering för huvuddatabaser. För externa databaser måste dessa åtgärder utföras självständigt av användaren, baserat på deras egen databasmiljö. NocoBase tillhandahåller inget inbyggt stöd för detta.
:::

## Sammanfattande jämförelse

| Jämförelsepunkt | Huvuddatabas | Extern databas |
|-----------------|--------------|----------------|
| Databastyper | PostgreSQL, MySQL, MariaDB, KingbaseES | PostgreSQL, MySQL, MariaDB, MSSQL, Oracle, KingbaseES |
| Stöd för samlingstyper | Alla samlingstyper | Endast grundläggande samlingar och vysamlingar |
| Stöd för fälttyper | Alla fälttyper | Alla fälttyper utom bilagefält |
| Säkerhetskopiering och migrering | Inbyggt stöd | Användaren hanterar själv |

## Rekommendationer

- **Om ni använder NocoBase för att bygga ett helt nytt affärssystem**, rekommenderar vi att ni använder **huvuddatabasen**. Detta ger er tillgång till NocoBases fullständiga funktionalitet.
- **Om ni använder NocoBase för att ansluta till databaser från andra system för grundläggande CRUD-operationer**, då bör ni använda **externa databaser**.