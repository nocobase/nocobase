---
title: "nb source build"
description: "Referência do comando nb source build: compila o projeto local do código-fonte do NocoBase."
keywords: "nb source build,NocoBase CLI,build,código-fonte"
---

# nb source build

Compila o projeto local do código-fonte do NocoBase. Este comando encaminha a execução do fluxo de build legado do NocoBase a partir da raiz do repositório.

## Uso

```bash
nb source build [packages...] [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `[packages...]` | string[] | Nomes dos pacotes a compilar; quando omitido, compila todos |
| `--cwd`, `-c` | string | Diretório de trabalho |
| `--no-dts` | boolean | Não gera arquivos de declaração `.d.ts` |
| `--sourcemap` | boolean | Gera sourcemap |
| `--verbose` | boolean | Exibe a saída detalhada do comando |

## Exemplos

```bash
nb source build
nb source build --no-dts
nb source build --sourcemap
nb source build @nocobase/acl
nb source build @nocobase/acl @nocobase/actions
```

## Comandos relacionados

- [`nb source dev`](./dev.md)
- [`nb source test`](./test.md)
