---
title: "nb source test"
description: "Referência do comando nb source test: executa testes no diretório da aplicação selecionada e prepara automaticamente o banco de dados de testes embutido."
keywords: "nb source test,NocoBase CLI,testes,Vitest,banco de dados"
---

# nb source test

Executa testes no diretório da aplicação selecionada. Antes de executar os testes, o CLI recria um banco de dados Docker de testes embutido e injeta as variáveis de ambiente `DB_*` usadas internamente.

## Uso

```bash
nb source test [paths...] [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `[paths...]` | string[] | Caminhos dos arquivos de teste ou globs repassados ao runner de testes |
| `--cwd`, `-c` | string | Diretório da aplicação onde os testes serão executados, padrão é o diretório atual |
| `--watch`, `-w` | boolean | Executa o Vitest em modo watch |
| `--run` | boolean | Execução única, sem entrar em modo watch |
| `--allowOnly` | boolean | Permite testes com `.only` |
| `--bail` | boolean | Interrompe na primeira falha |
| `--coverage` | boolean | Habilita o relatório de cobertura |
| `--single-thread` | string | Repassa o modo single-thread para o runner de testes subjacente |
| `--server` | boolean | Força o modo de testes do servidor |
| `--client` | boolean | Força o modo de testes do cliente |
| `--db-clean`, `-d` | boolean | Limpa o banco de dados quando o comando subjacente da aplicação suportar |
| `--db-dialect` | string | Tipo de banco de dados de testes embutido: `postgres`, `mysql`, `mariadb`, `kingbase` |
| `--db-image` | string | Imagem Docker do banco de dados de testes embutido |
| `--db-port` | string | Porta TCP publicada no host pelo banco de dados de testes embutido |
| `--db-database` | string | Nome do banco de dados injetado para os testes |
| `--db-user` | string | Usuário do banco de dados injetado para os testes |
| `--db-password` | string | Senha do banco de dados injetada para os testes |
| `--verbose` | boolean | Exibe a saída do Docker e do runner de testes subjacente |

## Exemplos

```bash
nb source test
nb source test --cwd /path/to/app
nb source test packages/core/server/src/__tests__/foo.test.ts
nb source test --server --coverage
nb source test --db-port 5433
```

## Comandos relacionados

- [`nb source build`](./build.md)
- [`nb db ps`](../db/ps.md)
