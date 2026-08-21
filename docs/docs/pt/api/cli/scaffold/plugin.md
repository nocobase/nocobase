---
title: "nb scaffold plugin"
description: "Referência do comando nb scaffold plugin: gera o scaffold de um plugin do NocoBase."
keywords: "nb scaffold plugin,NocoBase CLI,scaffold de plugin"
---

# nb scaffold plugin

Gera o código do scaffold de um plugin do NocoBase.

## Uso

```bash
nb scaffold plugin <pkg> [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `<pkg>` | string | Nome do pacote do plugin, obrigatório |
| `--cwd`, `-c` | string | Especifica o caminho do diretório raiz da aplicação |
| `--force-recreate`, `-f` | boolean | Força a recriação do scaffold do plugin |

## Exemplos

```bash
nb scaffold plugin @my-project/plugin-hello
nb scaffold plugin @my-project/plugin-hello --cwd /path/to/app
nb scaffold plugin @my-project/plugin-hello --force-recreate
```

## Explicação

Para aplicações source gerenciadas pelo CLI (criadas via `nb init`), o plugin será gerado no diretório `<app-path>/plugins/`. O `nb` sincronizará automaticamente o plugin para `source/packages/plugins/` para uso nos fluxos de desenvolvimento e construção.

Se o plugin de destino já existir, o comando retornará um erro por padrão. Use `--force-recreate` para forçar a recriação. Se houver conflitos de diretório ou links simbólicos externos no lado do source, será necessário remover manualmente os itens conflitantes antes de tentar novamente.

## Comandos relacionados

- [`nb scaffold migration`](./migration.md)
- [`nb plugin enable`](../plugin/enable.md)
