---
title: "nb app restart"
description: "Referência do comando nb app restart: reinicia a aplicação NocoBase do env especificado e, em envs Docker, recria o contêiner da aplicação a partir da configuração salva."
keywords: "nb app restart,NocoBase CLI,reiniciar aplicação,Docker"
---

# nb app restart

Para e depois inicia novamente a aplicação NocoBase do env especificado. Envs locais reutilizam o fluxo de `nb app stop` e `nb app start`; envs Docker removem primeiro o contêiner atual e depois recriam o contêiner da aplicação com base na configuração de env salva.

## Uso

```bash
nb app restart [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do env do CLI a ser reiniciado; usa o env atual quando omitido |
| `--yes`, `-y` | boolean | Quando `--env` é passado explicitamente e aponta para uma env diferente da env atual, pula a confirmação interativa |
| `--quickstart` | boolean | Inicia a aplicação em quickstart após a parada |
| `--port`, `-p` | string | Sobrescreve o `appPort` salvo na configuração do env |
| `--daemon`, `-d` / `--no-daemon` | boolean | Se deve executar em modo daemon após a parada; ativado por padrão |
| `--instances`, `-i` | integer | Número de instâncias a executar após a parada |
| `--launch-mode` | string | Modo de inicialização: `pm2` ou `node` |
| `--verbose` | boolean | Exibe a saída dos comandos subjacentes de parada e inicialização |

## Exemplos

```bash
nb app restart
nb app restart --env local
nb app restart --env local --quickstart
nb app restart --env local --port 12000
nb app restart --env local --no-daemon
nb app restart --env local --instances 2
nb app restart --env local --launch-mode pm2
nb app restart --env local --verbose
nb app restart --env local-docker
```

Se você passar `--env` explicitamente e ele for diferente da env atual, a CLI pedirá confirmação primeiro. Em terminais não interativos ou sessões de agentes de IA, adicione `--yes` manualmente ou execute primeiro `nb env use <name>` e tente novamente.

Sempre que a CLI precisar aguardar a aplicação ficar pronta, ela verificará `__health_check`: primeiro imprime uma linha de espera e, depois disso, uma linha de progresso a cada 10 segundos até a aplicação ficar disponível ou atingir o tempo limite. Se você passar `--no-daemon` para um env local, a aplicação será executada em primeiro plano, então a CLI não continuará aguardando a verificação de readiness após a inicialização.

## Comandos relacionados

- [`nb app start`](./start.md)
- [`nb app stop`](./stop.md)
- [`nb app logs`](./logs.md)
