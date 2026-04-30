---
title: "Prática: desenvolvendo o plugin de marca d'água"
description: "Use IA para desenvolver um plugin de marca d'água do NocoBase com uma única frase: marca d'água sobreposta na página, detecção contra adulteração e parâmetros de marca d'água configuráveis."
keywords: "Desenvolvimento com IA,plugin de marca d'água,plugin NocoBase,caso prático,programação com IA"
---

# Prática: desenvolvendo o plugin de marca d'água

Este caso mostra como, com uma única frase, fazer a IA desenvolver um plugin de marca d'água NocoBase completo — desde a criação do scaffold até a verificação de funcionamento, todo o processo realizado pela IA.

## Resultado final

Depois que o plugin é habilitado:

- A página do NocoBase exibe uma marca d'água semitransparente sobreposta, mostrando o nome do usuário logado
- A marca d'água não pode ser removida apagando o DOM — uma verificação periódica a regenera automaticamente
- Em "Configurações de plugin", é possível ajustar o texto da marca d'água, a opacidade e o tamanho da fonte

![watermark plugin](https://static-docs.nocobase.com/20260416170645.png)

## Pré-requisitos

:::tip Leitura prévia

- [NocoBase CLI](../ai/quick-start.md) — Instalar e iniciar o NocoBase
- [Início rápido do desenvolvimento de plugins com IA](./index.md) — Instalar Skills

:::

Certifique-se de que você já tem:

1. Um ambiente de desenvolvimento NocoBase em execução (a inicialização do NocoBase CLI instala automaticamente as NocoBase Skills)
2. Um editor com suporte a Agent de IA aberto (por exemplo, Claude Code, Codex, Cursor, etc.)

:::warning Atenção

- O NocoBase está em processo de migração de `client` (v1) para `client-v2`. No momento, o `client-v2` ainda está em desenvolvimento. O código cliente gerado pelo desenvolvimento com IA é baseado no `client-v2` e só pode ser usado no caminho `/v2/`. É uma prévia experimental e não é recomendado para uso direto em produção.
- O código gerado pela IA pode não estar 100% correto. Recomenda-se revisá-lo antes de habilitar. Se encontrar problemas em tempo de execução, envie a mensagem de erro para a IA continuar investigando e corrigindo. Geralmente, algumas trocas de mensagens resolvem o problema.

:::

## Começando

No diretório raiz do seu projeto NocoBase, envie o seguinte prompt à IA:

```
Ajude-me a usar a skill nocobase-plugin-development para desenvolver um plugin de marca d'água para o NocoBase.
Requisitos: sobreponha uma marca d'água semitransparente nas páginas, exibindo o nome do usuário logado, para evitar vazamentos via captura de tela.
Verifique periodicamente se o DOM da marca d'água foi removido. Se foi, regenere-o.
Na página de configurações do plugin, permita configurar o texto da marca d'água, a opacidade e o tamanho da fonte.
O nome do plugin é @my-project/plugin-watermark
```

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/nocobase-plugin-dev-compressed.mp4" type="video/mp4">
</video>

## O que a IA fez

Após receber os requisitos, a IA executa automaticamente as seguintes etapas:

### 1. Analisar requisitos e confirmar o plano

A IA primeiro analisa quais pontos de extensão do NocoBase são necessários para este plugin e, em seguida, apresenta um plano de desenvolvimento. Por exemplo:

> **Servidor:**
> - Uma tabela `watermarkSettings` para armazenar as configurações de marca d'água (texto, opacidade, tamanho da fonte)
> - Uma API personalizada para ler e escrever as configurações de marca d'água
> - Configuração de ACL: usuários autenticados podem ler, administradores podem escrever
>
> **Cliente:**
> - Página de configurações do plugin, com formulário para configurar os parâmetros da marca d'água
> - Lógica de renderização da marca d'água, lendo as configurações e sobrepondo-as na página
> - Detecção contra adulteração, com timer monitorando o DOM da marca d'água

Após confirmar o plano, a IA começa a escrever o código.

<!-- Necessário um screenshot do terminal mostrando a IA produzindo o plano de desenvolvimento -->

### 2. Criar o scaffold do plugin

```bash
yarn pm create @my-project/plugin-watermark
```

A IA gera a estrutura padrão de diretórios do plugin em `packages/plugins/@my-project/plugin-watermark/`.

### 3. Escrever o código do servidor

A IA gera os seguintes arquivos:

- **Definição da tabela de dados** — tabela `watermarkSettings`, contendo os campos `text`, `opacity`, `fontSize`
- **API personalizada** — interfaces para ler e atualizar as configurações de marca d'água
- **Configuração de ACL** — usuários autenticados podem ler as configurações de marca d'água, administradores podem modificá-las

<!-- Necessário um screenshot do terminal mostrando a IA gerando o código do servidor -->

### 4. Escrever o código do cliente

- **Página de configurações do plugin** — um formulário Ant Design para configurar texto, opacidade (slider) e tamanho da fonte
- **Renderização da marca d'água** — cria uma camada canvas/div em tela cheia sobre a página, exibindo o nome do usuário logado
- **Detecção contra adulteração** — `MutationObserver` + timer, garantia dupla; se o DOM for removido, será regenerado imediatamente

<!-- Necessário um screenshot do terminal mostrando a IA gerando o código do cliente -->

### 5. Internacionalização

A IA gera automaticamente os pacotes de idiomas em chinês e inglês, sem necessidade de operação adicional:

- `src/locale/zh-CN.json` — Tradução em chinês
- `src/locale/en-US.json` — Tradução em inglês

### 6. Habilitar o plugin

```bash
yarn pm enable @my-project/plugin-watermark
```

Após habilitar, abra uma página do NocoBase e você verá a marca d'água sobreposta ao conteúdo.

<!-- Necessário um vídeo: do prompt → IA gerando código → habilitando o plugin → marca d'água aparecendo na página → abrindo as configurações para ajustar parâmetros → marca d'água mudando de acordo, todo o processo completo -->

## Quanto tempo levou todo o processo

Do prompt ao plugin pronto para uso, levou cerca de **3 a 5 minutos**. A IA realizou as seguintes tarefas:

| Tarefa                                  | Estimativa manual | IA          |
| --------------------------------------- | ----------------- | ----------- |
| Criar scaffold                          | 2 minutos         | Automático  |
| Tabela de dados + API                   | 20 minutos        | Automático  |
| Página de configurações do plugin       | 30 minutos        | Automático  |
| Renderização + detecção contra adulteração | 40 minutos     | Automático  |
| Configuração de ACL                     | 10 minutos        | Automático  |
| Internacionalização                     | 15 minutos        | Automático  |
| **Total**                               | **~2 horas**      | **~5 minutos** |


## Quer criar mais plugins?

O plugin de marca d'água envolve principalmente renderização no frontend e armazenamento simples no backend. Se você quer saber o que mais a IA pode fazer por você — como blocos personalizados, relacionamentos complexos entre tabelas, extensões de workflow, etc. — confira [Recursos suportados](./capabilities).

## Links relacionados

- [Início rápido do desenvolvimento de plugins com IA](./index.md) — Início rápido e visão geral dos recursos
- [Recursos suportados](./capabilities) — Tudo o que a IA pode fazer por você, com exemplos de prompts
- [Desenvolvimento de plugins](../plugin-development/index.md) — Guia completo de desenvolvimento de plugins NocoBase
- [NocoBase CLI](../ai/quick-start.md) — Ferramenta de linha de comando para instalar e gerenciar o NocoBase
