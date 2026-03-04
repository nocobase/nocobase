---
pkg: "@nocobase/plugin-ui-templates"
---

:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/interface-builder/ui-templates).
:::

# UI-mallar

## Introduktion

Gränssnittsmallar används för att återanvända konfigurationer i gränssnittsbygget, vilket minskar upprepat arbete och håller konfigurationer synkroniserade på flera platser vid behov.

För närvarande stöds följande malltyper:

- **Blockmall**: Återanvänd hela blockkonfigurationer.
- **Fältmall**: Återanvänd konfigurationen för "fältområdet" i formulär- eller detaljblock.
- **Popup-mall**: Återanvänd konfigurationer för popup-fönster som triggas av åtgärder eller fält.

## Kärnbegrepp

### Referens och Kopia

Det finns vanligtvis två sätt att använda mallar:

- `Referens`: Flera platser delar samma mallkonfiguration. Om ni ändrar mallen eller någon referenspunkt synkroniseras uppdateringarna till alla andra platser som refererar till den.
- `Kopiera`: Kopiera som en oberoende konfiguration. Efterföljande ändringar påverkar inte varandra.

### Spara som mall

När ett block eller ett popup-fönster har konfigurerats kan ni använda `Spara som mall` i dess inställningsmeny och välja sparmetod:

- `Konvertera nuvarande... till mall`: Efter att ha sparat kommer den nuvarande positionen att växla till att referera till den mallen.
- `Kopiera nuvarande... som mall`: Skapar endast mallen; den nuvarande positionen förblir oförändrad.

## Blockmall

### Spara block som mall

1) Öppna inställningsmenyn för målblocket och klicka på `Spara som mall`.  
2) Fyll i `Mallnamn` / `Mallbeskrivning` och välj sparläge:
   - `Konvertera nuvarande block till mall`: Efter att ha sparat ersätts den nuvarande positionen med ett `Blockmall`-block (det vill säga en referens till mallen).
   - `Kopiera nuvarande block som mall`: Skapar endast mallen; det nuvarande blocket förblir oförändrat.

![save-as-template-block-20251228](https://static-docs.nocobase.com/save-as-template-block-20251228.png)

![save-as-template-block-full-20251228](https://static-docs.nocobase.com/save-as-template-block-full-20251228.png)

### Använda blockmallar

1) Lägg till block → "Övriga block" → `Blockmall`.  
2) I konfigurationen väljer ni:
   - `Mall`: Välj en mall.
   - `Läge`: `Referens` eller `Kopiera`.

![block-template-menu-20251228](https://static-docs.nocobase.com/block-template-menu-20251228.png)

![select-block-template-20251228](https://static-docs.nocobase.com/select-block-template-20251228.png)

### Konvertera referens till kopia

När ett block refererar till en mall kan ni använda `Konvertera referens till kopia` i blockets inställningsmeny för att ändra det nuvarande blocket till ett vanligt block (bryta referensen). Efterföljande ändringar kommer då inte att påverka varandra.

![convert-block-template-duplicate-20251228](https://static-docs.nocobase.com/convert-block-template-duplicate-20251228.png)

### Observera

- Läget `Kopiera` kommer att generera nya UID:n för blocket och dess undernoder. Vissa konfigurationer som är beroende av UID:n kan behöva konfigureras om.

## Fältmall

Fältmallar används för att återanvända konfigurationer av fältområden (fältval, layout och fältinställningar) i **formulärblock** och **detaljblock**, vilket undviker att ni behöver lägga till fält upprepade gånger på flera sidor eller block.

> Fältmallar påverkar endast "fältområdet" och ersätter inte hela blocket. För att återanvända ett helt block, använd blockmallen som beskrivs ovan.

### Använda fältmallar i formulär-/detaljblock

1) Gå in i konfigurationsläget och öppna menyn "Fält" i ett formulärblock eller detaljblock.  
2) Välj `Fältmall`.  
3) Välj en mall och välj läge: `Referens` eller `Kopiera`.

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

![use-field-template-config-20251228](https://static-docs.nocobase.com/use-field-template-config-20251228.png)

#### Meddelande om överskrivning

När det redan finns fält i blocket kommer användning av läget **Referens** vanligtvis att visa en bekräftelsefråga (eftersom de refererade fälten kommer att ersätta det nuvarande fältområdet).

### Konvertera refererade fält till kopia

När ett block refererar till en fältmall kan ni använda `Konvertera refererade fält till kopia` i blockets inställningsmeny för att göra det nuvarande fältområdet till en oberoende konfiguration (bryta referensen).

![convert-field-template-duplicate-20251228](https://static-docs.nocobase.com/convert-field-template-duplicate-20251228.png)

### Observera

- Fältmallar är endast tillämpliga på **formulärblock** och **detaljblock**.
- Om mallen och det nuvarande blocket är bundna till olika datatabeller, kommer mallen att visas som otillgänglig i väljaren med en förklaring till varför.
- Om ni vill göra "personliga justeringar" av fält i det nuvarande blocket rekommenderas det att använda läget `Kopiera` direkt, eller först utföra "Konvertera refererade fält till kopia".

## Popup-mall

Popup-mallar används för att återanvända en uppsättning popup-gränssnitt och interaktionslogik. För allmänna konfigurationer som öppningsmetod och storlek, se [Redigera popup](/interface-builder/actions/action-settings/edit-popup).

### Spara popup som mall

1) Öppna inställningsmenyn för en knapp eller ett fält som kan trigga en popup, klicka på `Spara som mall`.  
2) Fyll i mallnamn/beskrivning och välj sparläge:
   - `Konvertera nuvarande popup till mall`: Efter att ha sparat kommer den nuvarande popupen att växla till att referera till den mallen.
   - `Kopiera nuvarande popup som mall`: Skapar endast mallen; den nuvarande popupen förblir oförändrad.

![save-as-template-popup-20251228](https://static-docs.nocobase.com/save-as-template-popup-20251228.png)

### Använda mall i popup-konfiguration

1) Öppna popup-konfigurationen för knappen eller fältet.  
2) Välj en mall i `Popup-mall` för att återanvända den.

![edit-popup-select-20251228](https://static-docs.nocobase.com/edit-popup-select-20251228.png)

### Användningsvillkor (mallens tillgänglighetsområde)

Popup-mallar är relaterade till det åtgärdsscenario som triggar popupen. Väljaren kommer automatiskt att filtrera bort eller inaktivera inkompatibla mallar baserat på det aktuella scenariot (orsaker visas om villkoren inte uppfylls).

| Nuvarande åtgärdstyp | Tillgängliga popup-mallar |
| --- | --- |
| **Samlingsåtgärd** | Popup-mallar skapade av samlingsåtgärder för samma samling |
| **Icke-associerad poståtgärd** | Popup-mallar skapade av samlingsåtgärder eller icke-associerade poståtgärder för samma samling |
| **Associerad poståtgärd** | Popup-mallar skapade av samlingsåtgärder eller icke-associerade poståtgärder för samma samling; eller popup-mallar skapade av associerade poståtgärder för samma associationsfält |

### Popup-fönster för relationsdata

Popup-fönster som triggas av relationsdata (associationsfält) har speciella matchningsregler:

#### Strikt matchning för associerade popup-mallar

När en popup-mall skapas från en **associerad poståtgärd** (mallen har ett `associationName`), kan den mallen endast användas av åtgärder/fält med **exakt samma associationsfält**.

Exempel: En popup-mall skapad på associationsfältet `Order.Kund` kan endast användas av andra åtgärder för fältet `Order.Kund`. Den kan inte användas av fältet `Order.Referent` (även om båda pekar på samma datatabell `Kund`).

Detta beror på att den associerade popup-mallens interna variabler och konfigurationer är beroende av den specifika relationskontexten.

#### Associerade åtgärder som återanvänder mallar från målsamlingen

Associationsfält/åtgärder kan återanvända **icke-associerade popup-mallar från måldatatabellen** (mallar skapade av samlingsåtgärder eller icke-associerade poståtgärder), så länge datatabellen matchar.

Exempel: Associationsfältet `Order.Kund` kan använda popup-mallar från datatabellen `Kund`. Detta tillvägagångssätt är lämpligt för att dela samma popup-konfiguration över flera associationsfält (till exempel en enhetlig kunddetalj-popup).

### Konvertera referens till kopia

När en popup refererar till en mall kan ni använda `Konvertera referens till kopia` i inställningsmenyn för att göra den nuvarande popupen till en oberoende konfiguration (bryta referensen).

![convert-popup-to-duplicate-20251228](https://static-docs.nocobase.com/convert-popup-to-duplicate-20251228.png)


## Hantering av mallar

I Systeminställningar → `UI-mallar` kan ni visa och hantera alla mallar:

- **Blockmallar (v2)**: Hantera blockmallar.
- **Popup-mallar (v2)**: Hantera popup-mallar.

> Fältmallar härstammar från blockmallar och hanteras inom blockmallar.

![block-template-list-20251228](https://static-docs.nocobase.com/block-template-list-20251228.png)

Åtgärder som stöds: Visa, filtrera, redigera, radera.

> **Observera**: Om en mall för närvarande refereras kan den inte raderas direkt. Använd först `Konvertera referens till kopia` på de platser som refererar till mallen för att bryta referensen, och radera sedan mallen.