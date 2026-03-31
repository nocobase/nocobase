:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Mecanismo de Reatividade: Observable

:::info
O mecanismo de reatividade Observable do NocoBase é essencialmente similar ao [MobX](https://mobx.js.org/README.html). A implementação subjacente atual utiliza o [@formily/reactive](https://github.com/alibaba/formily/tree/next/packages/reactive), e sua sintaxe e conceitos são altamente compatíveis com o [MobX](https://mobx.js.org/README.html). O MobX não foi utilizado diretamente por razões históricas.
:::

No NocoBase 2.0, objetos reativos `Observable` estão por toda parte. Eles são o núcleo do fluxo de dados subjacente e da responsividade da interface do usuário, sendo amplamente utilizados em componentes como FlowContext, FlowModel e FlowStep.

## Por que escolher Observable?

O NocoBase escolheu Observable em vez de outras soluções de gerenciamento de estado como Redux, Recoil, Zustand e Jotai, pelos seguintes motivos principais:

- **Extremamente flexível**: Observable pode tornar qualquer objeto, array, Map, Set, etc., reativo. Ele suporta naturalmente aninhamento profundo e estruturas dinâmicas, tornando-o muito adequado para modelos de negócios complexos.
- **Não intrusivo**: Você pode manipular diretamente o objeto original, sem a necessidade de definir actions, reducers ou stores adicionais, proporcionando uma excelente experiência de desenvolvimento.
- **Rastreamento automático de dependências**: Ao envolver um componente com `observer`, o componente rastreia automaticamente as propriedades Observable que ele utiliza. Quando os dados mudam, a interface do usuário é atualizada automaticamente, sem a necessidade de gerenciar dependências manualmente.
- **Adequado para cenários fora do React**: O mecanismo de reatividade Observable não é aplicável apenas ao React, mas também pode ser combinado com outros frameworks para atender a uma gama mais ampla de necessidades de dados reativos.

## Por que usar observer?

`observer` escuta as mudanças em objetos Observable e aciona automaticamente as atualizações dos componentes React quando os dados mudam. Isso mantém sua interface do usuário sincronizada com seus dados, sem a necessidade de chamar `setState` ou outros métodos de atualização manualmente.

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

Para mais informações sobre o uso reativo, consulte a documentação do [@formily/reactive](https://reactive.formilyjs.org/).