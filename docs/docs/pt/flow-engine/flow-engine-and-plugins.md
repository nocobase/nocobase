:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Relação entre FlowEngine e Plugins

O **FlowEngine** não é um plugin, mas sim uma **API central** fornecida para que os plugins a utilizem, conectando as capacidades centrais com as extensões de negócio.
No NocoBase 2.0, todas as APIs estão centralizadas no FlowEngine, e os plugins podem acessar o FlowEngine através de `this.engine`.

```ts
class PluginHello extends Plugin {
  async load() {
    this.engine.registerModels({ ... });
  }
}
```

## Context: Capacidades Globais Gerenciadas Centralmente

O FlowEngine oferece um **Context** centralizado que reúne as APIs necessárias para diversos cenários, por exemplo:

```ts
class PluginHello extends Plugin {
  async load() {
    // Extensão de rota
    this.engine.context.router;

    // Fazer uma requisição
    this.engine.context.api.request();

    // Relacionado à internacionalização (i18n)
    this.engine.context.i18n;
    this.engine.context.t('Hello');
  }
}
```

> **Observação**:
> O Context no 2.0 resolve os seguintes problemas da versão 1.x:
>
> * Contexto disperso, chamadas inconsistentes
> * O contexto era perdido entre diferentes árvores de renderização do React
> * Só podia ser usado dentro de componentes React
>
> Para mais detalhes, consulte o **capítulo FlowContext**.

---

## Apelidos de Atalho em Plugins

Para simplificar as chamadas, o FlowEngine oferece alguns apelidos na instância do plugin:

* `this.context` → equivalente a `this.engine.context`
* `this.router` → equivalente a `this.engine.context.router`

## Exemplo: Estendendo a Rota

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {
    this.router.add('root', {
      path: '/',
      element: <div>Hello</div>,
    });
  }
}

// Para cenários de exemplo e teste
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

Neste exemplo:

* O plugin estende a rota para o caminho `/` usando o método `this.router.add`;
* `createMockClient` fornece uma aplicação mock limpa para facilitar a demonstração e os testes;
* `app.getRootComponent()` retorna o componente raiz, que pode ser montado diretamente na página.