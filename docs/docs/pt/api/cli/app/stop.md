---
title: 'nb app stop'
description: 'Referência do comando nb app stop: interrompe a aplicação NocoBase do env especificado e, se necessário, também limpa o contêiner do banco de dados interno gerenciado pela CLI.'
keywords: 'nb app stop,NocoBase CLI,parar aplicação,Docker,with-db,banco de dados interno'
---

# nb app stop

Interrompe a aplicação NocoBase do env especificado. Em instalações via npm/Git, isso para o processo local da aplicação; em instalações via Docker, isso limpa o contêiner salvo da aplicação.

Se você passar `--with-db` e esse env usar um banco de dados interno gerenciado pela CLI, o comando também limpará o contêiner do banco de dados. Se esse env usar um banco de dados externo, os recursos do banco de dados não serão tocados.

## Uso

```bash
nb app stop [flags]
```

## Parâmetros

| Parâmetro     | Tipo    | Descrição                                                                                                 |
| ------------- | ------- | --------------------------------------------------------------------------------------------------------- |
| `--env`, `-e` | string  | Nome do env da CLI a ser interrompido; se omitido, usa o env atual                                        |
| `--yes`, `-y` | boolean | Ignora a confirmação interativa quando o env explicitamente apontado por `--env` é diferente do env atual |
| `--with-db`   | boolean | Também limpa o contêiner do banco de dados quando existir um banco de dados interno gerenciado pela CLI   |
| `--verbose`   | boolean | Exibe a saída dos comandos locais ou Docker subjacentes                                                   |

## Exemplos

```bash
nb app stop
nb app stop --env local
nb app stop --env local --with-db
nb app stop --env local --verbose
nb app stop --env local-docker
```

## Observações

A CLI só verifica se o env especificado corresponde ao env atual quando você passa `--env` explicitamente. Se você especificar explicitamente um env diferente, um terminal interativo pedirá confirmação primeiro; em um terminal não interativo ou em cenários com agentes de IA, você precisa adicionar `--yes` explicitamente por conta própria, ou executar `nb env use <name>` primeiro e tentar novamente.

`--with-db` afeta apenas os contêineres de banco de dados interno gerenciados pela CLI. Em geral, se você só quiser parar a própria aplicação, não precisa desse parâmetro; só o adicione quando também quiser parar o runtime do banco de dados interno na máquina atual.

Este comando só pode operar sobre runtimes local ou Docker na máquina atual. Se um env for apenas uma conexão HTTP API, ou for um env SSH reservado, `nb app stop` não poderá desligá-lo remotamente para você.

## Comandos relacionados

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb env remove`](../env/remove.md)
