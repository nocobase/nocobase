:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Armazenamento de Vetores

## Introdução

Em uma base de conhecimento, ao salvar documentos, eles são vetorizados. Da mesma forma, ao recuperar documentos, os termos de busca são vetorizados. Ambos os processos exigem um `Embedding model` para vetorizar o texto original.

No **plugin** de Base de Conhecimento de IA, um armazenamento de vetores é a vinculação de um `Embedding model` e um banco de dados de vetores.

## Gerenciamento de Armazenamento de Vetores

Acesse a página de configuração do **plugin** de Funcionários de IA, clique na aba `Vector store` e selecione `Vector store` para entrar na página de gerenciamento de armazenamento de vetores.

![20251023003023](https://static-docs.nocobase.com/20251023003023.png)

Clique no botão `Add new` no canto superior direito para adicionar um novo armazenamento de vetores:

- No campo `Name`, insira o nome do armazenamento de vetores;
- Em `Vector store`, selecione um banco de dados de vetores já configurado. Consulte: [Banco de Dados de Vetores](/ai-employees/knowledge-base/vector-database);
- Em `LLM service`, selecione um serviço LLM já configurado. Consulte: [Gerenciamento de Serviço LLM](/ai-employees/quick-start/llm-service);
- No campo `Embedding model`, insira o nome do modelo `Embedding` a ser usado;

Clique no botão `Submit` para salvar as informações do armazenamento de vetores.

![20251023003121](https://static-docs.nocobase.com/20251023003121.png)