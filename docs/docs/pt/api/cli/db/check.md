---
title: "nb db check"
description: "Referência do comando nb db check: verificar se um banco de dados está acessível usando o env atual ou flags explícitos de banco de dados."
keywords: "nb db check,NocoBase CLI,database connection"
---

# nb db check

Verifica se um banco de dados está acessível. Você pode reutilizar as configurações de banco de dados salvas em um env ou informar flags `--db-*` explícitos.

## Uso

```bash
nb db check [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Ler as configurações do banco de dados a partir de um env do CLI; quando omitido, todos os flags `--db-*` obrigatórios devem ser informados |
| `--db-dialect` | string | Dialeto do banco de dados: `postgres`, `kingbase`, `mysql` ou `mariadb` |
| `--db-host` | string | Nome do host ou endereço IP do banco de dados |
| `--db-port` | string | Porta TCP do banco de dados |
| `--db-database` | string | Nome do banco de dados |
| `--db-user` | string | Nome de usuário do banco de dados |
| `--db-password` | string | Senha do banco de dados |
| `--json` | boolean | Saída JSON |

## Exemplos

```bash
nb db check --env app1
nb db check --env app1 --db-password new-secret --json
nb db check --db-dialect postgres --db-host 127.0.0.1 --db-port 5432 --db-database nocobase --db-user nocobase --db-password secret
```

## Observações

Se o env selecionado usar um banco de dados embutido gerenciado pelo CLI, o CLI resolve o endereço real da conexão antes de executar a verificação.

## Comandos relacionados

- [`nb db ps`](./ps.md)
- [`nb env info`](../env/info.md)
