# Vector Store

## Introduction

In a knowledge base, when saving documents, the documents are vectorized. When retrieving documents, the search terms are vectorized. Both processes require an `Embedding model` to vectorize the original text.

In the AI Knowledge Base plugin, a vector store is the binding of an `Embedding model` and a vector database.

## Vector Store Management

Go to the AI Employees plugin configuration page, click the `Vector store` tab, and select `Vector store` to enter the vector store management page.


![20251023003023](https://static-docs.nocobase.com/20251023003023.png)


Click the `Add new` button in the top right corner to add a new vector store:

- In the `Name` input box, enter the vector store name;
- In `Vector store`, select an already configured vector database. Refer to: [Vector Database](/ai-employees/knowledge-base/vector-database);
- In `LLM service`, select an already configured LLM service. Refer to: [LLM Service Management](/ai-employees/features/llm-service);
- In the `Embedding model` input box, enter the name of the `Embedding` model to be used;
  
Click the `Submit` button to save the vector store information.


![20251023003121](https://static-docs.nocobase.com/20251023003121.png)