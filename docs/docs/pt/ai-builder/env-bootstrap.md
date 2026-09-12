---
title: "Gerenciamento de Ambiente"
description: "O Skill de Gerenciamento de Ambiente cuida da instalação, atualização, parada, inicialização e gestão de múltiplos ambientes do NocoBase, como desenvolvimento, testes e produção — desde 'ainda não tenho o NocoBase instalado' até 'está tudo pronto para acessar'."
keywords: "Construtor de IA,gerenciamento de ambiente,instalação,atualização,Docker"
---

# Gerenciamento de Ambiente

:::tip Pré-requisitos

Antes de ler esta página, certifique-se de que você seguiu o [Início Rápido do Construtor de IA](./index.md), instalou o NocoBase CLI e concluiu a inicialização.

:::

## Introdução

O Skill de Gerenciamento de Ambiente cuida da instalação, atualização, parada, inicialização e gestão de múltiplos ambientes do NocoBase, como desenvolvimento, testes e produção — desde "ainda não tenho o NocoBase instalado" até "está tudo pronto para acessar".


## Capacidades

- Consultar ambientes e status do NocoBase.
- Adicionar, remover e alternar ambientes de instâncias do NocoBase.
- Instalar, atualizar, parar e iniciar instâncias do NocoBase.


## Exemplos de prompt

### Cenário A: Consulta de status do ambiente
Modo prompt
```
Quais instâncias do NocoBase existem atualmente? Em qual ambiente eu estou agora?
```
Modo linha de comando
```
nb env list
```

### Cenário B: Adicionar um ambiente existente
:::tip Pré-requisitos

É necessário ter uma instância existente do NocoBase, local ou remota.

:::

Modo prompt
```
Adicione o ambiente dev http://localhost:13000
```
Modo linha de comando
```
nb env add <dev> --base-url http://localhost:13000/api
```
### Cenário C: Instalar uma nova instância do NocoBase
:::tip Pré-requisitos

A forma mais prática e rápida de instalar o NocoBase é usar o modo Docker. Antes de executar, certifique-se de ter Node, Docker e Yarn instalados na sua máquina.

:::

Modo prompt
```
Instale o NocoBase
```
Modo linha de comando
```
nb init --ui
```

### Cenário D: Atualizar a instância

Modo prompt
```
Atualize a instância atual para a versão mais recente
```
Modo linha de comando
```
nb upgrade
```

### Cenário E: Parar a instância

Modo prompt
```
Pare a instância atual
```
Modo linha de comando
```
nb app stop
```

### Cenário E: Iniciar a instância

Modo prompt
```
Inicie a instância atual
```
Modo linha de comando
```
nb app start
```

## Perguntas frequentes

**Após instalar, percebi que não consigo experimentar as capacidades do Construtor de IA. O que faço?**

Atualmente, todas as capacidades do Construtor de IA estão na imagem alpha. Confirme se a instalação foi feita com essa imagem; caso contrário, atualize para essa imagem.

**O Docker reclama de conflito de porta na inicialização. O que faço?**

Mude para outra porta (por exemplo, `port=14000`) ou pare antes o processo que está usando a porta 13000. A fase de pré-checagem do Skill avisa proativamente sobre conflitos de porta.

## Links relacionados

- [Visão Geral do Construtor de IA](./index.md) — Visão geral de todos os Skills do Construtor de IA e como instalar
- [NocoBase CLI](../ai/quick-start.md) — Ferramenta de linha de comando para instalar e gerenciar o NocoBase
