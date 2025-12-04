---
pkg: "@nocobase/plugin-action-export-pro"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Export Pro

## Introduktion

Pluginet Export Pro erbjuder förbättrade funktioner utöver den vanliga exportfunktionen.

## Installation

Detta plugin är beroende av pluginet för asynkron uppgiftshantering. Ni behöver aktivera pluginet för asynkron uppgiftshantering innan ni kan använda det.

## Funktionella förbättringar

- Stöder asynkrona exportoperationer som körs i en separat tråd, vilket möjliggör export av stora datamängder.
- Stöder export av bilagor.

## Användarhandbok

### Konfigurera exportläge

![20251029172829](https://static-docs.nocobase.com/20251029172829.png)

![20251029172914](https://static-docs.nocobase.com/20251029172914.png)

På exportknappen kan ni konfigurera exportläget. Det finns tre valbara exportlägen:

- **Automatisk**: Exportläget bestäms av datamängden. Om antalet poster är färre än 1000 (eller 100 vid export av bilagor) används synkron export. Om antalet poster är fler än 1000 (eller 100 vid export av bilagor) används asynkron export.
- **Synkron**: Använder synkron export, som körs i huvudtråden. Detta lämpar sig för mindre datamängder. Att exportera stora datamängder i synkront läge kan leda till att systemet blockeras, fryser och inte kan hantera andra användares förfrågningar.
- **Asynkron**: Använder asynkron export, som körs i en separat bakgrundstråd och inte blockerar systemets nuvarande användning.

### Asynkron export

Efter att ni har initierat en export kommer processen att köras i en separat bakgrundstråd, utan att ni behöver konfigurera något manuellt. I användargränssnittet, efter att en exportoperation har startats, visas den aktuella exportuppgiften uppe till höger, med realtidsuppdatering av uppgiftens framsteg.

![20251029173028](https://static-docs.nocobase.com/20251029173028.png)

När exporten är klar kan ni ladda ner den exporterade filen från exportuppgifterna.

#### Samtidiga exporter
Ett stort antal samtidiga exportuppgifter kan påverkas av serverkonfigurationen, vilket leder till långsammare systemrespons. Därför rekommenderas det att systemutvecklare konfigurerar det maximala antalet samtidiga exportuppgifter (standard är 3). När antalet samtidiga uppgifter överskrider den konfigurerade gränsen, kommer nya uppgifter att köas.
![20250505171706](https://static-docs.nocobase.com/20250505171706.png)

Konfigurering av samtidighet: Miljövariabel `ASYNC_TASK_MAX_CONCURRENCY=并发数`

Baserat på omfattande tester med olika konfigurationer och datakomplexitet, rekommenderas följande antal samtidiga uppgifter:
- 2-kärnig CPU, 3 samtidiga uppgifter.
- 4-kärnig CPU, 5 samtidiga uppgifter.

#### Om prestanda
Om ni upplever att exportprocessen är ovanligt långsam (se referens nedan) kan det bero på prestandaproblem orsakade av **samlingens** struktur.

| Datakarakteristik | Indextyp | Datavolym | Exporttid |
|---------|---------|--------|---------|
| Inga relationsfält | Primärnyckel / Unikt villkor | 1 miljon | 3–6 minuter |
| Inga relationsfält | Vanligt index | 1 miljon | 6–10 minuter |
| Inga relationsfält | Sammansatt index (icke-unikt) | 1 miljon | 30 minuter |
| Relationsfält<br>(En-till-en, En-till-många,<br>Många-till-en, Många-till-många) | Primärnyckel / Unikt villkor | 500 000 | 15–30 minuter | Relationsfält minskar prestandan |

För att säkerställa effektiva exporter rekommenderar vi att ni:
1. **Samlingen** måste uppfylla följande villkor:

| Villkorstyp | Obligatoriskt villkor | Övriga anmärkningar |
|---------|------------------------|------|
| **Samlingsstruktur** (minst ett måste uppfyllas) | Har en primärnyckel<br>Har ett unikt villkor<br>Har ett index (unikt, vanligt, sammansatt) | Prioritet: Primärnyckel > Unikt villkor > Index
| Fältegenskaper | Primärnyckeln / det unika villkoret / indexet (ett av dem) måste ha sorterbara egenskaper, såsom: autoinkrementerande ID, Snowflake ID, UUID v1, tidsstämpel, nummer, etc.<br>(Obs: Icke-sorterbara fält som UUID v3/v4/v5, vanliga strängar etc., kommer att påverka prestandan) | Inga |

2. Minska antalet onödiga fält som ska exporteras, särskilt relationsfält (prestandaproblem orsakade av relationsfält optimeras fortfarande).
![20250506215940](https://static-docs.nocobase.com/20250506215940.png)
3. Om exporten fortfarande är långsam efter att ovanstående villkor har uppfyllts, kan ni analysera loggarna eller kontakta det officiella teamet för feedback.
![20250505182122](https://static-docs.nocobase.com/20250505182122.png)

- [Kopplingsregel](/interface-builder/actions/action-settings/linkage-rule): Visar/döljer knappen dynamiskt;
- [Redigera knapp](/interface-builder/actions/action-settings/edit-button): Redigera knappens titel, typ och ikon;