---
title: "nb portal registry sync"
description: "Referência do nb portal registry sync: instale, compare ou atualize itens de Registry fornecidos por plugins em um AI Portal."
keywords: "nb portal registry sync,NocoBase CLI,Portal Registry,shadcn,AI Portal"
---

# nb portal registry sync

Instala itens do NocoBase Portal Registry em um workspace de AI Portal existente. O comando lê o índice de Registry do serviço NocoBase selecionado. Assim, itens de plugins recém-habilitados ficam disponíveis sem serem definidos diretamente no template do Portal.

## Uso

```bash
nb portal registry sync <portal> [itens...] [opções]
```

## Argumentos e opções

| Argumento ou opção | Tipo | Descrição |
| --- | --- | --- |
| `<portal>` | string | Nome ou slug obrigatório do AI Portal |
| `[itens...]` | string[] | Nomes opcionais de itens do Registry. Quando omitidos, todos os itens dos plugins habilitados são instalados. As formas `ai` e `@nocobase/ai` são aceitas |
| `--env`, `-e` | string | Nome do env da CLI; quando omitido, usa o env atual |
| `--yes`, `-y` | boolean | Ignora a confirmação quando `--env` aponta para outro env |
| `--overwrite` | boolean | Substitui arquivos de Registry instalados, preservando os arquivos existentes em `src/components/ui` |
| `--overwrite-ui` | boolean | Permite que `--overwrite` também substitua `src/components/ui`; requer `--overwrite` |
| `--diff` | boolean | Exibe diferenças sem alterar o Portal |
| `--build` | boolean | Executa `pnpm build` e `pnpm build:html` após a instalação |

## Exemplos

Instalar todos os itens disponíveis que ainda não foram instalados:

```bash
nb portal registry sync customer
```

Instalar itens específicos:

```bash
nb portal registry sync customer ai acl auth-sms
```

Comparar um item instalado com a versão do serviço:

```bash
nb portal registry sync customer ai --diff
```

Atualizar um item preservando os componentes básicos de UI:

```bash
nb portal registry sync customer ai --overwrite
```

Sobrescrever arquivos de Registry e componentes básicos de UI:

```bash
nb portal registry sync customer --overwrite --overwrite-ui
```

Instalar e compilar o Portal:

```bash
nb portal registry sync customer --build
```

Usar outro env em um fluxo não interativo:

```bash
nb portal registry sync customer --env dev --yes
```

## Comportamento

O comando primeiro solicita o índice de Registry ao serviço NocoBase selecionado. O servidor retorna somente os itens fornecidos pelos plugins habilitados. Em seguida, configura o Registry `@nocobase` no `components.json` do Portal e instala os itens com a CLI shadcn local do Portal.

Por padrão, itens cujos arquivos de destino já existem são ignorados. Ao adicionar itens e dependências ausentes, os arquivos existentes em `src/extensions` e `src/components/ui` são protegidos.

Use `--overwrite` apenas quando quiser atualizar deliberadamente arquivos de Registry já instalados. Os componentes básicos de UI continuam protegidos, a menos que `--overwrite-ui` também seja informado. Revise as personalizações locais antes de sobrescrever arquivos.

`--diff` é somente leitura e não pode ser combinado com `--overwrite`, `--overwrite-ui` ou `--build`.

Se o Portal não tiver `node_modules`, o comando executa `pnpm install --frozen-lockfile` antes de chamar o shadcn.

## Comandos relacionados

- [`nb portal registry`](./index.md)
- [`nb portal create`](../create.md)
- [`nb portal dev`](../dev.md)
- [`nb portal deploy`](../deploy.md)
