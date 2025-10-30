# Advanced

## Introduction

Generally, large language models have poor data timeliness and lack the latest data. Therefore, online LLM service platforms usually provide a web search feature, allowing the AI to search for information using tools before replying, and then respond based on the search results.

AI employees have been adapted for the web search feature of various online LLM service platforms. You can enable the web search feature in the AI employee model configuration and in conversations.

## Enable Web Search Feature

Go to the AI employee plugin configuration page, click the `AI employees` tab to enter the AI employee management page.


![20251021225643](https://static-docs.nocobase.com/20251021225643.png)


Select the AI employee for which you want to enable the web search feature, click the `Edit` button to enter the AI employee editing page.


![20251022114043](https://static-docs.nocobase.com/20251022114043.png)


In the `Model settings` tab, turn on the `Web Search` switch, and click the `Submit` button to save the changes.


![20251022114300](https://static-docs.nocobase.com/20251022114300.png)


## Using the Web Search Feature in Conversations

After an AI employee has the web search feature enabled, a "Web" icon will appear in the conversation input box. Web search is enabled by default, and you can click it to disable it.


![20251022115110](https://static-docs.nocobase.com/20251022115110.png)


With web search enabled, the AI employee's reply will display the web search results.


![20251022115502](https://static-docs.nocobase.com/20251022115502.png)


## Differences in Web Search Tools Across Platforms

Currently, the AI employee's web search feature relies on the online LLM service platform, so the user experience may vary. The specific differences are as follows:

| Platform  | Web Search | tools | Real-time response with search terms | Returns external links as references in the answer |
| --------- | ---------- | ----- | ------------------------------------ | -------------------------------------------------- |
| OpenAI    | ✅          | ✅     | ✅                                    | ✅                                                  |
| Gemini    | ✅          | ❌     | ❌                                    | ✅                                                  |
| Dashscope | ✅          | ✅     | ❌                                    | ❌                                                  |
| Deepseek  | ❌          | ❌     | ❌                                    | ❌                                                  |