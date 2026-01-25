---
pkg: "@nocobase/plugin-comments"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Coleção de Comentários

## Introdução

A **coleção de comentários** é um modelo de **coleção** de dados projetado especificamente para armazenar comentários e feedback de usuários. Com o recurso de comentários, você pode adicionar funcionalidades de comentários a qualquer **coleção** de dados, permitindo que os usuários discutam, forneçam feedback ou façam anotações em registros específicos. A **coleção de comentários** suporta edição de rich text, oferecendo recursos flexíveis de criação de conteúdo.

![comment-collection-2025-11-01-00-39-01](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-39-01.png)

## Funcionalidades

- **Edição de Rich Text**: Inclui o editor Markdown (vditor) por padrão, suportando a criação de conteúdo rich text.
- **Vincular a Qualquer Coleção de Dados**: Você pode associar comentários a registros em qualquer **coleção** de dados através de campos de relacionamento.
- **Comentários Multinível**: Suporta respostas a comentários, construindo uma estrutura de árvore de comentários.
- **Rastreamento de Usuários**: Registra automaticamente o criador do comentário e a data/hora de criação.

## Guia de Uso

### Criando uma Coleção de Comentários

![comment-collection-2025-11-01-00-37-10](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-37-10.png)

1. Vá para a página de gerenciamento de **coleções** de dados.
2. Clique no botão "Criar **Coleção**".
3. Selecione o modelo "Coleção de Comentários".
4. Insira o nome da **coleção** (por exemplo: "Comentários de Tarefas", "Comentários de Artigos", etc.).
5. O sistema criará automaticamente uma **coleção de comentários** com os seguintes campos padrão:
   - Conteúdo do comentário (tipo Markdown vditor)
   - Criado por (vinculado à **coleção** de usuários)
   - Criado em (tipo data/hora)

### Configurando Relacionamentos

Para vincular comentários a uma **coleção** de dados de destino, você precisa configurar campos de relacionamento:

![](https://static-docs.nocobase.com/Solution/demoE3v1-19N.gif)

1. Adicione um campo de relacionamento "Muitos para Um" na **coleção de comentários**.
2. Selecione a **coleção** de dados de destino para vincular (por exemplo: **coleção** de tarefas, **coleção** de artigos, etc.).
3. Defina o nome do campo (por exemplo: "Pertence à Tarefa", "Pertence ao Artigo", etc.).

### Usando Blocos de Comentários em Páginas

![Enable Comments Collection](https://static-docs.nocobase.com/Solution/demoE3v1-20.gif)

1. Vá para a página onde você deseja adicionar a funcionalidade de comentários.
2. Adicione um bloco nos detalhes ou no pop-up do registro de destino.
3. Selecione o tipo de bloco "Comentários".
4. Escolha a **coleção de comentários** que você acabou de criar.

### Casos de Uso Típicos

- **Sistemas de Gerenciamento de Tarefas**: Membros da equipe discutem e fornecem feedback sobre tarefas.
- **Sistemas de Gerenciamento de Conteúdo**: Leitores comentam e interagem com artigos.
- **Fluxos de Trabalho de Aprovação**: Aprovadores fazem anotações e fornecem opiniões sobre formulários de solicitação.
- **Feedback de Clientes**: Colete avaliações de clientes sobre produtos ou serviços.

## Observações

- A **coleção de comentários** é um recurso de **plugin** comercial e requer que o **plugin** de comentários esteja habilitado para ser usado.
- É recomendado definir permissões apropriadas para a **coleção de comentários**, controlando quem pode visualizar, criar e excluir comentários.
- Para cenários com um grande volume de comentários, é recomendado habilitar a paginação para melhorar o desempenho.