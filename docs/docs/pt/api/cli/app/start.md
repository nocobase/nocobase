---
title: "nb app start"
description: "Referência do comando nb app start: inicia a aplicação NocoBase do env especificado; quando aplicável, o CLI primeiro sincroniza os plugins comerciais permitidos pela licença atual, depois os envs locais executam automaticamente a preparação necessária de instalação ou upgrade antes da inicialização, e os envs Docker recriam o contêiner da aplicação a partir da configuração salva."
keywords: "nb app start,NocoBase CLI,iniciar aplicação,Docker,pm2"
---

# nb app start

Inicia a aplicação NocoBase do env especificado. Quando aplicável, o CLI primeiro sincroniza os plugins comerciais permitidos pela licença atual. Depois, instalações npm/Git executam automaticamente a preparação necessária de instalação ou upgrade antes de rodar os comandos locais da aplicação; instalações Docker recriam o contêiner da aplicação a partir da configuração de env salva.

## Uso

```bash
nb app start [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do env do CLI a ser iniciado; usa o env atual quando omitido |
| `--yes`, `-y` | boolean | Quando `--env` é passado explicitamente e aponta para uma env diferente da env atual, pula a confirmação interativa |
| `--verbose` | boolean | Exibe a saída dos comandos subjacentes locais ou Docker |

## Exemplos

```bash
nb app start
nb app start --env local
nb app start --env local --verbose
nb app start --env local-docker
```

Se você passar `--env` explicitamente e ele for diferente da env atual, a CLI pedirá confirmação primeiro. Em terminais não interativos ou sessões de agentes de IA, adicione `--yes` manualmente ou execute primeiro `nb env use <name>` e tente novamente.

Por padrão, quando aplicável, o CLI primeiro executa `nb license plugins sync --skip-if-no-license` para sincronizar os plugins comerciais permitidos pela licença atual. Depois, envs locais executam automaticamente a preparação necessária de instalação ou upgrade antes de iniciar em segundo plano, e envs Docker recriam o contêiner da aplicação a partir da configuração de env salva. Sempre que a CLI precisar aguardar a aplicação ficar pronta, ela verificará `__health_check`: primeiro imprime uma linha de espera e, depois disso, uma linha de progresso a cada 10 segundos até a aplicação ficar disponível ou atingir o tempo limite.
## Comandos relacionados

- [`nb app stop`](./stop.md)
- [`nb app restart`](./restart.md)
- [`nb app logs`](./logs.md)
