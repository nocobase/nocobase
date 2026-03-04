---
pkg: '@nocobase/plugin-workflow-cc'
---

:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/workflow/nodes/cc).
:::

# Kopia <Badge>v1.8.2+</Badge>

## Introduktion

Kopia-noden används för att skicka visst kontextuellt innehåll från ett arbetsflödes exekvering till angivna användare för kännedom och granskning. Till exempel kan relevant information i ett godkännande eller andra processer skickas som kopia till andra deltagare så att de kan hålla sig informerade om framstegen.

Ni kan ställa in flera kopia-noder i ett arbetsflöde så att relevant information skickas till de angivna mottagarna när arbetsflödet når den noden.

Innehållet i kopian visas i menyn ”Kopia till mig” i Att göra-centret, där användare kan se allt innehåll som skickats till dem. Det kommer också att indikera olästa objekt som användaren ännu inte har sett, och användaren kan manuellt markera dem som lästa efter granskning.

## Skapa nod

I gränssnittet för konfiguration av arbetsflöden, klicka på plusknappen (”+”) i flödet för att lägga till en ”Kopia”-nod:

![抄送_添加](https://static-docs.nocobase.com/20250710222842.png)

## Nodkonfiguration

![节点配置](https://static-docs.nocobase.com/20250710224041.png)

I nodkonfigurationsgränssnittet kan ni ställa in följande parametrar:

### Mottagare

Mottagare är en samling av målanvändare för kopian, vilket kan vara en eller flera användare. Källan kan vara ett statiskt värde valt från användarlistan, ett dynamiskt värde specificerat av en variabel, eller resultatet av en fråga mot användar-samlingen.

![接收者配置](https://static-docs.nocobase.com/20250710224421.png)

### Användargränssnitt

Mottagare behöver se innehållet i kopian i menyn ”Kopia till mig” i Att göra-centret. Ni kan konfigurera resultat från triggern och valfri nod i arbetsflödeskontexten som innehållsblock.

![用户界面](https://static-docs.nocobase.com/20250710225400.png)

### Uppgiftskort <Badge>2.0+</Badge>

Kan användas för att konfigurera uppgiftskortet i listan ”Kopia till mig” i Att göra-centret.

![20260213010947](https://static-docs.nocobase.com/20260213010947.png)

I kortet kan ni fritt konfigurera de affärsfält ni vill visa (förutom relationsfält).

När arbetsflödets kopieringsuppgift har skapats kan det anpassade uppgiftskortet ses i listan i Att göra-centret:

![20260214124325](https://static-docs.nocobase.com/20260214124325.png)

### Uppgiftstitel

Uppgiftstiteln är den rubrik som visas i Att göra-centret. Ni kan använda variabler från arbetsflödeskontexten för att dynamiskt generera titeln.

![任务标题](https://static-docs.nocobase.com/20250710225603.png)

## Att göra-centret

Användare kan se och hantera allt innehåll som skickats som kopia till dem i Att göra-centret, samt filtrera och visa baserat på lässtatus.

![20250710232932](https://static-docs.nocobase.com/20250710232932.png)

![20250710233032](https://static-docs.nocobase.com/20250710233032.png)

Efter att ni har granskat innehållet kan ni markera det som läst, och antalet olästa objekt kommer att minska i enlighet därmed.

![20250710233102](https://static-docs.nocobase.com/20250710233102.png)