---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Blockkonfiguration

## E-postmeddelandeblock

### Lägg till block

På konfigurationssidan klickar du på knappen **Skapa block** och väljer blocket **E-postmeddelanden (Alla)** eller **E-postmeddelanden (Personliga)** för att lägga till ett e-postmeddelandeblock.

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_03_58_PM.png)

### Fältkonfiguration

Klicka på knappen **Fält** för blocket för att välja vilka fält som ska visas. För detaljerad information, se metoden för fältkonfiguration för tabeller.

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_37_PM.png)

### Datafilterkonfiguration

Klicka på konfigurationsikonen till höger om tabellen och välj **Dataintervall** för att ställa in dataintervallet för filtrering av e-postmeddelanden.

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_39_PM.png)

Du kan filtrera e-postmeddelanden med samma suffix med hjälp av variabler:
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_41_PM.png)

## E-postdetaljblock

Aktivera först funktionen **Aktivera klicka för att öppna** på ett fält i e-postmeddelandeblocket:
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_45_PM.png)

Lägg till blocket **E-postdetaljer** i popup-fönstret:
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_46_PM.png)

Du kan se e-postmeddelandets detaljerade innehåll:
![](https://static-docs.nocobase.com/email-manager/Loading--10-31-2025_04_49_PM.png)

Du kan konfigurera de önskade knapparna längst ner.

## E-postsändningsblock

Det finns två sätt att skapa ett formulär för att skicka e-post:

1. Lägg till knappen **Skicka e-post** högst upp i tabellen:
   ![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_52_PM.png)

2. Lägg till ett **E-postsändningsblock**:
   ![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_53_PM.png)

Båda metoderna kan skapa ett komplett formulär för att skicka e-post:
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_53_PM%20(1).png)

Varje fält i e-postformuläret överensstämmer med ett vanligt formulär och kan konfigureras med **Standardvärde** eller **Kopplingsregler** med mera.

> Svars- och vidarebefordringsformulären längst ner i e-postdetaljerna innehåller viss standarddatabehandling, som kan ändras via **FlowEngine**.