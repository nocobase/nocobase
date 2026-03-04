:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/ai-employees/features/llm-service).
:::

# Configurar serviço de LLM

Antes de usar os Funcionários de IA (AI Employees), você precisa configurar os serviços de LLM disponíveis.

Atualmente, são suportados OpenAI, Gemini, Claude, DeepSeek, Qwen, Kimi e modelos locais do Ollama.

## Criar serviço

Acesse `Configurações do sistema -> AI Employees -> LLM service`.

1. Clique em `Add New` para abrir a janela de criação.
2. Selecione o `Provider` (Provedor).
3. Preencha o `Title` (Título), `API Key` e `Base URL` (opcional).
4. Configure os `Enabled Models` (Modelos habilitados):
   - `Recommended models`: usa os modelos recomendados oficialmente.
   - `Select models`: seleciona a partir da lista retornada pelo provedor.
   - `Manual input`: insira manualmente o ID do modelo e o nome de exibição.
5. Clique em `Submit` para salvar.

![llm-service-create-provider-enabled-models.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-create-provider-enabled-models.png)

## Habilitação e ordenação de serviços

Na lista de serviços de LLM, você pode:

- Usar a chave `Enabled` para ativar ou desativar o serviço.
- Arrastar para reordenar os serviços (isso afeta a ordem de exibição dos modelos).

![llm-service-list-enabled-and-sort.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

## Teste de disponibilidade

Use o botão `Test flight` na parte inferior da janela de configuração para verificar a disponibilidade do serviço e do modelo.

Recomenda-se realizar o teste antes de colocar o serviço em uso na produção.