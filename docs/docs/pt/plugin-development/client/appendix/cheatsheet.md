---
title: "Cheatsheet de desenvolvimento de plugins"
description: "Cheatsheet de desenvolvimento de plugins NocoBase: o que fazer → em qual arquivo → qual API chamar, para localizar rapidamente onde o código deve ficar."
keywords: "cheatsheet,formas de registro,localização de arquivo,NocoBase"
---

# Cheatsheet de desenvolvimento de plugins

Ao escrever um plugin, é comum ficar pensando "isso deve ir em qual arquivo, qual API chamar". Este cheatsheet ajuda você a localizar rapidamente.

## Estrutura de diretórios do plugin

Ao criar um plugin via `yarn pm create @my-project/plugin-name`, a estrutura de diretórios a seguir é gerada automaticamente. Não crie diretórios manualmente para evitar pular etapas de registro que podem fazer o plugin não funcionar. Veja [Escreva seu primeiro plugin](../../write-your-first-plugin) para detalhes.

```bash
plugin-name/
├── src/
│   ├── client-v2/              # 客户端代码（v2）
│   │   ├── plugin.tsx          # 客户端插件入口
│   │   ├── locale.ts           # useT / tExpr 翻译 hook
│   │   ├── models/             # FlowModel（区块、字段、操作）
│   │   └── pages/              # 页面组件
│   ├── client/                 # 客户端代码（v1，兼容）
│   │   ├── plugin.tsx
│   │   ├── locale.ts
│   │   ├── models/
│   │   └── pages/
│   ├── server/                 # 服务端代码
│   │   ├── plugin.ts           # 服务端插件入口
│   │   └── collections/        # 数据表定义
│   └── locale/                 # 多语言翻译文件
│       ├── zh-CN.json
│       └── en-US.json
├── client-v2.js                # 根目录入口（构建产物指向）
├── client-v2.d.ts
├── client.js
├── client.d.ts
├── server.js
├── server.d.ts
└── package.json
```

## Cliente: o que quero fazer → como escrever

| O que quero fazer | Em qual arquivo | Qual API chamar | Documentação |
| --- | --- | --- | --- |
| Registrar uma rota de página | `load()` em `plugin.tsx` | `this.router.add()` | [Router](../router) |
| Registrar uma página de configurações de plugin | `load()` em `plugin.tsx` | `pluginSettingsManager.addMenuItem()` + `addPageTabItem()` | [Router](../router) |
| Registrar um bloco personalizado | `load()` em `plugin.tsx` | `this.flowEngine.registerModelLoaders()` | [FlowEngine → Extensão de blocos](../flow-engine/block) |
| Registrar um campo personalizado | `load()` em `plugin.tsx` | `this.flowEngine.registerModelLoaders()` | [FlowEngine → Extensão de campos](../flow-engine/field) |
| Registrar uma ação personalizada | `load()` em `plugin.tsx` | `this.flowEngine.registerModelLoaders()` | [FlowEngine → Extensão de ações](../flow-engine/action) |
| Fazer uma tabela interna aparecer na seleção de data tables do bloco | `load()` em `plugin.tsx` | `mainDS.addCollection()` | [Collections](../../server/collections) |
| Traduzir os textos do plugin | `locale/zh-CN.json` + `locale/en-US.json` | — | [i18n internacionalização](../component/i18n) |

## Server: o que quero fazer → como escrever

| O que quero fazer | Em qual arquivo | Qual API chamar | Documentação |
| --- | --- | --- | --- |
| Definir uma data table | `server/collections/xxx.ts` | `defineCollection()` | [Collections](../../server/collections) |
| Estender uma data table existente | `server/collections/xxx.ts` | `extendCollection()` | [Collections](../../server/collections) |
| Registrar uma API personalizada | `load()` em `server/plugin.ts` | `this.app.resourceManager.define()` | [ResourceManager](../../server/resource-manager) |
| Configurar permissões de API | `load()` em `server/plugin.ts` | `this.app.acl.allow()` | [Controle de permissões ACL](../../server/acl) |
| Inserir dados iniciais ao instalar o plugin | `install()` em `server/plugin.ts` | `this.db.getRepository().create()` | [Plugin](../../server/plugin) |

## Cheatsheet de FlowModel

| O que quero fazer | Qual classe base herdar | API-chave |
| --- | --- | --- |
| Criar um bloco apenas de exibição | `BlockModel` | `renderComponent()` + `define()` |
| Criar um bloco vinculado a uma data table (renderização personalizada) | `CollectionBlockModel` | `createResource()` + `renderComponent()` |
| Criar um bloco de tabela completo (personalizando sobre a tabela embutida) | `TableBlockModel` | `filterCollection()` + `customModelClasses` |
| Criar um componente de exibição de campo | `ClickableFieldModel` | `renderComponent(value)` + `bindModelToInterface()` |
| Criar um botão de ação | `ActionModel` | `static scene` + `registerFlow({ on: 'click' })` |

## Cheatsheet de métodos de tradução

| Cenário | O que usar | De onde importar |
| --- | --- | --- |
| Dentro do `load()` do Plugin | `this.t('key')` | Embutido na classe base Plugin |
| Em componentes React | `const t = useT(); t('key')` | `locale.ts` |
| Definição estática de FlowModel (`define()`, `registerFlow()`) | `tExpr('key')` | `locale.ts` |

## Cheatsheet de chamadas de API comuns

| O que quero fazer | No Plugin | Em componentes |
| --- | --- | --- |
| Enviar requisição API | `this.context.api.request()` | `ctx.api.request()` |
| Obter tradução | `this.t()` | `useT()` |
| Obter logger | `this.context.logger` | `ctx.logger` |
| Registrar rota | `this.router.add()` | — |
| Navegar entre páginas | — | `ctx.router.navigate()` |
| Abrir modal | — | `ctx.viewer.dialog()` |

## Links relacionados

- [Visão geral do desenvolvimento do cliente](../index.md) — caminho de aprendizagem e índice rápido
- [Plugin](../plugin) — entrada do plugin e ciclo de vida
- [Perguntas frequentes & guia de troubleshooting](./faq) — solução de problemas comuns
- [Router de rotas](../router) — registro de rotas de página
- [FlowEngine → Extensão de blocos](../flow-engine/block) — família BlockModel
- [FlowEngine → Extensão de campos](../flow-engine/field) — desenvolvimento com FieldModel
- [FlowEngine → Extensão de ações](../flow-engine/action) — desenvolvimento com ActionModel
- [Collections](../../server/collections) — defineCollection e tipos de campo
- [i18n internacionalização](../component/i18n) — escrita de arquivos de tradução
- [ResourceManager](../../server/resource-manager) — APIs REST personalizadas
- [Controle de permissões ACL](../../server/acl) — configuração de permissões
- [Plugin (server)](../../server/plugin) — ciclo de vida do plugin no servidor
- [Escreva seu primeiro plugin](../../write-your-first-plugin) — criação do esqueleto do plugin
