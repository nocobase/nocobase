:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Redigera popup

## Introduktion

Alla åtgärder eller fält som kan öppna ett popup-fönster när de klickas på, stöder konfiguration av popup-fönstrets öppningssätt, storlek med mera.

![20251027212617](https://static-docs.nocobase.com/20251027212617.png)

![20251027212800](https://static-docs.nocobase.com/20251027212800.png)

## Öppningsläge

- Låda

![20251027212832](https://static-docs.nocobase.com/20251027212832.png)

- Dialogruta

![20251027212905](https://static-docs.nocobase.com/20251027212905.png)

- Undersida

![20251027212940](https://static-docs.nocobase.com/20251027212940.png)

## Popup-storlek

- Stor
- Mellan (standard)
- Liten

## Popup-UID

”Popup-UID” är UID:et för den komponent som öppnar popup-fönstret. Det motsvarar också `viewUid`-segmentet i `view/:viewUid` i den aktuella adressfältet. Ni kan snabbt hämta det genom att klicka på ”Kopiera popup-UID” i inställningsmenyn för det fält eller den knapp som utlöser popup-fönstret.

![popup-copy-uid-20251102](https://static-docs.nocobase.com/popup-copy-uid-20251102.png)

Genom att ange popup-UID möjliggörs återanvändning av popup-fönster.

### Intern popup (standard)
- ”Popup-UID” är lika med UID:et för den aktuella åtgärdsknappen (som standard används denna knapps UID).

### Extern popup (återanvändning av popup)
- Fyll i UID:et för en annan utlösande knapp (dvs. popup-UID:et) i fältet ”Popup-UID” för att återanvända det popup-fönstret på en annan plats.
- Typisk användning: Flera sidor/block delar samma popup-gränssnitt och logik för att undvika dubbelkonfiguration.
- Vid användning av en extern popup kan vissa konfigurationer inte ändras (se nedan).

## Andra relaterade konfigurationer

- `Datakälla / Samling`: Skrivskyddad. Visar vilken datakälla och samling popup-fönstret är bundet till. Som standard används den aktuella blockets samling. I externt popup-läge används mål-popup-fönstrets konfiguration, och denna inställning kan inte ändras.
- `Kopplingsnamn`: Valfritt. Används för att öppna popup-fönstret från ett ”kopplingsfält”; visas endast när ett standardvärde finns. I externt popup-läge används mål-popup-fönstrets konfiguration, och denna inställning kan inte ändras.
- `Käll-ID`: Visas endast när `Kopplingsnamn` är inställt. Använder som standard den aktuella kontextens `sourceId`, men kan vid behov ändras till en variabel eller ett fast värde.
- `filterByTk`: Kan vara tomt, en valfri variabel eller ett fast värde, och används för att begränsa vilka dataposter som laddas i popup-fönstret.

![popup-config-20251102](https://static-docs.nocobase.com/popup-config-20251102.png)