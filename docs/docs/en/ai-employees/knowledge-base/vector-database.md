# Vector Database

## Introduction

In a knowledge base, the vector database stores vectorized knowledge base documents. Vectorized documents act as an index for the documents.

When RAG retrieval is enabled in an AI Agent conversation, the user's message is vectorized, and fragments of knowledge base documents are retrieved from the vector database to match relevant document paragraphs and original text.

Currently, the AI Knowledge Base plugin only has built-in support for PGVector, which is a PostgreSQL database plugin.

## Vector Database Management

Go to the AI Agent plugin configuration page, click the `Vector store` tab, and select `Vector database` to enter the vector database management page.


![20251022233704](https://static-docs.nocobase.com/20251022233704.png)


Click the `Add new` button in the upper right corner to add a new `PGVector` vector database connection:

- In the `Name` input box, enter the connection name.
- In the `Host` input box, enter the vector database IP address.
- In the `Port` input box, enter the vector database port number.
- In the `Username` input box, enter the vector database username.
- In the `Password` input box, enter the vector database password.
- In the `Database` input box, enter the database name.
- In the `Table name` input box, enter the table name, which is used when creating a new table to store vector data.

After entering all the necessary information, click the `Test` button to test if the vector database service is available, and click the `Submit` button to save the connection information.


![20251022234644](https://static-docs.nocobase.com/20251022234644.png)