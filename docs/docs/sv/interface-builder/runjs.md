:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Skriv och kör JS online

I NocoBase erbjuder **RunJS** en lättviktig utökningsmetod som passar för **snabba experiment och tillfällig logikhantering**. Utan att behöva skapa en plugin eller ändra källkoden kan ni anpassa gränssnitt eller interaktioner med JavaScript.

Med den kan ni direkt mata in JS-kod i gränssnittsbyggaren för att uppnå:

- Anpassat renderingsinnehåll (fält, block, kolumner, objekt, etc.)  
- Anpassad interaktionslogik (knappklick, händelselänkning)  
- Dynamiskt beteende i kombination med kontextuell data  

## Scenarier som stöds

### JS-block

Genom att anpassa blockrendering med JS får ni fullständig kontroll över blockets struktur och stil.  
Det passar för att visa anpassade komponenter, statistikdiagram, tredjepartsinnehåll och andra mycket flexibla scenarier.

![20250916105031](https://static-docs.nocobase.com/20250916105031.png)  

Dokumentation: [JS-block](/interface-builder/blocks/other-blocks/js-block)

### JS-åtgärd

Anpassa klicklogiken för åtgärdsknappar med JS. Ni kan då utföra valfria frontend-åtgärder eller API-anrop.  
Till exempel: dynamiskt beräkna värden, skicka in anpassad data, utlösa popup-fönster, etc.

![20250916105123](https://static-docs.nocobase.com/20250916105123.png)  

Dokumentation: [JS-åtgärd](/interface-builder/actions/types/js-action)

### JS-fält

Anpassa fältets renderingslogik med JS. Ni kan dynamiskt visa olika stilar, innehåll eller tillstånd baserat på fältvärden.

![20250916105354](https://static-docs.nocobase.com/20250916105354.png)  

Dokumentation: [JS-fält](/interface-builder/fields/specific/js-field)

### JS-objekt

Rendera oberoende objekt med JS utan att binda dem till specifika fält. Används ofta för att visa anpassade informationsblock.

![20250916104848](https://static-docs.nocobase.com/20250916104848.png)  

Dokumentation: [JS-objekt](/interface-builder/fields/specific/js-item)

### JS-tabellkolumn

Anpassa rendering av tabellkolumner med JS.  
Detta kan implementera komplex logik för cellvisning, som till exempel förloppsindikatorer, statusetiketter, etc.

![20250916105443](https://static-docs.nocobase.com/20250916105443.png)  

Dokumentation: [JS-tabellkolumn](/interface-builder/fields/specific/js-column)

### Länkningsregler

Kontrollera länkningslogiken mellan fält i formulär eller på sidor med JS.  
Till exempel: när ett fält ändras, ändra dynamiskt ett annat fälts värde eller synlighet.

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)  

Dokumentation: [Länkningsregler](/interface-builder/linkage-rule)

### Händelseflöde

Anpassa händelseflödets utlösningsvillkor och exekveringslogik med JS för att bygga mer komplexa frontend-interaktionskedjor.

![](https://static-docs.nocobase.com/20251031092755.png)  

Dokumentation: [Händelseflöde](/interface-builder/event-flow)