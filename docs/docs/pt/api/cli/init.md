---
title: 'nb init'
description: 'Referência do comando nb init: nova instalação, adoção de um app existente na máquina ou conexão a um app remoto, e salvamento como CLI env.'
keywords: 'nb init,NocoBase CLI,inicialização,env,Docker,npm,Git,conexão remota'
---

# nb init

Inicializa o workspace atual para que o coding agent possa se conectar e usar o NocoBase.

`nb init` pode instalar um app NocoBase local novo ou salvar as informações de conexão de um app existente.

Além disso, por padrão, `nb init` também sincroniza as NocoBase AI coding skills. Você só precisa adicionar `--skip-skills` quando já gerencia as skills por conta própria ou está executando em CI ou em um ambiente offline.

## Uso

```bash
nb init [flags]
```

## Modo interativo

`nb init` oferece três modos de interação:

- `nb init`: conclui o assistente passo a passo no terminal
- `nb init --ui`: abre um formulário no navegador local e conclui o setup com um assistente visual
- `nb init --yes --env app1`: pula os prompts e usa diretamente as flags; parâmetros não informados explicitamente usarão os valores padrão

O modo `--yes` é adequado para scripts, CI/CD ou outros cenários não interativos. Nesse modo, `--env <envName>` é obrigatório. Em geral, ele instala por padrão um app local novo; se você não especificar `--source`, `docker` será usado como origem de instalação por padrão.

## Retomar uma inicialização interrompida

Fluxos de instalação primeiro salvam a configuração do env e depois executam o download, o banco de dados e a instalação do app. Se falhar no meio do processo, você pode continuar:

```bash
nb init --env app1 --resume
```

`--resume` só se aplica a fluxos de inicialização em que a configuração do env já foi salva, e `--env` deve ser informado explicitamente.

## Preparar primeiro o env e instalar o app depois

`--prepare-only` foi feito para fluxos em que o env precisa ser preparado primeiro, depois a licença é ativada e só então o app é instalado e iniciado.

Se você quiser salvar primeiro a configuração do env e preparar o banco de dados, mas adiar o download de dependências, a instalação real do app e a primeira inicialização, pode usar:

```bash
nb init --env app1 --prepare-only
nb init --env app1 --prepare-only --ui
nb init --env app1 --prepare-only --yes
```

Esse modo está disponível para fluxos de instalação local, incluindo o assistente `--ui`. Ele não está disponível para fluxos de conexão remota. A CLI salvará o env atual no estado prepared, para que depois você possa continuar com um fluxo como este:

```bash
nb license activate --env app1
nb app start --env app1
```

Depois disso, `nb app start` concluirá a primeira instalação e mudará o env do estado prepared para o estado normal installed.

## Sobre o diretório de instalação

Você pode ver o caminho completo com `nb env info app1 --field app.appPath`.

Por padrão, a CLI organiza os arquivos locais em `app-path` seguindo esta convenção:

```text
<app-path>/
├── .nb/      # metadados da CLI para este env, como hooks.mjs
├── source/   # diretório padrão correspondente ao código-fonte do app ou ao conteúdo baixado
├── storage/  # diretório de dados em tempo de execução
└── .env      # arquivo opcional de variáveis de ambiente do app
```

Em geral:

- `.nb/` armazena metadados gerenciados pela CLI. Um script passado com `--hook-script` é copiado para `<app-path>/.nb/hooks.mjs`, para que `nb app upgrade` e a restauração local de source possam reutilizá-lo depois
- `source/` corresponde principalmente ao diretório local do app para envs npm / Git. Para envs Docker, a CLI também mantém essa lógica padrão de caminho, embora na maioria das vezes você não precise se preocupar manualmente com isso. Tenha atenção especial durante upgrades: o diretório `source/` será removido e baixado novamente, então não coloque aqui arquivos que precisam ser preservados
- `storage/` é usado para armazenar dados de runtime, como dados do banco de dados embutido, plugins, logs etc.
- `.env` é um arquivo opcional de variáveis de ambiente do app. Você só precisa adicioná-lo em `<app-path>/.env` quando quiser personalizar variáveis de ambiente; se esse arquivo existir, as origens de instalação Docker, npm e Git o lerão por padrão

Isso representa a convenção de diretórios padrão da CLI. Dependendo da origem de instalação, dos plugins e da fase de execução, o conteúdo real gerado no diretório pode não ser exatamente o mesmo.

## Observações

:::warning Atenção

- `--ui` não pode ser usado junto com `--yes`
- `--ui` também não pode ser usado junto com `--resume`
- `--ui-host` e `--ui-port` só podem ser usados junto com `--ui`
- `--skip-auth` não pode ser usado junto com `--access-token` ou `--token`

:::

## Localizar rapidamente por Steps

Os Steps exibidos variam um pouco conforme o caminho de setup. Por exemplo, ao conectar um app existente, normalmente você só usará `Getting started` e `Remote connection`.

Se você estiver seguindo o assistente local da UI passo a passo, pode usar a tabela abaixo para localizar rapidamente:

| Step                      | Principais parâmetros                                                                                                                                                                                             |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Getting started`         | `--env`、`--yes`、`--ui`、`--locale`、`--verbose`、`--skip-skills`、`--resume`、`--prepare-only`                                                                                                                 |
| `App environment`         | `--lang`、`--app-path`、`--app-port`、`--force`                                                                                                                                                                   |
| `App source and version`  | `--source`、`--version`、`--skip-download`、`--git-url`、`--docker-registry`、`--docker-platform`、`--npm-registry`、`--replace`、`--dev-dependencies`、`--output-dir`、`--docker-save`、`--build`、`--build-dts`、`--hook-script` |
| `Configure the database`  | `--builtin-db`、`--db-dialect`、`--builtin-db-image`、`--db-host`、`--db-port`、`--db-database`、`--db-user`、`--db-password`、`--db-schema`、`--db-table-prefix`、`--db-underscored`                             |
| `Create an admin account` | `--root-username`、`--root-email`、`--root-password`、`--root-nickname`                                                                                                                                           |
| `Remote connection`       | `--api-base-url`、`--auth-type`、`--access-token`、`--username`、`--password`、`--skip-auth`                                                                                                                      |

## Parâmetros

Há muitos parâmetros; fica mais claro separá-los por cenário de uso.

O “valor padrão” abaixo representa o valor ou comportamento que `nb init` normalmente adota quando você omite esse parâmetro.

### Básico e interação

| Parâmetro       | Tipo    | Valor padrão                                                                                 | Descrição                                                                                 |
| --------------- | ------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `--yes`, `-y`   | boolean | `false`                                                                                      | Pula os prompts e usa flags e valores padrão                                              |
| `--env`, `-e`   | string  | Nenhum                                                                                       | Nome do env salvo por esta inicialização; obrigatório nos modos `--yes` e `--resume`      |
| `--ui`          | boolean | `false`                                                                                      | Abre o assistente no navegador local; não pode ser usado junto com `--yes` ou `--resume`  |
| `--verbose`     | boolean | `false`                                                                                      | Exibe saída detalhada dos comandos                                                        |
| `--skip-skills` | boolean | `false`                                                                                      | Pula a sincronização das NocoBase AI coding skills                                        |
| `--ui-host`     | string  | `127.0.0.1`                                                                                  | Endereço de bind do serviço local de `--ui`                                               |
| `--ui-port`     | integer | `0`                                                                                          | Porta do serviço local de `--ui`; `0` significa alocação automática                       |
| `--locale`      | string  | Segue `NB_LOCALE`, a configuração da CLI ou o locale do sistema; fallback final para `en-US` | Idioma dos prompts da CLI e da UI local de setup: `en-US` ou `zh-CN`                      |
| `--resume`      | boolean | `false`                                                                                      | Continua a inicialização inacabada anterior, reutilizando a workspace env config já salva |
| `--prepare-only` | boolean | `false`                                                                                     | Salva e prepara um env de instalação local, incluindo fluxos `--ui`, sem instalar nem iniciar o app por enquanto |

### Conectar um app existente

| Parâmetro              | Tipo    | Valor padrão | Descrição                                                                                                                                                |
| ---------------------- | ------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--api-base-url`, `-u` | string  | Nenhum       | Endereço raiz da API; deve incluir o prefixo `/api`                                                                                                      |
| `--auth-type`, `-a`    | string  | `oauth`      | Método de autenticação: `basic`, `token` ou `oauth`. Em geral, o padrão `oauth` é suficiente; em alguns cenários de CI/CD, `basic` também pode ser usado |
| `--access-token`, `-t` | string  | Nenhum       | API key ou access token usado pela autenticação `token`                                                                                                  |
| `--username`           | string  | Nenhum       | Nome de usuário usado pela autenticação `basic`                                                                                                          |
| `--password`           | string  | Nenhum       | Senha usada pela autenticação `basic`                                                                                                                    |
| `--skip-auth`          | boolean | `false`      | Salva primeiro o env e o método de autenticação, e conclui o login depois com `nb env auth`                                                              |

### Parâmetros básicos de instalação local

| Parâmetro         | Tipo    | Valor padrão                        | Descrição                                                                                     |
| ----------------- | ------- | ----------------------------------- | --------------------------------------------------------------------------------------------- |
| `--lang`, `-l`    | string  | `en-US`                             | Idioma da interface do app recém-instalado                                                    |
| `--force`, `-f`   | boolean | `false`                             | Reconfigura um env existente e substitui recursos de runtime conflitantes quando necessário   |
| `--app-path`      | string  | `./<envName>/`                      | Diretório local do app npm/Git                                                                |
| `--app-port`      | string  | `13000`                             | Porta HTTP do app local; no modo `--yes`, uma porta disponível será escolhida automaticamente |
| `--root-username` | string  | `nocobase` (modo `--yes`)           | Nome de usuário do administrador inicial                                                      |
| `--root-email`    | string  | `admin@nocobase.com` (modo `--yes`) | E-mail do administrador inicial                                                               |
| `--root-password` | string  | `admin123` (modo `--yes`)           | Senha do administrador inicial                                                                |
| `--root-nickname` | string  | `Super Admin` (modo `--yes`)        | Nome de exibição do administrador inicial                                                     |

### Parâmetros do banco de dados

| Parâmetro                                  | Tipo    | Valor padrão                                                    | Descrição                                                               |
| ------------------------------------------ | ------- | --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `--builtin-db` / `--no-builtin-db`         | boolean | `true`                                                          | Se deve criar e conectar um banco de dados embutido gerenciado pela CLI |
| `--db-dialect`                             | string  | `postgres`                                                      | Tipo de banco de dados: `postgres`, `mysql`, `mariadb`, `kingbase`      |
| `--builtin-db-image`                       | string  | Segue `--db-dialect` e o locale                                 | Imagem do contêiner do banco de dados embutido                          |
| `--db-host`                                | string  | `postgres` para banco embutido; `127.0.0.1` para banco externo  | Endereço do host do banco de dados                                      |
| `--db-port`                                | string  | `postgres=5432`、`mysql=3306`、`mariadb=3306`、`kingbase=54321` | Porta do banco de dados                                                 |
| `--db-database`                            | string  | `nocobase`; `kingbase` para KingbaseES                          | Nome do banco de dados                                                  |
| `--db-user`                                | string  | `nocobase`                                                      | Nome de usuário do banco de dados                                       |
| `--db-password`                            | string  | `nocobase`                                                      | Senha do banco de dados                                                 |
| `--db-schema`                              | string  | Nenhum                                                          | Schema do banco de dados; usado apenas pelo PostgreSQL                  |
| `--db-table-prefix`                        | string  | Nenhum                                                          | Prefixo das tabelas do banco de dados                                   |
| `--db-underscored` / `--no-db-underscored` | boolean | `false`                                                         | Se nomes de tabelas e campos do banco usam estilo com sublinhado        |

### Parâmetros de download e código-fonte

| Parâmetro                                            | Tipo    | Valor padrão                                                                                  | Descrição                                                                                                      |
| ---------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `--skip-download`                                    | boolean | `false`                                                                                       | Pula o download e reutiliza o diretório local do app existente ou a imagem Docker                              |
| `--source`, `-s`                                     | string  | `docker`                                                                                      | Forma de obter o NocoBase: `docker`, `npm` ou `git`                                                            |
| `--version`, `-v`                                    | string  | `beta`                                                                                        | Parâmetro de versão: versão do pacote npm, tag da imagem Docker ou Git ref                                     |
| `--replace`, `-r`                                    | boolean | `false`                                                                                       | Substitui quando o diretório de destino já existe                                                              |
| `--dev-dependencies`, `-D` / `--no-dev-dependencies` | boolean | `false`                                                                                       | Se deve instalar devDependencies para instalação via npm/Git                                                   |
| `--output-dir`, `-o`                                 | string  | Para npm/Git, derivado de `--app-path`; para Docker + `--docker-save`, `./nocobase-<version>` | Diretório de destino do download, ou diretório para salvar o tarball quando `--docker-save` estiver habilitado |
| `--git-url`                                          | string  | `https://github.com/nocobase/nocobase.git`                                                    | Endereço do repositório Git                                                                                    |
| `--docker-registry`                                  | string  | `nocobase/nocobase`; no locale `zh-CN`, `registry.cn-shanghai.aliyuncs.com/nocobase/nocobase` | Nome do repositório da imagem Docker, sem a tag                                                                |
| `--docker-platform`                                  | string  | `auto`                                                                                        | Plataforma da imagem Docker: `auto`, `linux/amd64`, `linux/arm64`                                              |
| `--docker-save` / `--no-docker-save`                 | boolean | `false`                                                                                       | Se deve salvar adicionalmente a imagem Docker como tarball após o pull                                         |
| `--npm-registry`                                     | string  | vazio                                                                                         | Registry usado para download npm/Git e instalação de dependências                                              |
| `--build` / `--no-build`                             | boolean | `true`                                                                                        | Se deve compilar após instalar dependências via npm/Git                                                        |
| `--build-dts`                                        | boolean | `false`                                                                                       | Se deve gerar arquivos de declaração TypeScript ao compilar via npm/Git                                        |
| `--hook-script`                                      | string  | Nenhum                                                                                        | Copia o módulo hook especificado para `<app-path>/.nb/hooks.mjs` e salva na env config; suporta os lifecycle hooks `beforeDependencyInstall`, `beforeAppInstall` e `afterAppStart` |

## Exemplos

Os usos mais comuns são os seguintes.

### Concluir o assistente passo a passo no terminal

```bash
nb init
```

### Abrir o assistente no navegador local

```bash
nb init --ui
nb init --ui --ui-port 3000
```

### Preparar primeiro, depois ativar a licença e iniciar mais tarde

```bash
nb init --env app1 --prepare-only
nb license activate --env app1
nb app start --env app1
```

### Instalar um app local novo em modo não interativo

Se você não especificar `--source`, normalmente `docker` será usado como origem de instalação.

```bash
nb init --env app1 --yes
nb init --env app1 --yes --source docker --version latest
nb init --env app1 --yes --source docker --version beta
nb init --env app1 --yes --source docker --version alpha
nb init --env app1 --yes --source docker --version main \
  --docker-registry registry.cn-beijing.aliyuncs.com/nocobase/nocobase
nb init --env app1 --yes --source npm --version latest
nb init --env app1 --yes --source npm --version beta
nb init --env app1 --yes --source npm --version alpha
nb init --env app1 --yes --source npm --version beta --app-port 13080
nb init --env app1 --yes --source git --version latest
nb init --env app1 --yes --source git --version beta
nb init --env app1 --yes --source git --version alpha
nb init --env app1 --yes --source git --version feat/plugin-workflow-timeout
nb init --env app1 --yes --source git --version latest \
  --git-url https://gitee.com/nocobase/nocobase.git
```

### Estender o fluxo de instalação com um script hook

Se você precisar preparar conteúdo extra durante a instalação, passe um módulo ESM local com `--hook-script`:

```bash
nb init --env app1 --yes --source git --hook-script ./hooks.mjs
```

A CLI copia esse arquivo para `<app-path>/.nb/hooks.mjs` e salva `hookScript: ".nb/hooks.mjs"` na env config. `nb app start`, `nb app restart` e `nb app upgrade` posteriores o reutilizam a partir desse local.

O arquivo hook deve exportar um objeto como default. Implemente apenas os métodos necessários:

```js
export default {
  beforeDependencyInstall: async (context) => {
    // Runs after git clone / npm scaffold and before yarn install.
  },
  beforeAppInstall: async (context) => {
    // Runs before the app-level install or upgrade command.
  },
  afterAppStart: async (context) => {
    // Runs after the app actually starts and passes the health check.
  },
};
```

- `beforeDependencyInstall` só se aplica a source npm/Git e executa logo antes do `yarn install` real; Docker source não o executa
- `beforeAppInstall` executa antes de comandos de instalação ou upgrade da app, e se aplica a source npm/Git/Docker
- `afterAppStart` executa depois que a app realmente inicia e passa no `__health_check`; `nb app start`, `nb app restart` e `nb app upgrade` podem acioná-lo

`--prepare-only` apenas salva a env config e copia o arquivo hook. Ele não executa hooks. Quando você executar `nb app start` pela primeira vez depois disso, a CLI executará os hooks da primeira instalação com `context.phase` como `init` e `context.command` como `app:start`.

`context` inclui informações de lifecycle como `phase`, `command`, `source`, `version`, `appPath`, `sourcePath`, `storagePath`, `hookScript` e `envConfig`. Se um hook lançar erro, o comando CLI atual falha. Como `afterAppStart` pode rodar repetidamente em start, restart e upgrade, mantenha-o idempotente.

### Instalar rapidamente e usar autenticação basic

Se você quiser instalar rapidamente um app local em modo não interativo e salvar diretamente a autenticação `basic` após a instalação, também pode fazer assim. Dessa forma, não é necessário abrir o navegador para concluir o OAuth.

Se você mantiver a conta de administrador padrão do modo `--yes`, a forma mais curta é esta.

Quando ausente, a conta de administrador padrão é `nocobase` e a senha padrão é `admin123`:

```bash
nb init --env app1 --yes --auth-type basic
```

Se você também quiser personalizar a conta de administrador, pode fazer assim:

```bash
nb init --env app1 --yes \
  --auth-type basic \
  --root-username admin \
  --root-password secret123
```

### Conectar um app existente

Usar OAuth por padrão é suficiente. Se, em alguns cenários de CI/CD, não for conveniente abrir o navegador, você também pode salvar diretamente a autenticação `basic`; se já tiver um API token, também pode salvar diretamente a autenticação `token`.

```bash
nb init --env staging --yes \
  --api-base-url https://demo.example.com/api

nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type basic \
  --username <username> \
  --password <password>

nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type token \
  --access-token <token>

nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type oauth \
  --skip-auth
```

### Personalizar nomes do banco de dados

Se você precisar especificar um schema PostgreSQL, prefixo de tabela ou nomes com sublinhado, pode passar os parâmetros assim:

```bash
nb init --env app1 --yes \
  --db-dialect postgres \
  --db-schema public \
  --db-table-prefix nb_ \
  --db-underscored
```

### Continuar a inicialização interrompida anterior

```bash
nb init --env app1 --resume
```

### Exibir logs detalhados para troubleshooting

```bash
nb init --env app1 --yes --source docker --version latest --verbose
```

## Comandos relacionados

- [`nb env add`](./env/add.md)
- [`nb env auth`](./env/auth.md)
- [`nb source download`](./source/download.md)
