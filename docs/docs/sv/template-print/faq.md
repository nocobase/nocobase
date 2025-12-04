:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

## Vanliga problem och lösningar

### 1. Tomma kolumner och celler i Excel-mallar försvinner vid rendering

**Problembeskrivning**: I Excel-mallar kan celler utan innehåll eller formatering tas bort under renderingen, vilket leder till att de saknas i det slutgiltiga dokumentet.

**Lösningar**:

- **Fyll bakgrundsfärg**: Fyll tomma celler i det berörda området med en bakgrundsfärg för att säkerställa att de förblir synliga under renderingen.
- **Infoga mellanslag**: Infoga ett mellanslag i tomma celler. Detta hjälper till att bibehålla cellstrukturen även om det inte finns något faktiskt innehåll.
- **Ange kantlinjer**: Lägg till kantlinjer i tabellen för att tydliggöra cellgränserna och förhindra att celler försvinner vid rendering.

**Exempel**:

I Excel-mallen, ange en ljusgrå bakgrund för alla berörda celler och infoga mellanslag i tomma celler.

### 2. Sammanfogade celler fungerar inte vid utskrift

**Problembeskrivning**: När ni använder loop-funktioner för att generera tabeller kan sammanfogade celler i mallen leda till oväntade resultat vid rendering, till exempel att sammanfogningen försvinner eller att data hamnar fel.

**Lösningar**:

- **Undvik sammanfogade celler**: Försök att undvika att använda sammanfogade celler i tabeller som genereras med loopar för att säkerställa korrekt rendering av data.
- **Använd "Centrera över markering"**: Om ni behöver centrera text horisontellt över flera celler, använd funktionen "Centrera över markering" istället för att sammanfoga celler.
- **Begränsa placeringen av sammanfogade celler**: Om ni absolut måste använda sammanfogade celler, sammanfoga dem endast ovanför eller till höger om tabellen. Undvik att sammanfoga celler nedanför eller till vänster för att förhindra att sammanfogningseffekten går förlorad vid rendering.

### 3. Innehåll under loop-renderingsområdet orsakar formatfel

**Problembeskrivning**: I Excel-mallar, om det finns annat innehåll (t.ex. ordersammanfattning, anteckningar) under ett loop-område som dynamiskt växer baserat på dataobjekt (t.ex. orderdetaljer), kommer de loop-genererade dataraderna att expandera nedåt under renderingen. Detta kan direkt skriva över eller trycka undan det statiska innehållet nedanför, vilket leder till formatfel och överlappande innehåll i det slutgiltiga dokumentet.

**Lösningar**:

  * **Justera layouten, placera loop-området längst ner**: Detta är den mest rekommenderade metoden. Placera tabellområdet som ska loop-renderas längst ner på hela arbetsbladet. Flytta all information som ursprungligen låg under det (sammanfattning, signaturer, etc.) till ovanför loop-området. På så sätt kan loop-data fritt expandera nedåt utan att påverka några andra element.
  * **Reservera tillräckligt med tomma rader**: Om innehåll måste placeras under loop-området kan ni uppskatta det maximala antalet rader som loopen kan generera och manuellt infoga tillräckligt många tomma rader som en buffert mellan loop-området och innehållet nedanför. Denna metod innebär dock en risk – om den faktiska datamängden överskrider det uppskattade antalet rader kommer problemet att uppstå igen.
  * **Använd Word-mallar**: Om layoutkraven är komplexa och inte kan lösas genom att justera Excel-strukturen, överväg att använda Word-dokument som mallar. Tabeller i Word flyttar automatiskt nedåt innehåll när rader läggs till, utan problem med överlappande innehåll, vilket gör det mer lämpligt för att generera sådana dynamiska dokument.

**Exempel**:

**Felaktigt tillvägagångssätt**: Att placera informationen "Ordersammanfattning" direkt under tabellen "Orderdetaljer" som loopas.
![20250820080712](https://static-docs.nocobase.com/20250820080712.png)

**Korrekt tillvägagångssätt 1 (Justera layout)**: Flytta informationen "Ordersammanfattning" ovanför tabellen "Orderdetaljer", så att loop-området blir det nedersta elementet på sidan.
![20250820082226](https://static-docs.nocobase.com/20250820082226.png)

**Korrekt tillvägagångssätt 2 (Reservera tomma rader)**: Reservera många tomma rader mellan "Orderdetaljer" och "Ordersammanfattning" för att säkerställa att loop-innehållet har tillräckligt med utrymme att expandera.
![20250820081510](https://static-docs.nocobase.com/20250820081510.png)

**Korrekt tillvägagångssätt 3**: Använd Word-mallar.

### 4. Felmeddelanden visas under mallrendering

**Problembeskrivning**: Under mallrendering visar systemet felmeddelanden, vilket leder till att renderingen misslyckas.

**Möjliga orsaker**:

- **Fel i platshållare**: Namnen på platshållarna matchar inte fälten i datamängden, eller så finns det syntaxfel.
- **Saknad data**: Datamängden saknar fält som refereras i mallen.
- **Felaktig användning av formaterare**: Parametrarna för formateraren är felaktiga eller så används en formateringstyp som inte stöds.

**Lösningar**:

- **Kontrollera platshållare**: Se till att platshållarnamnen i mallen matchar fältnamnen i datamängden och att syntaxen är korrekt.
- **Validera datamängden**: Bekräfta att datamängden innehåller alla fält som refereras i mallen och att dataformaten är korrekta.
- **Justera formaterare**: Kontrollera hur formateraren används, se till att parametrarna är korrekta och använd endast formateringstyper som stöds.

**Exempel**:

**Felaktig mall**:
```
Order ID: {d.orderId}
Order Date: {d.orderDate:format('YYYY/MM/DD')}
Total Amount: {d.totalAmount:format('0.00')}
```

**Datamängd**:
```json
{
  "orderId": "A123456789",
  "orderDate": "2025-01-01T10:00:00Z"
  // Missing totalAmount field
}
```

**Lösning**: Lägg till fältet `totalAmount` i datamängden eller ta bort referensen till `totalAmount` från mallen.