---
title: "Campos"
description: "Entenda a função dos campos do NocoBase, como criá-los e gerenciá-los, os cenários de uso dos tipos de campo, como criar campos a partir da página e a lógica de mapeamento de campos das fontes de dados principais e externas."
keywords: "Campos,Field type,Field interface,mapeamento de campos,campo de título,restrição de unicidade,campo de relação,NocoBase"
---

# Campos

## Introdução

No NocoBase, **Field (campo)** é uma propriedade de negócio usada para descrever dados em uma [Collection (tabela de dados)](../collection.md). Ele descreve quais informações podem ser armazenadas em um registro e como essas informações podem ser inseridas, exibidas, filtradas e utilizadas na lógica de negócio da página.

| Definição | Descrição |
| --- | --- |
| Quais dados são armazenados | Por exemplo, texto, números, datas, arquivos, status, relações e JSON. |
| Como são usados na página | Por exemplo, podem ser inseridos e exibidos por meio de campos de entrada, seletores de data, menus suspensos, upload de anexos e seletores de relações. |
| Como participam das funcionalidades de negócio | Os campos são utilizados por blocos de página, filtros, ordenação, permissões, workflows, APIs, importação e exportação de dados, entre outras funcionalidades. |

Eles podem corresponder a:
- colunas reais do banco de dados no banco de dados principal
- colunas existentes do banco de dados externo
- campos em uma view do banco de dados
- campos nos resultados de uma consulta SQL
- campos nas respostas de uma API REST
- campos de relação, campos do sistema ou campos virtuais em uma tabela de dados

Entenda-o como “uma propriedade de um objeto de negócio”. Por exemplo:

| Objeto de negócio | Field correspondente |
| --- | --- |
| Cliente | Nome do cliente, número de celular, nível do cliente, responsável |
| Pedido | Número do pedido, valor do pedido, status do pedido, cliente |
| Contrato | Nome do contrato, data de assinatura, anexos do contrato, status de aprovação |
| Tarefa | Título da tarefa, prazo, prioridade, executor |
| Arquivo | Nome do arquivo, tamanho, tipo MIME, URL |

## Cenários de uso

A seguir, os cenários de uso comuns são organizados por categoria de campo. Esta seção ajuda você a decidir primeiro qual categoria de campo escolher. Para consultar configurações específicas, mapeamentos de tipos e observações importantes, acesse a documentação da categoria correspondente.

| Categoria de campo | Cenários de uso |
| --- | --- |
| [Campos de texto](./basic/input.md) | Adequados para armazenar nomes, números, descrições, informações de contato, endereços de links e outros conteúdos. |
| [Campos de rich text](./media/rich-text.md) | Adequados para armazenar textos principais, documentos explicativos, soluções de tratamento, trechos de código e outros conteúdos mais complexos. |
| [Campos numéricos](./basic/number.md) | Adequados para armazenar quantidades, valores, pontuações, proporções e outros valores numéricos. |
| [Campos de data e hora](./datetime/index.md) | Adequados para armazenar pontos no tempo, datas, horários, timestamps de sistemas externos e outros conteúdos. |
| [Campos de status e opções](./choices/select.md) | Adequados para armazenar valores dentro de um intervalo fixo, como se está habilitado, status do pedido, nível do cliente e etiquetas do cliente. |
| [Campos de anexos](./media/field-attachment.md) | Adequados para fazer upload de arquivos ou armazenar endereços de arquivos externos. |
| [Campos de relação](./associations/index.md) | Adequados para expressar conexões entre diferentes tabelas de dados, como um pedido pertencer a um cliente, um cliente possuir pedidos ou um usuário estar associado a funções. |
| [Campos de identificação e codificação](./advanced/uuid.md) | Adequados para armazenar chaves primárias internas, IDs de sincronização externos, identificadores de acesso público e números de negócio. |
| [Campos de formas geométricas](./geometric/point.md) | Adequados para armazenar informações espaciais ou geográficas, como a localização de uma loja, rotas de entrega e áreas de atendimento. |
| [Campos do sistema](./system-info/created-at.md) | Adequados para armazenar informações do sistema mantidas pelo NocoBase ou pelo banco de dados, como ID, data de criação, criador e data de atualização. |
| [Outros campos](./advanced/json.md) | Adequados para lidar com necessidades de campos que não se enquadram diretamente em outras categorias, como ordenação, fórmulas e JSON. |

## Tipos de Interface dos campos

O NocoBase divide os campos nas seguintes categorias sob a perspectiva de Interface:

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

## Tipos de dados dos campos

Cada Field Interface possui um tipo de dados padrão. Por exemplo, para um campo cuja Interface é numérica (Number), o tipo de dados padrão é double, mas também pode ser float, decimal etc. Atualmente, os tipos de dados compatíveis são:

![20240512103733](https://static-docs.nocobase.com/20240512103733.png)

## Mapeamento de tipos de campo

O fluxo para adicionar campos ao banco de dados principal é:

1. Selecionar o tipo de Interface
2. Configurar os tipos de dados disponíveis para a Interface atual

![20240512172416](https://static-docs.nocobase.com/20240512172416.png)

O fluxo de mapeamento de campos de uma fonte de dados externa é:

1. Mapear automaticamente, com base no tipo de campo do banco de dados externo, o tipo de dados correspondente (Field type) e o tipo de UI (Field Interface).
2. Modificar, conforme necessário, para tipos de dados e tipos de Interface mais adequados

![20240512172759](https://static-docs.nocobase.com/20240512172759.png)