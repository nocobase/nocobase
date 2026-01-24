:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Modo de Cluster

## Introdução

A partir da versão v1.6.0, o NocoBase passou a suportar a execução de aplicações em modo de cluster. Ao rodar uma aplicação nesse modo, você pode melhorar o desempenho no tratamento de acessos concorrentes, utilizando múltiplas instâncias e o modo multi-core.

## Arquitetura do Sistema

![20251031221530](https://static-docs.nocobase.com/20251031221530.png)

*   **Cluster de Aplicações**: Um cluster composto por múltiplas instâncias da aplicação NocoBase. Ele pode ser implantado em vários servidores ou executar múltiplos processos em modo multi-core em um único servidor.
*   **Banco de Dados**: Armazena os dados da aplicação. Pode ser um banco de dados de nó único ou distribuído.
*   **Armazenamento Compartilhado**: Usado para armazenar arquivos e dados da aplicação, suportando acesso de leitura e escrita de múltiplas instâncias.
*   **Middleware**: Inclui componentes como cache, sinais de sincronização, fila de mensagens e bloqueios distribuídos, para suportar a comunicação e coordenação dentro do cluster de aplicações.
*   **Balanceador de Carga**: Responsável por distribuir as requisições dos clientes para diferentes instâncias no cluster de aplicações, além de realizar verificações de saúde (health checks) e failover.

## Saiba Mais

Este documento apresenta apenas os conceitos básicos e os componentes do modo de cluster do NocoBase. Para detalhes específicos de implantação e mais opções de configuração, você pode consultar os seguintes documentos:

- Implantação
  - [Preparações](./preparations)
  - [Implantação no Kubernetes](./kubernetes)
  - [Operações](./operations)
- Avançado
  - [Divisão de Serviços](./services-splitting)
- [Referência de Desenvolvimento](./development)