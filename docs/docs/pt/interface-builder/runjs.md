:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Escrever e Executar JS Online

No NocoBase, o **RunJS** oferece um método de extensão leve, ideal para cenários de **experimentação rápida e processamento de lógica temporária**. Sem precisar criar `plugins` ou modificar o código-fonte, você pode personalizar interfaces ou interações usando JavaScript.

Com ele, você pode inserir código JS diretamente no construtor de interface para conseguir:

- Personalizar o conteúdo de renderização (campos, blocos, colunas, itens, etc.)
- Personalizar a lógica de interação (cliques em botões, vinculação de eventos)
- Comportamento dinâmico combinado com dados de contexto

## Cenários Suportados

### Bloco JS

Personalize a renderização de blocos usando JS, dando a você controle total sobre a estrutura e os estilos do bloco. É ideal para exibir componentes personalizados, gráficos estatísticos, conteúdo de terceiros e outros cenários altamente flexíveis.

![20250916105031](https://static-docs.nocobase.com/20250916105031.png)

Documentação: [Bloco JS](/interface-builder/blocks/other-blocks/js-block)

### Ação JS

Personalize a lógica de clique dos botões de ação usando JS, permitindo que você execute qualquer operação de frontend ou requisição de API. Por exemplo: calcular valores dinamicamente, enviar dados personalizados, acionar pop-ups, etc.

![20250916105123](https://static-docs.nocobase.com/20250916105123.png)

Documentação: [Ação JS](/interface-builder/actions/types/js-action)

### Campo JS

Personalize a lógica de renderização de campos usando JS. Você pode exibir dinamicamente diferentes estilos, conteúdos ou estados com base nos valores dos campos.

![20250916105354](https://static-docs.nocobase.com/20250916105354.png)

Documentação: [Campo JS](/interface-builder/fields/specific/js-field)

### Item JS

Renderize itens independentes usando JS sem vinculá-los a campos específicos. É comumente usado para exibir blocos de informação personalizados.

![20250916104848](https://static-docs.nocobase.com/20250916104848.png)

Documentação: [Item JS](/interface-builder/fields/specific/js-item)

### Coluna de Tabela JS

Personalize a renderização de colunas de tabela usando JS. Pode implementar lógicas complexas de exibição de células, como barras de progresso, rótulos de status, etc.

![20250916105443](https://static-docs.nocobase.com/20250916105443.png)

Documentação: [Coluna de Tabela JS](/interface-builder/fields/specific/js-column)

### Regras de Vinculação

Controle a lógica de vinculação entre campos em formulários ou páginas usando JS. Por exemplo: quando um campo muda, modifique dinamicamente o valor ou a visibilidade de outro campo.

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)

Documentação: [Regras de Vinculação](/interface-builder/linkage-rule)

### Fluxo de Eventos

Personalize as condições de acionamento e a lógica de execução do fluxo de eventos usando JS para construir cadeias de interação de frontend mais complexas.

![](https://static-docs.nocobase.com/20251031092755.png)

Documentação: [Fluxo de Eventos](/interface-builder/event-flow)