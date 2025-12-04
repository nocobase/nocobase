---
pkg: '@nocobase/plugin-workflow-subflow'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Arbetsflödesutgång

## Introduktion

Noden "Arbetsflödesutgång" används i ett anropat arbetsflöde för att definiera dess utdatavärde. När ett arbetsflöde anropas av ett annat, kan noden "Arbetsflödesutgång" användas för att skicka ett värde tillbaka till anroparen.

## Skapa noden

I det anropade arbetsflödet lägger ni till en "Arbetsflödesutgång"-nod:

![20241231002033](https://static-docs.nocobase.com/20241231002033.png)

## Konfigurera noden

### Utgångsvärde

Ange eller välj en variabel som utgångsvärde. Utgångsvärdet kan vara av vilken typ som helst, till exempel en konstant (sträng, nummer, booleskt värde, datum eller anpassad JSON), eller en annan variabel från arbetsflödet.

![20241231003059](https://static-docs.nocobase.com/20241231003059.png)

:::info{title=Tips}
Om flera "Arbetsflödesutgång"-noder läggs till i ett anropat arbetsflöde, kommer värdet från den sist exekverade "Arbetsflödesutgång"-noden att matas ut när arbetsflödet anropas.
:::