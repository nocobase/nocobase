---
pkg: '@nocobase/plugin-workflow'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Översikt

## Introduktion

Arbetsflödes-pluginet hjälper er att orkestrera automatiserade affärsprocesser i NocoBase, såsom dagliga godkännanden, datasynkronisering, påminnelser och andra uppgifter. I ett arbetsflöde kan ni implementera komplex affärslogik genom att enkelt konfigurera utlösare och relaterade noder via ett visuellt gränssnitt, utan att skriva någon kod.

### Exempel

Varje arbetsflöde är orkestrerat med en utlösare och flera noder. Utlösaren representerar en händelse i systemet, och varje nod representerar ett exekveringssteg. Tillsammans beskriver de den affärslogik som ska bearbetas efter att händelsen inträffat. Följande bild visar en typisk process för lagerminskning efter att en produktbeställning har lagts:

![Exempel på arbetsflöde](https://static-docs.nocobase.com/20251029222146.png)

När en användare skickar in en beställning kontrollerar arbetsflödet automatiskt lagersaldot. Om lagersaldot är tillräckligt dras lagret av och processen för orderläggning fortsätter; annars avslutas processen.

### Användningsområden

Ur ett mer generellt perspektiv kan arbetsflöden i NocoBase-applikationer lösa problem i olika scenarier:

- Automatisera repetitiva uppgifter: Ordergranskningar, lagersynkronisering, datarensning, poängberäkningar med mera behöver inte längre utföras manuellt.
- Stöd för människa-maskin-samarbete: Arrangera godkännanden eller granskningar vid nyckelnoder och fortsätt med efterföljande steg baserat på resultaten.
- Anslut till externa system: Skicka HTTP-förfrågningar, ta emot push-meddelanden från externa tjänster och uppnå systemövergripande automatisering.
- Snabbt anpassa sig till affärsförändringar: Justera processstrukturen, villkor eller andra nodkonfigurationer och gå live utan en ny release.

## Installation

Arbetsflöde är ett inbyggt plugin i NocoBase. Ingen ytterligare installation eller konfiguration krävs.

## Läs mer

- [Kom igång](./getting-started)
- [Utlösare](./triggers/index)
- [Noder](./nodes/index)
- [Använda variabler](./advanced/variables)
- [Exekveringar](./advanced/executions)
- [Versionshantering](./advanced/revisions)
- [Avancerade inställningar](./advanced/options)
- [Utveckling av tillägg](./development/index)