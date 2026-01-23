:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Bilagefält

## Introduktion

Systemet har ett inbyggt fält av typen "Bilagefält" för att stödja filuppladdningar i anpassade samlingar.

I grunden är bilagefältet ett många-till-många-relationsfält som pekar på systemets inbyggda samling "Attachments" (`attachments`). När ni skapar ett bilagefält i en samling genereras automatiskt en många-till-många-kopplingstabell. Metadata för uppladdade filer lagras i samlingen "Attachments", och filinformationen som refereras i er samling länkas via denna kopplingstabell.

## Fältkonfiguration

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### Begränsning av MIME-typer

Används för att begränsa vilka filtyper som får laddas upp, med hjälp av [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)-syntax. Till exempel representerar `image/*` bildfiler. Flera typer kan separeras med kommatecken, till exempel `image/*,application/pdf`, vilket tillåter både bild- och PDF-filer.

### Lagringsmotor

Välj den lagringsmotor som ska användas för uppladdade filer. Om fältet lämnas tomt används systemets standardlagringsmotor.