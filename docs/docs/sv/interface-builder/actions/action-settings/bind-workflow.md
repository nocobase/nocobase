:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Binda arbetsflöde

## Introduktion

På vissa åtgärdsknappar kan ni konfigurera ett bundet arbetsflöde för att koppla åtgärden till ett arbetsflöde och därmed automatisera databehandlingen.

![20251029144822](https://static-docs.nocobase.com/20251029144822.png)

![20251029145017](https://static-docs.nocobase.com/20251029145017.png)

## Stödda åtgärder och arbetsflödestyper

De åtgärdsknappar och arbetsflödestyper som för närvarande stöds för bindning är följande:

| Åtgärdsknapp \ Arbetsflödestyp | Före åtgärd-händelse | Efter åtgärd-händelse | Godkännandehändelse | Anpassad åtgärd-händelse |
| --- | --- | --- | --- | --- |
| Formulärets "Skicka", "Spara"-knappar | ✅ | ✅ | ✅ | ❌ |
| "Uppdatera post"-knappen i datarader (tabell, lista, etc.) | ✅ | ✅ | ✅ | ❌ |
| "Radera"-knappen i datarader (tabell, lista, etc.) | ✅ | ❌ | ❌ | ❌ |
| "Utlös arbetsflöde"-knappen | ❌ | ❌ | ❌ | ✅ |

## Binda flera arbetsflöden samtidigt

En åtgärdsknapp kan bindas till flera arbetsflöden. När flera arbetsflöden är bundna, följer deras exekveringsordning dessa regler:

1. För arbetsflöden av samma utlösartyp exekveras synkrona arbetsflöden först, följt av asynkrona arbetsflöden.
2. Arbetsflöden av samma utlösartyp exekveras i den konfigurerade ordningen.
3. Mellan arbetsflöden av olika utlösartyper:
    1. Före åtgärd-händelser exekveras alltid före efter åtgärd- och godkännandehändelser.
    2. Efter åtgärd- och godkännandehändelser har ingen specifik ordning, och affärslogiken bör inte förlita sig på konfigurationsordningen.

## Mer information

För olika arbetsflödeshändelsetyper, se den detaljerade dokumentationen för relevanta plugin:

* [Efter åtgärd-händelse]
* [Före åtgärd-händelse]
* [Godkännandehändelse]
* [Anpassad åtgärd-händelse]