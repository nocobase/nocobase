---
pkg: "@nocobase/plugin-workflow-response-message"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# HTTP-svar

## Introduktion

Denna nod stöds endast i synkrona Webhook-arbetsflöden och används för att skicka ett svar tillbaka till ett tredjepartssystem. Om en affärsprocess, till exempel vid hantering av en betalningsåterkoppling, stöter på ett oväntat resultat (som ett fel eller misslyckande), kan ni använda svarsnoden för att skicka ett felsvar till tredjepartssystemet. Detta gör att vissa tredjepartssystem kan försöka igen senare, baserat på statusen.

Dessutom kommer exekveringen av svarsnoden att avsluta arbetsflödets körning, och efterföljande noder kommer inte att exekveras. Om ingen svarsnod är konfigurerad i hela arbetsflödet, kommer systemet automatiskt att svara baserat på flödets exekveringsstatus: det returnerar `200` vid lyckad exekvering och `500` vid misslyckad exekvering.

## Skapa en svarsnod

I gränssnittet för konfiguration av arbetsflöden, klickar ni på plusknappen ("+") i flödet för att lägga till en "Svar"-nod:

![20241210115120](https://static-docs.nocobase.com/20241210115120.png)

## Konfiguration av svar

![20241210115500](https://static-docs.nocobase.com/20241210115500.png)

Ni kan använda variabler från arbetsflödets kontext i svarskroppen.