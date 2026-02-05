:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Schemalagd uppgift

## Introduktion

En schemalagd uppgift är en händelse som utlöses av ett tidskriterium och finns i två lägen:

- Anpassad tid: Regelbunden, cron-liknande utlösning baserad på systemtid.
- Tidsfält i samling: Utlösning baserad på värdet i ett tidsfält i en samling när tiden uppnås.

När systemet når den tidpunkt (med sekundprecision) som uppfyller de konfigurerade utlösningsvillkoren, kommer det motsvarande arbetsflödet att utlösas.

## Grundläggande användning

### Skapa en schemalagd uppgift

När ni skapar ett arbetsflöde i arbetsflödeslistan, välj typen "Schemalagd uppgift":

![Skapa en schemalagd uppgift](https://static-docs.nocobase.com/e09b6c9065167875b2ca7de5f5a799a7.png)

### Läget Anpassad tid

För det vanliga läget behöver ni först konfigurera starttiden till valfri tidpunkt (med sekundprecision). Starttiden kan ställas in till en framtida tid eller en tid i det förflutna. När den ställs in till en tid i det förflutna, kontrolleras om tiden har uppnåtts baserat på det konfigurerade upprepningsvillkoret. Om inget upprepningsvillkor är konfigurerat och starttiden är i det förflutna, kommer arbetsflödet inte längre att utlösas.

Det finns två sätt att konfigurera upprepningsregeln:

- Efter intervall: Utlöses med ett fast intervall efter starttiden, till exempel varje timme, var 30:e minut, etc.
- Avancerat läge: Det vill säga, enligt cron-regler, kan det konfigureras för en cykel som når en fast regelbaserad datum- och tidpunkt.

Efter att ni har konfigurerat upprepningsregeln kan ni även konfigurera ett slutvillkor. Det kan avslutas vid en fast tidpunkt eller begränsas av antalet gånger det har körts.

### Läget Tidsfält i samling

Att använda ett tidsfält i en samling för att bestämma starttiden är ett utlösningsläge som kombinerar vanliga schemalagda uppgifter med tidsfält i samlingar. Genom att använda detta läge kan ni förenkla noder i vissa specifika processer och det är också mer intuitivt att konfigurera. Till exempel, för att ändra statusen på förfallna obetalda ordrar till annullerade, kan ni helt enkelt konfigurera en schemalagd uppgift i läget "Tidsfält i samling", där ni väljer starttiden till 30 minuter efter att ordern skapats.

## Relaterade tips

### Schemalagda uppgifter i inaktivt eller avstängt tillstånd

Om det konfigurerade tidskriteriet uppfylls, men hela NocoBase-applikationstjänsten är i ett inaktivt eller avstängt tillstånd, kommer den schemalagda uppgift som skulle ha utlösts vid den tidpunkten att missas. Dessutom, efter att tjänsten har startats om, kommer de missade uppgifterna inte att utlösas igen. Därför kan ni behöva överväga hantering för sådana situationer eller ha reservåtgärder när ni använder det.

### Antal upprepningar

När slutvillkoret "efter antal upprepningar" är konfigurerat, räknas det totala antalet körningar för alla versioner av samma arbetsflöde. Till exempel, om en schemalagd uppgift har körts 10 gånger i version 1, och antalet upprepningar också är inställt på 10, kommer arbetsflödet inte längre att utlösas. Även om det kopieras till en ny version, kommer det inte att utlösas om inte antalet upprepningar ändras till ett tal större än 10. Men om det kopieras som ett nytt arbetsflöde, kommer antalet körningar att återställas till 0. Utan att ändra den relevanta konfigurationen kan det nya arbetsflödet utlösas ytterligare 10 gånger.

### Skillnaden mellan intervall och avancerat läge i upprepningsregler

Intervallet i upprepningsregeln är relativt tidpunkten för den senaste utlösningen (eller starttiden), medan det avancerade läget utlöses vid fasta tidpunkter. Till exempel, om det är konfigurerat att utlösas var 30:e minut, och den senaste utlösningen var 2021-09-01 12:01:23, då kommer nästa utlösningstid att vara 2021-09-01 12:31:23. Det avancerade läget, det vill säga cron-läget, är konfigurerat för att utlösas vid fasta tidpunkter. Till exempel kan det konfigureras att utlösas vid 01 och 31 minuter varje timme.

## Exempel

Anta att vi varje minut behöver kontrollera ordrar som inte har betalats inom 30 minuter efter skapandet, och automatiskt ändra deras status till annullerad. Vi kommer att implementera detta med båda lägena.

### Läget Anpassad tid

Skapa ett arbetsflöde baserat på en schemalagd uppgift. I utlösarkonfigurationen, välj läget "Anpassad tid", ställ in starttiden till valfri tidpunkt som inte är senare än aktuell tid, välj "Varje minut" för upprepningsregeln och lämna slutvillkoret tomt:

![Schemalagd uppgift_Utlösarkonfiguration_Anpassad tid-läge](https://static-docs.nocobase.com/71131e3f2034263f883062389b356cbd.png)

Konfigurera sedan andra noder enligt processlogiken, beräkna tiden för 30 minuter sedan och ändra statusen för obetalda ordrar som skapats före den tiden till annullerade:

![Schemalagd uppgift_Utlösarkonfiguration_Anpassad tid-läge](https://static-docs.nocobase.com/188bc5287ffa1fb24a4e7baa1de6eb29.png)

När arbetsflödet är aktiverat kommer det att utlösas en gång varje minut från starttiden, beräkna tiden för 30 minuter sedan för att uppdatera statusen för ordrar som skapats före den tidpunkten till annullerade.

### Läget Tidsfält i samling

Skapa ett arbetsflöde baserat på en schemalagd uppgift. I utlösarkonfigurationen, välj läget "Tidsfält i samling", välj samlingen "Ordrar", ställ in starttiden till 30 minuter efter orderns skapandetid, och välj "Ingen upprepning" för upprepningsregeln:

![Schemalagd uppgift_Utlösarkonfiguration_Tidsfält i samling-läge_Utlösare](https://static-docs.nocobase.com/d40d5aef57f42799d31cc5882dd94246.png)

Konfigurera sedan andra noder enligt processlogiken för att uppdatera statusen för ordern med utlösningsdata-ID och statusen "obetald" till annullerad:

![Schemalagd uppgift_Utlösarkonfiguration_Tidsfält i samling-läge_Uppdateringsnod](https://static-docs.nocobase.com/491dde9df773f5b14a4fd8ceac9d3e.png)

Till skillnad från läget Anpassad tid behöver ni här inte beräkna tiden för 30 minuter sedan, eftersom arbetsflödets utlösningsdata-kontext redan innehåller den datarad som uppfyller tidskriteriet. Därför kan ni direkt uppdatera statusen för den motsvarande ordern.