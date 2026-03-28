---

pkg: '@nocobase/plugin-action-duplicate'

---

:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/interface-builder/actions/types/duplicate).
:::

# Duplicar

## Introdução

A ação Duplicar permite que os usuários criem rapidamente novos registros com base em dados existentes. Ela suporta dois modos de duplicação: **Duplicação direta** e **Duplicar para o formulário e continuar preenchendo**.

## Instalação

Este é um plugin integrado, nenhuma instalação adicional é necessária.

## Modos de duplicação

![20260209224344](https://static-docs.nocobase.com/20260209224344.png)

### Duplicação direta

![20260209224506](https://static-docs.nocobase.com/20260209224506.png)

- Executado como "Duplicação direta" por padrão;
- **Campos do modelo**: Especifique os campos a serem duplicados. É possível "Selecionar tudo". Esta é uma configuração obrigatória.

![20260209225910](https://static-docs.nocobase.com/20260209225910.gif)

Após concluir a configuração, clique no botão para duplicar os dados.

### Duplicar para o formulário e continuar preenchendo

Os campos do modelo configurados serão preenchidos no formulário como **valores padrão**. Os usuários podem modificar esses valores antes de enviar para concluir a duplicação.

![20260209224704](https://static-docs.nocobase.com/20260209224704.png)

**Configurar campos do modelo**: Apenas os campos selecionados serão trazidos como valores padrão.

![20260209225148](https://static-docs.nocobase.com/20260209225148.png)

#### Sincronizar campos do formulário

- Analisa automaticamente os campos já configurados no bloco de formulário atual como campos do modelo;
- Se os campos do bloco de formulário forem modificados posteriormente (por exemplo, ajuste de componentes de campos de associação), você precisará abrir a configuração do modelo novamente e clicar em **Sincronizar campos do formulário** para garantir a consistência.

![20260209225450](https://static-docs.nocobase.com/20260209225450.gif)

Os dados do modelo serão preenchidos como padrões do formulário, e os usuários podem enviá-los após a modificação para concluir a duplicação.

### Notas complementares

#### Duplicar, Referenciar, Pré-carregar

Diferentes tipos de campos (tipos de associação) possuem lógicas de processamento distintas: **Duplicar / Referenciar / Pré-carregar**. O **componente de campo** de um campo de associação também afeta essa lógica:

- Select / Record picker: Usado para **Referenciar**
- Sub-form / Sub-table: Usado para **Duplicar**

**Duplicar**

- Campos comuns são duplicados;
- `hasOne` / `hasMany` só podem ser duplicados (esses relacionamentos não devem usar componentes de seleção como Seleção única ou Seletor de registro; em vez disso, use componentes de Subformulário ou Subtabela);
- A alteração do componente para `hasOne` / `hasMany` **não** altera a lógica de processamento (permanece como Duplicar);
- Para campos de associação duplicados, todos os subcampos podem ser selecionados.

**Referenciar**

- `belongsTo` / `belongsToMany` são tratados como Referência;
- Se o componente do campo for alterado de "Seleção única" para "Subformulário", o relacionamento muda de **Referência para Duplicar** (uma vez que se torna Duplicar, todos os subcampos tornam-se selecionáveis).

**Pré-carregar**

- Campos de associação sob um campo de Referência são tratados como Pré-carregamento;
- Campos de pré-carregamento podem se tornar Referência ou Duplicar após uma alteração de componente.

#### Selecionar tudo

- Seleciona todos os **campos de Duplicação** e **campos de Referência**.

#### Os seguintes campos serão filtrados do registro selecionado como modelo de dados:

- As chaves primárias de dados de associação duplicados são filtradas; chaves primárias para Referência e Pré-carregamento não são filtradas;
- Chaves estrangeiras;
- Campos que não permitem duplicatas (Único);
- Campos de ordenação;
- Campos de numeração automática (Sequence);
- Senha;
- Criado por, Criado em;
- Atualizado por último por, Atualizado em.

#### Sincronizar campos do formulário

- Analisa automaticamente os campos configurados no bloco de formulário atual em campos do modelo;
- Após modificar os campos do bloco de formulário (por exemplo, ajustar componentes de campos de associação), você deve sincronizar novamente para garantir a consistência.