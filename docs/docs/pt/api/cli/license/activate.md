---
title: "nb license activate"
description: "Referência do comando nb license activate: ativar uma license key comercial existente do NocoBase para um env selecionado."
keywords: "nb license activate,NocoBase CLI,commercial licensing"
---

# nb license activate

Ativa uma license key comercial existente para um env selecionado. Você pode passá-la diretamente, lê-la de um arquivo ou colá-la em um terminal interativo.

## Uso

```bash
nb license activate [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do env do CLI; quando omitido, o env atual é usado |
| `--key` | string | Informar diretamente uma license key comercial existente |
| `--key-file` | string | Ler uma license key comercial existente a partir de um arquivo |
| `--yes`, `-y` | boolean | Quando `--env` é passado explicitamente e aponta para uma env diferente da env atual, pula a confirmação interativa |
| `--json` | boolean | Saída JSON |

## Exemplos

```bash
nb license activate
nb license activate --env app1 --key <licenseKey>
nb license activate --env app1 --key-file ./license.txt
nb license activate --env app1 --json --key-file ./license.txt
```

## Observações

Quando executado de forma interativa, o CLI primeiro mostra o Hostname e o Instance ID atuais e depois pede que você cole a license key diretamente ou informe o caminho de um arquivo de key. Essas informações ajudam a confirmar se a licença está sendo vinculada à instância correta.

Depois que a ativação for concluída com sucesso, reinicie a aplicação para que a licença e o estado dos plugins comerciais passem a valer de fato; antes do reinício, o CLI sincronizará automaticamente os plugins comerciais permitidos pela licença atual:

```bash
nb app restart
```

Se você passar `--env` explicitamente e ele for diferente da env atual, a CLI pedirá confirmação primeiro. Em terminais não interativos ou sessões de agentes de IA, adicione `--yes` manualmente ou execute primeiro `nb env use <name>` e tente novamente.

## Comandos relacionados

- [`nb app restart`](../app/restart.md)
- [`nb license id`](./id.md)
- [`nb license status`](./status.md)
