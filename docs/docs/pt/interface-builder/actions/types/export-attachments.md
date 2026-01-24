---
pkg: "@nocobase/plugin-action-export-pro"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Exportar Anexos

## Introdução

A exportação de anexos permite exportar campos relacionados a anexos em formato de pacote compactado.

#### Configuração de Exportação de Anexos

![20251029173251](https://static-docs.nocobase.com/20251029173251.png)

![20251029173425](https://static-docs.nocobase.com/20251029173425.png)

![20251029173345](https://static-docs.nocobase.com/20251029173345.png)

- Configure os campos de anexo a serem exportados; você pode selecionar múltiplos.
- Você pode escolher se deseja gerar uma pasta para cada registro.

Regras de nomenclatura de arquivos:

- Se você optar por gerar uma pasta para cada registro, a regra de nomenclatura do arquivo será: `{valor do campo de título do registro}/{nome do campo de anexo}[-{número de sequência do arquivo}].{extensão do arquivo}`.
- Se você optar por não gerar uma pasta, a regra de nomenclatura do arquivo será: `{valor do campo de título do registro}-{nome do campo de anexo}[-{número de sequência do arquivo}].{extensão do arquivo}`.

O número de sequência do arquivo é gerado automaticamente quando um campo de anexo contém múltiplos anexos.

- [Regra de Vinculação](/interface-builder/actions/action-settings/linkage-rule): Para exibir/ocultar o botão dinamicamente;
- [Editar Botão](/interface-builder/actions/action-settings/edit-button): Edite o título, tipo e ícone do botão;