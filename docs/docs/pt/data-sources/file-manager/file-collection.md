---
title: "Coleção de arquivos"
description: "A coleção de arquivos armazena título, nome, tamanho, tipo MIME, caminho, URL, endereço de pré-visualização, armazenamento e metadados estendidos dos arquivos, sendo usada para associação com campos de anexos."
keywords: "Coleção de arquivos,File Collection,attachments,metadados,anexos,NocoBase"
---

# Coleção de arquivos

<PluginInfo name="file-manager"></PluginInfo>

## Introdução

A coleção de arquivos é adequada para armazenar metadados de arquivos, como nome, extensão, tamanho, tipo MIME, caminho, URL, endereço de pré-visualização, armazenamento e meta personalizados. O conteúdo dos arquivos é salvo pelo mecanismo de armazenamento de arquivos, enquanto a coleção de arquivos armazena os metadados.

A coleção de arquivos só pode ser criada pela página do banco de dados principal. Bancos de dados externos, fontes de dados da API REST e fontes de dados externas do NocoBase não oferecem suporte à criação de coleções de arquivos.

## Cenários de uso

A coleção de arquivos é adequada para estes cenários de negócio:

- Anexos de contratos, arquivos de faturas e comprovantes de reembolso
- Imagens de produtos, documentos de identificação de funcionários e documentos de projetos
- Arquivos enviados, pré-visualizados e baixados de registros de negócio
- Bibliotecas de anexos que precisam gerenciar metadados de arquivos separadamente

## Fluxo de uso

A coleção de arquivos normalmente não é usada diretamente como tabela principal de negócio. O fluxo comum é:

1. Criar uma coleção de arquivos para armazenar metadados como título, nome, tamanho, tipo, URL e armazenamento.
2. Criar um campo de relacionamento na tabela de negócio para associá-lo à coleção de arquivos. Por exemplo, associar a tabela 「Contrato」 à coleção de arquivos 「Anexos de contrato」.
3. Adicionar o campo de relacionamento ao bloco de formulário da tabela de negócio, permitindo que os usuários enviem arquivos ao criar ou editar registros de negócio.
4. Após o upload, o NocoBase gravará os metadados do arquivo na coleção de arquivos e associará o registro do arquivo ao registro de negócio atual por meio do campo de relacionamento.
5. Exibir o campo de anexos no bloco de detalhes, no bloco de tabela ou no bloco de lista da tabela de negócio, permitindo que os usuários visualizem, pré-visualizem ou baixem os arquivos.

## Configuração de criação

Na base de dados principal, clique em 「Create collection」 e selecione 「File collection」 para criar uma coleção de arquivos.

![20240324090414](https://static-docs.nocobase.com/20240324090414.png)

A configuração de criação de uma coleção de arquivos é basicamente igual à de uma tabela comum. A coleção de arquivos inclui um conjunto predefinido de campos de metadados, usados para armazenar o título, o caminho, a URL, o armazenamento e as informações estendidas dos arquivos enviados.

| Configuração | Descrição |
| --- | --- |
| Collection display name | Nome exibido da tabela na interface, por exemplo, 「Anexos de contrato」, 「Arquivos de faturas」 e 「Imagens de produtos」. |
| Collection name | Nome de identificação da tabela, usado para referências internas em API, campos de relacionamento, permissões, fluxos de trabalho e outros recursos. |
| Categories | Categoria da tabela. A categoria afeta apenas a forma de organização da interface de gerenciamento de tabelas, sem alterar a estrutura da tabela. |
| Description | Descrição da tabela. Você pode informar quais arquivos são armazenados nessa coleção, quem os envia e com quais tabelas de negócio ela está relacionada. |
| Preset fields | Campos predefinidos. Ao criar uma coleção de arquivos, recomenda-se manter os campos do sistema e os campos integrados da coleção de arquivos. |

### Campos integrados

Após a criação, a coleção de arquivos normalmente contém os campos integrados a seguir. O conteúdo dos arquivos é armazenado no armazenamento de arquivos, enquanto a coleção de arquivos armazena estes metadados.

| Campo | Nome do campo | Descrição |
| --- | --- | --- |
| ID | `id` | Campo de chave primária padrão, usado para identificar exclusivamente um registro de arquivo. |
| Title | `title` | Título do arquivo, normalmente usado para exibição na interface. |
| File name | `filename` | Nome do arquivo. |
| Extension name | `extname` | Extensão do arquivo. |
| Size | `size` | Tamanho do arquivo. |
| MIME type | `mimetype` | Tipo MIME do arquivo. |
| Path | `path` | Caminho do arquivo no armazenamento. |
| URL | `url` | Endereço de acesso ao arquivo. |
| Preview | `preview` | Endereço de pré-visualização do arquivo. |
| Storage | `storage` / `storageId` | Armazenamento ao qual o arquivo pertence. `storage` é o campo de relacionamento e `storageId` é a chave estrangeira correspondente. |
| Meta | `meta` | Metadados estendidos do arquivo. |
| 创建时间 | `createdAt` | Registra automaticamente a data e hora de criação do registro do arquivo. |
| 创建人 | `createdBy` | Registra automaticamente o usuário que enviou ou criou o registro do arquivo. |
| 更新时间 | `updatedAt` | Registra automaticamente a data e hora da última atualização do registro do arquivo. |
| 更新人 | `updatedBy` | Registra automaticamente o usuário que atualizou o registro do arquivo pela última vez. |
| 空间 | `space` | Disponível após a ativação do [plugin de múltiplos espaços](../../multi-app/multi-space/index.md), usado para isolar dados por espaço. Não aparece quando os múltiplos espaços não estão ativados. |

![20240324090527](https://static-docs.nocobase.com/20240324090527.png)

### Campo de chave primária

Assim como as tabelas comuns, a coleção de arquivos precisa de um campo de chave primária. Os campos de anexos e os campos de relacionamento associam os metadados dos arquivos por meio da chave primária.

Se a coleção de arquivos não tiver uma chave primária, será necessário definir 「Record unique key」 ao editar a tabela de dados; caso contrário, os registros de anexos poderão não ser associados, pré-visualizados ou editados corretamente.

## Estabelecer relacionamentos
Crie um campo de relacionamento na tabela de negócio e associe-o à coleção de arquivos.

![20240324091529](https://static-docs.nocobase.com/20240324091529.png)

## Uso na configuração de páginas

Os dados da coleção de arquivos normalmente são gerados automaticamente pelo upload por meio do componente de anexos. Use-os em blocos de formulário, blocos de detalhes ou blocos de relacionamento.

![20260710160424](https://static-docs.nocobase.com/20260710160424.png)

![20240324091321](https://static-docs.nocobase.com/20240324091321.png)

| Local da configuração | Uso |
| --- | --- |
| [Bloco de formulário](../../interface-builder/blocks/data-blocks/form.md) | Enviar anexos em registros da tabela de negócio. |
| [Bloco de detalhes](../../interface-builder/blocks/data-blocks/details.md) | Exibir, pré-visualizar ou baixar anexos. |
| [Bloco de tabela](../../interface-builder/blocks/data-blocks/table.md) | Exibir o campo de anexos em uma lista. |
| [Bloco de relacionamento](../../interface-builder/blocks/data-blocks/table.md) | Gerenciar diretamente os registros de arquivos associados ao registro de negócio atual. |


## Editar configuração

Na lista de tabelas de dados, clique em 「Edit」 à direita da coleção de arquivos para modificar configurações como o nome de exibição, a categoria, a descrição, o modo de paginação simples e 「Record unique key」 da tabela.

Os campos de metadados dos arquivos normalmente são preenchidos automaticamente durante o upload. Não é recomendável atribuir outros significados de negócio a campos como `url`, `path` e `storageId`. Se precisar estender as informações de negócio dos arquivos, adicione novos campos, como 「Tipo de arquivo」, 「Etapa relacionada」 e 「Arquivado」.

## Excluir tabela de dados

Na lista de tabelas de dados, clique em 「Delete」 à direita da coleção de arquivos para excluí-la.

A exclusão da coleção de arquivos excluirá os registros de metadados dos arquivos e os metadados relacionados da Collection. Antes de excluir, confirme se os campos de anexos, campos de relacionamento, blocos de página, permissões, fluxos de trabalho e APIs da tabela de negócio ainda dependem dela.

:::danger Aviso

A coleção de arquivos armazena os metadados dos arquivos. A exclusão de registros da coleção de arquivos pode invalidar as referências aos anexos nos registros de negócio; a exclusão simultânea do conteúdo dos arquivos depende do armazenamento de arquivos e da configuração de negócio. Antes de realizar a operação, confirme se os arquivos ainda são usados pelo negócio.

:::

## Links relacionados

- [Tabela comum](../data-source-main/general-collection.md) — Consulte as configurações gerais e as formas de uso dos blocos
- [Campos da tabela de dados](../data-modeling/collection-fields/index.md) — Consulte as configurações dos campos de anexos e dos campos de relacionamento
- [Gerenciador de arquivos](../../plugins/@nocobase/plugin-file-manager/index.md) — Consulte as configurações relacionadas ao armazenamento de arquivos
- [Múltiplos espaços](../../multi-app/multi-space/index.md) — Saiba mais sobre os campos de espaço e os recursos de isolamento por espaço