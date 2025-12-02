:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Eventos de Coleção

## Introdução

Os gatilhos do tipo evento de **coleção** monitoram os eventos de criação, atualização e exclusão em uma **coleção**. Quando uma operação de dados ocorre nessa **coleção** e atende às condições configuradas, ela aciona o **fluxo de trabalho** correspondente. Por exemplo, cenários como deduzir o estoque de um produto após a criação de um novo pedido, ou aguardar a revisão manual após a adição de um novo comentário.

## Uso Básico

Existem algumas situações de alteração em uma **coleção**:

1. Após criar dados.
2. Após atualizar dados.
3. Após criar ou atualizar dados.
4. Após excluir dados.

![Evento de Coleção_Seleção do Momento do Gatilho](https://static-docs.nocobase.com/81275602742deb71e0c830eb97aa612c.png)

Você pode escolher o momento do gatilho de acordo com as diferentes necessidades do seu negócio. Quando a situação de alteração selecionada inclui a atualização da **coleção**, você também pode especificar os campos que foram alterados. A condição de gatilho é atendida somente quando os campos selecionados mudam. Se nenhum campo for selecionado, significa que uma alteração em qualquer campo pode acionar o **fluxo de trabalho**.

![Evento de Coleção_Selecionar Campos Alterados](https://static-docs.nocobase.com/874a1475f01298b3c00267b2b4674611.png)

De forma mais detalhada, você pode configurar regras de condição para cada campo da linha de dados que aciona o gatilho. O gatilho só será disparado quando os campos atenderem às condições correspondentes.

![Evento de Coleção_Configurar Condições de Dados](https://static-docs.nocobase.com/264ae3835dcd75cee0eef7812c11fe0c.png)

Após um evento de **coleção** ser acionado, a linha de dados que gerou o evento será injetada no plano de execução como dados de contexto do gatilho, para ser usada como variáveis pelos nós subsequentes no **fluxo de trabalho**. No entanto, quando os nós subsequentes precisarem usar os campos de relacionamento desses dados, você precisará configurar primeiro o pré-carregamento dos dados de relacionamento. Os dados de relacionamento selecionados serão injetados no contexto junto com o gatilho e poderão ser selecionados e usados hierarquicamente.

## Dicas Relacionadas

### Gatilhos por Operações de Dados em Massa Não São Suportados Atualmente

Os eventos de **coleção** atualmente não suportam gatilhos por operações de dados em massa. Por exemplo, ao criar um artigo e adicionar simultaneamente várias tags para esse artigo (dados de relacionamento um-para-muitos), apenas o **fluxo de trabalho** para a criação do artigo será acionado. As várias tags criadas simultaneamente não acionarão o **fluxo de trabalho** para a criação de tags. Ao associar ou adicionar dados de relacionamento muitos-para-muitos, o **fluxo de trabalho** para a **coleção** intermediária também não será acionado.

### Operações de Dados Fora do Aplicativo Não Acionarão Eventos

Operações em **coleções** via chamadas de API HTTP para a interface do aplicativo também podem acionar eventos correspondentes. No entanto, se as alterações de dados forem feitas diretamente por meio de operações de banco de dados, em vez de pelo aplicativo NocoBase, os eventos correspondentes não poderão ser acionados. Por exemplo, gatilhos nativos do banco de dados não serão associados a **fluxos de trabalho** no aplicativo.

Além disso, usar o nó de ação SQL para operar no banco de dados é equivalente a operações diretas no banco de dados e não acionará eventos de **coleção**.

### Fontes de Dados Externas

Os **fluxos de trabalho** suportam **fontes de dados** externas desde a versão `0.20`. Se você estiver usando um **plugin** de **fonte de dados** externa e o evento de **coleção** estiver configurado para uma **fonte de dados** externa, desde que as operações de dados nessa **fonte de dados** sejam realizadas dentro do aplicativo (como criação de usuário, atualizações e operações de dados de **fluxo de trabalho**), os eventos de **coleção** correspondentes podem ser acionados. No entanto, se as alterações de dados forem feitas por meio de outros sistemas ou diretamente no banco de dados externo, os eventos de **coleção** não poderão ser acionados.

## Exemplo

Vamos usar como exemplo o cenário de calcular o preço total e deduzir o estoque após a criação de um novo pedido.

Primeiro, criamos uma **coleção** de Produtos e uma **coleção** de Pedidos, com os seguintes modelos de dados:

| Nome do Campo | Tipo de Campo        |
| ------------- | -------------------- |
| Nome do Produto | Texto de Linha Única |
| Preço         | Número               |
| Estoque       | Inteiro              |

| Nome do Campo | Tipo de Campo            |
| ------------- | ------------------------ |
| ID do Pedido  | Sequencial               |
| Produto do Pedido | Muitos-para-Um (Produtos) |
| Total do Pedido | Número                   |

E adicionamos alguns dados básicos de produtos:

| Nome do Produto | Preço | Estoque |
| --------------- | ----- | ------- |
| iPhone 14 Pro   | 7999  | 10      |
| iPhone 13 Pro   | 5999  | 0       |

Em seguida, criamos um **fluxo de trabalho** baseado no evento da **coleção** de Pedidos:

![Evento de Coleção_Exemplo_Gatilho de Novo Pedido](https://static-docs.nocobase.com/094392a870dddc65aeb20357f62ddc08.png)

Aqui estão algumas das opções de configuração:

- **Coleção**: Selecione a **coleção** "Pedidos".
- Momento do gatilho: Selecione "Após criar dados".
- Condições do gatilho: Deixe em branco.
- Pré-carregar dados de relacionamento: Marque "Produtos".

Depois, configuramos outros nós de acordo com a lógica do **fluxo de trabalho**: verificar se o estoque do produto é maior que 0. Se for, deduzir o estoque; caso contrário, o pedido é inválido e deve ser excluído:

![Evento de Coleção_Exemplo_Orquestração do Fluxo de Trabalho de Novo Pedido](https://static-docs.nocobase.com/7713ea1aaa0f52a0dc3c92aba5e58f05.png)

A configuração dos nós será explicada em detalhes na documentação para tipos de nós específicos.

Ative este **fluxo de trabalho** e teste-o criando um novo pedido pela interface. Após fazer um pedido para "iPhone 14 Pro", o estoque do produto correspondente será reduzido para 9. Se um pedido for feito para "iPhone 13 Pro", o pedido será excluído devido a estoque insuficiente.

![Evento de Coleção_Exemplo_Resultado da Execução do Novo Pedido](https://static-docs.nocobase.com/24cbe51e24ba4804b3bd48d99415c54f.png)