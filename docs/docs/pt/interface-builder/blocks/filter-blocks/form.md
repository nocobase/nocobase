:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/interface-builder/blocks/filter-blocks/form).
:::

# Formulário de filtro

## Introdução

O formulário de filtro permite que os usuários filtrem dados preenchendo campos de formulário. Pode ser usado para filtrar blocos de tabela, blocos de gráfico, blocos de lista, etc.

## Como usar

Vamos primeiro entender rapidamente como usar o formulário de filtro através de um exemplo simples. Suponha que temos um bloco de tabela contendo informações de usuários e desejamos filtrar os dados através de um formulário de filtro. Como mostrado abaixo:

![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

Os passos de configuração são os seguintes:

1. Ative o modo de configuração, adicione um bloco de "Formulário de filtro" e um bloco de "Tabela" na página.
![20251031163525_rec_](https://static-docs.nocobase.com/20251031163525_rec_.gif)
2. Adicione o campo "Apelido" no bloco de tabela e no bloco de formulário de filtro.
![20251031163932_rec_](https://static-docs.nocobase.com/20251031163932_rec_.gif)
3. Agora você já pode começar a usar.
![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

## Uso avançado

O bloco de formulário de filtro suporta configurações mais avançadas. Abaixo estão alguns usos comuns.

### Conectar múltiplos blocos

Um único campo de formulário pode filtrar dados de múltiplos blocos simultaneamente. A operação específica é a seguinte:

1. Clique na opção de configuração "Connect fields" do campo.
![20251031170300](https://static-docs.nocobase.com/20251031170300.png)
2. Adicione o bloco de destino que precisa ser associado; aqui selecionamos o bloco de lista na página.
![20251031170718](https://static-docs.nocobase.com/20251031170718.png)
3. Selecione um ou mais campos no bloco de lista para associar. Aqui selecionamos o campo "Apelido".
![20251031171039](https://static-docs.nocobase.com/20251031171039.png)
4. Clique no botão salvar para concluir a configuração. O efeito é mostrado abaixo:
![20251031171209_rec_](https://static-docs.nocobase.com/20251031171209_rec_.gif)

### Conectar blocos de gráfico

Referência: [Filtros de página e vinculação](../../../data-visualization/guide/filters-and-linkage.md)

### Campos personalizados

Além de selecionar campos da coleção, você também pode criar campos de formulário através de "Campos personalizados". Por exemplo, você pode criar um campo de seleção suspensa e personalizar as opções. A operação específica é a seguinte:

1. Clique na opção "Campos personalizados", a interface de configuração será exibida.
![20251031173833](https://static-docs.nocobase.com/20251031173833.png)
2. Preencha o título do campo, selecione "Seleção" em "Tipo de campo" e configure as opções.
![20251031174857_rec_](https://static-docs.nocobase.com/20251031174857_rec_.gif)
3. Os novos campos personalizados adicionados precisam ser associados manualmente aos campos do bloco de destino. O método de operação é o seguinte:
![20251031181957_rec_](https://static-docs.nocobase.com/20251031181957_rec_.gif)
4. Configuração concluída. O efeito é mostrado abaixo:
![20251031182235_rec_](https://static-docs.nocobase.com/20251031182235_rec_.gif)

Atualmente, os tipos de campos suportados são:

- Caixa de texto
- Número
- Data
- Seleção
- Botão de rádio
- Caixa de seleção
- Registro associado (Association)

#### Registro associado (campo de relacionamento personalizado)

O "Registro associado" é adequado para cenários de "filtragem por registros de tabela associada". Por exemplo, em uma lista de pedidos, filtrar pedidos por "Cliente", ou em uma lista de tarefas, filtrar tarefas por "Responsável".

Descrição dos itens de configuração:

- **Coleção de destino**: Indica de qual coleção carregar os registros selecionáveis.
- **Campo de título**: Usado para o texto de exibição nas opções suspensas e etiquetas selecionadas (como nome, título).
- **Campo de valor**: Usado para o valor enviado durante a filtragem real, geralmente selecionando o campo de chave primária (como `id`).
- **Permitir seleção múltipla**: Quando ativado, você pode selecionar vários registros de uma vez.
- **Operador**: Define como a condição de filtro corresponde (veja a explicação de "Operador" abaixo).

Configuração recomendada:

1. No `Campo de título`, selecione um campo com alta legibilidade (como "Nome"), evite usar apenas o ID para não afetar a usabilidade.
2. No `Campo de valor`, priorize o campo de chave primária para garantir que a filtragem seja estável e única.
3. Em cenários de seleção única, geralmente desative `Permitir seleção múltipla`; em cenários de seleção múltipla, ative `Permitir seleção múltipla` e use o `Operador` apropriado.

#### Operador

O `Operador` é usado para definir a relação de correspondência entre o "valor do campo do formulário de filtro" e o "valor do campo do bloco de destino".

### Recolher

Adicione um botão de recolher para dobrar e expandir o conteúdo do formulário de filtro, economizando espaço na página.

![20251031182743](https://static-docs.nocobase.com/20251031182743.png)

Suporta as seguintes configurações:

![20251031182849](https://static-docs.nocobase.com/20251031182849.png)

- **Número de linhas exibidas ao recolher**: Define o número de linhas de campos do formulário exibidas no estado recolhido.
- **Recolhido por padrão**: Quando ativado, o formulário de filtro é exibido por padrão no estado recolhido.