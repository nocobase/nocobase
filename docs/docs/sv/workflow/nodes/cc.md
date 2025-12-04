---
pkg: '@nocobase/plugin-workflow-cc'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Kopia <Badge>v1.8.2+</Badge>

## Introduktion

Kopia-noden används för att skicka visst kontextuellt innehåll från ett arbetsflödes exekvering till angivna användare, så att de kan ta del av och granska det. I exempelvis en godkännande- eller annan process kan relevant information skickas som kopia till andra deltagare, så att de snabbt kan följa arbetets framsteg.

Ni kan ställa in flera Kopia-noder i ett arbetsflöde. När arbetsflödet når en sådan nod skickas den relevanta informationen till de angivna mottagarna.

Innehållet som skickats som kopia visas i menyn ”Kopia till mig” i Att göra-centret, där användare kan se allt innehåll som skickats till dem. Systemet kommer också att indikera olästa objekt, och användare kan manuellt markera dem som lästa efter att de har granskats.

## Skapa nod

I gränssnittet för konfiguration av arbetsflöden klickar ni på plusknappen (”+”) i flödet för att lägga till en ”Kopia”-nod:

![抄送_添加](https://static-docs.nocobase.com/20250710222842.png)

## Nodkonfiguration

![节点配置](https://static-docs.nocobase.com/20250710224041.png)

I nodkonfigurationsgränssnittet kan ni ställa in följande parametrar:

### Mottagare

Mottagare är en samling av målanvändare för kopian, vilket kan vara en eller flera användare. Källan kan vara ett statiskt värde valt från användarlistan, ett dynamiskt värde specificerat av en variabel, eller resultatet av en fråga mot användar-samlingen.

![接收者配置](https://static-docs.nocobase.com/20250710224421.png)

### Användargränssnitt

Mottagare behöver se innehållet som skickats som kopia i menyn ”Kopia till mig” i Att göra-centret. Ni kan konfigurera resultaten från triggern och valfri nod i arbetsflödeskontexten som innehållsblock.

![用户界面](https://static-docs.nocobase.com/20250710225400.png)

### Uppgiftstitel

Uppgiftstiteln är den rubrik som visas i Att göra-centret. Ni kan använda variabler från arbetsflödeskontexten för att dynamiskt generera titeln.

![任务标题](https://static-docs.nocobase.com/20250710225603.png)

## Att göra-centret

Användare kan se och hantera allt innehåll som skickats som kopia till dem i Att göra-centret, samt filtrera och visa baserat på lässtatus.

![20250710232932](https://static-docs.nocobase.com/20250710232932.png)

![20250710233032](https://static-docs.nocobase.com/20250710233032.png)

Efter att ni har granskat innehållet kan ni markera det som läst, och antalet olästa objekt kommer att minska i enlighet därmed.

![20250710233102](https://static-docs.nocobase.com/20250710233102.png)