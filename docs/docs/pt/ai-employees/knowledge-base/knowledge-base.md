:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Base de Conhecimento

## Introdução

A base de conhecimento é a base para a recuperação RAG. Ela organiza documentos por categoria e constrói um índice. Quando um funcionário de IA responde a uma pergunta, ele priorizará a busca de respostas na base de conhecimento.

## Gerenciamento da Base de Conhecimento

Acesse a página de configuração do **plugin** de funcionário de IA e clique na aba `Knowledge base` para entrar na página de gerenciamento da base de conhecimento.

![20251023095649](https://static-docs.nocobase.com/20251023095649.png)

Clique no botão `Add new` no canto superior direito para adicionar uma base de conhecimento `Local`.

![20251023095826](https://static-docs.nocobase.com/20251023095826.png)

Insira as informações necessárias para a nova base de conhecimento:

- No campo `Name`, insira o nome da base de conhecimento;
- Em `File storage`, selecione o local de armazenamento de arquivos;
- Em `Vector store`, selecione o armazenamento de vetor, consulte [Armazenamento de Vetor](/ai-employees/knowledge-base/vector-store);
- No campo `Description`, insira a descrição da base de conhecimento;

Clique no botão `Submit` para criar a base de conhecimento.

![20251023095909](https://static-docs.nocobase.com/20251023095909.png)

## Gerenciamento de Documentos da Base de Conhecimento

Após criar a base de conhecimento, na página de lista da base de conhecimento, clique na base de conhecimento recém-criada para entrar na página de gerenciamento de documentos da base de conhecimento.

![20251023100458](https://static-docs.nocobase.com/20251023100458.png)

![20251023100527](https://static-docs.nocobase.com/20251023100527.png)

Clique no botão `Upload` para carregar documentos. Após o upload dos documentos, a vetorização será iniciada automaticamente. Aguarde até que o `Status` mude de `Pending` para `Success`.

Atualmente, a base de conhecimento suporta os seguintes tipos de documento: txt, pdf, doc, docx, ppt, pptx; PDFs suportam apenas texto puro.

![20251023100901](https://static-docs.nocobase.com/20251023100901.png)

## Tipos de Base de Conhecimento

### Base de Conhecimento Local

Uma base de conhecimento Local é uma base de conhecimento armazenada localmente no NocoBase. Os documentos e seus dados vetoriais são todos armazenados localmente pelo NocoBase.

![20251023101620](https://static-docs.nocobase.com/20251023101620.png)

### Base de Conhecimento Somente Leitura

Uma base de conhecimento Somente Leitura é uma base de conhecimento onde os documentos e dados vetoriais são mantidos externamente. Apenas uma conexão com o banco de dados de vetor é criada no NocoBase (atualmente, apenas PGVector é suportado).

![20251023101743](https://static-docs.nocobase.com/20251023101743.png)

### Base de Conhecimento Externa

Uma base de conhecimento Externa é uma base de conhecimento onde os documentos e dados vetoriais são mantidos externamente. A recuperação do banco de dados de vetor precisa ser estendida por desenvolvedores, permitindo o uso de bancos de dados de vetor não suportados atualmente pelo NocoBase.

![20251023101949](https://static-docs.nocobase.com/20251023101949.png)