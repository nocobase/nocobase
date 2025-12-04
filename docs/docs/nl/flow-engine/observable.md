:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Reactiviteitsmechanisme: Observable

:::info
Het Observable reactiviteitsmechanisme van NocoBase is in essentie vergelijkbaar met [MobX](https://mobx.js.org/README.html). De huidige onderliggende implementatie maakt gebruik van [@formily/reactive](https://github.com/alibaba/formily/tree/next/packages/reactive), waarvan de syntaxis en concepten zeer compatibel zijn met [MobX](https://mobx.js.org/README.html). Het is om historische redenen niet direct gebruikt.
:::

In NocoBase 2.0 zijn `Observable` reactieve objecten overal aanwezig. Het vormt de kern van de onderliggende gegevensstroom en UI-responsiviteit, en wordt veelvuldig gebruikt in onderdelen zoals FlowContext, FlowModel en FlowStep.

## Waarom kiezen voor Observable?

NocoBase heeft voor Observable gekozen boven andere state management-oplossingen zoals Redux, Recoil, Zustand en Jotai, om de volgende belangrijke redenen:

- **Extreem flexibel**: Observable kan elk object, array, Map, Set, enzovoort, reactief maken. Het ondersteunt van nature diepe nesting en dynamische structuren, waardoor het zeer geschikt is voor complexe bedrijfsmodellen.
- **Niet-invasief**: U kunt het originele object direct manipuleren zonder acties, reducers of extra stores te definiëren, wat een uitstekende ontwikkelervaring biedt.
- **Automatische afhankelijkheidsdetectie**: Door een component met `observer` te omwikkelen, volgt de component automatisch de Observable-eigenschappen die het gebruikt. Wanneer de gegevens veranderen, wordt de UI automatisch vernieuwd zonder dat u handmatig afhankelijkheden hoeft te beheren.
- **Geschikt voor niet-React scenario's**: Het Observable reactiviteitsmechanisme is niet alleen van toepassing op React, maar kan ook worden gecombineerd met andere frameworks om te voldoen aan een breder scala aan reactieve gegevensbehoeften.

## Waarom `observer` gebruiken?

`observer` luistert naar veranderingen in Observable-objecten en triggert automatisch updates van React-componenten wanneer de gegevens wijzigen. Dit zorgt ervoor dat uw UI synchroon blijft met uw gegevens, zonder dat u handmatig `setState` of andere updatemethoden hoeft aan te roepen.

## Basisgebruik

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

Voor meer informatie over reactief gebruik, verwijzen wij u naar de documentatie van [@formily/reactive](https://reactive.formilyjs.org/).