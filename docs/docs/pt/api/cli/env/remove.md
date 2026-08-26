---
title: 'nb env remove'
description: 'Referência do comando nb env remove: interrompe os runtimes gerenciados antes de remover a configuração do env, ou limpa completamente os recursos locais gerenciados quando necessário.'
keywords: 'nb env remove,NocoBase CLI,remover ambiente,remover configuração,purge'
---

# nb env remove

Remove um env configurado. Para envs local/docker, este comando primeiro interrompe o runtime do aplicativo e o runtime do banco de dados embutido gerenciados pela CLI na máquina atual, e depois remove a configuração salva do env da CLI. Para envs http/ssh, este comando apenas remove a configuração salva do env da CLI.

Se o env removido for o env atual, a CLI selecionará automaticamente um novo env atual entre os envs restantes; se não houver mais envs disponíveis, o env atual será limpo.

Por padrão, o comando exige confirmação. No modo não interativo, é necessário passar `--force` explicitamente para executá-lo.

Se precisar limpar o máximo possível os recursos gerenciados pela CLI na máquina atual, passe `--purge`. Para envs local/docker, `--purge` também limpa os recursos de runtime gerenciados, os dados de storage e, quando aplicável, os arquivos do app local baixados; para envs http/ssh, `--purge` não afeta serviços externos e apenas remove a configuração salva do env da CLI.

## Uso

```bash
nb env remove <name> [flags]
```

## Parâmetros

| Parâmetro       | Tipo    | Descrição                                                                                                                                                                                                              |
| --------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<name>`        | string  | Nome do ambiente configurado a ser removido                                                                                                                                                                            |
| `--force`, `-f` | boolean | Ignora a confirmação no modo remove atual; obrigatório no modo não interativo                                                                                                                                          |
| `--purge`       | boolean | Limpa adicionalmente os recursos gerenciados pela CLI, os dados de storage e, quando aplicável, os arquivos do app local baixados na máquina atual; para envs de API remota, apenas remove a configuração salva do env |
| `--verbose`     | boolean | Exibe o progresso detalhado                                                                                                                                                                                            |

## Exemplos

```bash
nb env remove staging
nb env remove staging --force
nb env remove staging --purge --force
```

## Comandos relacionados

- [`nb app stop`](../app/stop.md)
- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
