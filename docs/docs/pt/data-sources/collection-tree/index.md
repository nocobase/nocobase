---
pkg: "@nocobase/plugin-collection-tree"
title: "Tabela em árvore"
description: "A tabela em árvore é usada para armazenar dados hierárquicos, como estruturas organizacionais, categorias de produtos, hierarquias regionais e diretórios de departamentos, usando uma estrutura de tabela de adjacência para armazenar relações entre pais e filhos."
keywords: "tabela em árvore, coleção em árvore, tabela de adjacência, dados hierárquicos, Tree Collection,NocoBase"
---

# Tabela em árvore

## Introdução

A tabela em árvore é adequada para armazenar dados com relações hierárquicas, como estruturas organizacionais, categorias de produtos, hierarquias regionais, diretórios de departamentos e diretórios de bases de conhecimento. A tabela em árvore usa uma estrutura de tabela de adjacência para armazenar relações entre pais e filhos, e cada registro pode apontar para seu próprio nó pai.

As tabelas em árvore só podem ser criadas pela página do banco de dados principal. Bancos de dados externos, fontes de dados da API REST e fontes de dados do NocoBase externo não oferecem suporte à criação de tabelas em árvore.

## Cenários aplicáveis

A tabela em árvore é adequada para estes cenários de negócio:

- Estrutura organizacional da empresa e hierarquia de departamentos
- Categorias de produtos, diretórios de bases de conhecimento e diretórios de documentos
- Províncias, cidades e distritos, regiões de vendas e hierarquia de pontos de atendimento
- Categorias de BOM, categorias de equipamentos e categorias de ativos

## Configuração de criação

No banco de dados principal, clique em «Create collection» e selecione «Tree collection» para criar uma tabela em árvore.

![20240324143228](https://static-docs.nocobase.com/20240324143228.png)

A configuração de criação de uma tabela em árvore é basicamente igual à de uma tabela comum.

| Configuração | Descrição |
| --- | --- |
| Collection display name | Nome exibido da tabela de dados na interface, como «Estrutura organizacional», «Categorias de produtos» ou «Hierarquia regional». |
| Collection name | Nome identificador da tabela de dados, usado para referências internas em APIs, campos de relação, permissões, fluxos de trabalho etc. |
| Inherits | Selecione a tabela pai da qual deseja herdar. Visível somente quando o banco de dados principal é PostgreSQL. |
| Categories | Categoria da tabela de dados. A categoria afeta apenas a forma de organização da interface de gerenciamento de tabelas de dados, sem alterar sua estrutura. |
| Description | Descrição da tabela de dados. Você pode informar quais dados hierárquicos a tabela em árvore armazena, quem é responsável pela manutenção e em quais páginas ela é usada para filtragem. |
| Preset fields | Campos predefinidos. Ao criar uma tabela em árvore, é recomendável manter os campos do sistema e os campos integrados da tabela em árvore. |

### Campos integrados

Depois de criada, uma tabela em árvore normalmente contém estes campos integrados. `parentId`, `parent` e `children` são usados para armazenar relações hierárquicas em árvore.

| Campo | Nome do campo | Descrição |
| --- | --- | --- |
| ID | `id` | Campo de chave primária padrão, usado para identificar exclusivamente um registro. |
| Hora de criação | `createdAt` | Registra automaticamente a hora de criação deste registro. |
| Criado por | `createdBy` | Registra automaticamente o usuário que criou este registro. |
| Hora de atualização | `updatedAt` | Registra automaticamente a hora da última atualização deste registro. |
| Atualizado por | `updatedBy` | Registra automaticamente o usuário que atualizou este registro pela última vez. |
| Parent ID | `parentId` | Armazena o ID do nó pai. Normalmente fica vazio para os nós raiz. |
| Parent | `parent` | Campo de relação muitos-para-um que aponta para o nó pai na tabela atual. |
| Children | `children` | Campo de relação um-para-muitos que representa os nós filhos do nó atual. |
| Espaço | `space` | Disponível após a ativação do [plug-in de múltiplos espaços](../../multi-app/multi-space/index.md), usado para isolar dados por espaço. Não aparece quando o recurso de múltiplos espaços não está ativado. |

![20240324143555](https://static-docs.nocobase.com/20240324143555.png)

:::warning Atenção

Evite formar relações cíclicas nos dados da tabela em árvore, como quando o nó pai de A é B e o nó pai de B é A. Relações cíclicas podem causar anomalias na exibição em árvore e nos resultados da filtragem.

:::

### Campo de chave primária

As tabelas em árvore, assim como as tabelas comuns, precisam de um campo de chave primária. Os campos de relação hierárquica associam-se aos registros de chave primária da mesma tabela por meio do ID do nó pai.

Se a tabela em árvore não tiver uma chave primária, defina «Record unique key» ao editar a tabela de dados. Caso contrário, os blocos de página poderão não conseguir visualizar ou editar os registros corretamente, e a exibição em árvore também poderá não localizar os nós de forma estável.

## Uso na configuração de páginas

As tabelas em árvore podem usar a maioria dos blocos de dados de [tabelas comuns](../data-source-main/general-collection.md) para criar, excluir, atualizar e consultar dados. Além disso, elas também podem ser usadas com recursos de árvore:

| Bloco | Uso |
| --- | --- |
| [Bloco de tabela](../../interface-builder/blocks/data-blocks/table.md#启用树表) | Exibe registros em árvore para visualizar e manter a estrutura hierárquica. |
| [Bloco de formulário](../../interface-builder/blocks/data-blocks/form.md) | Adiciona ou edita um único registro de nó da árvore. |
| [Bloco de detalhes](../../interface-builder/blocks/data-blocks/details.md) | Visualiza os detalhes de um único nó da árvore. |
| [Bloco de filtro em árvore](../../interface-builder/blocks/filter-blocks/tree.md) | Usa uma estrutura em árvore para filtrar outros blocos de dados, sendo comumente usado para filtrar categorias, organizações, regiões e outras hierarquias. |

## Editar configuração

Na lista de tabelas de dados, clique em «Edit» à direita da tabela em árvore para modificar configurações como o nome exibido da tabela de dados, a categoria, a descrição, o modo de paginação simples e «Record unique key».

Geralmente, não é recomendável excluir ou alterar para outra finalidade os campos de relação entre pais e filhos da tabela em árvore. Para ajustar a estrutura hierárquica, altere primeiro a relação com o nó pai nos dados dos registros.

## Excluir tabela de dados

Na lista de tabelas de dados, clique em «Delete» à direita da tabela em árvore para excluí-la.

A exclusão de uma tabela em árvore remove os metadados de Collection, a tabela de dados real e os dados das relações hierárquicas. Antes de excluir, confirme se blocos de página, blocos de filtro em árvore, campos de relação, permissões, fluxos de trabalho e APIs ainda dependem dela.

:::danger Aviso

As tabelas em árvore são frequentemente usadas como condições de filtragem para outros blocos. Depois de excluir uma tabela em árvore, os blocos de filtro em árvore relacionados e as configurações de página que dependem dessa hierarquia de categorias poderão deixar de funcionar.

:::

## Links relacionados

- [Tabela comum](../data-source-main/general-collection.md) — Consulte as configurações gerais e as formas de uso dos blocos
- [Bloco de tabela](../../interface-builder/blocks/data-blocks/table.md) — Ative a exibição da tabela em árvore na tabela
- [Bloco de filtro em árvore](../../interface-builder/blocks/filter-blocks/tree.md) — Use uma estrutura em árvore para filtrar dados
- [Múltiplos espaços](../../multi-app/multi-space/index.md) — Saiba mais sobre o campo de espaço e o recurso de isolamento por espaço