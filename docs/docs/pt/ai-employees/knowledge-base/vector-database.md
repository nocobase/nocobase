:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Banco de Dados Vetorial

## Introdução

Em uma base de conhecimento, o banco de dados vetorial armazena documentos da base de conhecimento que foram vetorizados. Esses documentos vetorizados funcionam como um índice para os documentos originais.

Quando a recuperação RAG é ativada em uma conversa com um Agente de IA, a mensagem do usuário é vetorizada. Em seguida, fragmentos dos documentos da base de conhecimento são recuperados do banco de dados vetorial para encontrar parágrafos e textos originais relevantes.

Atualmente, o **plugin** de Base de Conhecimento de IA oferece suporte nativo apenas ao PGVector, que é um **plugin** de banco de dados PostgreSQL.

## Gerenciamento de Banco de Dados Vetorial

Acesse a página de configuração do **plugin** de Agente de IA, clique na aba `Vector store` e selecione `Vector database` para entrar na página de gerenciamento do banco de dados vetorial.

![20251022233704](https://static-docs.nocobase.com/20251022233704.png)

Clique no botão `Add new` no canto superior direito para adicionar uma nova conexão de banco de dados vetorial `PGVector`:

- No campo `Name`, insira o nome da conexão;
- No campo `Host`, insira o endereço IP do banco de dados vetorial;
- No campo `Port`, insira o número da porta do banco de dados vetorial;
- No campo `Username`, insira o nome de usuário do banco de dados vetorial;
- No campo `Password`, insira a senha do banco de dados vetorial;
- No campo `Database`, insira o nome do banco de dados;
- No campo `Table name`, insira o nome da tabela, que será usado ao criar uma nova tabela para armazenar dados vetoriais;

Após inserir todas as informações necessárias, clique no botão `Test` para verificar se o serviço do banco de dados vetorial está disponível e, em seguida, clique no botão `Submit` para salvar as informações da conexão.

![20251022234644](https://static-docs.nocobase.com/20251022234644.png)