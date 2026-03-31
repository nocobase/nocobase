:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Coleção de Expressões

## Criando uma Coleção de Modelo "Expressão"

Antes de usar nós de operação de expressão dinâmica em um fluxo de trabalho, você precisa primeiro criar uma coleção de modelo "Expressão" na ferramenta de gerenciamento de coleções. Essa coleção será usada para armazenar diferentes expressões:

![Criando uma Coleção de Expressões](https://static-docs.nocobase.com/33afe3369a1ea7943f12a04d9d4443ce.png)

## Inserindo Dados de Expressão

Em seguida, você pode configurar um bloco de tabela e inserir vários dados de fórmula na coleção de modelo. Cada linha na coleção de modelo "Expressão" pode ser vista como uma regra de cálculo projetada para um modelo de dados específico dentro da coleção. Você pode usar diferentes campos dos modelos de dados de várias coleções como variáveis, criando expressões únicas como regras de cálculo. Além disso, você pode aproveitar diferentes motores de cálculo, conforme necessário.

![Inserindo Dados de Expressão](https://static-docs.nocobase.com/761047f8daabacccbc6a6a24a73564093.png)

:::info{title=Dica}
Depois que as fórmulas são estabelecidas, elas precisam ser vinculadas aos dados de negócio. Associar diretamente cada linha de dados de negócio com os dados de fórmula pode ser tedioso. Por isso, uma abordagem comum é usar uma coleção de metadados, similar a uma coleção de classificação, para criar um relacionamento de muitos para um (ou um para um) com a coleção de fórmulas. Em seguida, os dados de negócio são associados aos metadados classificados em um relacionamento de muitos para um. Essa abordagem permite que você simplesmente especifique os metadados classificados relevantes ao criar dados de negócio, facilitando a localização e utilização dos dados de fórmula correspondentes através do caminho de associação estabelecido.
:::

## Carregando Dados Relevantes no Processo

Como exemplo, considere criar um fluxo de trabalho acionado por um evento de coleção. Quando um pedido é criado, o gatilho deve pré-carregar os dados do produto associado, juntamente com os dados de expressão relacionados ao produto:

![Evento de Coleção_Configuração do Gatilho](https://static-docs.nocobase.com/f181f75b10007afd5de068f3458d2e04.png)