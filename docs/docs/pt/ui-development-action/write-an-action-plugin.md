:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Coleção



# Coleção

Uma coleção é um dos conceitos mais importantes e fundamentais do NocoBase. É uma descrição abstrata de uma estrutura de dados.

Em um banco de dados relacional, uma coleção pode ser entendida como uma tabela de dados (Table). Em um banco de dados não relacional, pode ser entendida como uma coleção de documentos (Collection).

As coleções do NocoBase são semelhantes ao conceito de tabela de dados de outras plataformas low-code/no-code, mas com algumas diferenças. As coleções do NocoBase são mais flexíveis. Elas podem ser usadas não apenas para armazenar dados, mas também para definir os relacionamentos e o comportamento desses dados.

## Tipos de Coleção

As coleções do NocoBase são divididas em dois tipos:

- **Tabela**: Usada para armazenar e gerenciar dados de negócio, é o tipo de coleção mais comum no NocoBase.
- **Visão (View)**: Baseada em tabelas ou visões existentes, cria uma nova coleção virtual através de filtros, ordenação, associações, etc. Uma visão não armazena dados; ela é apenas uma referência e reorganização dos dados existentes.

## Campos da Coleção

Uma coleção é composta por vários campos, e cada campo tem um tipo que define o tipo de dado que ele armazena. O NocoBase suporta uma variedade de tipos de campo, incluindo:

- **Tipos básicos**: Texto de linha única, Texto longo, Número, Data, Booleano, etc.
- **Tipos de relacionamento**: Um para um, Um para muitos, Muitos para um, Muitos para muitos.
- **Tipos de mídia**: Imagem, Arquivo, Vídeo, etc.
- **Tipos de seleção**: Seleção única, Seleção múltipla, Menu suspenso (Dropdown), etc.
- **Tipos especiais**: Fórmula, Sequencial, Geolocalização, etc.

## Operações com Coleções

No NocoBase, você pode realizar as seguintes operações nas coleções:

- **Criar coleção**: Crie uma nova coleção para armazenar e gerenciar dados de negócio.
- **Editar coleção**: Modifique o nome, os campos, os relacionamentos, etc. de uma coleção.
- **Excluir coleção**: Exclua uma coleção, o que também removerá todos os dados contidos nela.
- **Visualizar coleção**: Visualize os dados em uma coleção e realize operações como adicionar, excluir, modificar e consultar dados.

## Coleções e Fontes de Dados

Cada coleção pertence a uma fonte de dados. Uma fonte de dados é um módulo no NocoBase usado para gerenciar e conectar a diferentes bancos de dados. O NocoBase suporta várias fontes de dados, incluindo:

- **Fonte de dados principal**: O banco de dados principal usado por padrão pelo NocoBase, geralmente PostgreSQL ou MySQL.
- **Fontes de dados externas**: Permite conectar a outros bancos de dados, como Oracle, SQL Server, etc.

Ao criar uma coleção, você precisa selecionar uma fonte de dados, e os dados dessa coleção serão armazenados nessa fonte de dados.