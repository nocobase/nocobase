# Capítulo 1: Conhecendo o NocoBase — Em 5 minutos no ar

Nesta série, vamos partir do zero, usando o NocoBase para construir um **sistema mínimo de tickets (HelpDesk)**. O sistema inteiro precisa de apenas **2 [tabelas de dados](/data-sources/data-modeling/collection)**, sem escrever uma única linha de código, e implementa envio de tickets, gerenciamento de categorias, rastreamento de mudanças, controle de permissões e [dashboard](/data-visualization) de dados.

Neste capítulo vamos começar fazendo deploy do NocoBase com um único comando via [Docker](/get-started/installation/docker), completar o primeiro login, entender a diferença entre [modo de configuração e modo de uso](/get-started/how-nocobase-works) e ter uma prévia geral do sistema de tickets.


## 1.1 O Que é o NocoBase

Você já passou por uma situação assim?

- A equipe precisa de um sistema interno para gerenciar processos de negócio, mas os softwares disponíveis no mercado nunca atendem 100%
- Contratar uma equipe de desenvolvimento para customizar é caro, lento, e os requisitos mudam o tempo todo
- Improvisar com Excel: os dados ficam cada vez mais bagunçados, e a colaboração se torna cada vez mais difícil

**O NocoBase nasceu justamente para resolver esse problema.** É uma **plataforma de desenvolvimento no-code com IA**, open source e altamente extensível. Você pode construir seu próprio sistema de negócio através de configuração e arrastar-e-soltar, sem precisar escrever código.

Comparado a outras ferramentas no-code, o NocoBase tem alguns conceitos centrais:

- **Orientado a modelo de dados**: primeiro defina [fontes de dados](/data-sources) e estruturas de dados, depois use [blocos](/interface-builder/blocks) para exibir os dados, e por fim use [ações](/interface-builder/actions) para processá-los — interface e dados totalmente desacoplados
- **WYSIWYG (o que você vê é o que você obtém)**: a página é a tela, clique onde quer alterar, intuitivo como montar uma página no Notion
- **Tudo é Plugin**: todas as funcionalidades são [Plugins](/development/plugin), parecido com WordPress, instale conforme necessidade e estenda livremente
- **IA integrada ao negócio**: [Funcionários de IA](/ai-employees/quick-start) embutidos podem executar tarefas como análise, tradução e entrada de dados, integrados ao seu fluxo de trabalho de verdade
- **Open source + Deploy privado**: o código central é totalmente open source, e os dados ficam totalmente no seu servidor


## 1.2 Instalando o NocoBase

O NocoBase suporta vários métodos de instalação. Vamos escolher o mais simples: **[instalação via Docker](/get-started/installation/docker)**.

### Pré-requisitos

Seu computador precisa ter [Docker](https://docs.docker.com/get-docker/) e Docker Compose instalados, e o serviço Docker precisa estar rodando. Windows / Mac / Linux são todos suportados.

### Passo 1: Baixar o arquivo de configuração

Abra o terminal (no Windows use o PowerShell, no Mac use o Terminal) e execute:

```bash
# Cria e entra no diretório do projeto
mkdir my-project && cd my-project

# Baixa o docker-compose.yml (usa PostgreSQL por padrão)
curl -fsSL https://static-docs.nocobase.com/docker-compose/cn/latest-postgres.yml -o docker-compose.yml
```

> **Outro banco de dados?** Substitua `postgres` no link acima por `mysql` ou `mariadb`.
> Você também pode escolher versões diferentes: `latest` (estável), `beta` (teste), `alpha` (desenvolvimento). Veja mais na [documentação oficial de instalação](https://docs.nocobase.com/get-started/installation/docker).
>
> | Banco de dados | Link de download |
> |--------|---------|
> | PostgreSQL (recomendado) | `https://static-docs.nocobase.com/docker-compose/cn/latest-postgres.yml` |
> | MySQL | `https://static-docs.nocobase.com/docker-compose/cn/latest-mysql.yml` |
> | MariaDB | `https://static-docs.nocobase.com/docker-compose/cn/latest-mariadb.yml` |

### Passo 2: Iniciar

```bash
# Baixar imagens
docker compose pull

# Iniciar em segundo plano (a primeira vez executa a instalação automaticamente)
docker compose up -d

# Ver os logs e confirmar que iniciou com sucesso
docker compose logs -f app
```

Quando você ver a seguinte linha na saída, significa que iniciou com sucesso:

```
🚀 NocoBase server running at: http://localhost:13000/
```

![01-getting-started-2026-03-11-07-49-19](https://static-docs.nocobase.com/01-getting-started-2026-03-11-07-49-19.png)

### Passo 3: Login

Abra o navegador e acesse `http://localhost:13000`, faça login com a conta padrão:

- **Usuário**: `admin@nocobase.com`
- **Senha**: `admin123`

> Após o primeiro login, lembre-se de alterar a senha padrão.


## 1.3 Conhecendo a Interface

Após o login, você verá uma interface inicial limpa. Sem pressa, vamos entender dois conceitos fundamentais primeiro.

### Modo de Configuração vs Modo de Uso

A interface do NocoBase tem dois modos:

| Modo | Descrição | Quem usa |
|------|------|------|
| **Modo de Uso** | Interface de uso diário para usuários comuns | Todos |
| **Modo de Configuração** | Modo de design para construir e ajustar a interface | Administradores |

Para alternar: clique no botão **«[UI Editor](/get-started/how-nocobase-works)»** no canto superior direito (ícone de marca-texto).

![01-getting-started-2026-03-11-08-17-26](https://static-docs.nocobase.com/01-getting-started-2026-03-11-08-17-26.png)

Após ativar o modo de configuração, você notará que muitos elementos da página ficam destacados com **bordas laranja** — isso significa que eles são configuráveis. Cada elemento configurável tem um pequeno ícone no canto superior direito; clique nele para configurar.

Vamos ver um sistema demo para visualizar o efeito:

![01-getting-started-2026-03-11-08-19-24](https://static-docs.nocobase.com/01-getting-started-2026-03-11-08-19-24.png)

Como na imagem acima: o menu, a barra de operações da tabela e a parte inferior da página todos exibem os indicadores laranja. Clique para acessar as próximas opções de criação.

> **Lembre-se desta regra**: no NocoBase, para alterar a tela, entre no modo de configuração, encontre o pequeno ícone no canto superior direito do elemento e clique nele.

### Estrutura Básica da Interface

A interface do NocoBase é composta por três áreas:

```
┌──────────────────────────────────────────┐
│         Barra de navegação superior      │
├──────────┬───────────────────────────────┤
│          │                               │
│  Menu    │       Área de conteúdo        │
│ esquerdo │   (com diversos blocos)       │
│ (group)  │                               │
│          │                               │
└──────────┴───────────────────────────────┘
```

- **Barra de navegação superior**: contém o menu de primeiro nível, alterna entre módulos
- **Menu lateral esquerdo (group)**: se for um menu de grupo, contém esse menu de segundo nível, organizando a hierarquia das páginas
- **Área de conteúdo**: o corpo da página, onde ficam os vários **blocos (Block)** que exibem e operam dados

![01-getting-started-2026-03-11-08-24-34](https://static-docs.nocobase.com/01-getting-started-2026-03-11-08-24-34.png)

Por enquanto está tudo vazio — sem problemas. A partir do próximo capítulo, vamos preencher tudo.


## 1.4 O Que Vamos Construir

Nos próximos capítulos, vamos passo a passo construir um **sistema de tickets de TI** capaz de:

- ✅ Submeter tickets: o [usuário](/users-permissions/user) preenche título, descrição, escolhe categoria e prioridade
- ✅ Lista de tickets: filtragem por status e categoria, tudo de relance
- ✅ Controle de [permissões](/users-permissions/acl/role): usuários comuns só veem seus próprios tickets, administradores veem todos
- ✅ Painel de dados: estatísticas em tempo real da distribuição e tendências
- ✅ Log de operações de dados (embutido)

O sistema inteiro precisa de apenas **2 tabelas de dados**:

| Tabela | Função | Campos personalizados |
|--------|------|--------|
| Categoria de Ticket | Categorias dos tickets (ex: problemas de rede, falhas de software) | 2 |
| Tickets | Tabela principal, registra cada ticket | 7-8 |

Você não leu errado, são apenas 2 tabelas. Recursos genéricos como usuários, permissões, gerenciamento de arquivos, e até departamentos, e-mails e logs de operação, o NocoBase já oferece com plugins prontos, sem precisar reinventar a roda. Só precisamos focar nos dados de negócio.


## Resumo

Neste capítulo concluímos:

1. Entendemos o que é o NocoBase — uma plataforma open source no-code
2. Instalamos e iniciamos o NocoBase com um único comando via Docker
3. Conhecemos os dois modos da interface (configuração/uso) e o layout básico
4. Vimos uma prévia do plano do sistema de tickets que vamos construir

**No próximo capítulo**, vamos colocar a mão na massa — entrar no gerenciamento de fontes de dados e criar nossa primeira tabela. Esse é o esqueleto de todo o sistema, e também o recurso mais central do NocoBase.

Até o próximo capítulo!

## Recursos Relacionados

- [Detalhes da Instalação Docker](/get-started/installation/docker) — opções completas de instalação e variáveis de ambiente
- [Requisitos do Sistema](/get-started/system-requirements) — requisitos de hardware e software
- [Como o NocoBase Funciona](/get-started/how-nocobase-works) — conceitos centrais como fontes de dados, blocos e ações
