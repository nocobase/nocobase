---
pkg: "@nocobase/plugin-action-import-pro"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Import Pro

## Introduktion

Pluginet Import Pro erbjuder förbättrade funktioner utöver den vanliga importfunktionen.

## Installation

Detta plugin är beroende av pluginet för asynkron uppgiftshantering. Ni måste aktivera pluginet för asynkron uppgiftshantering innan ni kan använda det.

## Funktionsförbättringar

![20251029172052](https://static-docs.nocobase.com/20251029172052.png)

- Stödjer asynkrona importoperationer som körs i en separat tråd, vilket möjliggör import av stora datamängder.

![20251029172129](https://static-docs.nocobase.com/20251029172129.png)

- Stödjer avancerade importalternativ.

## Användarmanual

### Asynkron import

Efter att en import har startats kommer processen att köras i en separat bakgrundstråd, utan att ni behöver konfigurera något manuellt. I användargränssnittet, efter att importen har påbörjats, visas den aktuella importuppgiften uppe till höger, med realtidsuppdateringar av uppgiftens framsteg.

![index-2024-12-30-09-21-05](https://static-docs.nocobase.com/index-2024-12-30-09-21-05.png)

När importen är klar kan ni se resultaten under importuppgifter.

#### Om prestanda

För att utvärdera prestandan vid storskalig dataimport har vi utfört jämförande tester under olika scenarier, fälttyper och utlösningskonfigurationer (resultaten kan variera beroende på server- och databaskonfigurationer och är endast avsedda som referens):

| Datavolym | Fälttyper | Importkonfiguration | Bearbetningstid |
|------|---------|---------|---------|
| 1 miljon poster | Sträng, Nummer, Datum, E-post, Lång text | • Utlös arbetsflöde: Nej<br>• Duplikatidentifierare: Ingen | Cirka 1 minut |
| 500 000 poster | Sträng, Nummer, Datum, E-post, Lång text, Många-till-många | • Utlös arbetsflöde: Nej<br>• Duplikatidentifierare: Ingen | Cirka 16 minuter|
| 500 000 poster | Sträng, Nummer, Datum, E-post, Lång text, Många-till-många, Många-till-en | • Utlös arbetsflöde: Nej<br>• Duplikatidentifierare: Ingen | Cirka 22 minuter |
| 500 000 poster | Sträng, Nummer, Datum, E-post, Lång text, Många-till-många, Många-till-en | • Utlös arbetsflöde: Asynkron utlösningsavisering<br>• Duplikatidentifierare: Ingen | Cirka 22 minuter |
| 500 000 poster | Sträng, Nummer, Datum, E-post, Lång text, Många-till-många, Många-till-en | • Utlös arbetsflöde: Asynkron utlösningsavisering<br>• Duplikatidentifierare: Uppdatera dubbletter, med 50 000 dubbletter | Cirka 3 timmar |

Baserat på ovanstående prestandatester och befintliga designlösningar, följer här några förklaringar och rekommendationer gällande påverkande faktorer:

1.  **Mekanism för hantering av dubbletter**: När ni väljer alternativen **Uppdatera dubbletter** eller **Endast uppdatera dubbletter** utför systemet sök- och uppdateringsoperationer rad för rad, vilket avsevärt minskar importeffektiviteten. Om er Excel-fil innehåller onödiga dubbletter kommer detta att ytterligare påverka importens hastighet. Vi rekommenderar att ni rensar bort onödiga dubbletter i Excel-filen (t.ex. med hjälp av professionella verktyg för deduplicering) innan ni importerar den till systemet, för att undvika onödig tidsspillan.

2.  **Effektivitet vid hantering av relationsfält**: Systemet hanterar relationsfält genom att söka efter kopplingar rad för rad, vilket kan bli en prestandabegränsning vid stora datamängder. För enkla relationsstrukturer (som en en-till-många-koppling mellan två samlingar) rekommenderas en stegvis importstrategi: importera först grunddata för huvudsakliga samlingen, och upprätta sedan relationen mellan samlingarna när detta är klart. Om affärsbehoven kräver att relationsdata importeras samtidigt, vänligen se prestandatesterna i tabellen ovan för att planera er importtid på ett rimligt sätt.

3.  **Mekanism för utlösning av arbetsflöden**: Det rekommenderas inte att aktivera utlösning av arbetsflöden vid storskalig dataimport, främst av följande två skäl:
    -   Även när importuppgiftens status visar 100 % avslutas den inte omedelbart. Systemet behöver fortfarande extra tid för att skapa exekveringsplaner för arbetsflödena. Under denna fas genererar systemet en motsvarande exekveringsplan för arbetsflödet för varje importerad post, vilket upptar importtråden men påverkar inte användningen av den redan importerade datan.
    -   Efter att importuppgiften är helt slutförd kan den samtidiga exekveringen av ett stort antal arbetsflöden leda till att systemresurserna blir ansträngda, vilket påverkar systemets totala svarstid och användarupplevelse.

Dessa tre påverkande faktorer kommer att övervägas för ytterligare optimering i framtiden.

### Importkonfiguration

#### Importalternativ – Utlös arbetsflöde

![20251029172235](https://static-docs.nocobase.com/20251029172235.png)

Vid import kan ni välja om arbetsflöden ska utlösas. Om detta alternativ är markerat och samlingen är kopplad till ett arbetsflöde (samlingshändelse), kommer importen att utlösa arbetsflödet rad för rad.

#### Importalternativ – Identifiera dubbletter

![20251029172421](https://static-docs.nocobase.com/20251029172421.png)

Markera detta alternativ och välj motsvarande läge för att identifiera och hantera dubbletter under importen.

Alternativen i importkonfigurationen kommer att tillämpas som standardvärden. Administratörer kan styra om uppladdaren får ändra dessa alternativ (förutom alternativet för att utlösa arbetsflöde).

**Inställningar för uppladdarens behörigheter**

![20251029172516](https://static-docs.nocobase.com/20251029172516.png)

- Tillåt uppladdaren att ändra importalternativ

![20251029172617](https://static-docs.nocobase.com/20251029172617.png)

- Förbjud uppladdaren att ändra importalternativ

![20251029172655](https://static-docs.nocobase.com/20251029172655.png)

##### Beskrivning av lägen

- Hoppa över dubbletter: Söker efter befintliga poster baserat på innehållet i "Identifieringsfältet". Om posten redan finns, hoppas raden över; om den inte finns, importeras den som en ny post.
- Uppdatera dubbletter: Söker efter befintliga poster baserat på innehållet i "Identifieringsfältet". Om posten redan finns, uppdateras den; om den inte finns, importeras den som en ny post.
- Uppdatera endast dubbletter: Söker efter befintliga poster baserat på innehållet i "Identifieringsfältet". Om posten redan finns, uppdateras den; om den inte finns, hoppas den över.

##### Identifieringsfält

Systemet identifierar om en rad är en dubblett baserat på värdet i detta fält.

- [Kopplingsregel](/interface-builder/actions/action-settings/linkage-rule): Visar/döljer knappar dynamiskt;
- [Redigera knapp](/interface-builder/actions/action-settings/edit-button): Redigera knappens titel, typ och ikon;