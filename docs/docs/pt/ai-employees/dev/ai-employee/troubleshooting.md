---
title: "Problemas comuns no desenvolvimento de plugins para funcionários de IA"
description: "Diagnóstico de Tools, Skills, funcionários integrados e cartões de Tool no frontend do NocoBase que não foram registrados ou executados."
keywords: "NocoBase,problemas comuns de funcionários de IA,Tool não registrada,Skill não carregada,cartão no frontend"
---

# Problemas comuns no desenvolvimento de plugins para funcionários de IA

## A Tool não foi registrada

Verifique os itens abaixo nesta ordem:

- Se o arquivo está em `src/ai/**/tools/`, dentro do escopo de build do plugin
- Se o arquivo usa a extensão `.ts` ou `.js`
- Se há um `export default defineTools(...)`
- Se o arquivo da Tool foi nomeado incorretamente com a extensão `.d.ts`
- Se há outra Tool com o mesmo nome, fazendo com que o registro posterior seja ignorado
- Se o plugin já foi recompilado e carregado

## A Skill não aparece

Verifique primeiro o nome do arquivo. Atualmente, ele deve ser:

```text
SKILLS.md
```

Confirme também se o frontmatter contém `name` e `description` estáveis e se o arquivo está em `src/ai/**/skills/<skill-name>/SKILLS.md`.

## A Skill é carregada, mas não consegue chamar a Tool

Verifique estes itens:

- Se a lista `tools` da Skill inclui o nome da Tool
- Se a Tool está no diretório `tools/` da Skill atual
- Se o nome do arquivo da Tool, `definition.name` e a referência na Skill são iguais
- Se o `scope` é adequado à forma de vinculação atual
- Se a Tool deixou de ser registrada por causa de um nome duplicado

Vincular uma Tool significa apenas que o modelo pode usá-la. Se a Tool já aparece na Skill, mas o modelo ainda não a chama, especifique claramente no fluxo de trabalho de `SKILLS.md` quando chamá-la, quais parâmetros usar e que é preciso aguardar o resultado.

## O cartão no frontend não aparece

O nome registrado no frontend deve ser exatamente igual ao nome final da Tool no servidor:

```ts
this.ai.toolsManager.registerTools('developerChoice', options);
```

Verifique também:

- Se o plugin personalizado usa o runtime `src/client-v2/`
- Se o cartão foi registrado no método `load()` do plugin cliente
- Se o ToolCall entrou em um estado compatível com o cartão
- Se o cartão foi desabilitado por uma verificação de `invokeStatus`
- Se o plugin cliente já foi recompilado e carregado

## A Tool não continua a execução após um clique no cartão

Confirme se uma das funções `approve()`, `edit()` ou `reject()` foi chamada. Quando for necessário gravar a escolha do usuário nos parâmetros, use:

```ts
await decisions.edit({
  ...toolCall.args,
  option: selectedOption,
});
```

Confirme também se o schema do servidor aceita esse campo e se `invoke()` faz a leitura dele.

## A alteração em `definition.name` não entrou em vigor

O nome de uma Tool carregada automaticamente é determinado pelo nome do arquivo ou do diretório. Por exemplo:

```text
src/ai/tools/developerChoice.ts
```

O nome final será `developerChoice`. Para renomeá-la, também é necessário renomear o arquivo e atualizar as referências na Skill, a configuração do funcionário de IA e o nome registrado no frontend.

## Links relacionados

- [Desenvolvimento de plugins para funcionários de IA](./index.md) — volte à visão geral do guia de desenvolvimento
- [Definir uma Tool no servidor](./define-tool.md) — verifique a nomenclatura e o registro da Tool
- [Definir uma Skill](./define-skill.md) — verifique o vínculo entre a Skill e a Tool
- [Adicionar interação no frontend a uma Tool](./frontend-tool-ui.md) — verifique o ToolCall e o registro no frontend
