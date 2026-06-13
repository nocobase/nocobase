---
title: 'nb db stop'
description: 'Referência do comando nb db stop: interrompe o contêiner de banco de dados integrado do env especificado.'
keywords: 'nb db stop,NocoBase CLI,parar banco de dados,Docker'
---

# nb db stop

Interrompe o contêiner de banco de dados integrado do env especificado. Este comando se aplica apenas a envs com o banco de dados integrado gerenciado pela CLI habilitado.

## Uso

```bash
nb db stop [flags]
```

## Parâmetros

| Parâmetro     | Tipo    | Descrição                                                                                           |
| ------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `--env`, `-e` | string  | Nome do env da CLI cujo banco de dados integrado deve ser interrompido; se omitido, usa o env atual |
| `--verbose`   | boolean | Exibe a saída do comando Docker subjacente                                                          |

## Exemplos

```bash
nb db stop
nb db stop --env app1
nb db stop --env app1 --verbose
```

## Comandos relacionados

- [`nb db start`](./start.md)
- [`nb app stop`](../app/stop.md)
