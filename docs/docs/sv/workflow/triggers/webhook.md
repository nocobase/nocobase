---
pkg: '@nocobase/plugin-workflow-webhook'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Webhook

## Introduktion

Webhook-utlösaren tillhandahåller en URL som kan anropas av tredjepartssystem via HTTP-förfrågningar. När en tredjepartshändelse inträffar skickas en HTTP-förfrågan till denna URL för att utlösa arbetsflödets exekvering. Detta är lämpligt för meddelanden som initieras av externa system, såsom betalningsåterkopplingar eller meddelanden.

## Skapa ett arbetsflöde

När ni skapar ett arbetsflöde väljer ni typen "Webhook-händelse":

![20241210105049](https://static-docs.nocobase.com/20241210105049.png)

:::info{title="Obs!"}
Skillnaden mellan "synkrona" och "asynkrona" arbetsflöden är att ett synkront arbetsflöde väntar tills arbetsflödet har slutförts innan det returnerar ett svar, medan ett asynkront arbetsflöde omedelbart returnerar det svar som konfigurerats i utlösaren och köar exekveringen i bakgrunden.
:::

## Utlösarkonfiguration

![20241210105441](https://static-docs.nocobase.com/20241210105441.png)

### Webhook-URL

Webhook-utlösarens URL genereras automatiskt av systemet och är kopplad till detta arbetsflöde. Ni kan klicka på knappen till höger för att kopiera den och klistra in den i tredjepartssystemet.

Endast HTTP-metoden POST stöds; andra metoder kommer att returnera ett `405`-fel.

### Säkerhet

HTTP Basic Authentication stöds för närvarande. Ni kan aktivera detta alternativ och ställa in ett användarnamn och lösenord. Inkludera användarnamnet och lösenordet i Webhook-URL:en i tredjepartssystemet för att implementera säkerhetsautentisering för Webhooken (för standarddetaljer, se: [MDN: HTTP authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication#basic_authentication_scheme)).

När ett användarnamn och lösenord har ställts in kommer systemet att verifiera om användarnamnet och lösenordet i förfrågan matchar. Om de inte tillhandahålls eller inte matchar, kommer ett `401`-fel att returneras.

### Parsa förfrågningsdata

När en tredje part anropar Webhooken måste data som skickas med i förfrågan parsas innan de kan användas i arbetsflödet. Efter parsning blir det en utlösarvariabel som kan refereras i efterföljande noder.

Parsningen av HTTP-förfrågan är uppdelad i tre delar:

1.  Förfrågningshuvuden

    Förfrågningshuvuden är vanligtvis enkla nyckel-värde-par av strängtyp. De huvudfält ni behöver använda kan konfigureras direkt, till exempel `Date`, `X-Request-Id`, etc.

2.  Förfrågningsparametrar

    Förfrågningsparametrar är frågeparametrar i URL:en, såsom `query`-parametern i `http://localhost:13000/api/webhook:trigger/1hfmkioou0d?query=1`. Ni kan klistra in en komplett exempel-URL eller bara delen med frågeparametrar och klicka på parsaknappen för att automatiskt parsa nyckel-värde-paren.

    ![20241210111155](https://static-docs.nocobase.com/20241210111155.png)

    Automatisk parsning kommer att konvertera parameterdelen av URL:en till en JSON-struktur och generera sökvägar som `query[0]`, `query[0].a` baserat på parameterhierarkin. Sökvägsnamnet kan ändras manuellt om det inte uppfyller era behov, men vanligtvis behövs ingen ändring. Aliaset är visningsnamnet för variabeln när den används, vilket är valfritt. Parsningen kommer också att generera en fullständig lista över parametrar från exemplet; ni kan ta bort alla parametrar ni inte behöver.

3.  Förfrågningskropp

    Förfrågningskroppen är Body-delen av HTTP-förfrågan. För närvarande stöds endast förfrågningskroppar med `Content-Type`-formatet `application/json`. Ni kan direkt konfigurera de sökvägar som ska parsas, eller ni kan mata in ett JSON-exempel och klicka på parsaknappen för automatisk parsning.

    ![20241210112529](https://static-docs.nocobase.com/20241210112529.png)

    Automatisk parsning kommer att konvertera nyckel-värde-paren i JSON-strukturen till sökvägar. Till exempel kommer `{"a": 1, "b": {"c": 2}}` att generera sökvägar som `a`, `b` och `b.c`. Aliaset är visningsnamnet för variabeln när den används, vilket är valfritt. Parsningen kommer också att generera en fullständig lista över parametrar från exemplet; ni kan ta bort alla parametrar ni inte behöver.

### Svarsinställningar

Konfigurationen av Webhook-svaret skiljer sig mellan synkrona och asynkrona arbetsflöden. För asynkrona arbetsflöden konfigureras svaret direkt i utlösaren. Vid mottagandet av en Webhook-förfrågan returneras det konfigurerade svaret omedelbart till tredjepartssystemet, och därefter exekveras arbetsflödet. För synkrona arbetsflöden behöver ni lägga till en svarsnod inom flödet för att hantera det enligt affärsbehov (för detaljer, se: [Svarsnod](#svarsnod)).

Vanligtvis har svaret för en asynkront utlöst Webhook-händelse statuskoden `200` och svarskroppen `ok`. Ni kan också anpassa svarsstatuskoden, svarsrubrikerna och svarskroppen efter behov.

![20241210114312](https://static-docs.nocobase.com/20241210114312.png)

## Svarsnod

Referens: [Svarsnod](../nodes/response.md)

## Exempel

I ett Webhook-arbetsflöde kan ni returnera olika svar baserat på olika affärsvillkor, som visas i figuren nedan:

![20241210120655](https://static-docs.nocobase.com/20241210120655.png)

Använd en villkorlig förgreningsnod för att avgöra om en viss affärsstatus är uppfylld. Om den är uppfylld, returnera ett framgångssvar; annars, returnera ett felsvar.