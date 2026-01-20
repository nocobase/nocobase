:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Começando

## Configure Seu Primeiro Fluxo de Trabalho

Acesse a página de gerenciamento do **plugin** de **fluxo de trabalho** pelo menu de configuração de **plugins** na barra de menu superior:

![Workflow plugin management entry](https://static-docs.nocobase.com/20251027222721.png)

A interface de gerenciamento listará todos os **fluxos de trabalho** criados:

![Workflow Management](https://static-docs.nocobase.com/20251027222900.png)

Clique no botão "Novo" para criar um novo **fluxo de trabalho** e selecione o evento de **coleção**:

![Create Workflow](https://static-docs.nocobase.com/20251027222951.png)

Após enviar, clique no link "Configurar" na lista para acessar a interface de configuração do **fluxo de trabalho**:

![An empty workflow](https://static-docs.nocobase.com/20251027223131.png)

Em seguida, clique no cartão do gatilho para abrir o painel de configuração do gatilho. Selecione uma **coleção** criada anteriormente (por exemplo, a **coleção** "Artigos"), escolha "Após adicionar registro" para o momento do gatilho e clique no botão "Salvar" para concluir a configuração do gatilho:

![Configure Trigger](https://static-docs.nocobase.com/20251027224735.png)

Depois, você pode clicar no botão de adição no **fluxo de trabalho** para adicionar um nó. Por exemplo, selecione um nó de cálculo para concatenar os campos "Título" e "ID" dos dados do gatilho:

![Add Calculation Node](https://static-docs.nocobase.com/20251027224842.png)

Clique no cartão do nó para abrir o painel de configuração do nó. Use a função `CONCATENATE` fornecida pelo Formula.js para concatenar os campos "Título" e "ID". Os dois campos são inseridos através do seletor de variáveis:

![Calculation node using functions and variables](https://static-docs.nocobase.com/20251027224939.png)

Em seguida, crie um nó de atualização de registro para salvar o resultado no campo "Título":

![Create Update Record Node](https://static-docs.nocobase.com/20251027232654.png)

Da mesma forma, clique no cartão para abrir o painel de configuração do nó de atualização de registro. Selecione a **coleção** "Artigos", escolha o ID dos dados do gatilho para o ID do registro a ser atualizado, selecione "Título" para o campo a ser atualizado e escolha o resultado do nó de cálculo para o valor:

![Configure Update Record Node](https://static-docs.nocobase.com/20251027232802.png)

Por fim, clique no botão "Ativar"/"Desativar" na barra de ferramentas superior direita para mudar o **fluxo de trabalho** para o estado ativado, permitindo que ele seja acionado e executado.

## Acionando o Fluxo de Trabalho

Volte para a interface principal do sistema, crie um artigo através do bloco de artigos e preencha o título do artigo:

![Create post data](https://static-docs.nocobase.com/20251027233004.png)

Após enviar e atualizar o bloco, você verá que o título do artigo foi atualizado automaticamente para o formato "Título do Artigo + ID do Artigo":

![Post title modified by workflow](https://static-docs.nocobase.com/20251027233043.png)

:::info{title=Dica}
Como os **fluxos de trabalho** acionados por eventos de **coleção** são executados de forma assíncrona, você não verá a atualização dos dados imediatamente na interface após enviá-los. No entanto, após um curto período, você poderá ver o conteúdo atualizado ao recarregar a página ou o bloco.
:::

## Visualizando o Histórico de Execução

O **fluxo de trabalho** acabou de ser acionado e executado com sucesso uma vez. Você pode voltar à interface de gerenciamento de **fluxos de trabalho** para visualizar o histórico de execução correspondente:

![View workflow list](https://static-docs.nocobase.com/20251027233246.png)

Na lista de **fluxos de trabalho**, você pode ver que este **fluxo de trabalho** gerou um histórico de execução. Clique no link da coluna de contagem para abrir os registros do histórico de execução do **fluxo de trabalho** correspondente:

![Execution history list for the corresponding workflow](https://static-docs.nocobase.com/20251027233341.png)

Em seguida, clique no link "Ver" para acessar a página de detalhes dessa execução, onde você pode ver o status de execução e os dados de resultado de cada nó:

![Workflow execution history details](https://static-docs.nocobase.com/20251027233615.png)

Os dados de contexto do gatilho e os dados de resultado da execução do nó podem ser visualizados clicando no botão de status no canto superior direito do cartão correspondente. Por exemplo, vamos visualizar os dados de resultado do nó de cálculo:

![Calculation node result](https://static-docs.nocobase.com/20251027233635.png)

Você pode ver que os dados de resultado do nó de cálculo contêm o título calculado, que são os dados usados pelo nó de atualização de registro subsequente.

## Resumo

Através dos passos acima, você concluiu a configuração e o acionamento de um **fluxo de trabalho** simples e foi apresentado aos seguintes conceitos básicos:

- **Fluxo de trabalho**: Usado para definir as informações básicas de um **fluxo de trabalho**, incluindo nome, tipo de gatilho e status de ativação. Você pode configurar quantos nós quiser dentro dele. É a entidade que carrega o **fluxo de trabalho**.
- **Gatilho**: Cada **fluxo de trabalho** contém um gatilho, que pode ser configurado com condições específicas para que o **fluxo de trabalho** seja acionado. É o ponto de entrada do **fluxo de trabalho**.
- **Nó**: Um nó é uma unidade de instrução dentro de um **fluxo de trabalho** que executa uma ação específica. Múltiplos nós em um **fluxo de trabalho** formam um **fluxo de trabalho** de execução completo através de relações de upstream e downstream.
- **Execução**: Uma execução é o objeto de execução específico após um **fluxo de trabalho** ser acionado, também conhecido como registro de execução ou histórico de execução. Ela contém informações como o status da execução e os dados de contexto do gatilho. Há também resultados de execução correspondentes para cada nó, que incluem o status de execução do nó e as informações dos dados de resultado.

Para um uso mais aprofundado, você pode consultar o seguinte conteúdo:

- [Gatilhos](./triggers/index)
- [Nós](./nodes/index)
- [Usando Variáveis](./advanced/variables)
- [Execuções](./advanced/executions)
- [Gerenciamento de Versões](./advanced/revisions)
- [Opções Avançadas](./advanced/options)