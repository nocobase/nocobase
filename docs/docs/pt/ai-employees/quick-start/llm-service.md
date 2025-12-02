:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Início Rápido

## Introdução

Antes de usar o AI Employee, você precisa conectar um serviço LLM online. Atualmente, o NocoBase oferece suporte aos principais serviços LLM online, como OpenAI, Gemini, Claude, DepSeek, Qwen, etc.
Além dos serviços LLM online, o NocoBase também permite a conexão com modelos locais do Ollama.

## Configurar Serviço LLM

Acesse a página de configuração do `plugin` AI Employee, clique na aba `LLM service` para entrar na página de gerenciamento de serviços LLM.

![20251021213122](https://static-docs.nocobase.com/20251021213122.png)

Passe o mouse sobre o botão `Add New` no canto superior direito da lista de serviços LLM e selecione o serviço LLM que você deseja usar.

![20251021213358](https://static-docs.nocobase.com/20251021213358.png)

Tomando o OpenAI como exemplo, insira um `title` fácil de lembrar na janela pop-up, depois digite a `API key` obtida do OpenAI e clique em `Submit` para salvar. Isso conclui a configuração do serviço LLM.

O campo `Base URL` geralmente pode ser deixado em branco. Se você estiver usando um serviço LLM de terceiros que seja compatível com a API do OpenAI, preencha o `Base URL` correspondente.

![20251021214549](https://static-docs.nocobase.com/20251021214549.png)

## Teste de Disponibilidade

Na página de configuração do serviço LLM, clique no botão `Test flight`, insira o nome do modelo que você deseja usar e clique no botão `Run` para verificar se o serviço LLM e o modelo estão disponíveis.

![20251021214903](https://static-docs.nocobase.com/20251021214903.png)