---
title: "nb app upgrade"
description: "Referência do comando nb app upgrade: para a aplicação, substitui o código-fonte ou a imagem salvos e então faz o upgrade e inicia a aplicação NocoBase selecionada."
keywords: "nb app upgrade,NocoBase CLI,upgrade,atualizar,imagem Docker"
---

# nb app upgrade

Atualiza a aplicação NocoBase selecionada. A CLI para a aplicação atual primeiro, substitui por padrão o código-fonte ou a imagem salvos, sincroniza plugins comerciais, faz o upgrade e inicia a aplicação, e atualiza o runtime do env ao final. Envs Docker recriam o contêiner da aplicação a partir da configuração de env salva durante a inicialização.

## Uso

```bash
nb app upgrade [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do env do CLI a ser atualizado; usa o env atual quando omitido |
| `--yes`, `-y` | boolean | Quando `--env` é passado explicitamente e aponta para uma env diferente da env atual, pula a confirmação interativa |
| `--force`, `-f` | boolean | Pula a confirmação do upgrade. Esse sinalizador precisa ser passado explicitamente em terminais não interativos e em sessões de agentes de IA |
| `--skip-download`, `-s` | boolean | Pula o download do código-fonte ou da imagem e executa o fluxo de upgrade e inicialização com o código-fonte local ou a imagem Docker atualmente salvos; também ignora `nb license plugins sync` |
| `--version` | string | Sobrescreve a versão de destino deste upgrade; quando tiver sucesso, a nova versão será gravada de volta em `downloadVersion` na configuração do env |
| `--verbose` | boolean | Exibe a saída dos comandos subjacentes de atualização e reinicialização |

## Exemplos

```bash
nb app upgrade
nb app upgrade --force
nb app upgrade --env local
nb app upgrade --env local --force
nb app upgrade --env local --skip-download
nb app upgrade --env local --skip-download --version beta
nb app upgrade --env local --version beta
nb app upgrade --env local --verbose
nb app upgrade --env local-docker --skip-download
```

Se você passar `--env` explicitamente e ele for diferente da env atual, a CLI pedirá confirmação primeiro. Em terminais não interativos ou sessões de agentes de IA, adicione `--yes` manualmente ou execute primeiro `nb env use <name>` e tente novamente.

Antes de o upgrade realmente começar, terminais interativos também pedirão uma confirmação adicional de upgrade, a menos que você passe `--force`. Em terminais não interativos e em sessões de agentes de IA, `nb app upgrade` se recusará a continuar sem `--force` e exibirá um comando de nova execução que pode ser copiado diretamente. Se a operação também for cross-env, você precisará de `--yes` e `--force`.

Por padrão, `nb app upgrade` executa estas etapas:

1. `nb app stop`
2. `nb source download --replace`
3. `nb license plugins sync --skip-if-no-license`
4. `nb app start`
5. Salvar a nova `downloadVersion` quando necessário
6. `nb env update`

Quando `--skip-download` é passado, a CLI ignora as etapas 2 e 3 e executa diretamente o fluxo de upgrade e inicialização com o código-fonte ou a imagem atualmente salvos. Se `--version` também for passado, a CLI não baixa essa versão durante esta execução; em vez disso, apenas a salva como a nova `downloadVersion` depois de uma inicialização bem-sucedida, para que upgrades futuros possam usá-la.

A etapa 4 conclui automaticamente a preparação de upgrade necessária de acordo com o estado atual do código e depois aguarda a aplicação passar em `__health_check`. Durante essa espera, a CLI imprime primeiro uma linha de espera e depois uma linha de progresso a cada 10 segundos até que a aplicação esteja pronta ou o health check atinja o tempo limite.

Se a etapa final `nb env update` falhar, o upgrade ainda será considerado bem-sucedido. A CLI exibirá um aviso e pedirá que você execute `nb env update <envName>` manualmente depois.

## Comandos relacionados

- [`nb source download`](../source/download.md)
- [`nb app restart`](./restart.md)
- [`nb self update`](../self/update.md)
