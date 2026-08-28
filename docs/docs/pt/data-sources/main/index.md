---
title: "Banco de dados principal"
description: "Banco de dados principal do NocoBase: armazena dados das tabelas do sistema e dados de negócios, com suporte a MySQL/PostgreSQL/MariaDB/KingbaseES/OceanBase, sincronização de estruturas de tabelas do banco de dados e criação de tabelas comuns, tabelas hierárquicas, tabelas SQL etc."
keywords: "banco de dados principal,MySQL、PostgreSQL、MariaDB、KingbaseES、OceanBase,sincronização de tabelas de dados"
---
# Banco de dados principal

## Introdução

Banco de dados configurado em [Implantar o NocoBase](/ai/install-nocobase-app), usado para armazenar os dados das tabelas do sistema do NocoBase e também os dados das tabelas de negócios dos usuários.

As versões de banco de dados e as edições comerciais compatíveis com o banco de dados principal são:

| Banco de dados | Versão compatível | Edição da comunidade | Edição padrão | Edição profissional | Edição empresarial |
| --- | --- | --- | --- | --- | --- |
| MySQL | >= 8.0.17 | ✅ | ✅ | ✅ | ✅ |
| PostgreSQL | >= 10 | ✅ | ✅ | ✅ | ✅ |
| MariaDB | >= 10.9 | ✅ | ✅ | ✅ | ✅ |
| KingbaseES | >=V9 | ❌ | ❌ | ✅ | ✅ |
| OceanBase | >=4.3 | ❌ | ❌ | ❌ | ✅ |

:::tip Observação

O KingbaseES oferece suporte apenas ao modo de compatibilidade com PostgreSQL, e o OceanBase oferece suporte apenas ao modo de compatibilidade com MySQL.

:::

## Instalação de plug-ins

| Banco de dados | Plug-in correspondente | Método de instalação |
| --- | --- | --- |
| MySQL | Nenhum | Plug-in integrado, não é necessária instalação separada. |
| PostgreSQL | Nenhum | Plug-in integrado, não é necessária instalação separada. |
| MariaDB | Nenhum | Plug-in integrado, não é necessária instalação separada. |
| KingbaseES | `@nocobase/plugin-data-source-kingbase` | Requer uma licença comercial; após a instalação, o plug-in é ativado por padrão. |
| OceanBase | `@nocobase/plugin-data-source-oceanbase` | Requer uma licença comercial; após a instalação, o plug-in é ativado por padrão. |

## Acessar a fonte de dados principal

1. Clique no menu de fontes de dados em funções do sistema para acessar a página inicial das fontes de dados.
2. Selecione a fonte de dados **Main** na lista de fontes de dados e clique na ação **Configurar** para acessar o banco de dados principal e gerenciá-lo.

![configure_main_datasource](https://static-docs.nocobase.com/configure_main_datasource.png)

## Gerenciamento da fonte de dados principal

O banco de dados principal oferece recursos de gerenciamento de tabelas de dados: é possível pesquisar, criar, alterar e excluir tabelas de dados, bem como sincronizar os campos de tabelas já existentes no banco de dados; também é possível criar, alterar e excluir campos de tabelas de dados.
- **Filtrar**: pesquisar as tabelas de dados gerenciadas pelo banco de dados principal do NocoBase
- **Criar tabela de dados**: adicionar uma nova tabela de dados de negócios
- **Editar**: alterar uma tabela de dados de negócios
- **Excluir**: excluir uma tabela de dados de negócios
- **Sincronizar do banco de dados**: sincronizar a estrutura de tabelas já existentes no banco de dados
- **Configurar campos**: criar, alterar e excluir campos de tabelas de dados
-  **+** : o **+** da aba permite gerenciar categorias de tabelas de dados, criando, alterando e excluindo categorias
![main_datasource_management](https://static-docs.nocobase.com/main_datasource_management.png)

### S sincronizar tabelas existentes do banco de dados

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Uma característica importante da fonte de dados principal é a possibilidade de sincronizar tabelas já existentes no banco de dados com o NocoBase para gerenciá-las. Isso significa:

- **Proteger investimentos existentes**: se o banco de dados já contiver muitas tabelas de negócios, não é necessário recriá-las; basta sincronizá-las e utilizá-las diretamente
- **Integração flexível**: tabelas criadas por outras ferramentas, como scripts SQL ou ferramentas de gerenciamento de bancos de dados, podem ser incorporadas ao gerenciamento do NocoBase
- **Migração gradual**: permite migrar gradualmente os sistemas existentes para o NocoBase, em vez de refatorá-los de uma só vez

Por meio do recurso «Carregar do banco de dados», você pode:
1. navegar por todas as tabelas do banco de dados
2. selecionar as tabelas que precisam ser sincronizadas
3. identificar automaticamente a estrutura das tabelas e os tipos de campos
4. importá-las para o NocoBase com um clique para gerenciá-las

### Suporte a vários tipos de estruturas de tabela

![nocobase_doc-2025-10-29-19-47-14](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-47-14.png)

O NocoBase permite criar e gerenciar vários tipos de tabelas de dados:
- **Tabela comum**: inclui campos de sistema frequentemente utilizados;
- **Tabela herdada**: é possível criar uma tabela pai e derivar dela tabelas filhas. As tabelas filhas herdam a estrutura da tabela pai e também podem definir suas próprias colunas.
- **Tabela hierárquica**: tabela com estrutura em árvore; atualmente, oferece suporte apenas ao modelo de tabela de adjacência;
- **Tabela de calendário**: usada para criar tabelas de eventos relacionados a calendários;
- **Tabela de arquivos**: usada para gerenciar o armazenamento de arquivos;
- **Tabela SQL**: não é uma tabela de banco de dados real, mas permite exibir rapidamente consultas SQL de forma estruturada;
- **Tabela de visualização**: conecta-se a visualizações existentes do banco de dados;

### Suporte ao gerenciamento categorizado de tabelas de dados

![20240322231520](https://static-docs.nocobase.com/20240322231520.png)

### Oferece uma ampla variedade de tipos de campos

![nocobase_doc-2025-10-29-19-48-51](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-48-51.png)

#### Conversão flexível de tipos de campos

O NocoBase oferece suporte à conversão flexível de tipos de campos dentro do mesmo tipo de banco de dados.

**Opções de conversão para campos do tipo String**

Quando um campo do banco de dados é do tipo String, ele pode ser convertido no NocoBase para qualquer uma das seguintes formas:

- **Tipos básicos**: texto de linha única, texto multilinha, número de celular, e-mail, URL, senha, cor, ícone
- **Tipos de seleção**: menu suspenso (seleção única), caixa de seleção única
- **Tipos de rich media**: Markdown, Markdown (Vditor), rich text, anexo (URL)
- **Tipos de data e hora**: data e hora (com fuso horário), data e hora (sem fuso horário)
- **Tipos avançados**: codificação automática, seletor de tabela de dados, criptografia

Esse mecanismo de conversão flexível significa:
- **Não é necessário modificar a estrutura do banco de dados**: o tipo de armazenamento subjacente do campo permanece inalterado; apenas sua forma de apresentação no NocoBase é modificada
- **Adaptação às mudanças do negócio**: conforme os requisitos de negócio mudam, é possível ajustar rapidamente a forma de exibição e interação dos campos
- **Segurança dos dados**: o processo de conversão não afeta a integridade dos dados existentes

### Sincronização flexível em nível de campo

O NocoBase não só pode sincronizar uma tabela inteira, como também oferece suporte ao gerenciamento detalhado da sincronização em nível de campo:

![nocobase_doc-2025-10-29-19-49-56](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-49-56.png)

#### Características da sincronização de campos:

1. **Sincronização em tempo real**: quando a estrutura da tabela do banco de dados mudar, novos campos podem ser sincronizados a qualquer momento
2. **Sincronização seletiva**: é possível sincronizar apenas os campos necessários, em vez de todos
3. **Identificação automática de tipos**: identifica automaticamente os tipos de campos do banco de dados e os mapeia para os tipos de campos do NocoBase
4. **Preservação da integridade dos dados**: o processo de sincronização não afeta os dados existentes

#### Cenários de uso:

- **Evolução da estrutura do banco de dados**: quando os requisitos de negócio mudarem e for necessário adicionar novos campos ao banco de dados, eles poderão ser sincronizados rapidamente com o NocoBase
- **Colaboração em equipe**: quando outros membros da equipe ou o DBA adicionarem campos ao banco de dados, eles poderão ser sincronizados prontamente
- **Modelo de gerenciamento híbrido**: alguns campos são gerenciados pelo NocoBase e outros pelos métodos tradicionais, permitindo uma combinação flexível

Esse mecanismo de sincronização flexível permite que o NocoBase se integre bem à arquitetura técnica existente, sem exigir mudanças na forma original de gerenciamento do banco de dados, ao mesmo tempo que oferece a conveniência do desenvolvimento low-code do NocoBase.

Para obter mais informações, consulte a seção «[Campos da tabela de dados / Visão geral](../data-modeling/collection-fields/index.md)».
