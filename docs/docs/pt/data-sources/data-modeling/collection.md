---
title: "Tabela de dados"
description: "Conheça a finalidade das tabelas de dados do NocoBase, os tipos de estrutura de tabela, as diferenças entre o banco de dados principal e as tabelas de dados externas, além de como escolher entre tabelas comuns, tabelas herdadas, tabelas em árvore, tabelas de arquivos, tabelas SQL e exibições de banco de dados."
keywords: "Tabela de dados,Collection,Tabela comum,Tabela herdada,Tabela em árvore,Tabela de arquivos,Tabela SQL,Exibição de banco de dados,NocoBase"
---

# Tabela de dados

## Introdução

No NocoBase, **Collection (tabela de dados)** é um modelo de dados usado para descrever uma classe de dados de negócio. Ela não é simplesmente o nome de uma tabela do banco de dados, mas uma descrição unificada que o NocoBase faz de um tipo de dados.

Uma Collection normalmente define três aspectos:

| Definição | Descrição |
| --- | --- |
| Onde os dados são armazenados | Os dados podem vir de uma tabela do banco de dados principal, de uma tabela de banco de dados externo, do resultado de uma consulta SQL, de uma exibição de banco de dados, de um recurso de API REST ou de um aplicativo NocoBase externo. |
| Quais campos existem | Os campos descrevem quais informações cada registro contém, como nome do cliente, número de celular, valor do pedido, data de criação e responsável. |
| Como será usada pelo NocoBase | Blocos de página, permissões, fluxos de trabalho, APIs e campos de relacionamento funcionam com base na Collection. |

Você pode entender a Collection como a “estrutura de dados de um objeto de negócio”. Por exemplo, «cliente», «pedido», «contrato» e «tarefa» podem ser Collections.

Depois de criar ou conectar uma tabela de dados, normalmente ainda é necessário realizar três etapas:

- Configurar os campos, para que a tabela de dados possa armazenar as informações necessárias ao negócio
- Na página, [adicionar blocos](../../interface-builder/blocks/index.md#添加区块), para que os usuários possam visualizar, inserir e processar dados
- Configurar permissões, fluxos de trabalho e APIs, para que os dados possam ser acessados e encaminhados de acordo com as regras de negócio

## Tipos de estrutura de tabela

- **Tabela comum** — adequada para armazenar dados de negócio convencionais, como clientes, pedidos, contratos, chamados, solicitações de reembolso, projetos e tarefas
- **Tabela em árvore** — adequada para armazenar dados hierárquicos, como estruturas organizacionais, categorias de produtos, hierarquias regionais, diretórios de departamentos e diretórios de bases de conhecimento
- **Tabela de calendário** — adequada para armazenar dados com intervalos de tempo, como reservas de salas de reunião, cronogramas de projetos, horários de cursos, escalas de plantão e agendas de eventos
- **Tabela de comentários** — adequada para armazenar discussões geradas em torno de registros de negócio, como comentários de tarefas, comentários de artigos, opiniões de aprovação e feedback de clientes; crie um [campo de relacionamento](./collection-fields/associations/index.md) em uma tabela de negócio (tabela comum, tabela em árvore ou tabela de calendário) para associá-la à tabela de comentários e use a página pop-up da tabela de negócio para criar um [bloco de comentários](../../plugins/@nocobase/plugin-comments/index.md) e comentar os dados de negócio
- **Tabela de arquivos** — adequada para armazenar metadados de arquivos, como anexos de contratos, arquivos de faturas, imagens de produtos e documentos de identificação de funcionários; os arquivos são armazenados pelo mecanismo de armazenamento de arquivos; crie um [campo de relacionamento](./collection-fields/associations/index.md) em uma tabela de negócio (tabela comum, tabela em árvore ou tabela de calendário) para associá-la à tabela de arquivos e use a tabela de negócio para criar um bloco e configurar o campo de relacionamento para fazer upload de arquivos; os metadados dos arquivos serão salvos automaticamente na tabela de arquivos
- **Exibição de banco de dados** — uma view já existente no banco de dados, como uma exibição de relatório financeiro, uma exibição de clientes filtrada ou uma exibição agregada após a sincronização entre sistemas
- **Tabela SQL** — adequada para usar como tabela de dados os resultados de consultas SQL, como resumos de vendas, alertas de estoque, relatórios estatísticos entre tabelas e painéis operacionais
- **Tabela herdada** — adequada quando várias classes de objetos de negócio compartilham um conjunto de campos comuns, mas cada uma também possui seus próprios campos exclusivos, como uma tabela pai de ativos da qual derivam ativos de computadores, ativos de veículos e móveis de escritório