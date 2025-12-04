:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Bilagafält

## Introduktion

Systemet har ett inbyggt fält av typen ”Bilaga” för att stödja filuppladdningar i anpassade samlingar.

Bilagafältet är i grunden ett många-till-många-relationsfält som pekar på den inbyggda samlingen ”Attachments” (`attachments`). När ett bilagafält skapas i en samling genereras automatiskt en kopplingstabell för många-till-många-relationen. Metadatan för uppladdade filer lagras i samlingen ”Attachments”, och filinformationen som refereras i samlingen kopplas via denna kopplingstabell.

## Fältkonfiguration

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### MIME-typbegränsningar

Används för att begränsa vilka filtyper som får laddas upp, med hjälp av [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)-syntaxen. Till exempel: `image/*` representerar bildfiler. Flera typer kan separeras med ett kommatecken, till exempel: `image/*,application/pdf` tillåter både bild- och PDF-filer.

### Lagringsmotor

Välj den lagringsmotor som ska användas för att lagra uppladdade filer. Om fältet lämnas tomt används systemets standardlagringsmotor.