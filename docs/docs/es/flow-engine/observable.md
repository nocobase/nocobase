:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Mecanismo de Reactividad: Observable

:::info
El mecanismo de reactividad Observable de NocoBase es esencialmente similar a [MobX](https://mobx.js.org/README.html). La implementación subyacente actual utiliza [@formily/reactive](https://github.com/alibaba/formily/tree/next/packages/reactive), y su sintaxis y conceptos son altamente compatibles con [MobX](https://mobx.js.org/README.html). La razón por la que no se utiliza directamente es por motivos históricos.
:::

En NocoBase 2.0, los objetos reactivos `Observable` están por todas partes. Son el núcleo del flujo de datos subyacente y la capacidad de respuesta de la interfaz de usuario, y se utilizan ampliamente en componentes como FlowContext, FlowModel y FlowStep.

## ¿Por qué elegir Observable?

NocoBase eligió Observable en lugar de otras soluciones de gestión de estado como Redux, Recoil, Zustand y Jotai, por las siguientes razones principales:

- **Flexibilidad extrema**: Observable puede hacer que cualquier objeto, array, Map, Set, etc., sea reactivo. Soporta de forma nativa el anidamiento profundo y las estructuras dinámicas, lo que lo hace muy adecuado para modelos de negocio complejos.
- **No intrusivo**: Puede manipular directamente el objeto original sin necesidad de definir acciones, *reducers* o *stores* adicionales, lo que proporciona una excelente experiencia de desarrollo.
- **Seguimiento automático de dependencias**: Al envolver un componente con `observer`, este rastrea automáticamente las propiedades Observable que utiliza. Cuando los datos cambian, la interfaz de usuario se actualiza automáticamente sin necesidad de gestionar las dependencias manualmente.
- **Adecuado para escenarios que no son de React**: El mecanismo de reactividad Observable no solo es aplicable a React, sino que también se puede combinar con otros *frameworks* para satisfacer una gama más amplia de necesidades de datos reactivos.

## ¿Por qué usar observer?

`observer` escucha los cambios en los objetos Observable y activa automáticamente las actualizaciones de los componentes de React cuando los datos cambian. Esto mantiene su interfaz de usuario sincronizada con sus datos sin tener que llamar manualmente a `setState` u otros métodos de actualización.

## Uso Básico

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

Para obtener más información sobre el uso reactivo, consulte la documentación de [@formily/reactive](https://reactive.formilyjs.org/).