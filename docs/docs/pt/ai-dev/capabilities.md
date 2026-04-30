---
title: "Recursos suportados"
description: "Todos os recursos suportados pelo desenvolvimento com IA: scaffold, tabelas de dados, blocos, campos, ações, páginas de configuração, API, permissões, internacionalização e scripts de upgrade."
keywords: "Desenvolvimento com IA,recursos,desenvolvimento de plugins,scaffold,tabelas de dados,blocos,campos,ações,permissões,internacionalização"
---

# Recursos suportados

:::tip Pré-requisito

Antes de ler esta página, certifique-se de ter concluído a preparação do ambiente seguindo o [Início rápido do desenvolvimento de plugins com IA](./index.md).

:::

O recurso de desenvolvimento de plugins com IA é baseado na Skill [nocobase-plugin-development](https://github.com/nocobase/skills/tree/main/skills/nocobase-plugin-development). Se você já inicializou através do [NocoBase CLI](../ai/quick-start.md) (`nb init`), essa Skill será instalada automaticamente.

A seguir estão listadas todas as coisas que a IA pode fazer por você atualmente. Cada recurso vem acompanhado de um exemplo de prompt que você pode copiar e adaptar à sua necessidade.

:::warning Atenção

- O NocoBase está em processo de migração de `client` (v1) para `client-v2`. No momento, o `client-v2` ainda está em desenvolvimento. O código cliente gerado pelo desenvolvimento com IA é baseado no `client-v2` e só pode ser usado no caminho `/v2/`. É uma prévia experimental e não é recomendado para uso direto em produção.
- O código gerado pela IA pode não estar 100% correto. Recomenda-se revisá-lo antes de habilitar. Se encontrar problemas em tempo de execução, envie a mensagem de erro para a IA continuar investigando e corrigindo. Geralmente, algumas trocas de mensagens resolvem o problema.
- Recomenda-se usar modelos da família GPT ou Claude para o desenvolvimento, pois oferecem os melhores resultados. Outros modelos também funcionam, mas a qualidade da geração pode variar.

:::

## Boas práticas

- **Diga à IA explicitamente que você quer criar ou modificar um plugin NocoBase, e forneça o nome do plugin** — por exemplo, "Por favor, use a skill nocobase-plugin-development para me ajudar a desenvolver um plugin NocoBase chamado @my-scope/plugin-rating". Sem fornecer o nome do plugin, a IA pode não saber onde gerar o código.
- **No prompt, especifique explicitamente o uso da skill nocobase-plugin-development** — por exemplo, "Por favor, use a skill nocobase-plugin-development para me ajudar a desenvolver um plugin NocoBase...". Isso permite que o Agent leia diretamente as capacidades das Skills, evitando entrar em modo plan e ignorar as Skills.
- **Execute o Agent de IA no diretório raiz do repositório de código-fonte do NocoBase** — assim a IA pode encontrar automaticamente a estrutura do projeto, as dependências e os plugins existentes. Se você não estiver no diretório raiz do código-fonte, será necessário informar adicionalmente o caminho do repositório ao Agent.

## Índice rápido

| Eu quero...                                  | A IA pode fazer                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------ |
| Criar um novo plugin                         | Gerar o scaffold completo, incluindo a estrutura de diretórios frontend e backend |
| Definir uma tabela de dados                  | Gerar a definição da Collection, com suporte a todos os tipos de campo e relacionamentos |
| Criar um bloco personalizado                 | Gerar BlockModel + painel de configuração + registro no menu "Adicionar bloco" |
| Criar um campo personalizado                 | Gerar FieldModel + vinculação à interface de campo                       |
| Adicionar botões de ação personalizados      | Gerar ActionModel + popup/drawer/caixa de confirmação                    |
| Criar uma página de configurações de plugin  | Gerar formulário no frontend + API no backend + armazenamento            |
| Escrever uma API personalizada               | Gerar Resource Action + registro de rotas + configuração de ACL          |
| Configurar permissões                        | Gerar regras de ACL, controlando o acesso por papel                      |
| Suporte multilíngue                          | Gerar automaticamente pacotes de idiomas em chinês e inglês              |
| Escrever scripts de upgrade                  | Gerar Migration, com suporte a DDL e migração de dados                   |

## Scaffold de plugin

A IA pode gerar a estrutura completa de diretórios de um plugin NocoBase com base na descrição da sua necessidade, incluindo arquivos de entrada de frontend e backend, definições de tipos e configurações básicas.

Exemplo de prompt:

```
Ajude-me a criar um plugin NocoBase chamado @my-scope/plugin-todo
```

A IA executará `yarn pm create @my-scope/plugin-todo` e gerará a estrutura padrão de diretórios:

```
packages/plugins/@my-scope/plugin-todo/
├── src/
│   ├── server/
│   │   └── plugin.ts
│   ├── client-v2/
│   │   └── plugin.tsx
│   └── locale/
│       ├── zh-CN.json
│       └── en-US.json
├── package.json
└── ...
```

## Definição de tabela de dados

A IA suporta a geração de definições de Collection com todos os tipos de campos do NocoBase, incluindo relacionamentos (um para muitos, muitos para muitos, etc.).

Exemplo de prompt:

```
Por favor, use a skill nocobase-plugin-development para me ajudar a desenvolver um plugin NocoBase chamado @my-scope/plugin-order,
e dentro dele defina uma tabela "pedidos", com os campos: número do pedido (auto-incremento), nome do cliente (string),
valor (decimal), status (seleção única: pendente/em processamento/concluído), data de criação.
A relação entre pedidos e clientes é muitos-para-um.
```

A IA gerará uma definição `defineCollection`, contendo tipos de campos, valores padrão, configurações de relacionamento, etc.

## Bloco personalizado

Os blocos são a forma mais central de extensão do frontend do NocoBase. A IA pode ajudar você a gerar o modelo do bloco, o painel de configuração e o registro no menu.

Exemplo de prompt:

```
Por favor, use a skill nocobase-plugin-development para me ajudar a desenvolver um plugin NocoBase chamado @my-scope/plugin-simple-block,
crie um bloco personalizado de exibição (BlockModel) onde o usuário pode inserir conteúdo HTML no painel de configuração,
e o bloco renderiza esse HTML. Registre este bloco no menu "Adicionar bloco".
```

<video width="100%" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_17.23.49.mp4" type="video/mp4">
</video>

A IA gerará o `BlockModel`, criará o painel de configuração através de `registerFlow` + `uiSchema`, e registrará no menu "Adicionar bloco".

Para um exemplo completo, consulte [Criar um bloco personalizado de exibição](../plugin-development/client/examples/custom-block).

## Componente de campo personalizado

Se os componentes nativos de renderização de campo do NocoBase não atenderem às suas necessidades, a IA pode ajudar a criar um componente de exibição personalizado, substituindo a forma padrão de renderização de campo.

Exemplo de prompt:

```
Por favor, use a skill nocobase-plugin-development para me ajudar a desenvolver um plugin NocoBase chamado @my-scope/plugin-rating,
crie um componente de exibição de campo personalizado (FieldModel) que renderize campos do tipo integer como ícones de estrela,
suportando notas de 1 a 5. Clicar nas estrelas deve modificar o valor da avaliação diretamente e salvá-lo no banco de dados.
```

![Demonstração do componente Rating](https://static-docs.nocobase.com/20260422170712.png)

A IA gerará um `FieldModel` personalizado, substituindo o componente padrão de renderização do campo integer.

## Ações personalizadas

Os botões de ação podem aparecer no topo do bloco (nível collection), na coluna de ações de cada linha da tabela (nível record), ou em ambas as posições simultaneamente. Ao clicar, podem exibir um aviso, abrir um popup com formulário, chamar uma API, etc.

Exemplo de prompt:

```
Por favor, use a skill nocobase-plugin-development para me ajudar a desenvolver um plugin NocoBase chamado @my-scope/plugin-simple-action,
crie três botões de ação personalizados (ActionModel):
1. Um botão de nível collection, que aparece no topo do bloco e, ao ser clicado, exibe um aviso de sucesso
2. Um botão de nível record, que aparece na coluna de ações de cada linha da tabela e, ao ser clicado, exibe o ID do registro atual
3. Um botão de nível both, que aparece em ambas as posições e, ao ser clicado, exibe um aviso informativo
```

<video width="100%" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-08_17.55.43.mp4" type="video/mp4">
</video>

A IA gerará o `ActionModel`, controlando a posição de exibição dos botões através de `ActionSceneEnum`, e tratando o evento de clique através de `registerFlow({ on: 'click' })`.

Para um exemplo completo, consulte [Criar um botão de ação personalizado](../plugin-development/client/examples/custom-action).

## Página de configurações do plugin

Muitos plugins precisam de uma página de configurações para que o usuário possa configurar parâmetros — por exemplo, a API Key de um serviço de terceiros, o endereço de Webhook, etc.

Exemplo de prompt:

```
Por favor, use a skill nocobase-plugin-development para me ajudar a desenvolver um plugin NocoBase chamado @my-scope/plugin-settings-page,
crie uma página de configurações que registre uma entrada "Configuração de serviço externo" no menu "Configurações de plugin", contendo duas Tabs:
1. Tab "Configuração da API": formulário com API Key (string, obrigatório), API Secret (senha, obrigatório), Endpoint (string, opcional), salvando no banco de dados via API do backend
2. Tab "Sobre": exibe o nome do plugin e a versão
Use componentes de formulário do Ant Design no frontend, e defina as duas interfaces externalApi:get e externalApi:set no backend.
```

![Efeito da página de configurações do plugin](https://static-docs.nocobase.com/20260415160006.png)

A IA gerará o componente da página de configurações no frontend, Resource Action no backend, definição da tabela de dados e configuração de ACL.

Para um exemplo completo, consulte [Criar uma página de configurações de plugin](../plugin-development/client/examples/settings-page).

## API personalizada

Se as interfaces CRUD nativas não forem suficientes, a IA pode ajudar você a escrever uma REST API personalizada. Abaixo está um exemplo completo de integração frontend-backend — o backend define a tabela de dados e a API, e o frontend cria um bloco personalizado para exibir os dados.

Exemplo de prompt:

```
Por favor, use a skill nocobase-plugin-development para me ajudar a desenvolver um plugin NocoBase chamado @my-scope/plugin-todo,
crie um plugin de gerenciamento de dados de Todo com integração entre frontend e backend:
1. No backend, defina uma tabela todoItems com os campos title (string), completed (boolean), priority (string, padrão medium)
2. No frontend, crie um TableBlock personalizado que exiba apenas os dados de todoItems
3. O campo priority deve ser exibido com Tags coloridas (high vermelho, medium laranja, low verde)
4. Adicione um botão "Novo Todo" que, ao ser clicado, abre um formulário para criar registros
5. Usuários autenticados podem realizar todas as operações de CRUD
```

![Efeito do plugin de gerenciamento de dados Todo](https://static-docs.nocobase.com/20260408164204.png)

A IA gerará a definição de Collection do servidor, Resource Action, configuração de ACL, bem como o `TableBlockModel` do cliente, `FieldModel` personalizado e `ActionModel`.

Para um exemplo completo, consulte [Criar um plugin de gerenciamento de dados com integração frontend-backend](../plugin-development/client/examples/fullstack-plugin).

## Configuração de permissões

A IA configurará automaticamente regras de ACL razoáveis para a API e os recursos gerados. Você também pode especificar explicitamente os requisitos de permissão no prompt:

Exemplo de prompt:

```
Por favor, use a skill nocobase-plugin-development para me ajudar a desenvolver um plugin NocoBase chamado @my-scope/plugin-todo,
defina uma tabela de dados todoItems (campos title, completed, priority),
requisitos de permissão: usuários autenticados podem visualizar, criar e editar; somente o papel admin pode excluir.
```

A IA configurará as regras de acesso correspondentes no servidor através de `this.app.acl.allow()`.

## Internacionalização

Por padrão, a IA gera dois pacotes de idiomas, em chinês e inglês (`zh-CN.json` e `en-US.json`), sem que você precise mencionar isso explicitamente.

Se houver necessidade de outros idiomas:

```
Por favor, use a skill nocobase-plugin-development para me ajudar a desenvolver um plugin NocoBase chamado @my-scope/plugin-order,
preciso de suporte para três pacotes de idiomas: chinês, inglês e japonês
```

## Scripts de upgrade

Quando o plugin precisa atualizar a estrutura do banco de dados ou migrar dados, a IA pode ajudar a gerar um script de Migration.

Exemplo de prompt:

```
Por favor, use a skill nocobase-plugin-development para me ajudar a escrever um script de upgrade para o plugin NocoBase @my-scope/plugin-order,
adicione um campo "observação" à tabela "pedidos" (texto longo, opcional) e preencha o valor padrão "nenhum" no campo de observação dos pedidos existentes.
```

A IA gerará um arquivo de Migration com número de versão, contendo operações DDL e lógica de migração de dados.

## Links relacionados

- [Início rápido do desenvolvimento de plugins com IA](./index.md) — Início rápido e visão geral dos recursos
- [Prática: desenvolvendo o plugin de marca d'água](./watermark-plugin) — Caso prático completo de desenvolvimento de plugin com IA
- [Desenvolvimento de plugins](../plugin-development/index.md) — Guia completo de desenvolvimento de plugins NocoBase
- [NocoBase CLI](../ai/quick-start.md) — Ferramenta de linha de comando para instalar e gerenciar o NocoBase
