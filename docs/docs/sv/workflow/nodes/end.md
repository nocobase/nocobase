:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Avsluta arbetsflöde

När den här noden körs avslutas det aktuella arbetsflödet omedelbart med den status som konfigurerats i noden. Den används vanligtvis för flödeskontroll baserad på specifik logik, där man lämnar det aktuella arbetsflödet när vissa villkor är uppfyllda och stoppar körningen av efterföljande processer. Det kan jämföras med `return`-instruktionen i programmeringsspråk, som används för att avsluta den aktuella funktionen.

## Lägg till nod

I gränssnittet för arbetsflödeskonfiguration klickar du på plusknappen ("+") i flödet för att lägga till en "Avsluta arbetsflöde"-nod:

![End Workflow_Add](https://static-docs.nocobase.com/672186ab4c8f7313dd3cf9c880b524b8.png)

## Nodkonfiguration

![End Workflow_Node Configuration](https://static-docs.nocobase.com/bb6a597f25e9afb72836a14a0fe0683e.png)

### Slutstatus

Slutstatusen påverkar det slutliga tillståndet för arbetsflödets körning. Den kan konfigureras som "Lyckades" eller "Misslyckades". När arbetsflödet når den här noden avslutas det omedelbart med den konfigurerade statusen.

:::info{title=Tips}
När den används i ett arbetsflöde av typen "Före åtgärdshändelse" kommer den att avlyssna begäran som initierade åtgärden. För mer information, se [Användning av "Före åtgärdshändelse"](../triggers/pre-action).

Utöver att avlyssna begäran som initierade åtgärden, kommer konfigurationen av slutstatusen också att påverka statusen för feedbacken i "svarsmeddelandet" för denna typ av arbetsflöde.
:::