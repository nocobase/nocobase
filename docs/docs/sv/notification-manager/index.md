---
pkg: '@nocobase/plugin-notification-manager'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Notishantering

## Introduktion

Notishantering är en centraliserad tjänst som integrerar flera notiskanaler. Den erbjuder en enhetlig lösning för kanalinställningar, sändningshantering och loggning, och stöder flexibel utökning till fler kanaler.

![20240928112556](https://static-docs.nocobase.com/20240928112556.png)

- **Lila del**: Notishanteringen erbjuder en omfattande tjänst som omfattar kanalinställningar och loggning, med möjlighet att utöka till fler notiskanaler.
- **Grön del**: In-App-meddelande, en inbyggd kanal som gör det möjligt för användare att ta emot notiser direkt i applikationen.
- **Röd del**: E-post, en utbyggbar kanal som gör det möjligt för användare att ta emot notiser via e-post.

## Kanalhantering

![20240928181752](https://static-docs.nocobase.com/20240928181752.png)

För närvarande stöds följande kanaler:

- [In-App-meddelande](/notification-manager/notification-in-app-message)
- [E-post](/notification-manager/notification-email) (med inbyggd SMTP-överföring)

Ni kan också utöka med fler kanaler, se dokumentationen för [Kanalutökning](/notification-manager/development/extension).

## Notisloggar

Systemet loggar detaljerad information och status för varje notis, vilket underlättar analys och felsökning.

![20240928181649](https://static-docs.nocobase.com/20240928181649.png)

## Arbetsflödesnotisnod

![20240928181726](https://static-docs.nocobase.com/20240928181726.png)