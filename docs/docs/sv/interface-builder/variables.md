:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Variabler

## Introduktion

Variabler är en uppsättning symboler som används för att identifiera ett värde i det aktuella sammanhanget. Ni kan använda dem i olika scenarier, till exempel när ni konfigurerar blockens dataomfång, standardvärden för fält, kopplingsregler och arbetsflöden.

![20251030114458](https://static-docs.nocobase.com/20251030114458.png)

## Variabler som stöds för närvarande

### Aktuell användare

Representerar data för den för närvarande inloggade användaren.

![20240416154950](https://static-docs.nocobase.com/20240416154950.png)

### Aktuell roll

Representerar rollidentifieraren (rollnamnet) för den för närvarande inloggade användaren.

![20240416155100](https://static-docs.nocobase.com/20240416155100.png)

### Aktuellt formulär

Värdena för det aktuella formuläret, som endast används i formulärblock. Användningsområden inkluderar:

- Kopplingsregler för det aktuella formuläret
- Standardvärden för formulärfält (gäller endast vid tillägg av ny data)
- Inställningar för dataomfång för relationsfält
- Konfiguration för fältvärdetilldelning vid skicka-åtgärder

#### Kopplingsregler för det aktuella formuläret

![20251027114920](https://static-docs.nocobase.com/20251027114920.png)

#### Standardvärden för formulärfält (endast för nya formulär)

![20251027115016](https://static-docs.nocobase.com/20251027115016.png)

#### Inställningar för dataomfång för relationsfält

Används för att dynamiskt filtrera alternativen för ett nedströmsfält baserat på ett uppströmsfält, vilket säkerställer korrekt datainmatning.

**Exempel:**

1. Användaren väljer ett värde för fältet **Owner**.
2. Systemet filtrerar automatiskt alternativen för fältet **Account** baserat på den valda Ownerns **userName**.

![20251030151928](https://static-docs.nocobase.com/20251030151928.png)

### Aktuell post

En post avser en rad i en samling, där varje rad representerar en enskild post. Variabeln "Aktuell post" är tillgänglig i **kopplingsreglerna för radåtgärder** i block av visningstyp.

Exempel: Inaktivera raderingsknappen för dokument som är "Betalda".

![20251027120217](https://static-docs.nocobase.com/20251027120217.png)

### Aktuell popup-post

Popup-åtgärder spelar en mycket viktig roll i NocoBase gränssnittskonfiguration.

- Popup för radåtgärder: Varje popup har en variabel "Aktuell popup-post" som representerar den aktuella radposten.
- Popup för relationsfält: Varje popup har en variabel "Aktuell popup-post" som representerar den aktuella klickade relationsposten.

Block inom en popup kan använda variabeln "Aktuell popup-post". Relaterade användningsområden inkluderar:

- Konfigurera ett blocks dataomfång
- Konfigurera dataomfånget för ett relationsfält
- Konfigurera standardvärden för fält (i ett formulär för att lägga till ny data)
- Konfigurera kopplingsregler för åtgärder

### URL-frågeparametrar

Denna variabel representerar frågeparametrarna i den aktuella sidans URL. Den är endast tillgänglig när en frågesträng finns i sidans URL. Det är smidigare att använda den tillsammans med [Länkåtgärden](/interface-builder/actions/types/link).

![20251027173017](https://static-docs.nocobase.com/20251027173017.png)

![20251027173121](https://static-docs.nocobase.com/20251027173121.png)

### API-token

Värdet för denna variabel är en sträng, som är en autentiseringsuppgift för att komma åt NocoBase API. Den kan användas för att verifiera användarens identitet.

### Aktuell enhetstyp

Exempel: Visa inte åtgärden "Skriv ut mall" på enheter som inte är datorer.

![20251029215303](https://static-docs.nocobase.com/20251029215303.png)