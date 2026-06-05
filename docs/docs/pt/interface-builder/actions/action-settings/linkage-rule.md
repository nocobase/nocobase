:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Regras de Interligação de Ações

## Introdução

As regras de interligação de ações permitem que você controle dinamicamente o estado de uma ação (como exibir, habilitar, ocultar, desabilitar, etc.) com base em condições específicas. Ao configurar essas regras, você pode vincular o comportamento dos botões de ação ao registro atual, à função do usuário ou a dados contextuais.

![20251029150224](https://static-docs.nocobase.com/20251029150224.png)

## Como Usar

Quando a condição é atendida (se nenhuma condição for definida, ela é aprovada por padrão), a execução das configurações de propriedade ou de JavaScript é acionada. Constantes e variáveis são suportadas na avaliação condicional.

![20251030224601](https://static-docs.nocobase.com/20251030224601.png)

A regra permite modificar as propriedades dos botões.

![20251029150452](https://static-docs.nocobase.com/20251029150452.png)

## Constantes

Exemplo: Pedidos pagos não podem ser editados.

![20251029150638](https://static-docs.nocobase.com/20251029150638.png)

## Variáveis

### Variáveis de Sistema

![20251029150014](https://static-docs.nocobase.com/20251029150014.png)

Exemplo 1: Controle a visibilidade de um botão com base no tipo de dispositivo atual.

![20251029151057](https://static-docs.nocobase.com/20251029151057.png)

Exemplo 2: O botão de atualização em massa no cabeçalho da tabela do bloco de pedidos está disponível apenas para a função de Administrador; outras funções não podem executar esta ação.

![20251029151209](https://static-docs.nocobase.com/20251029151209.png)

### Variáveis de Contexto

Exemplo: O botão Adicionar nas oportunidades de pedido (bloco de associação) é habilitado apenas quando o status do pedido é "Pagamento Pendente" ou "Rascunho". Em outros status, o botão será desabilitado.

![20251029151520](https://static-docs.nocobase.com/20251029151520.png)

![20251029152200](https://static-docs.nocobase.com/20251029152200.png)

Para mais informações sobre variáveis, consulte [Variáveis](/interface-builder/variables).