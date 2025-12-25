---
pkg: "@nocobase/plugin-ai"
---

# Overview

![clipboard-image-1766653060](https://static-docs.nocobase.com/clipboard-image-1766653060.png)

AI Employees are a set of intelligent agents deeply integrated into the NocoBase business system.

Unlike ordinary Chatbots, AI Employees are the "anthropomorphic colleagues" of an enterprise. They are not only capable of natural language conversation but also possess the following core characteristics:

*   **Context Awareness**: Capable of understanding the current page, selected data rows, and system table structure definitions.
*   **Actionable**: Capable of executing actual business operations, such as querying databases, analyzing emails, filling out forms, configuring charts, writing JS modules, triggering workflows, etc.
*   **Persona**: Each AI Employee has a specific professional role (such as "Data Analyst", "Translation Assistant", "Frontend Engineer", etc.) and is equipped with corresponding skills.


## Core Concepts

Before using AI Employees, understanding the following core concepts will help you better configure and manage them:

*   **AI Employee**: An independent intelligent colleague. It consists of **Role Setting** (Persona), **Model (LLM)**, and **Tools** (Skills).
*   **LLM (Large Language Model)**: The "brain" of the AI Employee. Supports mainstream models like OpenAI (GPT-4), Anthropic (Claude 3), etc., determining the AI's understanding and reasoning capabilities.
*   **Tool**: Functional units provided to the AI for execution, equivalent to the AI's hands and feet. For example, `webSearch` (Web Search), `queryDatabase` (Query Database).
*   **Context**: The ability of the AI Employee to perceive its environment. Includes the current page structure, selected data rows, form field definitions, etc., without the need for manual copy-pasting by the user.
*   **Knowledge Base / RAG**: The "long-term memory" or "reference book" of the AI Employee. Through RAG (Retrieval-Augmented Generation) technology, you can upload internal enterprise documents such as PDFs and Word files, allowing the AI to prioritize these materials when answering questions.
*   **Vector Store**: Technical infrastructure used to support the Knowledge Base. It slices documents and converts them into vectors for semantic search.
*   **Chat**: A complete interaction process between the user and the AI Employee. The system saves chat history so the AI can understand the context.


## Entry Points

You can Summon them from the shortcut employee list in the bottom-right corner.

![20251102121159-2025-11-02-12-12-01](https://static-docs.nocobase.com/20251102121159-2025-11-02-12-12-01.png)


You can also Summon them casually next to Blocks, such as Table Blocks, Form Blocks, Chart Blocks, Code Blocks, etc.

![20251102121036-2025-11-02-12-10-38](https://static-docs.nocobase.com/20251102121036-2025-11-02-12-10-38.png)


They automatically retrieve data as Context. For example, **Viz** on a Table Block automatically retrieves data from the table and calls appropriate Tools to process it. This means you don't need to copy this data to a Chatbot.

<video controls class="rounded shadow"><source src="https://static-docs.nocobase.com/z-2025-11-02-12.13.35-2025-11-02-12-13-46.mp4" type="video/mp4"></video>

They can also automatically retrieve page structure as Context. For example, **Dex** on a Form Block automatically retrieves the field structure of the form and calls appropriate Tools to operate on the page. This means you don't need to copy data back from a Chatbot.

<video controls class="rounded shadow"><source src="https://static-docs.nocobase.com/z-2025-11-02-12.16.07-2025-11-02-12-16-21.mp4" type="video/mp4"></video>

You can also directly select Blocks on the page and send them to the AI Employee, who will extract the corresponding data and page structure from them.

<video controls class="rounded shadow"><source src="https://static-docs.nocobase.com/z-2025-11-02-12.17.25-2025-11-02-12-17-44.mp4" type="video/mp4"></video>


## Shortcuts（Tasks）

You can preset common Tasks for each AI Employee based on their current location, allowing you to start working with a single click—fast and convenient.

<video controls class="rounded shadow"><source src="https://static-docs.nocobase.com/z-2025-11-02-12.19.33-2025-11-02-12-19-49.mp4" type="video/mp4"></video>


## Installation

AI Employees is a built-in plugin of NocoBase, ready to use out of the box without separate installation.