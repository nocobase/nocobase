:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Regras de Vinculação

## Introdução

No NocoBase, as Regras de Vinculação são um mecanismo para controlar o comportamento interativo dos elementos da interface de usuário (front-end). Elas permitem que você ajuste a exibição e a lógica de comportamento de blocos, campos e ações na interface com base em diferentes condições, proporcionando uma experiência interativa flexível e de baixo código. Este recurso está em constante iteração e otimização.

Ao configurar as regras de vinculação, você pode, por exemplo:

- Ocultar/exibir certos blocos com base na função do usuário atual. Diferentes funções podem ver blocos com escopos de dados distintos; por exemplo, administradores veem blocos com informações completas, enquanto usuários comuns só veem blocos de informações básicas.
- Preencher ou redefinir automaticamente outros valores de campo quando uma opção é selecionada em um formulário.
- Desabilitar certos campos de entrada quando uma opção é selecionada em um formulário.
- Definir certos campos de entrada como obrigatórios quando uma opção é selecionada em um formulário.
- Controlar se os botões de ação estão visíveis ou clicáveis sob certas condições.

## Configuração de Condições

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)

### Variável do Lado Esquerdo

A variável do lado esquerdo em uma condição é usada para definir o "objeto de avaliação" na regra de vinculação. A condição é avaliada com base no valor dessa variável para determinar se a ação de vinculação deve ser acionada.

As variáveis selecionáveis incluem:

- Campos no contexto, como `「Formulário Atual/xxx」`, `「Registro Atual/xxx」`, `「Registro de Pop-up Atual/xxx」`, etc.;
- Variáveis globais do sistema, como `Usuário Atual`, `Função Atual`, etc., adequadas para controle dinâmico com base na identidade do usuário, permissões e outras informações.
  > ✅ As opções disponíveis para a variável do lado esquerdo são determinadas pelo contexto do bloco. Utilize a variável do lado esquerdo de forma adequada às suas necessidades de negócio:
  >
  > - `「Usuário Atual」` representa as informações do usuário atualmente logado.
  > - `「Formulário Atual」` representa os valores de entrada em tempo real no formulário.
  > - `「Registro Atual」` representa o valor do registro salvo, como um registro de linha em uma tabela.

### Operador

O operador é usado para definir a lógica da avaliação da condição, ou seja, como comparar a variável do lado esquerdo com o valor do lado direito. Diferentes tipos de variáveis do lado esquerdo suportam diferentes operadores. Os tipos comuns de operadores são os seguintes:

- **Tipo Texto**: `$includes`, `$eq`, `$ne`, `$empty`, `$notEmpty`, etc.
- **Tipo Numérico**: `$eq`, `$gt`, `$lt`, `$gte`, `$lte`, etc.
- **Tipo Booleano**: `$isTruly`, `$isFalsy`
- **Tipo Array**: `$match`, `$anyOf`, `$empty`, `$notEmpty`, etc.

> ✅ O sistema recomendará automaticamente uma lista de operadores disponíveis com base no tipo da variável do lado esquerdo para garantir que a lógica de configuração seja razoável.

### Valor do Lado Direito

Usado para comparação com a variável do lado esquerdo, é o valor de referência para determinar se a condição é atendida.

O conteúdo suportado inclui:

- Valores constantes: Insira números fixos, texto, datas, etc.;
- Variáveis de contexto: como outros campos no formulário atual, o registro atual, etc.;
- Variáveis do sistema: como o usuário atual, hora atual, função atual, etc.

> ✅ O sistema adaptará automaticamente o método de entrada para o valor do lado direito com base no tipo da variável do lado esquerdo, por exemplo:
>
> - Quando o lado esquerdo for um "campo de seleção", o seletor de opção correspondente será exibido.
> - Quando o lado esquerdo for um "campo de data", um seletor de data será exibido.
> - Quando o lado esquerdo for um "campo de texto", uma caixa de entrada de texto será exibida.

> 💡 O uso flexível dos valores do lado direito (especialmente variáveis dinâmicas) permite que você construa lógicas de vinculação baseadas no usuário atual, no estado atual dos dados e no ambiente de contexto, alcançando assim uma experiência interativa mais poderosa.

## Lógica de Execução das Regras

### Acionamento da Condição

Quando a condição em uma regra é atendida (opcional), a ação de modificação de propriedade abaixo dela será executada automaticamente. Se nenhuma condição for definida, a regra será considerada sempre atendida por padrão, e a ação de modificação de propriedade será executada automaticamente.

### Múltiplas Regras

Você pode configurar múltiplas regras de vinculação para um formulário. Quando as condições de múltiplas regras são atendidas simultaneamente, o sistema executará os resultados na ordem, do primeiro ao último, o que significa que o último resultado será o padrão final.
Exemplo: A Regra 1 define um campo como "Desabilitado", e a Regra 2 define o campo como "Editável". Se as condições para ambas as regras forem atendidas, o campo ficará no estado "Editável".

> A ordem de execução de múltiplas regras é crucial. Ao projetar regras, certifique-se de esclarecer suas prioridades e inter-relações para evitar conflitos.

## Gerenciamento de Regras

As seguintes operações podem ser realizadas em cada regra:

- Nome Personalizado: Defina um nome fácil de entender para a regra, facilitando o gerenciamento e a identificação.

- Ordenação: Ajuste a ordem com base na prioridade de execução das regras para garantir que o sistema as processe na sequência correta.

- Excluir: Remova as regras que não são mais necessárias.

- Habilitar/Desabilitar: Desabilite temporariamente uma regra sem excluí-la, útil para cenários em que uma regra precisa ser desativada temporariamente.

- Duplicar Regra: Crie uma nova regra copiando uma existente para evitar configurações repetitivas.

## Sobre Variáveis

Na atribuição de valores de campo e na configuração de condições, tanto constantes quanto variáveis são suportadas. A lista de variáveis pode variar dependendo da localização do bloco. Escolher e usar variáveis de forma adequada pode atender às necessidades de negócio com mais flexibilidade. Para mais informações sobre variáveis, consulte [Variáveis](/interface-builder/variables).

## Regras de Vinculação de Blocos

As regras de vinculação de blocos permitem o controle dinâmico da exibição de um bloco com base em variáveis do sistema (como usuário atual, função) ou variáveis de contexto (como o registro de pop-up atual). Por exemplo, um administrador pode visualizar informações completas de pedidos, enquanto uma função de atendimento ao cliente pode ver apenas dados específicos de pedidos. Através das regras de vinculação de blocos, você pode configurar blocos correspondentes com base nas funções e definir diferentes campos, botões de ação e escopos de dados dentro desses blocos. Quando a função logada for a função alvo, o sistema exibirá o bloco correspondente. É importante notar que os blocos são exibidos por padrão, então você geralmente precisará definir a lógica para ocultar o bloco.

👉 Para detalhes, veja: [Bloco/Regras de Vinculação de Blocos](/interface-builder/blocks/block-settings/block-linkage-rule)

## Regras de Vinculação de Campos

As regras de vinculação de campos são usadas para ajustar dinamicamente o estado dos campos em um formulário ou bloco de detalhes com base nas ações do usuário, incluindo principalmente:

- Controlar o estado de **Exibir/Ocultar** de um campo
- Definir se um campo é **Obrigatório**
- **Atribuir um valor**
- Executar JavaScript para lidar com lógicas de negócio personalizadas

👉 Para detalhes, veja: [Bloco/Regras de Vinculação de Campos](/interface-builder/blocks/block-settings/field-linkage-rule)

## Regras de Vinculação de Ações

As regras de vinculação de ações atualmente suportam o controle de comportamentos de ação, como ocultar/desabilitar, com base em variáveis de contexto, como o valor do registro atual e o formulário atual, bem como variáveis globais.

👉 Para detalhes, veja: [Ação/Regras de Vinculação](/interface-builder/actions/action-settings/linkage-rule)