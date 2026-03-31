:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Formulário de Filtro

## Introdução
O formulário de filtro permite que os usuários filtrem dados preenchendo campos de formulário. Ele pode ser usado para filtrar blocos de tabela, blocos de gráfico, blocos de lista e muito mais.

## Como usar
Vamos começar com um exemplo simples para entender rapidamente como usar o formulário de filtro. Imagine que temos um bloco de tabela com informações de usuários e queremos filtrar esses dados usando um formulário de filtro, assim:

![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

Os passos para configurar são:

1. Ative o modo de edição e adicione um bloco de "Formulário de filtro" e um bloco de "Tabela" à página.
![20251031163525_rec_](https://static-docs.nocobase.com/20251031163525_rec_.gif)
2. Adicione o campo "Apelido" tanto ao bloco de tabela quanto ao bloco de formulário de filtro.
![20251031163932_rec_](https://static-docs.nocobase.com/20251031163932_rec_.gif)
3. Pronto! Agora você já pode começar a usar.
![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

## Uso avançado
O bloco de formulário de filtro oferece configurações mais avançadas. Veja alguns casos de uso comuns.

### Conectando múltiplos blocos
Um único campo do formulário pode filtrar dados em vários blocos ao mesmo tempo. Veja como fazer:

1. Clique na opção de configuração "Connect fields" (Conectar campos) para o campo.
![20251031170300](https://static-docs.nocobase.com/20251031170300.png)
2. Adicione os blocos de destino que você quer conectar. Neste exemplo, vamos selecionar o bloco de lista na página.
![20251031170718](https://static-docs.nocobase.com/20251031170718.png)
3. Selecione um ou mais campos do bloco de lista para conectar. Aqui, vamos selecionar o campo "Apelido".
![20251031171039](https://static-docs.nocobase.com/20251031171039.png)
4. Clique no botão de salvar para finalizar a configuração. O resultado será este:
![20251031171209_rec_](https://static-docs.nocobase.com/20251031171209_rec_.gif)

### Conectando blocos de gráfico
Referência: [Filtros de página e vinculação](../../../data-visualization/guide/filters-and-linkage.md)

### Campos personalizados
Além de selecionar campos de **coleções**, você também pode criar campos de formulário usando "Campos personalizados". Por exemplo, você pode criar um campo de seleção suspensa com opções personalizadas. Veja como fazer:

1. Clique na opção "Campos personalizados" para abrir o painel de configuração.
![20251031173833](https://static-docs.nocobase.com/20251031173833.png)
2. Preencha o título do campo, selecione "Select" como o modelo do campo e configure as opções.
![20251031174857_rec_](https://static-docs.nocobase.com/20251031174857_rec_.gif)
3. Os campos personalizados recém-adicionados precisam ser conectados manualmente aos campos nos blocos de destino. Veja como:
![20251031181957_rec_](https://static-docs.nocobase.com/20251031181957_rec_.gif)
4. Configuração concluída. O resultado será este:
![20251031182235_rec_](https://static-docs.nocobase.com/20251031182235_rec_.gif)

Os modelos de campo atualmente suportados são:

- `Input`: Campo de texto de linha única
- `Number`: Campo de entrada numérica
- `Date`: Seletor de data
- `Select`: Lista suspensa (pode ser configurada para seleção única ou múltipla)
- `Radio group`: Grupo de botões de rádio (seleção única)
- `Checkbox group`: Grupo de caixas de seleção (seleção múltipla)

### Recolher
Adicione um botão de recolher para expandir e contrair o conteúdo do formulário de filtro, economizando espaço na página.

![20251031182743](https://static-docs.nocobase.com/20251031182743.png)

Configurações suportadas:

![20251031182849](https://static-docs.nocobase.com/20251031182849.png)

- **Linhas recolhidas**: Define quantas linhas de campos do formulário são exibidas no estado recolhido.
- **Recolhido por padrão**: Quando ativado, o formulário de filtro é exibido no estado recolhido por padrão.