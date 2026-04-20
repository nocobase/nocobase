:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/interface-builder/blocks/data-blocks/form).
:::

# Bloco de formulário

## Introdução

O bloco de formulário é um bloco essencial para construir interfaces de entrada e edição de dados. Ele possui alta capacidade de personalização, utilizando os componentes correspondentes para exibir os campos necessários com base no modelo de dados. Através de fluxos de eventos, como regras de vinculação, o bloco de formulário pode exibir campos dinamicamente. Além disso, ele pode ser combinado com fluxos de trabalho para realizar o acionamento de processos automatizados e o processamento de dados, aumentando ainda mais a eficiência do trabalho ou realizando a orquestração lógica.

## Adicionar bloco de formulário

- **Editar formulário**: Usado para modificar dados existentes.
- **Novo formulário**: Usado para criar novas entradas de dados.

![20251023191139](https://static-docs.nocobase.com/20251023191139.png)

## Itens de configuração do bloco

![20251023191448](https://static-docs.nocobase.com/20251023191448.png)

### Regras de vinculação do bloco

Controle o comportamento do bloco (como exibir ou executar JavaScript) por meio de regras de vinculação.

![20251023191703](https://static-docs.nocobase.com/20251023191703.png)

Para mais detalhes, consulte [Regras de vinculação do bloco](/interface-builder/blocks/block-settings/block-linkage-rule)

### Regras de vinculação de campo

Controle o comportamento dos campos do formulário por meio de regras de vinculação.

![20251023191849](https://static-docs.nocobase.com/20251023191849.png)

Para mais detalhes, consulte [Regras de vinculação de campo](/interface-builder/blocks/block-settings/field-linkage-rule)

### Layout

O bloco de formulário suporta dois modos de layout, configurados através do atributo `layout`:

- **horizontal** (layout horizontal): Este layout faz com que o rótulo e o conteúdo sejam exibidos em uma única linha, economizando espaço vertical, sendo adequado para formulários simples ou situações com pouca informação.
- **vertical** (layout vertical) (padrão): O rótulo fica acima do campo; este layout torna o formulário mais fácil de ler e preencher, especialmente para formulários que contêm vários campos ou itens de entrada complexos.

![20251023193638](https://static-docs.nocobase.com/20251023193638.png)

## Configurar campos

### Campos desta coleção

> **Nota**: Campos em coleções herdadas (ou seja, campos da coleção pai) serão mesclados e exibidos automaticamente na lista de campos atual.

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### Campos de coleção de relacionamento

> Os campos de coleção de relacionamento são somente leitura no formulário e geralmente são usados em conjunto com campos de relacionamento para exibir vários valores de campo dos dados relacionados.

![20260212161035](https://static-docs.nocobase.com/20260212161035.png)

- Atualmente, suporta apenas relacionamentos para um (como belongsTo / hasOne, etc.).
- Geralmente é usado em conjunto com campos de relacionamento (usados para selecionar registros associados): o componente de campo de relacionamento é responsável por selecionar/alterar o registro associado, e o campo da coleção associada é responsável por exibir mais informações sobre esse registro (somente leitura).

**Exemplo**: Após selecionar o "Responsável", exiba o número de telefone, e-mail e outras informações do responsável no formulário.

> Se o campo de relacionamento "Responsável" não estiver configurado no formulário de edição, as informações associadas correspondentes ainda poderão ser exibidas. Quando o campo de relacionamento "Responsável" for configurado, ao alterar o responsável, as informações associadas correspondentes serão atualizadas para o registro correspondente.

![20260212160748](https://static-docs.nocobase.com/20260212160748.gif)

### Outros campos

![20251023192559](https://static-docs.nocobase.com/20251023192559.png)

- Escrever JavaScript permite realizar a exibição de conteúdo personalizado e a apresentação de conteúdos complexos.

![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

### Template de campo

Templates de campo são usados para reutilizar a configuração da área de campos no bloco de formulário. Veja detalhes em [Template de campo](/interface-builder/fields/field-template).

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

## Configurar ações

![20251023193231](https://static-docs.nocobase.com/20251023193231.png)

- [Enviar](/interface-builder/actions/types/submit)
- [Acionar fluxo de trabalho](/interface-builder/actions/types/trigger-workflow)
- [Ação JS](/interface-builder/actions/types/js-action)
- [Funcionário de IA](/interface-builder/actions/types/ai-employee)