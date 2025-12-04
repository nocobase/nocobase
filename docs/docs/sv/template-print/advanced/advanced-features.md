:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

## Avancerade funktioner

### Sidnumrering

#### 1. Uppdatera sidnummer

##### Syntax
Infoga det helt enkelt i ditt Office-program.

##### Exempel
I Microsoft Word:
- Använd funktionen "Infoga → Sidnummer".
I LibreOffice:
- Använd funktionen "Infoga → Fält → Sidnummer".

##### Resultat
I den genererade rapporten uppdateras sidnumren på varje sida automatiskt.

#### 2. Generera innehållsförteckning

##### Syntax
Infoga det helt enkelt i ditt Office-program.

##### Exempel
I Microsoft Word:
- Använd funktionen "Infoga → Index och tabeller → Innehållsförteckning".
I LibreOffice:
- Använd funktionen "Infoga → Innehållsförteckning och index → Innehållsförteckning, index eller bibliografi".

##### Resultat
Rapportens innehållsförteckning uppdateras automatiskt baserat på dokumentets innehåll.

#### 3. Upprepa tabellhuvuden

##### Syntax
Infoga det helt enkelt i ditt Office-program.

##### Exempel
I Microsoft Word:
- Högerklicka på tabellhuvudet → Tabellegenskaper → Markera "Upprepa som rubrikrad överst på varje sida".
I LibreOffice:
- Högerklicka på tabellhuvudet → Tabellegenskaper → Fliken Textflöde → Markera "Upprepa rubrik".

##### Resultat
När en tabell sträcker sig över flera sidor upprepas tabellhuvudet automatiskt överst på varje sida.

### Internationalisering (i18n)

#### 1. Översättning av statisk text

##### Syntax
Använd taggen `{t(text)}` för att internationalisera statisk text:
```
{t(meeting)}
```

##### Exempel
I mallen:
```
{t(meeting)} {t(apples)}
```
Motsvarande översättningar tillhandahålls i JSON-data eller en extern lokaliseringsordlista (t.ex. för "fr-fr"), som "meeting" → "rendez-vous" och "apples" → "Pommes".

##### Resultat
När rapporten genereras kommer texten att ersättas med motsvarande översättning baserat på målspråket.

#### 2. Översättning av dynamisk text

##### Syntax
För datainnehåll kan du använda formateraren `:t`, till exempel:
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```

##### Exempel
I mallen:
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```
JSON-data och lokaliseringsordlistan tillhandahåller de lämpliga översättningarna.

##### Resultat
Baserat på villkoret kommer utdata att vara antingen "lundi" eller "mardi" (med målspråket som exempel).

### Nyckel-värde-mappning

#### 1. Uppräkningskonvertering (:convEnum)

##### Syntax
```
{data:convEnum(enumName)}
```
Till exempel:
```
0:convEnum('ORDER_STATUS')
```

##### Exempel
I ett API-alternativsexempel tillhandahålls följande:
```json
{
  "enum": {
    "ORDER_STATUS": ["pending", "sent", "delivered"]
  }
}
```
I mallen:
```
0:convEnum('ORDER_STATUS')
```

##### Resultat
Utdata blir "pending"; om indexet överskrider uppräkningsintervallet, matas det ursprungliga värdet ut.

### Dynamiska bilder
:::info
Stöder för närvarande filtyperna XLSX och DOCX
:::
Du kan infoga "dynamiska bilder" i dokumentmallar. Detta innebär att platshållarbilder i mallen automatiskt ersätts med faktiska bilder under rendering baserat på data. Processen är mycket enkel och kräver bara att du:

1. Infogar en tillfällig bild som platshållare
2. Redigerar bildens "Alternativ text" för att ange fältetiketten
3. Renderar dokumentet, så ersätter systemet automatiskt bilden med den faktiska bilden

Nedan förklarar vi hur du går tillväga för DOCX och XLSX med hjälp av specifika exempel.

#### Infoga dynamiska bilder i DOCX-filer

##### Ersättning av enstaka bilder

1. Öppna din DOCX-mall och infoga en tillfällig bild (det kan vara vilken platshållarbild som helst, till exempel en [enfärgad blå bild](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png)).

:::info
**Instruktioner för bildformat**

- För närvarande stöder platshållarbilder endast PNG-format. Vi rekommenderar att du använder vår exempelbild, den [enfärgade blå bilden](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png).
- Målbilder som ska renderas stöder endast PNG-, JPG- och JPEG-format. Andra bildtyper kan misslyckas med att renderas.

**Instruktioner för bildstorlek**

Oavsett om det gäller DOCX eller XLSX kommer den slutliga renderade bildstorleken att följa dimensionerna för den tillfälliga bilden i mallen. Detta innebär att den faktiska ersättningsbilden automatiskt skalas för att matcha storleken på den platshållarbild du infogade. Om du vill att den renderade bilden ska vara 150×150, använd en tillfällig bild i mallen och justera den till den storleken.
:::

2. Högerklicka på bilden, redigera dess "Alternativ text" och fyll i den bildfältsetikett du vill infoga, till exempel `{d.imageUrl}`:

![20250414211130-2025-04-14-21-11-31](https://static-docs.nocobase.com/20250414211130-2025-04-14-21-11-31.png)

3. Använd följande exempeldata för rendering:
```json
{
  "name": "Apple",
  "imageUrl": "https://images.pexels.com/photos/206959/pexels-photo-206959.jpeg",
}
```

4. I det renderade resultatet ersätts den tillfälliga bilden med den faktiska bilden:

![20250414203444-2025-04-14-20-34-46](https://static-docs.nocobase.com/20250414203444-2025-04-14-20-34-46.png)

##### Ersättning av flera bilder i en loop

Om du vill infoga en grupp bilder i mallen, till exempel en produktlista, kan du också implementera detta med hjälp av loopar. De specifika stegen är följande:

1. Anta att dina data ser ut så här:
```json
{
  "products": [
    {
      "name": "Apple",
      "imageUrl": "https://images.pexels.com/photos/206959/pexels-photo-206959.jpeg",
    },
    {
      "name": "Banana",
      "imageUrl": "https://images.pexels.com/photos/61127/pexels-photo-61127.jpeg",
    },
  ]
}
```

2. Ställ in ett loopområde i DOCX-mallen och infoga tillfälliga bilder i varje loopobjekt med alternativ text inställd på `{d.products[i].imageUrl}`, som visas nedan:

![20250414205418-2025-04-14-20-54-19](https://static-docs.nocobase.com/20250414205418-2025-04-14-20-54-19.png)

3. Efter rendering kommer alla tillfälliga bilder att ersättas med sina respektive databilder:

![20250414205503-2025-04-14-20-55-05](https://static-docs.nocobase.com/20250414205503-2025-04-14-20-55-05.png)

#### Infoga dynamiska bilder i XLSX-filer

Arbetssättet i Excel-mallar (XLSX) är i princip detsamma, men observera följande punkter:

1. Efter att ha infogat en bild, se till att du väljer "bild i cell" snarare än att bilden svävar ovanför cellen.

![20250414211643-2025-04-14-21-16-45](https://static-docs.nocobase.com/20250414211643-2025-04-14-21-16-45.png)

2. Efter att ha valt cellen, klicka för att visa "Alternativ text" för att fylla i fältetiketten, till exempel `{d.imageUrl}`.

### Streckkoder
:::info
Stöder för närvarande filtyperna XLSX och DOCX
:::

#### Generera streckkoder (t.ex. QR-koder)

Generering av streckkoder fungerar på samma sätt som dynamiska bilder och kräver bara tre steg:

1. Infoga en tillfällig bild i mallen för att markera streckkodens position
2. Redigera bildens "Alternativ text" och skriv in fältetiketten för streckkodsformatet, till exempel `{d.code:barcode(qrcode)}`, där `qrcode` är streckkodstypen (se listan över stödda typer nedan).

![20250414214626-2025-04-14-21-46-28](https://static-docs.nocobase.com/20250414214626-2025-04-14-21-46-28.png)

3. Efter rendering kommer platshållarbilden automatiskt att ersättas med motsvarande streckkodsbild:

![20250414214925-2025-04-14-21-49-26](https://static-docs.nocobase.com/20250414214925-2025-04-14-21-49-26.png)

#### Streckkodstyper som stöds

| Streckkodens namn | Typ   |
| ----------------- | ----- |
| QR-kod            | qrcode |