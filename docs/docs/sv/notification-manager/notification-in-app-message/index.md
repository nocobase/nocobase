---
pkg: '@nocobase/plugin-notification-in-app-message'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Avisering: App-interna meddelanden

## Introduktion

Med den här funktionen kan ni ta emot meddelanden i realtid direkt i NocoBase-applikationen.

## Installation

Denna `plugin` är inbyggd, så ni behöver inte installera den separat.

## Lägga till en kanal för app-interna meddelanden

Gå till Aviseringshantering, klicka på knappen Lägg till och välj App-interna meddelanden.
![2024-11-08-08-33-26-20241108083326](https://static-docs.nocobase.com/2024-11-08-08-33-26-20241108083326.png)

Ange kanalens namn och beskrivning, klicka sedan på Skicka.
![2024-11-08-08-34-32-20241108083431](https://static-docs.nocobase.com/2024-11-08-08-34-32-20241108083431.png)

Den nya kanalen visas nu i listan.

![2024-11-08-08-34-52-20241108083452](https://static-docs.nocobase.com/2024-11-08-08-34-52-20241108083452.png)

## Exempel på användningsfall

För att hjälpa er att bättre förstå hur app-interna meddelanden används, följer här ett exempel på "Uppföljning av marknadsföringsleads".

Föreställ er att ert team driver en stor marknadsföringskampanj med målet att följa upp potentiella kunders feedback och behov. Med app-interna meddelanden kan ni:

**Skapa en aviseringskanal**: Först, i Aviseringshantering, konfigurerar ni en kanal för app-interna meddelanden med namnet "Marketing Clue" för att säkerställa att teammedlemmar tydligt kan identifiera dess syfte.

![2024-11-08-08-34-32-20241108083431](https://static-docs.nocobase.com/2024-11-08-08-34-32-20241108083431.png)

**Konfigurera ett `arbetsflöde`**: Skapa ett `arbetsflöde` som automatiskt utlöser en avisering när en ny marknadsföringslead genereras. Ni kan lägga till en aviseringsnod i `arbetsflödet`, välja den "Marketing Clue"-kanal ni skapade och konfigurera meddelandets innehåll efter behov. Till exempel:

![image-1-2024-10-27-14-07-17](https://static-docs.nocobase.com/image-1-2024-10-27-14-07-17.png)

**Ta emot aviseringar i realtid**: När `arbetsflödet` utlöses kommer all relevant personal att få aviseringar i realtid, vilket säkerställer att teamet snabbt kan svara och agera.

![image-2-2024-10-27-14-07-22](https://static-docs.nocobase.com/image-2-2024-10-27-14-07-22.png)

**Meddelandehantering och spårning**: App-interna meddelanden grupperas efter kanalnamn. Ni kan filtrera meddelanden baserat på läst och oläst status för att snabbt se viktig information. Genom att klicka på knappen "Visa" omdirigeras ni till den konfigurerade länksidan för vidare åtgärder.

![20241027140648-2024-10-27-14-06-51-2024-10-29-13-26-41](https://static-docs.nocobase.com/20241027140648-2024-10-27-14-06-51-2024-10-29-13-26-41.png)