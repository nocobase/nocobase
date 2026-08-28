---
title: "Componentes compartilhados"
description: "Componentes compartilhados do NocoBase client v2: contêineres de formulário, campos, filtros, tabelas e ícones."
keywords: "client-v2,shared components,React,Antd,NocoBase"
---

# Componentes compartilhados

O NocoBase client v2 inclui um conjunto de componentes compartilhados. Ao criar páginas de plugin, páginas de configuração ou formulários, você pode usá-los diretamente para reutilizar a UI e as interações preparadas pelo NocoBase.

Esta seção organiza os componentes por cenário de uso. Cada página apresenta um único componente: quando usar, a API comum e se ele pode ser pré-visualizado na documentação.

## Índice rápido

| Quero... | Onde ver |
| --- | --- |
| Controlar o scanner de tela cheia de baixo nível | [CodeScanner](./form/code-scanner) |
| Colocar um formulário padrão em um dialog | [DialogFormLayout](./form/dialog-form-layout) |
| Colocar um formulário padrão em um drawer | [DrawerFormLayout](./form/drawer-form-layout) |
| Permitir apenas variáveis de ambiente `$env` | [EnvVariableInput](./form/env-variable-input) |
| Informar um tamanho de arquivo e armazená-lo em bytes | [FileSizeInput](./form/file-size-input) |
| Editar configuração JSON / JSON5 | [JsonTextArea](./form/json-text-area) |
| Informar uma senha com indicador de força | [PasswordInput](./form/password-input) |
| Carregar opções de Select de forma assíncrona a partir de uma API | [RemoteSelect](./form/remote-select) |
| Adicionar suporte a escaneamento em um input | [ScanInput](./form/scan-input) |
| Permitir que um campo aceite constantes e variáveis | [TypedVariableInput](./form/typed-variable-input) |
| Permitir que um campo de linha única aceite variáveis como `{{ $env.X }}` e `{{ $user.name }}` | [VariableInput](./form/variable-input) |
| Inserir variáveis em configuração JSON / JSON5 | [VariableJsonTextArea](./form/variable-json-text-area) |
| Permitir variáveis em texto multilinha | [VariableTextArea](./form/variable-text-area) |
| Filtrar uma Collection com múltiplas condições | [CollectionFilter](./filter/) |
| Incorporar um painel de filtro de Collection em uma página | [CollectionFilterPanel](./filter/collection-filter-panel) |
| Personalizar a linha arrastável de uma antd Table | [SortableRow](./table/sortable-row) |
| Personalizar a coluna de alça de arraste de uma Table | [SortHandle](./table/sort-handle) |
| Exibir listas, selecionar linhas e ordenar por arraste em páginas de configuração | [Table](./table/) |
| Usar ícones do Ant Design ou registrar ícones personalizados | [Icon](./icon) |
| Criar um registro interno para itens de extensão do plugin | [createFormRegistry](./create-form-registry) |

## Uso

Importe os componentes necessários em um plugin de cliente e use-os como componentes React comuns:

```tsx
import { RemoteSelect, Table } from '@nocobase/client-v2';

function SettingsPage() {
  return (
    <>
      <RemoteSelect request={loadOptions} />
      <Table rowKey="id" columns={columns} dataSource={records} />
    </>
  );
}
```

## Quando usar

Por padrão, use React + Antd. Para cenários comuns de plugins NocoBase, confira estes componentes primeiro:

- Abrir formulários em drawer ou dialog em páginas de configuração
- Inserir variáveis, editar JSON, informar tamanhos de arquivo ou escanear códigos em campos de formulário
- Usar filtros de Collection ou ordenação por arraste em listas
- Usar a entrada unificada de ícones do NocoBase

Para entradas, botões e mensagens comuns, os componentes Antd geralmente são mais claros.

## Links relacionados

- [Desenvolvimento de componentes](../plugin-development/client/component/index.md)
- [Context - Recursos comuns](../plugin-development/client/ctx/common-capabilities.md)
- [FlowEngine](../flow-engine/index.md)
