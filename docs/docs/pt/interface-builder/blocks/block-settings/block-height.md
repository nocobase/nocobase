:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/interface-builder/blocks/block-settings/block-height).
:::

# Altura do Bloco

## Introdução

A altura do bloco suporta três modos: **Altura padrão**, **Altura especificada** e **Altura total**. A maioria dos blocos suporta configurações de altura.

![20260211153947](https://static-docs.nocobase.com/20260211153947.png)

![20260211154020](https://static-docs.nocobase.com/20260211154020.png)

## Modos de Altura

### Altura padrão

A estratégia de altura padrão varia para diferentes tipos de blocos. Por exemplo, os blocos de Tabela e Formulário adaptam automaticamente sua altura com base no conteúdo, e nenhuma barra de rolagem aparecerá dentro do bloco.

### Altura especificada

Você pode especificar manualmente a altura total da moldura externa do bloco. O bloco calculará e alocará automaticamente a altura disponível internamente.

![20260211154043](https://static-docs.nocobase.com/20260211154043.gif)

### Altura total

O modo de altura total é semelhante à altura especificada, mas a altura do bloco é calculada com base na **janela de visualização** (viewport) atual do navegador para atingir a altura máxima da tela cheia. Nenhuma barra de rolagem aparecerá na página do navegador; as barras de rolagem aparecerão apenas dentro do bloco.

O tratamento da rolagem interna no modo de altura total difere ligeiramente entre os blocos:

- **Tabela**: Rolagem interna dentro do `tbody`;
- **Formulário / Detalhes**: Rolagem interna dentro da Grade (rolagem de conteúdo excluindo a área de ação);
- **Lista / Cartão de Grade**: Rolagem interna dentro da Grade (rolagem de conteúdo excluindo a área de ação e a barra de paginação);
- **Mapa / Calendário**: Altura adaptativa geral, sem barras de rolagem;
- **Iframe / Markdown**: Limita a altura total da moldura do bloco, com barras de rolagem aparecendo dentro do bloco.

#### Tabela em altura total

![20260211154204](https://static-docs.nocobase.com/20260211154204.gif)

#### Formulário em altura total

![20260211154335](https://static-docs.nocobase.com/20260211154335.gif)