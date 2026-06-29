---
title: "nb self check"
description: "Referência do comando nb self check: verifica a versão do NocoBase CLI instalado e o suporte a auto-atualização."
keywords: "nb self check,NocoBase CLI,verificação de versão"
---

# nb self check

Verifica a instalação atual do NocoBase CLI, resolve a versão mais recente do channel selecionado e informa se há suporte para auto-atualização automática.

## Uso

```bash
nb self check [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--channel` | string | Channel de release a ser comparado, padrão `auto`; opções: `auto`, `latest`, `test`, `beta`, `alpha` |
| `--json` | boolean | Saída em JSON |

## Método de instalação

`nb self check` detecta o método de instalação atual em runtime. Ele não usa o cache histórico `self-install-methods.json`.

O comando pode informar estes métodos de instalação:

| Método de instalação | Significado |
| --- | --- |
| `npm-global` | A CLI está instalada sob o `npm prefix -g` atual. |
| `pnpm-global` | A CLI está instalada em uma árvore global `node_modules` do pnpm. |
| `yarn-global` | A CLI é iniciada a partir de `yarn global bin` ou instalada sob `yarn global dir`. |
| `package-local` | A CLI está instalada na árvore de dependências de um projeto local. |
| `source` | A CLI está rodando a partir de um checkout do repositório. |
| `unknown` | A instalação da CLI não pôde ser associada a um método de instalação suportado. |

A auto-atualização é suportada para `npm-global`, `pnpm-global` e `yarn-global`. Para `package-local` ou `source`, atualize o projeto pai ou o checkout do repositório.

## Exemplos

```bash
nb self check
nb self check --channel beta
nb self check --json
```

## Comandos relacionados

- [`nb self update`](./update.md)
