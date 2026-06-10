---
title: "nb app restart"
description: "Referência do comando nb app restart: reinicia a aplicação NocoBase do env especificado; quando aplicável, o CLI primeiro sincroniza os plugins comerciais permitidos pela licença atual, depois os envs locais executam automaticamente a preparação necessária de instalação ou upgrade durante a reinicialização, e os envs Docker recriam o contêiner da aplicação a partir da configuração salva."
keywords: "nb app restart,NocoBase CLI,reiniciar aplicação,Docker"
---

# nb app restart

Para e depois inicia novamente a aplicação NocoBase do env especificado. Quando aplicável, o CLI primeiro sincroniza os plugins comerciais permitidos pela licença atual. Depois, envs locais reutilizam o fluxo de `nb app stop` e `nb app start` e, por padrão, executam automaticamente a preparação necessária de instalação ou upgrade antes de iniciar novamente; envs Docker removem primeiro o contêiner atual e depois recriam o contêiner da aplicação com base na configuração de env salva.

## Uso

```bash
nb app restart [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do env do CLI a ser reiniciado; usa o env atual quando omitido |
| `--yes`, `-y` | boolean | Quando `--env` é passado explicitamente e aponta para uma env diferente da env atual, pula a confirmação interativa |
| `--verbose` | boolean | Exibe a saída dos comandos subjacentes de parada e inicialização |

## Exemplos

```bash
nb app restart
nb app restart --env local
nb app restart --env local --verbose
nb app restart --env local-docker
```

Se você passar `--env` explicitamente e ele for diferente da env atual, a CLI pedirá confirmação primeiro. Em terminais não interativos ou sessões de agentes de IA, adicione `--yes` manualmente ou execute primeiro `nb env use <name>` e tente novamente.

Por padrão, quando aplicável, o CLI primeiro executa `nb license plugins sync --skip-if-no-license` para sincronizar os plugins comerciais permitidos pela licença atual. Depois, envs locais executam automaticamente a preparação necessária de instalação ou upgrade antes de iniciar novamente, e envs Docker concluem essa etapa antes de recriar o contêiner. Sempre que a CLI precisar aguardar a aplicação ficar pronta, ela verificará `__health_check`: primeiro imprime uma linha de espera e, depois disso, uma linha de progresso a cada 10 segundos até a aplicação ficar disponível ou atingir o tempo limite.

## Comandos relacionados

- [`nb app start`](./start.md)
- [`nb app stop`](./stop.md)
- [`nb app logs`](./logs.md)
