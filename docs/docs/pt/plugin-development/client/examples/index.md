---
title: "Exemplos práticos de plugins"
description: "Casos práticos completos de plugins do cliente NocoBase: página de configurações, bloco personalizado, integração front-back, campo personalizado, do zero até a conclusão."
keywords: "exemplos de plugins,casos práticos,plugin completo,NocoBase"
---

# Exemplos práticos de plugins

Os capítulos anteriores apresentaram individualmente as capacidades de [Plugin](../plugin), [Router](../router), [Component](../component/index.md), [Context](../ctx/index.md), [FlowEngine](../flow-engine/index.md) e outras. Este capítulo costura tudo — através de alguns exemplos práticos completos, mostra todo o processo de criação de um plugin, da concepção à conclusão.

Cada exemplo corresponde a um plugin de exemplo executável; você pode consultar o código-fonte ou rodá-lo localmente.

## Lista de exemplos

| Exemplo | Capacidades envolvidas | Dificuldade |
| --- | --- | --- |
| [Construir uma página de configurações de plugin](./settings-page) | Plugin + Router + Component + Context + Server | Iniciante |
| [Construir um bloco de exibição personalizado](./custom-block) | Plugin + FlowEngine (BlockModel) | Iniciante |
| [Construir um componente de campo personalizado](./custom-field) | Plugin + FlowEngine (FieldModel) | Iniciante |
| [Construir um botão de ação personalizado](./custom-action) | Plugin + FlowEngine (ActionModel) | Iniciante |
| [Construir um plugin de gestão de dados com integração front-back](./fullstack-plugin) | Plugin + FlowEngine (TableBlockModel + FieldModel + ActionModel) + Server | Avançado |

Recomenda-se a leitura na ordem. O primeiro exemplo usa componentes React + uma API simples de servidor, sem envolver FlowEngine; os três do meio demonstram, respectivamente, as três classes base do FlowEngine: bloco, campo e ação; o último costura tudo o que foi aprendido — bloco, campo e ação — somado a uma data table do servidor, formando um plugin completo com integração front-back. Se você ainda não tem certeza se deve usar componente React ou FlowModel, comece por [Component vs FlowModel](../component-vs-flow-model).

## Links relacionados

- [Escreva seu primeiro plugin](../../write-your-first-plugin) — criar um plugin executável do zero
- [Visão geral do desenvolvimento do cliente](../index.md) — caminho de aprendizagem e índice rápido
- [Visão geral do FlowEngine](../flow-engine/index.md) — uso básico do FlowModel e registerFlow
- [Documentação completa do FlowEngine](../../../flow-engine/index.md) — referência completa de FlowModel, Flow e Context
- [Component vs FlowModel](../component-vs-flow-model) — escolha entre componente ou FlowModel
