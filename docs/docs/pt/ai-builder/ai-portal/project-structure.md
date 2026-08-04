---
title: "Estrutura do projeto e stack técnica"
description: "A stack técnica, as convenções de diretórios, as variáveis de ambiente e os comandos mais usados do template do AI Portal, para você saber se a IA colocou o código no lugar certo."
keywords: "AI Portal,estrutura do projeto,stack técnica,React,Vite,Refine,Tailwind CSS,shadcn/ui,variáveis de ambiente"
---

# Estrutura do projeto e stack técnica

:::tip Pré-requisitos

Antes de ler esta página, certifique-se de que você já colocou o seu primeiro Portal no ar seguindo o [Início rápido do AI Portal](./index.md).

:::

A maior parte do desenvolvimento diário pode ficar por conta da IA. Ainda assim, conhecer a estrutura do template permite saber se a IA colocou o código no lugar certo e facilita localizar problemas.

## Stack técnica

O template de Portal é baseado em `@nocobase/portal-template-default`, com código-fonte em [nocobase/portal-template-default](https://github.com/nocobase/portal-template-default).

| Tecnologia | Finalidade |
| --- | --- |
| React 19 + TypeScript | Framework de frontend |
| Vite | Servidor de desenvolvimento e ferramenta de build |
| [Refine](https://refine.dev/docs/) | Framework da camada de dados, cuidando de recursos, rotas, formulários e permissões |
| Tailwind CSS 4 | Estilos |
| [shadcn/ui](https://ui.shadcn.com/) | Base de componentes, com o código-fonte pertencendo ao projeto |
| lucide | Biblioteca de ícones |
| pnpm | Gerenciador de pacotes |

Essa combinação é a stack de frontend que a IA melhor conhece hoje, o que torna mais preciso o que ela escreve.

O Portal é por enquanto um projeto puramente de frontend, com a lógica de negócio resolvida pela API do NocoBase, pelos componentes padrão e assim por diante. O suporte para o AI Agent também escrever o backend do Portal está a caminho.

## Estrutura de diretórios

```text
src/
├── app/            Rotas e carregamento de extensões
├── pages/          Login, cadastro, esqueci a senha e afins
├── components/     Componentes
│   ├── ui/         Base de componentes shadcn/ui
│   ├── app-shell/  Layout, navegação, estados de carregamento
│   ├── auth/       Componentes de autenticação
│   └── ...
├── extensions/     Extensões, ativas assim que instaladas
├── lib/            Wrapper do cliente NocoBase e lógica de ACL
├── providers/      Providers do Refine
├── hooks/          Hooks customizados
└── locales/        Textos localizados
```

Alguns pontos importantes:

- **`src/app/routes.tsx`** — Estrutura de rotas. As rotas autenticadas e não autenticadas ficam separadas, e as rotas fornecidas por extensões são montadas automaticamente
- **`src/app/extensions.tsx`** — Carregamento de extensões, usando `import.meta.glob` para varrer `src/extensions/*/extension.tsx`
- **`src/providers/data.ts`** — O data provider do Refine, que traduz a sintaxe de consulta do Refine em parâmetros da API do NocoBase
- **`src/lib/nocobase/client.ts`** — `NocoBaseClient`, o wrapper de baixo nível por trás de toda requisição
- **`src/components/ui/`** — Mais de 60 componentes shadcn/ui, prontos para uso

As páginas de negócio normalmente ficam em `src/extensions/`, um diretório por módulo funcional. Veja [Componentes padrão e extensões](./components.md).

## Arquivos importantes

| Arquivo | Finalidade |
| --- | --- |
| `AGENTS.md` | Convenções de desenvolvimento para o AI Agent. Você pode adicionar aqui as regras do seu projeto |
| `components.json` | Configuração do shadcn/ui, incluindo estilo, biblioteca de ícones e aliases de caminho |
| `.env` / `.env.local` | Variáveis de ambiente, atualizadas automaticamente por `nb portal dev` e `deploy` |
| `vite.config.ts` | Configuração de build, incluindo o proxy da API usado durante o desenvolvimento |

## Variáveis de ambiente

| Variável | Descrição |
| --- | --- |
| `NOCOBASE_API_URL` | Raiz da REST API do NocoBase, **precisa terminar com `/api`**. Normalmente `/api` em deploys de mesma origem |
| `NOCOBASE_PORTAL_BASE` | Caminho público em que o Portal está montado. `/` no desenvolvimento local, o caminho real de deploy como `/x/main/` nos builds |
| `NOCOBASE_AUTHENTICATOR` | Nome do autenticador, `basic` por padrão |
| `NOCOBASE_API_TOKEN` | Token temporário para desenvolvimento. Não faça commit de um valor real |
| `API_CLIENT_STORAGE_PREFIX` | Prefixo de armazenamento do token. Mantenha alinhado se o servidor tiver customizado |
| `API_CLIENT_STORAGE_TYPE` | Forma de armazenamento do token, `localStorage` por padrão |
| `API_CLIENT_SHARE_TOKEN` | Se o token é compartilhado, `false` por padrão |

O `nb portal dev` e o `nb portal deploy` escrevem essas variáveis para você, então normalmente não é preciso mexer nelas. As três últimas só precisam ser alinhadas quando o servidor customizou a forma de armazenar os tokens de autenticação.

Durante o desenvolvimento, se `NOCOBASE_API_URL` for um endereço absoluto, o Vite monta um proxy para encaminhar as requisições, então você não precisa lidar com CORS.

## Comandos mais usados

São estes os comandos do dia a dia. Instalação de dependências, atualização das variáveis de ambiente e builds ficam todos por conta da CLI nos bastidores:

| Comando | Finalidade |
| --- | --- |
| `nb portal list` | Ver quais Portals a aplicação atual tem |
| `nb portal info <portal>` | Consultar o caminho de desenvolvimento, o caminho de deploy e a URL de acesso de um Portal |
| `nb portal create <portal>` | Criar o workspace de desenvolvimento de um Portal novo a partir do template |
| `nb portal pull <portal>` | Baixar o código-fonte remoto do Portal para o workspace de desenvolvimento local |
| `nb portal dev <portal>` | Iniciar o servidor de desenvolvimento local e ver as alterações ao vivo |
| `nb portal push <portal>` | Enviar as alterações locais do código-fonte para o remoto |
| `nb portal deploy <portal>` | Compilar e fazer o deploy, tornando as alterações visíveis para os usuários |
| `nb portal config <portal>` | Ajustar o source storage, as configurações de Git e o caminho do workspace de desenvolvimento |
| `nb portal destroy <portal>` | Excluir o registro do Portal e os arquivos implantados |

Para os parâmetros completos de cada comando, veja a [Referência do comando `nb portal`](../../api/cli/portal/index.md).

## Onde fica o workspace de desenvolvimento

O workspace de desenvolvimento de um Portal vai para o diretório em que você estava quando executou `nb portal create` ou `nb portal pull`:

```text
./<portal>
```

Você pode apontar para outro lugar com `--path` na criação ou no pull. Os artefatos de deploy compilados vão para outro lugar — sob o storage da aplicação de destino, mantidos em sincronia pelo `nb portal deploy`, e não são algo com que você lide normalmente.

Se você não tem certeza de onde fica o workspace de desenvolvimento de um Portal, basta consultar:

```bash
nb portal info main
```

## Links relacionados

- [Início rápido do AI Portal](./index.md) — Coloque no ar a sua primeira entrada de frontend escrita pela IA
- [Componentes padrão e extensões](./components.md) — A base de componentes shadcn/ui e o mecanismo de extensão
- [Deploy e gerenciamento de código-fonte](./deploy.md) — O fluxo de build e deploy, e o source storage
- [Construção com AI Agent](./agent-workflow.md) — Conduza a IA em linguagem natural para escrever páginas
- [`nb portal info`](../../api/cli/portal/info.md) — Veja onde fica o workspace de desenvolvimento de um Portal
