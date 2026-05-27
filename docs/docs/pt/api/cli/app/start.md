---
title: "nb app start"
description: "Referência do comando nb app start: inicia a aplicação NocoBase do env especificado e, em envs Docker, recria o contêiner da aplicação a partir da configuração salva."
keywords: "nb app start,NocoBase CLI,iniciar aplicação,Docker,pm2"
---

# nb app start

Inicia a aplicação NocoBase do env especificado. Instalações npm/Git executam os comandos locais da aplicação; instalações Docker recriam o contêiner da aplicação a partir da configuração de env salva.

## Uso

```bash
nb app start [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do env do CLI a ser iniciado; usa o env atual quando omitido |
| `--yes`, `-y` | boolean | Quando `--env` é passado explicitamente e aponta para uma env diferente da env atual, pula a confirmação interativa |
| `--quickstart` | boolean | Inicia a aplicação em quickstart |
| `--port`, `-p` | string | Sobrescreve o `appPort` salvo na configuração do env |
| `--daemon`, `-d` / `--no-daemon` | boolean | Se deve executar em modo daemon; ativado por padrão |
| `--instances`, `-i` | integer | Número de instâncias a executar |
| `--launch-mode` | string | Modo de inicialização: `pm2` ou `node` |
| `--verbose` | boolean | Exibe a saída dos comandos subjacentes locais ou Docker |

## Exemplos

```bash
nb app start
nb app start --env local
nb app start --env local --quickstart
nb app start --env local --port 12000
nb app start --env local --daemon
nb app start --env local --no-daemon
nb app start --env local --instances 2
nb app start --env local --launch-mode pm2
nb app start --env local --verbose
nb app start --env local-docker
```

Se você passar `--env` explicitamente e ele for diferente da env atual, a CLI pedirá confirmação primeiro. Em terminais não interativos ou sessões de agentes de IA, adicione `--yes` manualmente ou execute primeiro `nb env use <name>` e tente novamente.

Por padrão, envs locais iniciam em segundo plano, e envs Docker recriam o contêiner da aplicação a partir da configuração de env salva. Sempre que a CLI precisar aguardar a aplicação ficar pronta, ela verificará `__health_check`: primeiro imprime uma linha de espera e, depois disso, uma linha de progresso a cada 10 segundos até a aplicação ficar disponível ou atingir o tempo limite.

Se você passar `--no-daemon` para um env local, a aplicação será executada em primeiro plano. Nesse caso, a CLI não continuará aguardando a verificação de readiness após a inicialização.

## Comandos relacionados

- [`nb app stop`](./stop.md)
- [`nb app restart`](./restart.md)
- [`nb app logs`](./logs.md)
