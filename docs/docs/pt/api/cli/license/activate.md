---
title: "nb license activate"
description: "Referência do comando nb license activate: ativar o licenciamento comercial do NocoBase para um env selecionado."
keywords: "nb license activate,NocoBase CLI,commercial licensing"
---

# nb license activate

Ativa o licenciamento comercial para um env selecionado. Você pode informar diretamente um license key existente ou solicitar e ativar uma licença online.

## Uso

```bash
nb license activate [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do env do CLI; quando omitido, o env atual é usado |
| `--key` | string | Informar diretamente um license key existente |
| `--key-file` | string | Ler o license key a partir de um arquivo |
| `--online` | boolean | Solicitar uma licença online e ativá-la |
| `--account` | string | Conta do serviço de licenças para ativação online |
| `--password` | string | Senha do serviço de licenças para ativação online |
| `--desc` | string | Nome da aplicação para a ativação online |
| `--yes` | boolean | Confirmar que as informações enviadas são verdadeiras e corretas |
| `--json` | boolean | Saída JSON |

## Exemplos

```bash
nb license activate --env app1 --key <licenseKey>
nb license activate --env app1 --key-file ./license.txt
nb license activate --env app1 --online
nb license activate --env app1 --online --account aa --password bb --desc test24 --yes
nb license activate --env app1 --json --key-file ./license.txt
```

## Observações

Quando a ativação online é usada, o CLI solicita um license key ao serviço de licenças com o ID da instância e a URL da aplicação do env atual.

## Comandos relacionados

- [`nb license id`](./id.md)
- [`nb license status`](./status.md)
