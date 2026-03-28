---
title: Pontos de Extensão do Plugin RunJS (Documentação ctx / Snippets / Mapeamento de Cena)
---

:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/flow-engine/runjs-extension-points).
:::

# Pontos de Extensão do Plugin RunJS (Documentação ctx / Snippets / Mapeamento de Cena)

Quando um plugin adiciona ou estende as capacidades do RunJS, recomenda-se registrar o "mapeamento de contexto / documentação do `ctx` / código de exemplo" por meio dos **pontos de extensão oficiais**. Isso garante que:

- O CodeEditor possa fornecer preenchimento automático (auto-completion) para `ctx.xxx.yyy`.
- A codificação por IA possa obter referências de API `ctx` estruturadas e exemplos.

Este capítulo apresenta dois pontos de extensão:

- `registerRunJSContextContribution(...)`
- `registerRunJSSnippet(...)`

## 1. `registerRunJSContextContribution`

Usado para registrar "contribuições" (contributions) do RunJS. Usos típicos incluem:

- Adicionar/sobrescrever mapeamentos de `RunJSContextRegistry` (`modelClass` -> `RunJSContext`, incluindo `scenes`).
- Estender `RunJSDocMeta` (descrições/exemplos/modelos de preenchimento para a API `ctx`) para `FlowRunJSContext` ou um `RunJSContext` personalizado.

### Descrição do Comportamento

- As contribuições são executadas coletivamente durante a fase `setupRunJSContexts()`.
- Se o `setupRunJSContexts()` já tiver sido concluído, **registros tardios serão executados imediatamente** (sem necessidade de reiniciar o setup).
- Cada contribuição será executada **no máximo uma vez** para cada `RunJSVersion`.

### Exemplo: Adicionando um Contexto de Modelo editável por JS

```ts
import { registerRunJSContextContribution, FlowRunJSContext, RunJSContextRegistry } from '@nocobase/flow-engine';

registerRunJSContextContribution(({ version, FlowRunJSContext: BaseCtx, RunJSContextRegistry: Registry }) => {
  if (version !== 'v1') return;

  class MyPluginRunJSContext extends BaseCtx {}

  // 1) Documentação/preenchimento do ctx (RunJSDocMeta)
  MyPluginRunJSContext.define({
    label: 'Contexto RunJS do MyPlugin',
    properties: {
      myPlugin: {
        description: 'Namespace do meu plugin',
        detail: 'object',
        properties: {
          hello: {
            description: 'Dizer olá',
            detail: '(name: string) => string',
            completion: { insertText: `ctx.myPlugin.hello('Mundo')` },
          },
        },
      },
    },
  });

  // 2) Mapeamento model -> context (a cena afeta o preenchimento do editor/filtragem de snippets)
  Registry.register('v1', 'MyPluginJSModel', MyPluginRunJSContext, { scenes: ['block'] });
});
```

## 2. `registerRunJSSnippet`

Usado para registrar trechos de código de exemplo (snippets) para o RunJS, utilizados para:

- Preenchimento de snippets no CodeEditor.
- Servir como exemplos/materiais de referência para codificação por IA (podem ser filtrados por cena/versão/idioma).

### Recomendação de Nomeação de ref

Sugere-se usar: `plugin/<nomeDoPlugin>/<topico>`, por exemplo:

- `plugin/plugin-my/foo`
- `plugin/plugin-my/api-request-example`

Evite conflitos com os namespaces `global/*` ou `scene/*` do núcleo (core).

### Estratégia de Conflito

- Por padrão, entradas `ref` existentes não são sobrescritas (retorna `false` sem lançar erro).
- Para sobrescrever explicitamente, passe `{ override: true }`.

### Exemplo: Registrando um Snippet

```ts
import { registerRunJSSnippet } from '@nocobase/flow-engine';

registerRunJSSnippet('plugin/plugin-my/hello', async () => ({
  default: {
    label: 'Olá (Meu Plugin)',
    description: 'Exemplo mínimo para o meu plugin',
    prefix: 'my-hello',
    versions: ['v1'],
    scenes: ['block'],
    contexts: ['*'],
    content: `
// Snippet do meu plugin
ctx.message.success('Olá do plugin');
`,
  },
}));
```

## 3. Melhores Práticas

- **Manutenção em Camadas de Documentação + Snippets**:
  - `RunJSDocMeta`: Descrições/modelos de preenchimento (curtos, estruturados).
  - Snippets: Exemplos longos (reutilizáveis, filtráveis por cena/versão).
- **Evite Prompts Excessivamente Longos**: Os exemplos devem ser concisos; priorize "modelos mínimos executáveis".
- **Prioridade de Cena**: Se o seu código JS roda principalmente em cenários como formulários ou tabelas, certifique-se de preencher o campo `scenes` corretamente para melhorar a relevância dos preenchimentos e exemplos.

## 4. Ocultando Preenchimentos com Base no ctx Real: `hidden(ctx)`

Certas APIs do `ctx` são altamente específicas ao contexto (por exemplo, `ctx.popup` só está disponível quando um pop-up ou gaveta está aberto). Se você deseja ocultar essas APIs indisponíveis durante o preenchimento, pode definir `hidden(ctx)` para a entrada correspondente no `RunJSDocMeta`:

- Retorna `true`: Oculta o nó atual e sua subárvore.
- Retorna `string[]`: Oculta subcaminhos específicos sob o nó atual (suporta o retorno de múltiplos caminhos; os caminhos são relativos; as subárvores são ocultadas com base na correspondência de prefixo).

`hidden(ctx)` suporta `async`: Você pode usar `await ctx.getVar('ctx.xxx')` para determinar a visibilidade (a critério do usuário). Recomenda-se manter essa lógica rápida e sem efeitos colaterais (evite requisições de rede, por exemplo).

Exemplo: Mostrar preenchimentos de `ctx.popup.*` apenas quando `popup.uid` existir.

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Contexto de pop-up (async)',
      hidden: async (ctx) => !(await ctx.getVar('ctx.popup'))?.uid,
      properties: {
        uid: 'UID do pop-up',
      },
    },
  },
});
```

Exemplo: O pop-up está disponível, mas alguns subcaminhos estão ocultos (apenas caminhos relativos; por exemplo, ocultando `record` e `parent.record`).

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Contexto de pop-up (async)',
      hidden: async (ctx) => {
        const popup = await ctx.getVar('ctx.popup');
        if (!popup?.uid) return true;
        const hidden: string[] = [];
        if (!popup?.record) hidden.push('record');
        if (!popup?.parent?.record) hidden.push('parent.record');
        return hidden;
      },
      properties: {
        uid: 'UID do pop-up',
        record: 'Registro do pop-up',
        parent: {
          properties: {
            record: 'Registro pai',
          },
        },
      },
    },
  },
});
```

Nota: O CodeEditor sempre habilita a filtragem de preenchimento com base no `ctx` real (fail-open, não lança erros).

## 5. `info/meta` em Tempo de Execução e API de Informações de Contexto (para Preenchimentos e LLMs)

Além de manter a documentação do `ctx` estaticamente via `FlowRunJSContext.define()`, você também pode injetar **info/meta** em tempo de execução via `FlowContext.defineProperty/defineMethod`. Você pode então gerar informações de contexto **serializáveis** para o CodeEditor ou LLMs usando as seguintes APIs:

- `await ctx.getApiInfos(options?)`: Informações estáticas da API.
- `await ctx.getVarInfos(options?)`: Informações da estrutura de variáveis (obtidas de `meta`, suporta expansão de path/maxDepth).
- `await ctx.getEnvInfos()`: Instantâneo (snapshot) do ambiente de execução.

### 5.1 `defineMethod(name, fn, info?)`

O `info` suporta (todos opcionais):

- `description` / `detail` / `examples`
- `ref: string | { url: string; title?: string }`
- `params` / `returns` (estilo JSDoc)

> Nota: `getApiInfos()` gera documentação estática da API e não incluirá campos como `deprecated`, `disabled` ou `disabledReason`.

Exemplo: Fornecendo links de documentação para `ctx.refreshTargets()`.

```ts
ctx.defineMethod('refreshTargets', async () => {
  // ...
}, {
  description: 'Atualiza os dados dos blocos de destino',
  detail: '() => Promise<void>',
  ref: { url: 'https://docs.nocobase.com/', title: 'Docs' },
});
```

### 5.2 `defineProperty(key, { meta?, info? })`

- `meta`: Usado para a interface do seletor de variáveis (`getPropertyMetaTree` / `FlowContextSelector`). Determina a visibilidade, estrutura em árvore, desativação, etc. (suporta funções/async).
  - Campos comuns: `title` / `type` / `properties` / `sort` / `hidden` / `disabled` / `disabledReason` / `buildVariablesParams`
- `info`: Usado para documentação estática da API (`getApiInfos`) e descrições para LLMs. Não afeta a interface do seletor de variáveis (suporta funções/async).
  - Campos comuns: `title` / `type` / `interface` / `description` / `examples` / `ref` / `params` / `returns`

Quando apenas `meta` é fornecido (sem `info`):

- `getApiInfos()` não retornará esta chave (pois as docs estáticas da API não são inferidas a partir de `meta`).
- `getVarInfos()` construirá a estrutura da variável com base no `meta` (usado para seletores de variáveis/árvores de variáveis dinâmicas).

### 5.3 API de Informações de Contexto

Usada para gerar "informações de capacidade de contexto disponíveis".

```ts
type FlowContextInfosEnvNode = {
  description?: string;
  getVar?: string; // Pode ser usado diretamente em await ctx.getVar(getVar), recomendado começar com "ctx."
  value?: any; // Valor estático resolvido (serializável, retornado apenas quando inferível)
  properties?: Record<string, FlowContextInfosEnvNode>;
};

type FlowContextApiInfos = Record<string, any>; // Documentação estática (nível superior)
type FlowContextVarInfos = Record<string, any>; // Estrutura de variáveis (expansível por path/maxDepth)
type FlowContextEnvInfos = {
  popup?: FlowContextInfosEnvNode;
  block?: FlowContextInfosEnvNode;
  flowModel?: FlowContextInfosEnvNode;
  resource?: FlowContextInfosEnvNode;
  record?: FlowContextInfosEnvNode;
  currentViewBlocks?: FlowContextInfosEnvNode;
};
```

Parâmetros comuns:

- `getApiInfos({ version })`: Versão da documentação do RunJS (padrão é `v1`).
- `getVarInfos({ path, maxDepth })`: Recorte e profundidade máxima de expansão (padrão é 3).

Nota: Os resultados retornados pelas APIs acima não contêm funções e são adequados para serialização direta para LLMs.

### 5.4 `await ctx.getVar(path)`

Quando você tem uma "string de caminho de variável" (por exemplo, vinda de uma configuração ou entrada do usuário) e deseja recuperar o valor em tempo de execução dessa variável diretamente, use `getVar`:

- Exemplo: `const v = await ctx.getVar('ctx.record.roles.id')`
- `path` é um caminho de expressão começando com `ctx.` (ex: `ctx.record.id` / `ctx.record.roles[0].id`).

Adicionalmente: Métodos ou propriedades que começam com um sublinhado `_` são tratados como membros privados e não aparecerão na saída de `getApiInfos()` ou `getVarInfos()`.