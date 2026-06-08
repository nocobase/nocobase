---
title: 'nb backup restore'
description: 'Referência do comando nb backup restore: restaura um arquivo de backup local para o env de destino.'
keywords: 'nb backup restore,NocoBase CLI,restaurar backup,restaurar,nbdata'
---

# nb backup restore

Restaura um arquivo de backup local para o env de destino. Normalmente, usa-se aqui um arquivo `*.nbdata`. A restauração sobrescreverá os dados do aplicativo de destino, por isso o CLI solicita uma confirmação adicional por padrão.

## Uso

```bash
nb backup restore --file <path> [flags]
```

## Parâmetros

| Parâmetro      | Tipo    | Descrição                                                                                                                            |
| -------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `--env`, `-e`  | string  | Nome do env do CLI para o qual restaurar; se omitido, usa o env atual                                                                |
| `--yes`, `-y`  | boolean | Ignora a confirmação interativa quando o env explicitamente apontado por `--env` é diferente do env atual                            |
| `--file`, `-f` | string  | Caminho do arquivo de backup local; obrigatório                                                                                      |
| `--force`      | boolean | Confirma a sobrescrita dos dados do aplicativo; deve ser informado explicitamente em terminais não interativos e sessões de AI agent |

## Exemplos

```bash
nb backup restore --file ./backups/base.nbdata --force
nb backup restore --env e2e --file ./backups/base.nbdata --yes --force
```

## Descrição

O CLI só verifica se `--env` é igual ao env atual quando você passa `--env` explicitamente. Se um env diferente for especificado explicitamente, um terminal interativo pedirá confirmação primeiro; em terminais não interativos ou cenários de AI agent, você precisa adicionar `--yes` explicitamente por conta própria, ou executar primeiro `nb env use <name>` e tentar novamente.

Antes da execução, o CLI verifica primeiro se o caminho apontado por `--file` existe e confirma que é um arquivo comum. Se o caminho não existir ou apontar para um diretório, o comando falhará imediatamente.

Se `--force` não for informado, um terminal interativo exibirá uma segunda confirmação, deixando claro que essa restauração sobrescreverá os dados do aplicativo. Em terminais não interativos e sessões de AI agent, se `--force` estiver ausente, o CLI recusará a execução diretamente e exibirá uma dica de reexecução que pode ser copiada. Se ao mesmo tempo também for uma operação entre envs diferentes, normalmente é necessário informar `--yes` e `--force`.

Após o upload ser bem-sucedido, o CLI continuará aguardando que o aplicativo de destino volte a passar em `__health_check`. Ou seja, quando o comando retornar com sucesso, o aplicativo normalmente já terá sido restaurado para um estado acessível.

## Comandos relacionados

- [`nb backup create`](./create.md)
- [`nb app restart`](../app/restart.md)
