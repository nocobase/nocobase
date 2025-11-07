# RAG Retrieval

## Introduction

After configuring the knowledge base, you can enable the RAG feature in the AI employee settings.

With RAG enabled, when a user chats with an AI employee, the AI employee will use RAG retrieval to fetch documents from the knowledge base based on the user's message and reply based on the retrieved documents.

## Enable RAG

Go to the AI employee plugin configuration page, click the `AI employees` tab to enter the AI employee management page.


![20251023010811](https://static-docs.nocobase.com/20251023010811.png)


Select the AI employee for which you want to enable RAG, click the `Edit` button to enter the AI employee editing page.

In the `Knowledge base` tab, turn on the `Enable` switch.

- In `Knowledge Base Prompt`, enter the prompt for referencing the knowledge base. `{knowledgeBaseData}` is a fixed placeholder and should not be modified.
- In `Knowledge Base`, select the configured knowledge base. See: [Knowledge Base](/ai-employees/knowledge-base/knowledge-base).
- In the `Top K` input box, enter the number of documents to retrieve, the default is 3.
- In the `Score` input box, enter the document relevance threshold for retrieval.

Click the `Submit` button to save the AI employee settings.


![20251023010844](https://static-docs.nocobase.com/20251023010844.png)