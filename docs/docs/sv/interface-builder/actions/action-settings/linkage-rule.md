:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Regler för kopplade åtgärder

## Introduktion

Regler för kopplade åtgärder låter användare dynamiskt styra statusen för en åtgärd (som att visa, aktivera, dölja, inaktivera, etc.) baserat på specifika villkor. Genom att konfigurera dessa regler kan ni koppla åtgärdsknappars beteende till den aktuella posten, användarrollen eller kontextuella data.

![20251029150224](https://static-docs.nocobase.com/20251029150224.png)

## Användning

När villkoret är uppfyllt (det godkänns som standard om inget villkor har ställts in) utlöses körningen av egenskapinställningar eller JavaScript. Konstanter och variabler stöds i villkorsbedömningen.

![20251030224601](https://static-docs.nocobase.com/20251030224601.png)

Regeln stöder modifiering av knappegenskaper.

![20251029150452](https://static-docs.nocobase.com/20251029150452.png)

## Konstanter

Exempel: Betalda ordrar kan inte redigeras.

![20251029150638](https://static-docs.nocobase.com/20251029150638.png)

## Variabler

### Systemvariabler

![20251029150014](https://static-docs.nocobase.com/20251029150014.png)

Exempel 1: Styr en knapps synlighet baserat på den aktuella enhetstypen.

![20251029151057](https://static-docs.nocobase.com/20251029151057.png)

Exempel 2: Knappen för massuppdatering i rubriken på orderblockstabellen är endast tillgänglig för administratörsrollen; andra roller kan inte utföra denna åtgärd.

![20251029151209](https://static-docs.nocobase.com/20251029151209.png)

### Kontextuella variabler

Exempel: Lägg till-knappen på ordermöjligheterna (relationsblock) är endast aktiverad när orderstatusen är "Väntar på betalning" eller "Utkast". I andra statusar kommer knappen att vara inaktiverad.

![20251029151520](https://static-docs.nocobase.com/20251029151520.png)

![20251029152200](https://static-docs.nocobase.com/20251029152200.png)

För mer information om variabler, se [Variabler](/interface-builder/variables).