---
title: "Gerenciamento de Plugins"
description: "O Skill de Gerenciamento de Plugins serve para visualizar, ativar e desativar plugins do NocoBase."
keywords: "Construtor de IA,gerenciamento de plugins,ativar plugin,desativar plugin"
---

# Gerenciamento de Plugins

:::tip Pré-requisitos

Antes de ler esta página, certifique-se de que você seguiu o [Início Rápido do Construtor de IA](./index.md), instalou o NocoBase CLI e concluiu a inicialização.

:::

## Introdução

O Skill de Gerenciamento de Plugins serve para visualizar, ativar e desativar plugins do NocoBase — ele identifica automaticamente o ambiente local ou remoto, escolhe o backend de execução adequado e, com uma releitura de validação, garante o sucesso da operação.


## Capacidades

- Consultar a lista de plugins e o status de ativação.
- Ativar plugins.
- Desativar plugins.

## Exemplos de prompt

### Cenário A: Consultar status dos plugins

Modo prompt
```
Quais plugins existem no ambiente atual?
```
Modo linha de comando
```
nb plugin list
```

Lista todos os plugins, com status de ativação e informações de versão.

![Consultar status dos plugins](https://static-docs.nocobase.com/20260417150510.png)

### Cenário B: Ativar plugin

Modo prompt
```
Ative o plugin de localização.
```
Modo linha de comando
```
nb plugin enable <localização>
```

O Skill ativa em ordem e, após cada ativação, faz uma releitura para confirmar `enabled=true`.

![Ativar plugin](https://static-docs.nocobase.com/20260417153023.png)

### Cenário C: Desativar plugin

Modo prompt
```
Desative o plugin de localização.
```
Modo linha de comando
```
nb plugin disable  <localização>
```

![Desativar plugin](https://static-docs.nocobase.com/20260417173442.png)

## Perguntas frequentes

**O que fazer quando o plugin não tem efeito após a ativação?**

Alguns plugins exigem reiniciar a aplicação para entrar em vigor após a ativação. O Skill informa no resultado se o reinício é necessário.

## Links relacionados

- [Visão Geral do Construtor de IA](./index.md) — Visão geral de todos os Skills do Construtor de IA e como instalar
- [NocoBase CLI](../ai/quick-start.md) — Ferramenta de linha de comando para instalar e gerenciar o NocoBase
