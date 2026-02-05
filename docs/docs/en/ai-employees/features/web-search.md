# Web Search

Usually, the data timeliness of large language models is relatively poor and lacks the latest data. Therefore, online LLM Service platforms generally provide Web Search functions, allowing AI to use Tools to search for information before replying, and then reply based on the search results of the Tools.

AI Employees have adapted to the Web Search functions of various online LLM Service platforms. You can enable the Web Search function in the AI Employee Model configuration and in the Chat.

## Enable Web Search Function

Enter the AI Employee plugin configuration page, click the `AI employees` tab to enter the AI Employee management page.

![20251021225643](https://static-docs.nocobase.com/20251021225643.png)

Select the AI Employee for whom you want to enable the Web Search function, click the `Edit` button to enter the AI Employee editing page.

![20251022114043](https://static-docs.nocobase.com/20251022114043.png)

In the `Model settings` tab, turn on the `Web Search` switch, and click the `Submit` button to save the changes.

![20251022114300](https://static-docs.nocobase.com/20251022114300.png)

## Use Web Search Function in Chat

After the AI Employee enables the Web Search function, a "Web Search" icon will appear in the chat input box. Web Search is enabled by default, click to disable it.

![20251022115110](https://static-docs.nocobase.com/20251022115110.png)

After enabling Web Search, the AI Employee's reply will display the Web Search results.

![20251022115502](https://static-docs.nocobase.com/20251022115502.png)

## Differences in Web Search Tools on Various AI Platforms

Currently, the AI Employee Web Search function relies on the online LLM Service platform, and there will be differences in the user experience. The specific differences are as follows:

| Platform | Web Search | Tools | Real-time response to search terms | Return reference external link information |
| :--- | :--- | :--- | :--- | :--- |
| OpenAI | ✅ | ✅ | ✅ | ✅ |
| Gemini | ✅ | ❌ | ❌ | ✅ |
| Dashscope | ✅ | ✅ | ❌ | ❌ |
| DeepSeek | ❌ | ❌ | ❌ | ❌ |