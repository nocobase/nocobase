:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Bloco de Formulário

## Introdução

O bloco de formulário é um bloco importante para construir interfaces de entrada e edição de dados. Ele é altamente personalizável, usando componentes correspondentes para exibir os campos necessários com base no modelo de dados. Através de fluxos de eventos, como regras de vinculação, o bloco de formulário pode exibir campos dinamicamente. Além disso, ele pode ser combinado com **fluxos de trabalho** para acionar processos automatizados e lidar com dados, melhorando ainda mais a eficiência do trabalho ou implementando orquestração lógica.

## Adicionar Bloco de Formulário

- **Editar formulário**: Usado para modificar dados existentes.
- **Adicionar formulário**: Usado para criar novas entradas de dados.

![20251023191139](https://static-docs.nocobase.com/20251023191139.png)

## Configurações do Bloco

![20251023191448](https://static-docs.nocobase.com/20251023191448.png)

### Regra de Vinculação do Bloco

Controle o comportamento do bloco (como se ele deve ser exibido ou executar JavaScript) através de regras de vinculação.

![20251023191703](https://static-docs.nocobase.com/20251023191703.png)

Para mais detalhes, consulte [Regra de Vinculação do Bloco](/interface-builder/blocks/block-settings/block-linkage-rule)

### Regra de Vinculação de Campo

Controle o comportamento dos campos do formulário através de regras de vinculação.

![20251023191849](https://static-docs.nocobase.com/20251023191849.png)

Para mais detalhes, consulte [Regra de Vinculação de Campo](/interface-builder/blocks/block-settings/field-linkage-rule)

### Layout

O bloco de formulário suporta dois modos de layout, que podem ser configurados através do atributo `layout`:

- **horizontal** (layout horizontal): Este layout exibe o rótulo e o conteúdo em uma única linha, economizando espaço vertical, sendo adequado para formulários simples ou situações com poucas informações.
- **vertical** (layout vertical) (padrão): O rótulo é posicionado acima do campo. Este layout torna o formulário mais fácil de ler e preencher, sendo especialmente útil para formulários com múltiplos campos ou itens de entrada complexos.

![20251023193638](https://static-docs.nocobase.com/20251023193638.png)

## Configurar Campos

### Campos desta Coleção

> **Observação**: Campos de coleções herdadas (ou seja, campos da coleção pai) são automaticamente mesclados e exibidos na lista de campos atual.

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### Outros Campos

![20251023192559](https://static-docs.nocobase.com/20251023192559.png)

- Escreva JavaScript para personalizar o conteúdo exibido e mostrar informações complexas.

![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

## Configurar Ações

![20251023193231](https://static-docs.nocobase.com/20251023193231.png)

- [Enviar](/interface-builder/actions/types/submit)
- [Acionar fluxo de trabalho](/interface-builder/actions/types/trigger-workflow)
- [Ação JS](/interface-builder/actions/types/js-action)
- [Funcionário de IA](/interface-builder/actions/types/ai-employee)