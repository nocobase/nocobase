:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Reaktivitetsmekanism: Observable

:::info
NocoBases reaktivitetsmekanism med Observable liknar i grunden [MobX](https://mobx.js.org/README.html). Den nuvarande underliggande implementeringen använder [@formily/reactive](https://github.com/alibaba/formily/tree/next/packages/reactive), vars syntax och koncept är mycket kompatibla med [MobX](https://mobx.js.org/README.html). Det användes inte direkt på grund av historiska skäl.
:::

I NocoBase 2.0 finns `Observable` reaktiva objekt överallt. De utgör kärnan i det underliggande dataflödet och UI-responsen, och används flitigt i komponenter som FlowContext, FlowModel och FlowStep.

## Varför välja Observable?

NocoBase valde Observable framför andra lösningar för tillståndshantering som Redux, Recoil, Zustand och Jotai av följande huvudskäl:

-   **Extremt flexibelt**: Observable kan göra vilket objekt, vilken array, Map, Set etc. som helst reaktivt. Det stöder naturligt djup nästling och dynamiska strukturer, vilket gör det mycket lämpligt för komplexa affärsmodeller.
-   **Icke-påträngande**: Ni kan direkt manipulera det ursprungliga objektet utan att definiera actions, reducers eller ytterligare stores, vilket ger en utmärkt utvecklingsupplevelse.
-   **Automatisk beroendespårning**: Genom att omsluta en komponent med `observer` spårar komponenten automatiskt de Observable-egenskaper den använder. När datan ändras uppdateras användargränssnittet automatiskt utan att ni behöver hantera beroenden manuellt.
-   **Lämpligt för icke-React-scenarier**: Observable-reaktivitetsmekanismen är inte bara tillämplig för React utan kan också kombineras med andra ramverk för att möta ett bredare spektrum av reaktiva databehov.

## Varför använda observer?

`observer` lyssnar efter ändringar i Observable-objekt och triggar automatiskt uppdateringar av React-komponenter när datan ändras. Detta håller ert användargränssnitt synkroniserat med er data utan att ni behöver anropa `setState` eller andra uppdateringsmetoder manuellt.

## Grundläggande användning

```tsx
import React from 'react';
import { Input } from 'antd';
import { observer, observable } from '@nocobase/flow-engine';

const obs = observable.deep({
  value: 'aa'
});

const MyComponent = observer(() => {
  return (
    <div>
      <Input
        defaultValue={obs.value}
        onChange={(e) => {
          obs.value = e.target.value;
        }}
      />
      <div>{obs.value}</div>
    </div>
  );
});

export default MyComponent;
```

För mer information om reaktiv användning, se dokumentationen för [@formily/reactive](https://reactive.formilyjs.org/).