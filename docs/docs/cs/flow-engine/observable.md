:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Reaktivní mechanismus: Observable

:::info
Reaktivní mechanismus Observable v NocoBase je v podstatě podobný [MobX](https://mobx.js.org/README.html). Současná základní implementace využívá [@formily/reactive](https://github.com/alibaba/formily/tree/next/packages/reactive) a její syntaxe a koncepty jsou vysoce kompatibilní s [MobX](https://mobx.js.org/README.html). Přímé použití MobX nebylo z historických důvodů realizováno.
:::

V NocoBase 2.0 jsou `Observable` reaktivní objekty všudypřítomné. Jsou jádrem základního datového toku a odezvy uživatelského rozhraní a jsou široce využívány v komponentách jako FlowContext, FlowModel a FlowStep.

## Proč zvolit Observable?

NocoBase zvolil Observable namísto jiných řešení pro správu stavu, jako jsou Redux, Recoil, Zustand a Jotai, z následujících hlavních důvodů:

- **Extrémní flexibilita**: Observable dokáže učinit reaktivním jakýkoli objekt, pole, Map, Set atd. Přirozeně podporuje hluboké vnoření a dynamické struktury, což je velmi vhodné pro složité obchodní modely.
- **Nenarušující**: Můžete přímo manipulovat s původním objektem, aniž byste museli definovat akce, reducery nebo další úložiště, což poskytuje vynikající vývojářskou zkušenost.
- **Automatické sledování závislostí**: Obalením komponenty pomocí `observer` komponenta automaticky sleduje vlastnosti Observable, které používá. Když se data změní, uživatelské rozhraní se automaticky aktualizuje, aniž byste museli ručně spravovat závislosti.
- **Vhodné pro scénáře mimo React**: Reaktivní mechanismus Observable je použitelný nejen pro React, ale lze jej také kombinovat s jinými frameworky, aby splňoval širší spektrum potřeb reaktivních dat.

## Proč používat observer?

`observer` naslouchá změnám v objektech Observable a automaticky spouští aktualizace React komponent, když se data změní. To udržuje vaše uživatelské rozhraní synchronizované s vašimi daty, aniž byste museli ručně volat `setState` nebo jiné metody aktualizace.

## Základní použití

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

Pro více informací o reaktivním použití se prosím podívejte do dokumentace [@formily/reactive](https://reactive.formilyjs.org/).