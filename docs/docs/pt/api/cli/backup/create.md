---
title: 'nb backup create'
description: 'Referência do comando nb backup create: cria um backup por meio do env selecionado e baixa o arquivo de backup para o local.'
keywords: 'nb backup create,NocoBase CLI,criar backup,baixar backup,nbdata'
---

# nb backup create

Cria um backup por meio do env selecionado e baixa o arquivo de backup para o local. Quando `--output` é omitido, a CLI salva o arquivo no diretório de trabalho atual e reutiliza o nome do arquivo de backup retornado pelo remoto — normalmente `backup_*.nbdata`.

## Uso

```bash
nb backup create [flags]
```

## Parâmetros

| Parâmetro             | Tipo    | Descrição                                                                                                                                                                         |
| --------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--env`, `-e`         | string  | Nome do env da CLI para o qual criar o backup; quando omitido, usa o env atual                                                                                                    |
| `--yes`, `-y`         | boolean | Ignora a confirmação interativa quando o env explicitamente apontado por `--env` é diferente do env atual                                                                         |
| `--output`, `-o`      | string  | Caminho de destino do download. Quando omitido, salva no diretório atual; se apontar para um diretório existente, o nome do arquivo de backup remoto será anexado automaticamente |
| `--json-output`, `-j` | boolean | Exibe o resultado final em JSON, incluindo os campos `env`, `name` e `output`                                                                                                     |

## Exemplos

```bash
nb backup create
nb backup create --output ./backups
nb backup create --output ./backups/base.nbdata
nb backup create --env e2e --output ./backups --yes
nb backup create --env e2e --json-output
```

## Observações

A CLI só verifica se `--env` corresponde ao env atual quando você passa `--env` explicitamente. Se um env diferente for especificado explicitamente, um terminal interativo pedirá confirmação primeiro; em um terminal não interativo ou em um cenário de AI agent, você precisa adicionar `--yes` explicitamente por conta própria, ou executar `nb env use <name>` primeiro e tentar novamente.

O fluxo de criação é dividido em duas etapas: primeiro chama a API de backup do env de destino para criar o backup remoto e, em seguida, consulta o status a cada 2 segundos; depois que o backup for concluído, baixa o arquivo para o local. Se após 600 segundos o remoto ainda retornar `inProgress: true`, o comando será encerrado por tempo limite.

`--output` pode ser tanto um caminho de arquivo quanto um caminho de diretório existente. A CLI só reconhece um caminho existente como diretório; se o caminho não existir, ele será tratado como caminho do arquivo de destino.

Depois de passar `--json-output`, a CLI deixa de exibir texto de progresso e imprime diretamente o resultado JSON final. Esse modo é mais adequado para continuar sendo consumido por scripts e fluxos de agent.

## Comandos relacionados

- [`nb backup restore`](./restore.md)
- [`nb env update`](../env/update.md)
