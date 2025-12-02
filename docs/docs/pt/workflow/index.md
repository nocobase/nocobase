---
pkg: '@nocobase/plugin-workflow'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Visão Geral

## Introdução

O plugin de fluxo de trabalho ajuda você a orquestrar processos de negócios automatizados no NocoBase, como aprovações diárias, sincronização de dados, lembretes e outras tarefas. Em um fluxo de trabalho, você pode implementar lógicas de negócios complexas simplesmente configurando gatilhos e nós relacionados por meio de uma interface visual, sem precisar escrever código.

### Exemplo

Cada fluxo de trabalho é orquestrado com um gatilho e vários nós. O gatilho representa um evento no sistema, e cada nó representa uma etapa de execução. Juntos, eles descrevem a lógica de negócios a ser processada após a ocorrência do evento. A imagem a seguir mostra um processo típico de dedução de estoque após a realização de um pedido de produto:

![Exemplo de Fluxo de Trabalho](https://static-docs.nocobase.com/20251029222146.png)

Quando um usuário envia um pedido, o fluxo de trabalho verifica automaticamente o estoque. Se o estoque for suficiente, ele deduz o estoque e prossegue com a criação do pedido; caso contrário, o processo é encerrado.

### Casos de Uso

De uma perspectiva mais geral, os fluxos de trabalho em aplicações NocoBase podem resolver problemas em diversos cenários:

- Automatizar tarefas repetitivas: Revisões de pedidos, sincronização de estoque, limpeza de dados, cálculos de pontuação, etc., não exigem mais operação manual.
- Suportar colaboração humano-máquina: Organizar aprovações ou revisões em nós chave e continuar com as etapas subsequentes com base nos resultados.
- Conectar a sistemas externos: Enviar requisições HTTP, receber notificações de serviços externos e alcançar automação entre sistemas.
- Adaptar-se rapidamente a mudanças de negócios: Ajustar a estrutura do processo, condições ou outras configurações de nós e entrar em produção sem a necessidade de um novo lançamento.

## Instalação

O fluxo de trabalho é um plugin integrado do NocoBase. Nenhuma instalação ou configuração adicional é necessária.

## Saiba Mais

- [Primeiros Passos](./getting-started)
- [Gatilhos](./triggers/index)
- [Nós](./nodes/index)
- [Usando Variáveis](./advanced/variables)
- [Execuções](./advanced/executions)
- [Gerenciamento de Versões](./advanced/revisions)
- [Configuração Avançada](./advanced/options)
- [Desenvolvimento de Extensões](./development/index)