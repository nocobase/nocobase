:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/ai-employees/quick-start).
:::

# Início Rápido

Vamos concluir uma configuração mínima utilizável de Funcionários de IA em 5 minutos.

## Instalar o plugin

Os Funcionários de IA são integrados ao NocoBase (`@nocobase/plugin-ai`), portanto, não é necessária uma instalação separada.

## Configurar modelos

Você pode configurar os serviços de LLM através de qualquer um destes acessos:

1. Acesso pelo painel: `Configurações do sistema -> Funcionários de IA -> Serviço de LLM`.
2. Atalho na interface: No painel de chat de IA, use o `Model Switcher` para escolher um modelo e clique no atalho "Adicionar serviço de LLM" para ser redirecionado.

![quick-start-model-switcher-add-llm-service.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/quick-start-model-switcher-add-llm-service.png)

Geralmente, você precisará confirmar:
1. Selecionar o Provedor (Provider).
2. Preencher a Chave de API (API Key).
3. Configurar os `Modelos Habilitados` (Enabled Models); basta usar o Recomendado (Recommend) por padrão.

## Habilitar funcionários integrados

Os Funcionários de IA integrados já vêm habilitados por padrão, então geralmente não é necessário ativá-los um por um.

Se você precisar ajustar a disponibilidade (habilitar/desabilitar um funcionário específico), altere a chave `Habilitado` (Enabled) na lista em `Configurações do sistema -> Funcionários de IA`.

![ai-employee-list-enable-switch.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-list-enable-switch.png)

## Começar a colaborar

Na página da aplicação, passe o mouse sobre o atalho no canto inferior direito e escolha um Funcionário de IA.
![ai-employees-entry-bottom-right.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employees-entry-bottom-right.png)

Clique para abrir a caixa de diálogo do chat de IA:

![chat-footer-employee-switcher-and-model-switcher.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/chat-footer-employee-switcher-and-model-switcher.png)

Você também pode:  
* Adicionar blocos
* Adicionar anexos
* Ativar busca na web
* Alternar Funcionários de IA
* Selecionar modelos

Eles também podem obter automaticamente a estrutura da página como contexto. Por exemplo, o Dex em um bloco de formulário pode ler a estrutura dos campos do formulário e chamar as habilidades adequadas para operar na página.

## Tarefas de atalho

Você pode predefinir tarefas comuns para cada Funcionário de IA na posição atual, permitindo iniciar o trabalho com apenas um clique, de forma rápida e conveniente.

<video controls class="rounded shadow"><source src="https://static-docs.nocobase.com/z-2025-11-02-12.19.33-2025-11-02-12-19-49.mp4" type="video/mp4"></video>

## Visão geral dos funcionários integrados

O NocoBase fornece diversos Funcionários de IA integrados para diferentes cenários.

Você só precisa:

1. Configurar os serviços de LLM.
2. Ajustar o status de ativação dos funcionários conforme necessário (habilitados por padrão).
3. Selecionar o modelo no chat e começar a colaborar.

| Nome do Funcionário | Posicionamento da Função | Principais Capacidades |
| :--- | :--- | :--- |
| **Cole** | Assistente NocoBase | Perguntas e respostas sobre o produto, recuperação de documentos |
| **Ellis** | Especialista em E-mail | Redação de e-mails, geração de resumos, sugestões de resposta |
| **Dex** | Especialista em Organização de Dados | Tradução de campos, formatação, extração de informações |
| **Viz** | Analista de Insights | Insights de dados, análise de tendências, interpretação de indicadores-chave |
| **Lexi** | Assistente de Tradução | Tradução multilíngue, auxílio na comunicação |
| **Vera** | Analista de Pesquisa | Busca na web, agregação de informações, pesquisa aprofundada |
| **Dara** | Especialista em Visualização de Dados | Configuração de gráficos, geração de relatórios visuais |
| **Orin** | Especialista em Modelagem de Dados | Auxílio no design da estrutura de coleções, sugestões de campos |
| **Nathan** | Engenheiro Frontend | Auxílio na escrita de trechos de código frontend, ajustes de estilo |

**Observações**

Alguns Funcionários de IA integrados não aparecem na lista do canto inferior direito porque possuem cenários de uso exclusivos:

- Orin: páginas de modelagem de dados.
- Dara: blocos de configuração de gráficos.
- Nathan: JS Block e editores de código similares.