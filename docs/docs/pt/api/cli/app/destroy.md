---
title: "nb app destroy"
description: "Referência do comando nb app destroy: remove os recursos de runtime gerenciados, os dados de storage e a configuração salva do env para um env selecionado."
keywords: "nb app destroy,NocoBase CLI,destruir env,limpeza,remover storage"
---

# nb app destroy

Destrói um env selecionado removendo os recursos de runtime gerenciados, os dados de storage e a configuração salva do CLI env.

Para envs locais e Docker, o comando primeiro remove os recursos de runtime da aplicação gerenciados nesta máquina, também remove o runtime do banco de dados embutido quando existir, apaga os dados de storage e, por fim, remove a configuração salva do CLI env. Para envs HTTP e SSH, ele apenas remove a configuração salva do CLI env e não toca em serviços externos.

Para envs locais npm/Git baixados, o comando também remove os arquivos locais da aplicação gerenciados pelo CLI. Para caminhos locais personalizados da app, ele mantém os arquivos locais do código-fonte e remove apenas os recursos de runtime gerenciados, os dados de storage e a configuração salva do env.

Por padrão, o comando solicita confirmação. No modo não interativo, você precisa passar `--env` e `--force` explicitamente.

## Uso

```bash
nb app destroy [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do CLI env que será destruído; no modo interativo, o env atual é usado por padrão quando omitido |
| `--force`, `-f` | boolean | Pula a confirmação e destrói imediatamente o env selecionado; obrigatório no modo não interativo |
| `--verbose` | boolean | Exibe a saída bruta dos comandos de destruição |

## Exemplos

```bash
nb app destroy --env app1
nb app destroy --env app1 --force
```

## Comandos relacionados

- [`nb app stop`](./stop.md)
- [`nb app down`](./down.md)
- [`nb env remove`](../env/remove.md)
