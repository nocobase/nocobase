# Instale usando CLI (recomendado)

Após o NocoBase 2.1.0, o método oficial de instalação e gerenciamento baseado em CLI é fornecido. Você pode usá-lo para concluir a instalação, conexão, atualização e manutenção diária, e também pode preparar um ambiente conectável e operável para o AI Agent.

## Instale a CLI do NocoBase

Executado apenas ao instalar a CLI pela primeira vez.

Primeiro instale a CLI globalmente:

```bash
npm install -g @nocobase/cli
nb --version
```

:::tip É recomendado ativar o modo de sessão primeiro

Se você abrir vários terminais ou shells ao mesmo tempo, ou quiser que o AI Agent opere em paralelo com você, é recomendado por padrão executar [`nb session setup`](../../api/cli/session/setup.md) primeiro. Desta forma, cada sessão pode manter seu próprio `current env` e não afetará facilmente uma à outra.

```bash
nb session setup
```

:::

A CLI verifica atualizações automáticas por padrão. Você pode ajustar a estratégia de atualização de acordo com seus próprios hábitos:

- `prompt`: Avisa quando uma nova versão é encontrada
- `auto`: atualização automática
- `off`: Desative as atualizações automáticas

```bash
nb config set update.policy prompt
nb config set update.policy auto
nb config set update.policy off
```

A auto-atualização só é suportada quando a CLI é gerenciada por uma instalação global padrão de npm, pnpm ou yarn. Se estiver rodando a partir do source ou da árvore de dependências de um projeto local, use [`nb self check`](../../api/cli/self/check.md) para ver o método de instalação detectado e atualize esse projeto pai.

Se você for implementar o NocoBase no servidor e quiser abrir o assistente `nb init --ui` a partir de um navegador remoto, é recomendado primeiro alterar o host padrão da CLI para o IP do servidor atual:

```bash
nb config set default-ui-host <server-ip>
nb config set default-api-host <server-ip>
```

Substitua `<server-ip>` pelo IP real do servidor atual que está acessível para você.

`nb config` é a configuração global da CLI. Normalmente, ele só precisa ser definido uma vez, e esses valores padrão serão usados ​​automaticamente ao executar `nb init --ui` novamente mais tarde, portanto, não há necessidade de repetir a configuração todas as vezes.

De modo geral:

- `default-ui-host` é usado para o endereço de escuta padrão de `nb init --ui` ao iniciar a página do assistente
- `default-api-host` para o endereço API gerado por padrão em novas instalações

Se implantado em um servidor, ambos os valores geralmente devem ser alterados para IPs acessíveis ao servidor atual, em vez de continuar a usar o endereço local padrão.

:::warning Este é apenas um assistente de instalação ou método de acesso temporário, não uma entrada recomendada para ambientes de produção.

Defina `default-ui-host` / `default-api-host` para o IP do servidor, principalmente para que você possa abrir `nb init --ui` em um navegador remoto ou verificar temporariamente se o serviço está acessível após a conclusão da instalação.

Isso não significa que o ambiente de produção deva usar `IP + port` para fornecer serviços externos por muito tempo. Ao implantar formalmente, ainda é recomendado usar um nome de domínio e fornecer acesso unificado por meio de um proxy reverso, como Nginx ou Caddy, e então habilitar HTTPS.

:::

## Instale o NocoBase

### Método 1: Instalar através do assistente de UI

Esta é a entrada padrão recomendada. Você só precisa executar:

```bash
nb init --ui
```

Se quiser especificar uma porta fixa para a página do assistente, você pode adicionar `--ui-port` diretamente, por exemplo:

```bash
nb init --ui --ui-port 3000
```

![assistente de interface de inicialização nb](https://static-docs.nocobase.com/2026-06-03-20-54-01.png)

O assistente irá guiá-lo passo a passo para concluir a configuração necessária para instalação ou conexão com base no cenário atual.

### Método 2: Interagir através do terminal

Se você se sentir mais confortável digitando passo a passo no terminal, você pode executar diretamente:

```bash
nb init
```

![2026-06-03-21-36-33](https://static-docs.nocobase.com/2026-06-03-21-36-33.png)

### Método 3: Através de comandos não interativos

Se você estiver executando em um script, CI/CD ou outro ambiente não interativo, basta usar `--yes`. Neste modo, `--env` deve ser passado explicitamente e os parâmetros não especificados explicitamente serão processados ​​​​por valores padrão.

A maneira padrão mais curta de escrevê-lo é:

```bash
nb init --yes --env app1
```

Específico para combinações comuns, como diferentes fontes de instalação, seleção de versão, certificação `basic`, conexão CI/CD com aplicativos existentes e nomenclatura de banco de dados, basta olhar para [exemplo de referência de comando `nb init`](../../api/cli/init.md# exemplo).

## O que você deve confirmar primeiro após a conclusão da instalação?

`--env` é o nome do ambiente na CLI. De modo geral, a próxima coisa a fazer após a conclusão da instalação gira em torno deste ambiente.

Geralmente é recomendado confirmar estas três coisas primeiro:

1. Se o ambiente foi criado e salvo com sucesso
2. Se o aplicativo pode ser iniciado normalmente e se os logs estão normais
3. Se você vai abri-lo oficialmente para o mundo exterior, planejou a entrada no ambiente de produção em vez de continuar usando `IP + port` diretamente?

### Diretório de instalação

Se você acabou de instalar um aplicativo local usando `nb init --env app1`, poderá visualizar o caminho completo através de `nb env info app1 --field app.appPath`.

Por padrão, a CLI organiza os arquivos locais em `app-path` de acordo com a seguinte convenção:

```text
<app-path>/
├── source/   # 应用源码或下载内容对应的默认目录
├── storage/  # 运行时数据目录
└── .env      # 可选的应用环境变量文件
```

De modo geral:

- `source/` corresponde principalmente ao diretório de aplicativo local do npm/Git env. Para o ambiente Docker, a CLI também manterá esse conjunto de derivação de caminho padrão, mas na maioria das vezes você não precisa se preocupar com isso manualmente
- `storage/` é usado para armazenar dados de tempo de execução, como dados de banco de dados integrados, plug-ins, logs, etc.
- `.env` é um arquivo opcional de variável de ambiente de aplicativo. Somente quando você precisar personalizar variáveis ​​de ambiente, será necessário adicioná-las em `<app-path>/.env`; se este arquivo existir, as fontes de instalação Docker, npm e Git irão lê-lo por padrão.

Consulte [`nb init` Referência de comando](../../api/cli/init.md) para uma descrição mais completa.

### Lembrete de implantação do ambiente de produção

Se você acabou de concluir a instalação e deseja verificar primeiro os resultados da instalação, geralmente não há problema em abrir a página com `IP + port`.

Mas se este ambiente for oficialmente prestador de serviços ao mundo exterior, é necessário prestar especial atenção:

- `nb init --ui` em si é apenas uma página temporária do assistente de instalação, usada para concluir a instalação ou inicialização, e não é a entrada de serviço externo oficial do aplicativo.
- Após a conclusão da instalação por meio de `nb init`, o `IP + port` atualmente exposto pelo aplicativo é mais adequado para a fase de depuração, fase de verificação ou acesso temporário à intranet
- No ambiente de produção, não é recomendado expor diretamente a porta do aplicativo NocoBase à rede pública para uso a longo prazo.
- Para acesso externo oficial, recomenda-se a utilização de nome de domínio e proxy reverso para NocoBase através de Nginx ou Caddy
- Os ambientes de produção devem priorizar a ativação de HTTPS em vez do uso prolongado de `http://IP:port` exposto

Em outras palavras, `default-ui-host` e `default-api-host` servem apenas para tornar o assistente de instalação e a geração de endereço padrão mais convenientes e não representam a entrada de acesso ao ambiente de produção final.

Se este ambiente estiver pronto para ser lançado oficialmente, é recomendado "conectar-se ao proxy reverso e habilitar HTTPS" como a próxima etapa após a conclusão da instalação, em vez de um item de otimização opcional.

Se você estiver pronto para prosseguir com a implantação formal agora, é recomendável começar com [implantação do ambiente de produção](../production/index.md) e, em seguida, continuar examinando a configuração do proxy reverso de [Nginx](../production/reverse-proxy/nginx.md) ou [Caddy](../production/reverse-proxy/caddy.md) conforme necessário.

### Operações diárias

Você pode primeiro confirmar se este ambiente foi salvo com sucesso:

```bash
nb env current
nb env list
nb env status
nb env info app1
nb env info app1 --json
```

Se quiser continuar com as operações subsequentes após a instalação, você pode clicar no seguinte índice para consultar:

| Eu quero... | Onde procurar |
| --- | --- |
| Se você estiver pronto para tornar este ambiente oficialmente aberto ao mundo externo, conecte-o ao proxy reverso do ambiente de produção e use o nome de domínio e HTTPS para expor o serviço. | [Nginx](../production/reverse-proxy/nginx.md) / [Caddy](../production/reverse-proxy/caddy.md). |
| Confirme se o ambiente foi salvo com sucesso, verifique qual ambiente está sendo usado atualmente e alterne entre vários ambientes. | [`nb env`](../../api/cli/env/index.md), [Gerenciamento de vários ambientes](../operations/multi-environment.md). |
| Inicie, pare, reinicie o aplicativo, visualize logs ou continue atualizando o aplicativo. | [`nb app`](../../api/cli/app/index.md), [Gerenciar aplicativo](../operations/manage-app.md). |
| Verifique as conexões do banco de dados, visualize o status do banco de dados integrado ou solucione problemas de contêiner de banco de dados. | [`nb db`](../../api/cli/db/index.md). |
| Visualize plug-ins instalados, ative ou desative plug-ins. | [`nb plugin`](../../api/cli/plugin/index.md). |
| Ative a autorização comercial, verifique o status da autorização e sincronize plug-ins comerciais. | [`nb license`](../../api/cli/license/index.md). |
| Gerencie projetos de código-fonte local, como download de código-fonte, início do modo de desenvolvimento, construção ou teste. Isso normalmente é usado com ambiente npm/Git. | [`nb source`](../../api/cli/source/index.md). |

Se você acabou de instalar um aplicativo local, geralmente poderá executar estes comandos primeiro:

```bash
nb env use app1
nb app start
nb app logs
nb plugin list
```

Se você mantiver vários ambientes ao mesmo tempo, consulte [Gerenciamento de vários ambientes](../operations/multi-environment.md) para métodos subsequentes de alternância e visualização de status.

Se você quiser atualizar o aplicativo posteriormente, basta consultar [Gerenciar aplicativo](../operations/manage-app.md) e [Referência de comandos `nb app upgrade`](../../api/cli/app/upgrade.md).

## Links relacionados

- [`nb init` Referência de comando](../../api/cli/init.md)
- [`nb env info` Referência de comando](../../api/cli/env/info.md)
- [Proxy reverso do ambiente de produção: Nginx](../production/reverse-proxy/nginx.md) / [Caddy](../production/reverse-proxy/caddy.md)
- [Migrar do método antigo para CLI](./migration.md)
- [Gerenciamento de vários ambientes](../operations/multi-environment.md)
- [Gerenciar aplicativo](../operations/manage-app.md)
