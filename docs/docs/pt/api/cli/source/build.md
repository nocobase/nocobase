---
title: "nb source build"
description: "Referência do comando nb source build: compila o projeto local do código-fonte do NocoBase."
keywords: "nb source build,NocoBase CLI,build,código-fonte"
---

# nb source build

Compila o projeto local de código-fonte do NocoBase. Deve ser executado no diretório de código-fonte (`<app-path>/source/`). Para aplicações source gerenciadas pelo CLI, antes da construção, os plugins no diretório `plugins/` serão automaticamente sincronizados para `source/packages/plugins/`.

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
| `--tar` | boolean | Após a construção, empacota automaticamente como arquivo `.tgz` |
| `--verbose` | boolean | Exibe a saída detalhada do comando |

## Exemplos

```bash
nb source build
nb source build @my-project/plugin-hello
nb source build @my-project/plugin-hello --tar
nb source build --no-dts
nb source build --sourcemap
```

## Explicação

Ao usar `--tar`, após a construção, o plugin especificado será empacotado como arquivo `.tgz` e salvo no diretório `source/storage/tar/`. Ao concluir, o comando imprimirá o caminho completo do tarball.

## Comandos relacionados

- [`nb source dev`](./dev.md)
- [`nb source test`](./test.md)
