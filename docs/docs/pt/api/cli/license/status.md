---
title: "nb license status"
description: "Referência do comando nb license status: exibir o status da licença comercial para um env selecionado."
keywords: "nb license status,NocoBase CLI,license status"
---

# nb license status

Exibe o status da licença comercial para o env selecionado.

## Uso

```bash
nb license status [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do env do CLI; quando omitido, o env atual é usado |
| `--yes`, `-y` | boolean | Quando `--env` é passado explicitamente e aponta para uma env diferente da env atual, pula a confirmação interativa |
| `--doctor` | boolean | Executar verificações e sugestões extras de diagnóstico |
| `--json` | boolean | Saída JSON |

## Exemplos

```bash
nb license status
nb license status --env app1
nb license status --env app1 --yes
nb license status --env app1 --doctor
nb license status --env app1 --json
```

## Observações

O novo CLI ainda não implementa completamente as verificações de status de licença no backend. O comando ainda pode retornar contexto básico e marcadores de diagnóstico, mas não um veredito completo sobre a licença.

Se você passar `--env` explicitamente e ele for diferente da env atual, a CLI pedirá confirmação primeiro. Em terminais não interativos ou sessões de agentes de IA, adicione `--yes` manualmente ou execute primeiro `nb env use <name>` e tente novamente.

## Comandos relacionados

- [`nb license activate`](./activate.md)
- [`nb license id`](./id.md)
