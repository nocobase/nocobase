# Como conectar o antigo método de instalação ao AI e migrar para CLI

Se você ainda usa o código-fonte Docker, `create-nocobase-app` ou Git para instalar e manter o NocoBase de acordo com a documentação antiga, você pode continuar a usá-lo desta forma. Não há necessidade de reinstalar o aplicativo imediatamente para acessar a IA.

Esta página ajuda principalmente a determinar a rota primeiro:

- Continue a usar os métodos originais de instalação e atualização
- Permita que os aplicativos existentes acessem o agente de IA primeiro
- Migrar para uma nova abordagem baseada em CLI

Por padrão, é recomendável primeiro verificar a qual categoria você pertence e depois inserir o documento correspondente. Isso é mais estável e tem menos probabilidade de operar incorretamente o ambiente de produção.

## Qual método devo escolher?

| Se você quiser agora... | O que fazer por padrão |
| --- | --- |
| Continue a instalar, atualizar e manter aplicativos da maneira original | Continue a usar o método antigo, primeiro leia a entrada relevante do documento abaixo |
| Permitir que um aplicativo antigo em execução estável se conecte ao agente de IA | Por padrão, a conexão remota é usada primeiro, o que apresenta o menor risco |
| Use `nb app`, `nb env`, `nb source` para gerenciar aplicativos no futuro | Crie um novo aplicativo CLI e migre os dados antigos para lá |

## Continue a usar o método de instalação original

Se você estiver acostumado com o método de instalação anterior, poderá continuar a usá-lo. Basta seguir os documentos originais para instalação, atualização e configuração de variáveis ​​de ambiente.

### Instale o NocoBase

- [Instalação do Docker](/get-started/installation/docker)
- [instalação create-nocobase-app](/get-started/installation/create-nocobase-app)
- [Instalação do código-fonte do Git](/get-started/installation/git)
- [Variáveis de ambiente](/get-started/installation/env)

### Atualizar NocoBase

- [Atualizando a instalação do Docker](/get-started/upgrading/docker)
- [Atualização da instalação do create-nocobase-app](/get-started/upgrading/create-nocobase-app)
- [Atualizando a instalação do código-fonte do Git](/get-started/upgrading/git)

## Método 1: primeiro permita que os aplicativos existentes acessem o agente de IA

Se o seu aplicativo antigo já estiver funcionando de forma estável, use este método por padrão.

O foco deste método é primeiro conectar os aplicativos existentes à CLI e ao agente de IA por meio de conexão remota. Este é o risco mais baixo porque não assume diretamente os processos atuais de instalação, inicialização, parada e atualização.

Mas devemos primeiro esclarecer os limites:

- Este método não possui recursos relacionados a `nb app`
- Ele não assume o gerenciamento do tempo de execução de aplicativos antigos para você
- Mas as habilidades relacionadas à construção de IA podem ser usadas normalmente

Em outras palavras, se o que mais importa no momento é "conectar a IA primeiro" em vez de "mudar imediatamente todo o sistema de gerenciamento de operações para a CLI", você seguirá esse caminho primeiro por padrão.

Ao conectar-se a um aplicativo existente, você pode inicializar um ambiente CLI como este:

```bash
# 默认使用 OAuth 认证
nb init --yes --env app1 \
  --api-base-url=http://your-app-host/api

# 使用 token 认证
nb init --yes --env app1 \
  --api-base-url=http://your-app-host/api \
  --auth-type=token \
  --access-token=<token>
```

Se a reautenticação for necessária posteriormente, você poderá executar:

```bash
nb env auth app1
```

Se você quiser apenas começar a usar IA para desenvolver recursos, continue lendo [AI Build Quick Start](/ai-builder/).

## Método 2: Migrar para CLI

Se você quiser usar `nb app`, `nb env` e `nb source` para gerenciar aplicativos locais no futuro, a abordagem mais segura não será assumir diretamente o aplicativo existente, mas criar um novo aplicativo e depois migrar os dados do aplicativo antigo para lá.

A razão também é muito simples: a capacidade de “assumir aplicações existentes” ainda está em desenvolvimento.

Portanto, no momento, a rota de migração padrão recomendada é:

1. Primeiro crie um novo aplicativo CLI
2. Migre o banco de dados, `storage` e variáveis de ambiente do aplicativo antigo.
3. Depois de verificar se a operação, a atualização e os recursos de IA do novo aplicativo estão normais, decida se deseja mudar para o ambiente de produção.

Primeiro crie um novo ambiente CLI:

```bash
nb init --yes --env app1
```

Antes de migrar, é recomendado confirmar se estes conteúdos estão prontos:

1. O backup do banco de dados foi feito
2. Foi feito backup do diretório `storage`
3. As principais variáveis de ambiente do aplicativo antigo foram registradas, como `APP_KEY`, `TZ`, `DB_*`, `DB_UNDERSCORED`

Por padrão, basta migrar primeiro o ambiente de teste. Migre o ambiente de produção somente quando tiver confirmado que o backup, as variáveis ​​de ambiente e a configuração do banco de dados estão corretos.

## Onde procurar em seguida

- Se você estiver pronto para instalar e gerenciar aplicativos de uma nova maneira, continue para [Instalação usando CLI (recomendado)](./cli.md)
- Se você continuar a usar o método de instalação original, basta voltar para a instalação e atualizar a entrada do documento acima.
