:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Mechanizm reaktywności: Observable

:::info
Mechanizm reaktywności Observable w NocoBase jest w zasadzie podobny do [MobX](https://mobx.js.org/README.html). Obecna implementacja bazowa wykorzystuje [@formily/reactive](https://github.com/alibaba/formily/tree/next/packages/reactive), a jego składnia i koncepcje są wysoce kompatybilne z [MobX]. Bezpośrednie użycie [MobX] nie nastąpiło jedynie z przyczyn historycznych.
:::

W NocoBase 2.0 reaktywne obiekty `Observable` są wszechobecne. Stanowią one rdzeń bazowego przepływu danych i responsywności interfejsu użytkownika, znajdując szerokie zastosowanie w takich elementach jak FlowContext, FlowModel czy FlowStep.

## Dlaczego wybraliśmy Observable?

NocoBase wybrało Observable zamiast innych rozwiązań do zarządzania stanem, takich jak Redux, Recoil, Zustand czy Jotai, z następujących głównych powodów:

- **Wyjątkowa elastyczność**: Observable może uczynić reaktywnym dowolny obiekt, tablicę, Mapę, Set itp. Naturalnie wspiera głębokie zagnieżdżanie i dynamiczne struktury, co czyni go idealnym dla złożonych modeli biznesowych.
- **Brak inwazyjności**: Mogą Państwo bezpośrednio manipulować oryginalnym obiektem, bez konieczności definiowania akcji, reducerów czy dodatkowych magazynów (store'ów), co zapewnia doskonałe doświadczenie deweloperskie.
- **Automatyczne śledzenie zależności**: Wystarczy owinąć komponent w `observer`, a komponent automatycznie będzie śledził używane właściwości Observable. Gdy dane się zmienią, interfejs użytkownika odświeży się automatycznie, bez potrzeby ręcznego zarządzania zależnościami.
- **Odpowiedni dla scenariuszy poza Reactem**: Mechanizm reaktywności Observable jest stosowalny nie tylko w React, ale może być również łączony z innymi frameworkami, aby sprostać szerszemu zakresowi potrzeb w zakresie danych reaktywnych.

## Dlaczego warto używać observer?

`observer` nasłuchuje zmian w obiektach Observable i automatycznie wyzwala aktualizacje komponentów React, gdy dane ulegną zmianie. Dzięki temu Państwa interfejs użytkownika pozostaje zsynchronizowany z danymi, bez konieczności ręcznego wywoływania `setState` lub innych metod aktualizacji.

## Podstawowe użycie

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

Aby uzyskać więcej informacji na temat użycia reaktywnego, proszę zapoznać się z dokumentacją [@formily/reactive](https://reactive.formilyjs.org/).