:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Plugin

Em NocoBase, o **Plugin Cliente** é a principal forma de estender e personalizar a funcionalidade do frontend. Ao estender a classe base `Plugin` fornecida por `@nocobase/client`, os desenvolvedores podem registrar lógica, adicionar componentes de página, estender menus ou integrar funcionalidades de terceiros em diferentes estágios do ciclo de vida.

## Estrutura da Classe Plugin

A estrutura básica de um plugin do lado do cliente é a seguinte:

```ts
import { Plugin } from '@nocobase/client';

export class PluginHelloClient extends Plugin {
  async afterAdd() {
    // Executado após o plugin ser adicionado
    console.log('Plugin added');
  }

  async beforeLoad() {
    // Executado antes do plugin carregar
    console.log('Before plugin load');
  }

  async load() {
    // Executado quando o plugin carrega, registra rotas, componentes de UI, etc.
    console.log('Plugin loaded');
  }
}

export default PluginHelloClient;
```

## Descrição do Ciclo de Vida

Cada plugin passa sequencialmente pelos seguintes estágios do ciclo de vida quando o navegador é atualizado ou a aplicação é inicializada:

| Método do Ciclo de Vida | Momento da Execução | Descrição |
|-------------------------|---------------------|-----------|
| **afterAdd()**          | Executado imediatamente após o plugin ser adicionado ao gerenciador de plugins | A instância do plugin já foi criada neste ponto, mas nem todos os plugins terminaram de inicializar. Adequado para inicialização leve, como ler configurações ou vincular eventos básicos. |
| **beforeLoad()**        | Executado antes do `load()` de todos os plugins | Pode acessar todas as instâncias de plugins habilitados (`this.app.pm.get()`). Adequado para lógica de preparação que depende de outros plugins. |
| **load()**              | Executado quando o plugin carrega | Este método é executado após a conclusão de todos os `beforeLoad()` dos plugins. Adequado para registrar rotas de frontend, componentes de UI e outras lógicas centrais. |

## Ordem de Execução

Toda vez que o navegador é atualizado, `afterAdd()` → `beforeLoad()` → `load()` serão executados.

## Contexto do Plugin e FlowEngine

A partir do NocoBase 2.0, as APIs de extensão do lado do cliente estão principalmente concentradas no **FlowEngine**. Na classe do plugin, você pode obter a instância do engine através de `this.engine`.

```ts
// Acesse o contexto do engine no método load()
async load() {
  const { app, router, apiClient } = this.engine.context;
  console.log('Current app:', app);
}
```

Para mais detalhes, consulte:  
- [FlowEngine](/flow-engine)  
- [Contexto](./context.md)