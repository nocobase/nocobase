:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Estrutura do Projeto

Seja ao clonar o código-fonte do Git ou ao inicializar um projeto com `create-nocobase-app`, o projeto NocoBase gerado é, essencialmente, um monorepo baseado em **Yarn Workspace**.

## Visão Geral do Diretório Raiz

O exemplo a seguir usa `my-nocobase-app/` como diretório do projeto. Pode haver pequenas diferenças em ambientes distintos:

```bash
my-nocobase-app/
├── packages/              # Código-fonte do projeto
│   ├── plugins/           # Plugins em desenvolvimento (não compilados)
├── storage/               # Dados de tempo de execução e conteúdo gerado dinamicamente
│   ├── apps/
│   ├── db/
│   ├── logs/
│   ├── uploads/
│   ├── plugins/           # Plugins compilados (incluindo aqueles enviados pela interface)
│   └── tar/               # Arquivos de pacote de plugins (.tar)
├── scripts/               # Scripts de utilidade e comandos de ferramenta
├── .env*                  # Configurações de variáveis de ambiente para diferentes ambientes
├── lerna.json             # Configuração do workspace Lerna
├── package.json           # Configuração do pacote raiz, declara o workspace e scripts
├── tsconfig*.json         # Configurações TypeScript (frontend, backend, mapeamento de caminhos)
├── vitest.config.mts      # Configuração de testes de unidade Vitest
└── playwright.config.ts   # Configuração de testes E2E Playwright
```

## Descrição do Subdiretório packages/

O diretório `packages/` contém os módulos principais do NocoBase e pacotes extensíveis. O conteúdo depende da origem do projeto:

- **Projetos criados via `create-nocobase-app`**: Por padrão, incluem apenas `packages/plugins/`, usado para armazenar o código-fonte de plugins personalizados. Cada subdiretório é um pacote npm independente.
- **Repositório de código-fonte oficial clonado**: Você verá mais subdiretórios, como `core/`, `plugins/`, `pro-plugins/`, `presets/`, etc., que correspondem ao núcleo do framework, plugins integrados e soluções predefinidas oficiais.

Em qualquer um dos casos, `packages/plugins` é o local principal para desenvolver e depurar plugins personalizados.

## Diretório de Tempo de Execução storage/

O diretório `storage/` armazena dados gerados em tempo de execução e saídas de build. As descrições dos subdiretórios comuns são as seguintes:

- `apps/`: Configuração e cache para cenários de múltiplas aplicações.
- `logs/`: Logs de tempo de execução e saída de depuração.
- `uploads/`: Arquivos e recursos de mídia enviados pelos usuários.
- `plugins/`: Plugins empacotados enviados pela interface do usuário ou importados via CLI.
- `tar/`: Pacotes de plugins compactados gerados após a execução de `yarn build <plugin> --tar`.

> Geralmente, é recomendado adicionar o diretório `storage` ao `.gitignore` e tratá-lo separadamente durante a implantação ou backup.

## Configuração de Ambiente e Scripts do Projeto

- `.env`, `.env.test`, `.env.e2e`: Usados para execução local, testes de unidade/integração e testes end-to-end, respectivamente.
- `scripts/`: Armazena scripts de manutenção comuns (como inicialização de banco de dados, utilitários de lançamento, etc.).

## Caminhos de Carregamento e Prioridade de Plugins

Plugins podem existir em vários locais. O NocoBase os carregará na seguinte ordem de prioridade ao iniciar:

1.  Versão do código-fonte em `packages/plugins` (para desenvolvimento e depuração local).
2.  Versão empacotada em `storage/plugins` (enviada pela interface do usuário ou importada via CLI).
3.  Pacotes de dependência em `node_modules` (instalados via npm/yarn ou integrados ao framework).

Quando um plugin com o mesmo nome existe tanto no diretório de código-fonte quanto no diretório empacotado, o sistema priorizará o carregamento da versão do código-fonte, facilitando substituições locais e depuração.

## Modelo de Diretório de Plugin

Crie um plugin usando a CLI:

```bash
yarn pm create @my-project/plugin-hello
```

A estrutura de diretórios gerada é a seguinte:

```bash
packages/plugins/@my-project/plugin-hello/
├── dist/                    # Saída de build (gerada conforme necessário)
├── src/                     # Diretório do código-fonte
│   ├── client/              # Código frontend (blocos, páginas, modelos, etc.)
│   │   ├── plugin.ts        # Classe principal do plugin no lado do cliente
│   │   └── index.ts         # Entrada do lado do cliente
│   ├── locale/              # Recursos multilíngues (compartilhados entre frontend e backend)
│   ├── swagger/             # Documentação OpenAPI/Swagger
│   └── server/              # Código backend
│       ├── collections/     # Definições de coleções
│       ├── commands/        # Comandos personalizados
│       ├── migrations/      # Scripts de migração de banco de dados
│       ├── plugin.ts        # Classe principal do plugin no lado do servidor
│       └── index.ts         # Entrada do lado do servidor
├── index.ts                 # Exportação de ponte frontend e backend
├── client.d.ts              # Declarações de tipo frontend
├── client.js                # Artefato de build frontend
├── server.d.ts              # Declarações de tipo backend
├── server.js                # Artefato de build backend
├── .npmignore               # Configuração de ignorar na publicação
└── package.json
```

> Após a conclusão do build, o diretório `dist/` e os arquivos `client.js`, `server.js` serão carregados quando o plugin for habilitado.
> Durante a fase de desenvolvimento, você só precisa modificar o diretório `src/`. Antes de publicar, execute `yarn build <plugin>` ou `yarn build <plugin> --tar`.