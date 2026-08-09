---
title: "Adicionar interação no frontend a uma Tool"
description: "Apresenta card, modal, decisions.edit e execução no frontend para Tools de funcionários de IA do NocoBase, além de adicionar um cartão de seleção a um funcionário integrado."
keywords: "NocoBase,cartão de Tool no frontend,ToolsUIProperties,decisions.edit,SuggestionsOptionsCard,frontend Tool"
---

# Adicionar interação no frontend a uma Tool

Algumas Tools só precisam ser executadas no servidor e não exigem uma interface personalizada. Outras precisam que o usuário confirme, selecione ou edite parâmetros; nesse caso, é possível registrar um cartão, um modal ou uma lógica de execução no navegador para a Tool de mesmo nome.

:::tip Diferencie os dois conceitos

O **cartão no frontend** cuida apenas da exibição e da interação entre a pessoa e o ToolCall. Isso não significa que a lógica de negócio da Tool será necessariamente executada no navegador.

Se o objetivo for apenas exibir opções como em `suggestions` e continuar o `invoke()` do servidor depois que o usuário fizer uma escolha, mantenha o padrão `execution: 'backend'`. Defina `execution: 'frontend'` e implemente o `invoke` no frontend somente quando a lógica da Tool realmente precisar acessar a página atual do navegador, o FlowModel ou o estado do editor.

:::

## Primeiro, defina os parâmetros e a lógica de execução no servidor

A Tool integrada `suggestions` está em:

```text
packages/plugins/@nocobase/plugin-ai/src/ai/tools/suggestions.ts
```

Seu schema contém tanto as opções disponíveis quanto a escolha final do usuário:

```ts
schema: z.object({
  option: z.string().describe('user selected option, ignore this param').optional(),
  options: z.array(z.string()).describe('A list of suggested prompts for the user to choose from.'),
})
```

Conforme a descrição da Tool, na primeira chamada o modelo deve gerar apenas `options`. Como essa Tool não define `defaultPermission: 'ALLOW'`, a permissão padrão é `ASK`, e o ToolCall fica pausado enquanto aguarda uma ação do usuário.

Depois que o usuário faz uma escolha, o frontend usa `decisions.edit()` para combinar `option` com os parâmetros originais e retoma o ToolCall. Por fim, o `invoke()` do servidor retorna o conteúdo selecionado:

```ts
return {
  status: 'success',
  content: args?.option,
};
```

A implementação integrada também grava o resultado da seleção novamente em `aiMessages.toolCalls`, para que as mensagens do histórico continuem mostrando a opção escolhida quando forem renderizadas outra vez.

## Criar o cartão da Tool

O cartão no frontend recebe `ToolsUIProperties`:

```tsx
import { useState } from 'react';
import type { ToolsUIProperties } from '@nocobase/client-v2';
import { Button, Flex } from 'antd';

interface DeveloperChoiceArgs {
  options?: string[] | string;
  option?: string;
}

const parseOptions = (value: DeveloperChoiceArgs['options']): string[] => {
  if (Array.isArray(value)) {
    return value.filter((option): option is string => typeof option === 'string');
  }
  if (typeof value !== 'string') {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((option): option is string => typeof option === 'string') : [];
  } catch {
    return [];
  }
};

export const DeveloperChoiceCard = ({
  toolCall,
  decisions,
}: ToolsUIProperties<DeveloperChoiceArgs>) => {
  const [submitting, setSubmitting] = useState(false);
  const options = parseOptions(toolCall.args?.options);

  const handleSelect = async (option: string) => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await decisions.edit({
        ...toolCall.args,
        option,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Flex gap="small" wrap="wrap">
      {options.map((option, index) => (
        <Button
          key={`${option}-${index}`}
          disabled={toolCall.invokeStatus !== 'interrupted' || submitting}
          onClick={() => handleSelect(option)}
        >
          {option}
        </Button>
      ))}
    </Flex>
  );
};
```

:::warning Atenção

Este componente apresenta o uso geral de `decisions.edit()` e trata cliques repetidos e parâmetros em strings JSON. Em produção, também é necessário considerar conversas somente leitura, a mensagem ativa atual e o estado das seleções no histórico conforme a interface de chat em que o componente aparece. Consulte a implementação completa em `packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/tools/SuggestionsOptionsCard.tsx`.

:::

`decisions` fornece três operações:

| Método | Função |
| --- | --- |
| `approve()` | Continua a execução com os parâmetros originais |
| `edit(args)` | Altera os parâmetros e continua a execução |
| `reject(message?)` | Rejeita a execução e retorna o motivo ao fluxo da conversa |

A implementação integrada de `SuggestionsOptionsCard.tsx` também trata estes detalhes:

- Aceita `options` tanto como array quanto como string JSON
- Exibe um loading enquanto o ToolCall ainda está sendo gerado
- Permite escolher somente em ToolCalls com estado `interrupted`
- Desabilita os botões imediatamente após um clique para evitar envios repetidos
- Mantém e destaca a opção já selecionada nas mensagens do histórico
- Permite que somente a conversa atualmente editável acione a operação

## Registrar no plugin do cliente

O nome registrado no frontend deve ser exatamente igual ao nome da Tool no servidor:

```tsx
import { Plugin } from '@nocobase/client-v2';
import { DeveloperChoiceCard } from './ai-employees/tools/DeveloperChoiceCard';

export class PluginDeveloperHelperClient extends Plugin {
  async load() {
    this.ai.toolsManager.registerTools('developerChoice', {
      ui: {
        card: DeveloperChoiceCard,
      },
    });
  }
}

export default PluginDeveloperHelperClient;
```

Se o arquivo no servidor for `src/ai/tools/developerChoice.ts`, registre `developerChoice` aqui.

O processo de registro da Tool integrada `suggestions` segue a mesma abordagem:

```ts
export const suggestionsTool = [
  'suggestions',
  {
    ui: {
      card: SuggestionsOptionsCard,
    },
  },
];
```

Em seguida, `PluginAIClientV2.load()` chama `registerPluginAIClientV2BuiltinTools(this.ai.toolsManager)`, que combina o cartão com a definição da Tool de mesmo nome retornada pelo servidor.

## Escolher entre cartão, modal e execução no frontend

Abaixo estão apenas as configurações mais comuns de `ToolsOptions` no cliente. Consulte o tipo completo em `packages/core/client-v2/src/ai/tools-manager/types.ts`.

```ts
type ToolsOptions = {
  ui?: {
    card?: ComponentType<ToolsUIProperties>;
    modal?: {
      title?: string;
      okText?: string;
      Component?: ComponentType;
      footer?: ComponentType;
      hideOkButton?: boolean;
      // modal.props、useOnOk 等配置请查看完整类型。
    };
  };
  invoke?: (app, params) => unknown | Promise<unknown>;
  // useHooks 等其他配置请查看完整类型。
};
```

### Usar um cartão

Use `card` por padrão. O cartão é adequado para exibir o estado da execução, botões de confirmação e poucas opções no local do ToolCall.

### Usar um modal

Adicione um `modal` quando houver muito conteúdo, necessidade de uma visualização maior ou edição complexa de parâmetros.

### Executar a Tool no navegador

Se a Tool no servidor definir `execution: 'frontend'`, o cliente também precisará fornecer `invoke`. Esse tipo de Tool é adequado para ler o contexto da página atual, o conteúdo do editor ou o estado do FlowEngine, mas não para gravar dados que exijam proteção por permissões do servidor.

## Exemplo completo: adicionar um cartão de seleção a um funcionário de IA integrado

Depois de concluir o [exemplo completo: criar um funcionário de IA integrado](./complete-example.md), você pode transformar a pergunta de acompanhamento do `Dev Helper` em opções clicáveis. Para isso, defina também uma Tool `developerChoice` e registre seu cartão no frontend. Coloque o arquivo do servidor em:

```text
src/ai/ai-employees/dev-helper/skills/welcome-developer/tools/developerChoice.ts
```

Essa Tool declara as opções e recebe a escolha do usuário:

```ts
import type { Context } from '@nocobase/actions';
import { defineTools } from '@nocobase/ai';
import { z } from 'zod';

export default defineTools({
  scope: 'SPECIFIED',
  introduction: {
    title: '{{t("ai.tools.developerChoice.title", { ns: "@nocobase/plugin-developer-helper" })}}',
    about: '{{t("ai.tools.developerChoice.about", { ns: "@nocobase/plugin-developer-helper" })}}',
  },
  definition: {
    name: 'developerChoice',
    description: 'Show a short list of plugin-development directions for the user to choose from.',
    schema: z.object({
      options: z.array(z.string()).min(2).max(4),
      option: z.string().optional(),
    }),
  },
  invoke: async (_ctx: Context, args: { options: string[]; option?: string }) => {
    return {
      status: 'success',
      content: args.option,
    };
  },
});
```
Como `developerChoice.ts` pertence à Skill `welcome-developer` e está em seu diretório `tools/`, ela é vinculada automaticamente à Skill atual. Porém, o vínculo significa apenas que o modelo pode usar essa Tool, não que necessariamente a chamará.

Também é necessário atualizar o fluxo de trabalho em `SKILLS.md`, substituindo as etapas 5–6 originais por:

```md
5. Use `content.name` to write a short welcome message in the same language as the user.
6. Call `developerChoice` exactly once with 2–4 plugin-development directions written in the user's language.
7. Wait for the user to select an option.
8. Continue according to the selected option.
```

Reutilize no frontend o `DeveloperChoiceCard` definido anteriormente e salve-o em:

```text
src/client-v2/ai-employees/tools/DeveloperChoiceCard.tsx
```

Por fim, registre-o em `src/client-v2/plugin.tsx`:

```tsx
import { Plugin } from '@nocobase/client-v2';
import { DeveloperChoiceCard } from './ai-employees/tools/DeveloperChoiceCard';

export class PluginDeveloperHelperClient extends Plugin {
  async load() {
    this.ai.toolsManager.registerTools('developerChoice', {
      ui: {
        card: DeveloperChoiceCard,
      },
    });
  }
}

export default PluginDeveloperHelperClient;
```

Depois de registrar o cartão, faça um novo build do cliente. Quando a conversa chegar a `developerChoice`, o ToolCall será pausado e exibirá opções clicáveis.

<!-- É necessária uma captura de tela da conversa mostrando as opções clicáveis de developerChoice -->

## Links relacionados

- [Definir uma Tool no servidor](./define-tool.md) — defina a Tool no servidor correspondente ao cartão no frontend
- [Exemplo completo: criar um funcionário de IA integrado](./complete-example.md) — conclua primeiro o exemplo básico sem código no frontend
- [Internacionalização de plugins para funcionários de IA](./internationalization.md) — traduza os textos de Tools e Skills na interface de administração
- [Plugin cliente](../../../plugin-development/client/plugin.md) — conheça o ponto de entrada do plugin cliente e o método `load()`
