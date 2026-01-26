---
pkg: '@nocobase/plugin-workflow-response-message'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Svarsmeddelande

## Introduktion

Svarsmeddelandenoden används för att skicka anpassade meddelanden från arbetsflödet tillbaka till klienten som initierade åtgärden, i specifika typer av arbetsflöden.

:::info{title=Tips}
För närvarande stöds det för användning i arbetsflöden av typen ”Händelse före åtgärd” och ”Anpassad åtgärdshändelse” i synkront läge.
:::

## Skapa en nod

I arbetsflödestyper som stöds kan ni lägga till en nod för ”Svarsmeddelande” var som helst i arbetsflödet. Klicka på plusknappen (”+”) i arbetsflödet för att lägga till en nod för ”Svarsmeddelande”:

![Lägga till en nod](https://static-docs.nocobase.com/eac2b3565e95e4ce59f340624062ed3d.png)

Svarsmeddelandet existerar som en array under hela begäran. När en nod för svarsmeddelande exekveras i arbetsflödet läggs det nya meddelandeinnehållet till i arrayen. När servern skickar svaret skickas alla meddelanden till klienten samtidigt.

## Nodkonfiguration

Meddelandeinnehållet är en mallsträng där variabler kan infogas. Ni kan organisera detta mallinnehåll fritt i nodkonfigurationen:

![Nodkonfiguration](https://static-docs.nocobase.com/d5fa5f4002d50baf3ba16048818fddfc.png)

När arbetsflödet exekverar denna nod kommer mallen att parsas och generera resultatet av meddelandeinnehållet. I konfigurationen ovan kommer variabeln ”Lokal variabel / Loopa alla produkter / Loopobjekt / Produkt / Titel” att ersättas med ett specifikt värde i det faktiska arbetsflödet, till exempel:

```
Produkten ”iPhone 14 pro” är slut i lager
```

![Meddelandeinnehåll](https://static-docs.nocobase.com/06bd4a6b6ec499c853f0c39987f63a6a.png)

## Arbetsflödeskonfiguration

Statusen för svarsmeddelandet beror på arbetsflödets exekveringsstatus, om det lyckades eller misslyckades. Om någon nod misslyckas kommer hela arbetsflödet att misslyckas. I sådana fall kommer meddelandeinnehållet att returneras till klienten med en felstatus och visas.

Om ni behöver definiera en felstatus aktivt i arbetsflödet kan ni använda en ”Slutnod” och konfigurera den till en felstatus. När denna nod exekveras kommer arbetsflödet att avslutas med en felstatus, och meddelandet kommer att returneras till klienten med en felstatus.

Om hela arbetsflödet inte genererar någon felstatus och exekveras framgångsrikt till slutet, kommer meddelandeinnehållet att returneras till klienten med en framgångsstatus.

:::info{title=Tips}
Om flera noder för svarsmeddelanden definieras i arbetsflödet, kommer de exekverade noderna att lägga till meddelandeinnehållet i en array. När det slutligen returneras till klienten kommer allt meddelandeinnehåll att returneras och visas tillsammans.
:::

## Användningsfall

### ”Händelse före åtgärd”-arbetsflöde

Att använda ett svarsmeddelande i ett ”Händelse före åtgärd”-arbetsflöde gör det möjligt att skicka motsvarande meddelandefeedback till klienten efter att arbetsflödet har avslutats. För mer information, se [Händelse före åtgärd](../triggers/pre-action.md).

### ”Anpassad åtgärdshändelse”-arbetsflöde

Att använda ett svarsmeddelande i en ”Anpassad åtgärdshändelse” i synkront läge gör det möjligt att skicka motsvarande meddelandefeedback till klienten efter att arbetsflödet har avslutats. För mer information, se [Anpassad åtgärdshändelse](../triggers/custom-action.md).