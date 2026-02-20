:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Rullgardinsmeny

## Introduktion

Rullgardinsmenyn låter dig koppla data genom att välja från befintlig data i målsamlingen, eller genom att lägga till ny data för koppling. Alternativen i rullgardinsmenyn stöder också suddig sökning.

![20251029205901](https://static-docs.nocobase.com/20251029205901.png)

## Fältkonfiguration

### Ställ in datamängd

Styr datamängden för rullgardinslistan.

![20251029210025](https://static-docs.nocobase.com/20251029210025.png)

För mer information, se [Ställ in datamängd](/interface-builder/fields/field-settings/data-scope)

### Ställ in sorteringsregler

Styr sorteringen av data i rullgardinsmenyn.

Exempel: Sortera efter tjänstedatum i fallande ordning.

![20251029210105](https://static-docs.nocobase.com/20251029210105.png)

### Tillåt att lägga till/koppla flera poster

Begränsar en 'många-till-många'-relation till att endast tillåta koppling av en post.

![20251029210145](https://static-docs.nocobase.com/20251029210145.png)

### Rubrikfält

Rubrikfältet är det etikettfält som visas i alternativen.

![20251029210507](https://static-docs.nocobase.com/20251029210507.gif)

> Stöder snabbsökning baserad på rubrikfältet.

För mer information, se [Rubrikfält](/interface-builder/fields/field-settings/title-field)

### Snabbskapande: Lägg till först, välj sedan

![20251125220046](https://static-docs.nocobase.com/20251125220046.png)

#### Lägg till via rullgardinsmeny

Efter att ha skapat en ny post i målsamlingen väljer systemet den automatiskt och kopplar den när formuläret skickas in.

I exemplet nedan har samlingen "Orders" ett "många-till-en"-relationsfält **"Account"**.

![20251125220447](https://static-docs.nocobase.com/20251125220447.gif)

#### Lägg till via modal

Att lägga till via modal är lämpligt för mer komplexa datainmatningsscenarier och låter dig konfigurera ett anpassat formulär för att skapa nya poster.

![20251125220607](https://static-docs.nocobase.com/20251125220607.gif)

[Fältkomponent](/interface-builder/fields/association-field)