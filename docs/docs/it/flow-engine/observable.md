:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Meccanismo di Reattività: Observable

:::info
Il meccanismo di reattività Observable di NocoBase è essenzialmente simile a [MobX](https://mobx.js.org/README.html). L'implementazione sottostante attuale utilizza [@formily/reactive](https://github.com/alibaba/formily/tree/next/packages/reactive), e la sua sintassi e i suoi concetti sono altamente compatibili con [MobX](https://mobx.js.org/README.html). Non è stato utilizzato direttamente solo per ragioni storiche.
:::

In NocoBase 2.0, gli oggetti reattivi `Observable` sono onnipresenti. Sono il cuore del flusso di dati sottostante e della reattività dell'interfaccia utente, e vengono ampiamente utilizzati in contesti come FlowContext, FlowModel e FlowStep.

## Perché scegliere Observable?

NocoBase ha scelto Observable rispetto ad altre soluzioni di gestione dello stato come Redux, Recoil, Zustand e Jotai per le seguenti ragioni principali:

-   **Estremamente flessibile**: Observable può rendere reattivo qualsiasi oggetto, array, Map, Set, ecc. Supporta naturalmente l'annidamento profondo e le strutture dinamiche, rendendolo molto adatto per modelli di business complessi.
-   **Non intrusivo**: Può manipolare direttamente l'oggetto originale senza dover definire action, reducer o store aggiuntivi, offrendo un'esperienza di sviluppo eccellente.
-   **Tracciamento automatico delle dipendenze**: Avvolgendo un componente con `observer`, il componente traccia automaticamente le proprietà Observable che utilizza. Quando i dati cambiano, l'interfaccia utente si aggiorna automaticamente senza la necessità di gestire manualmente le dipendenze.
-   **Adatto a scenari non-React**: Il meccanismo di reattività Observable non è applicabile solo a React, ma può anche essere combinato con altri framework per soddisfare una gamma più ampia di esigenze di dati reattivi.

## Perché usare observer?

`observer` ascolta i cambiamenti negli oggetti Observable e attiva automaticamente gli aggiornamenti dei componenti React quando i dati subiscono variazioni. Questo Le permette di mantenere la Sua interfaccia utente sincronizzata con i dati senza dover chiamare manualmente `setState` o altri metodi di aggiornamento.

## Utilizzo Base

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

Per maggiori informazioni sull'utilizzo reattivo, può consultare la documentazione di [@formily/reactive](https://reactive.formilyjs.org/).