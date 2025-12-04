:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Ställa in dataintervall

## Introduktion

Att ställa in ett dataintervall innebär att definiera standardfiltervillkor för ett block. Ni kan flexibelt justera dataintervallet utifrån era affärsbehov, men oavsett vilka filtreringsåtgärder som utförs kommer systemet automatiskt att tillämpa detta standardfiltervillkor, vilket säkerställer att datan alltid håller sig inom det angivna intervallets gränser.

## Användarhandbok

![20251027110053](https://static-docs.nocobase.com/20251027110053.png)

Filterfältet stödjer val av fält från den aktuella samlingen och relaterade samlingar.

![20251027110140](https://static-docs.nocobase.com/20251027110140.png)

### Operatorer

Olika typer av fält stödjer olika operatorer. Till exempel stödjer textfält operatorer som 'är lika med', 'är inte lika med' och 'innehåller'; nummerfält stödjer operatorer som 'större än' och 'mindre än'; medan datumfält stödjer operatorer som 'är inom' och 'är före ett specifikt datum'.

![20251027111124](https://static-docs.nocobase.com/20251027111124.png)

### Statiskt värde

Exempel: Filtrera data baserat på orderns ”Status”.

![20251027111229](https://static-docs.nocobase.com/20251027111229.png)

### Variabelt värde

Exempel: Filtrera orderdata för den aktuella användaren.

![20251027113349](https://static-docs.nocobase.com/20251027113349.png)

För mer information om variabler, se [Variabler](/interface-builder/variables)