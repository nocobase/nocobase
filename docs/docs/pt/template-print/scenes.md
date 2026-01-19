# Usando o recurso 'Impressão de Modelo' para gerar Contratos de Fornecimento e Compra

Em cenários de cadeia de suprimentos ou comércio, muitas vezes é necessário gerar rapidamente um "Contrato de Fornecimento e Compra" padronizado e preencher dinamicamente o conteúdo com base em informações de **fontes de dados**, como compradores, vendedores e detalhes de produtos. A seguir, usaremos um caso de uso simplificado de "Contrato" como exemplo para mostrar a você como configurar e usar o recurso "Impressão de Modelo" para mapear informações de dados para os espaços reservados nos modelos de contrato, gerando automaticamente o documento final do contrato.

---

## 1. Visão Geral do Contexto e da Estrutura de Dados

Em nosso exemplo, existem aproximadamente as seguintes **coleções** principais (omitindo outros campos irrelevantes):

- **parties**: Armazena informações de unidades ou indivíduos da Parte A/Parte B, incluindo nome, endereço, pessoa de contato, telefone, etc.
- **contracts**: Armazena registros de contrato específicos, incluindo número do contrato, chaves estrangeiras de comprador/vendedor, informações do signatário, datas de início/fim, conta bancária, etc.
- **contract_line_items**: Usado para armazenar vários itens sob este contrato (nome do produto, especificação, quantidade, preço unitário, data de entrega, etc.)

![template_print-2025-11-01-16-34-04](https://static-docs.nocobase.com/template_print-2025-11-01-16-34-04.png)

Como o sistema atual suporta apenas a impressão de registros individuais, clicaremos em "Imprimir" na página "Detalhes do Contrato", e o sistema recuperará automaticamente o registro de `contracts` correspondente, bem como as `parties` associadas e outras informações, preenchendo-as em documentos Word ou PDF.

---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


## 2. Preparação

### 2.1 Preparação do Plugin

Atenção, nosso **plugin** "Impressão de Modelo" é comercial e precisa ser adquirido e ativado antes que as operações de impressão possam ser realizadas.

![template_print-2025-11-01-17-31-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-51.png)

**Confirmar Ativação do Plugin:**

Em qualquer página, crie um bloco de detalhes (por exemplo, usuários) e verifique se há uma opção de configuração de modelo correspondente na configuração de ação:

![template_print-2025-11-01-17-32-09](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-09.png)

![template_print-2025-11-01-17-32-30](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-30.png)

### 2.2 Criação de Coleções

Crie as **coleções** de entidade principal, de contrato e de itens de produto projetadas acima (selecione apenas os campos principais).

#### Coleção de Contratos (Contracts)

| Categoria do Campo | Nome de Exibição do Campo | Nome do Campo | Interface do Campo |
|--------------------|---------------------------|---------------|--------------------|
| **Campos PK e FK** |                           |               |                    |
|                    | ID                        | id            | Inteiro            |
|                    | ID do Comprador           | buyer_id      | Inteiro            |
|                    | ID do Vendedor            | seller_id     | Inteiro            |
| **Campos de Associação** |                           |               |                    |
|                    | Itens do Contrato         | contract_items| Um para muitos     |
|                    | Comprador (Parte A)       | buyer         | Muitos para um     |
|                    | Vendedor (Parte B)        | seller        | Muitos para um     |
| **Campos Gerais**  |                           |               |                    |
|                    | Número do Contrato        | contract_no   | Texto de linha única |
|                    | Data de Início da Entrega | start_date    | Data/Hora (com fuso horário) |
|                    | Data de Fim da Entrega    | end_date      | Data/Hora (com fuso horário) |
|                    | Taxa de Depósito (%)      | deposit_ratio | Porcentagem        |
|                    | Dias de Pagamento Após a Entrega | payment_days_after | Inteiro |
|                    | Nome da Conta Bancária (Beneficiário) | bank_account_name | Texto de linha única |
|                    | Nome do Banco             | bank_name     | Texto de linha única |
|                    | Número da Conta Bancária (Beneficiário) | bank_account_number | Texto de linha única |
|                    | Valor Total               | total_amount  | Número             |
|                    | Códigos de Moeda          | currency_codes| Seleção única      |
|                    | Taxa de Saldo (%)         | balance_ratio | Porcentagem        |
|                    | Dias de Saldo Após a Entrega | balance_days_after | Inteiro |
|                    | Local de Entrega          | delivery_place| Texto longo        |
|                    | Nome do Signatário da Parte A | party_a_signatory_name | Texto de linha única |
|                    | Título do Signatário da Parte A | party_a_signatory_title | Texto de linha única |
|                    | Nome do Signatário da Parte B | party_b_signatory_name | Texto de linha única |
|                    | Título do Signatário da Parte B | party_b_signatory_title | Texto de linha única |
| **Campos do Sistema** |                           |               |                    |
|                    | Criado Em                 | createdAt     | Criado em          |
|                    | Criado Por                | createdBy     | Criado por         |
|                    | Última Atualização Em     | updatedAt     | Última atualização em |
|                    | Última Atualização Por    | updatedBy     | Última atualização por |

#### Coleção de Partes (Parties)

| Categoria do Campo | Nome de Exibição do Campo | Nome do Campo | Interface do Campo |
|--------------------|---------------------------|---------------|--------------------|
| **Campos PK e FK** |                           |               |                    |
|                    | ID                        | id            | Inteiro            |
| **Campos Gerais**  |                           |               |                    |
|                    | Nome da Parte             | party_name    | Texto de linha única |
|                    | Endereço                  | address       | Texto de linha única |
|                    | Pessoa de Contato         | contact_person| Texto de linha única |
|                    | Telefone de Contato       | contact_phone | Telefone           |
|                    | Cargo                     | position      | Texto de linha única |
|                    | E-mail                    | email         | E-mail             |
|                    | Site                      | website       | URL                |
| **Campos do Sistema** |                           |               |                    |
|                    | Criado Em                 | createdAt     | Criado em          |
|                    | Criado Por                | createdBy     | Criado por         |
|                    | Última Atualização Em     | updatedAt     | Última atualização em |
|                    | Última Atualização Por    | updatedBy     | Última atualização por |

#### Coleção de Itens de Linha do Contrato (Contract Line Items)

| Categoria do Campo | Nome de Exibição do Campo | Nome do Campo | Interface do Campo |
|--------------------|---------------------------|---------------|--------------------|
| **Campos PK e FK** |                           |               |                    |
|                    | ID                        | id            | Inteiro            |
|                    | ID do Contrato            | contract_id   | Inteiro            |
| **Campos de Associação** |                           |               |                    |
|                    | Contrato                  | contract      | Muitos para um     |
| **Campos Gerais**  |                           |               |                    |
|                    | Nome do Produto           | product_name  | Texto de linha única |
|                    | Especificação / Modelo    | spec          | Texto de linha única |
|                    | Quantidade                | quantity      | Inteiro            |
|                    | Preço Unitário            | unit_price    | Número             |
|                    | Valor Total               | total_amount  | Número             |
|                    | Data de Entrega           | delivery_date | Data/Hora (com fuso horário) |
|                    | Observação                | remark        | Texto longo        |
| **Campos do Sistema** |                           |               |                    |
|                    | Criado Em                 | createdAt     | Criado em          |
|                    | Criado Por                | createdBy     | Criado por         |
|                    | Última Atualização Em     | updatedAt     | Última atualização em |
|                    | Última Atualização Por    | updatedBy     | Última atualização por |

### 2.3 Configuração da Interface

**Inserir Dados de Exemplo:**

![template_print-2025-11-01-17-32-59](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-59.png)

![template_print-2025-11-01-17-33-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-11.png)

**Configure as regras de vinculação abaixo para calcular automaticamente o preço total e o pagamento do saldo:**

![template_print-2025-11-01-17-33-21](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-21.png)

**Crie um bloco de visualização, confirme os dados e ative a ação "Impressão de Modelo":**

![template_print-2025-11-01-17-33-33](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-33.png)

### 2.4 Configuração do Plugin de Impressão de Modelo

![template_print-2025-11-01-17-33-45](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-45.png)

Adicione uma configuração de modelo, como "Contrato de Fornecimento e Compra":

![template_print-2025-11-01-17-33-57](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-57.png)

![template_print-2025-11-01-17-34-08](https://static-docs.nocobase.com/template_print-2025-11-01-17-34-08.png)

Em seguida, acesse a aba "Lista de Campos", onde você pode ver todos os campos do objeto atual. Depois de clicar em "Copiar", você pode começar a preencher o modelo.

![template_print-2025-11-01-17-35-19](https://static-docs.nocobase.com/template_print-2025-11-01-17-35-19.png)

### 2.5 Preparação do Arquivo de Contrato

**Arquivo de Modelo de Contrato Word**

Prepare o modelo de contrato (.docx) com antecedência, por exemplo: `SUPPLY AND PURCHASE CONTRACT.docx`

Neste exemplo, fornecemos uma versão simplificada do "Contrato de Fornecimento e Compra", que contém espaços reservados de exemplo:

- `{d.contract_no}`: Número do contrato
- `{d.buyer.party_name}`、`{d.seller.party_name}`: Nomes do comprador e vendedor
- `{d.total_amount}`: Valor total do contrato
- E outros espaços reservados como "pessoa de contato", "endereço", "telefone", etc.

Em seguida, você pode copiar os campos da sua **coleção** e colá-los no Word.

---

## 3. Tutorial de Variáveis de Modelo

### 3.1 Preenchimento de Variáveis Básicas e Propriedades de Objeto Associado

**Preenchimento de Campos Básicos:**

Por exemplo, o número do contrato no topo, ou o objeto da entidade que assina o contrato. Você clica em copiar e cola diretamente no espaço em branco correspondente no contrato.

![template_print-2025-11-01-17-31-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-11.gif)

![template_print-2025-11-01-17-30-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-30-51.png)

### 3.2 Formatação de Dados

#### Formatação de Data

Nos modelos, muitas vezes precisamos formatar campos, especialmente campos de data. O formato de data copiado diretamente geralmente é longo (como Qua Jan 01 2025 00:00:00 GMT) e precisa ser formatado para exibir o estilo que desejamos.

Para campos de data, você pode usar a função `formatD()` para especificar o formato de saída:

```
{nome_do_campo:formatD(estilo_de_formatação)}
```

**Exemplo:**

Por exemplo, se o campo original que você copiou é `{d.created_at}`, e você precisa formatar a data para o formato `2025-01-01`, então modifique este campo para:

```
{d.created_at:formatD(YYYY-MM-DD)}  // Saída: 2025-01-01
```

**Estilos comuns de formatação de data:**

- `YYYY` - Ano (quatro dígitos)
- `MM` - Mês (dois dígitos)
- `DD` - Dia (dois dígitos)
- `HH` - Hora (formato 24 horas)
- `mm` - Minutos
- `ss` - Segundos

**Exemplo 2:**

```
{d.created_at:formatD(YYYY-MM-DD HH:mm:ss)}  // Saída: 2025-01-01 14:30:00
```

#### Formatação de Valores Monetários

Suponha que haja um campo de valor monetário, como `{d.total_amount}` no contrato. Você pode usar a função `formatN()` para formatar números, especificando casas decimais e separador de milhares.

**Sintaxe:**

```
{nome_do_campo:formatN(casas_decimais, separador_de_milhares)}
```

- **Casas decimais**: Você pode especificar quantas casas decimais manter. Por exemplo, `2` significa duas casas decimais.
- **Separador de milhares**: Especifique se deve usar o separador de milhares, geralmente `true` ou `false`.

**Exemplo 1: Formatar valor monetário com separador de milhares e duas casas decimais**

```
{d.amount:formatN(2, true)}  // Saída: 1.234,56
```

Isso formatará `d.amount` para duas casas decimais e adicionará um separador de milhares.

**Exemplo 2: Formatar valor monetário para inteiro sem casas decimais**

```
{d.amount:formatN(0, true)}  // Saída: 1.235
```

Isso formatará `d.amount` para um número inteiro e adicionará um separador de milhares.

**Exemplo 3: Formatar valor monetário com duas casas decimais, mas sem separador de milhares**

```
{d.amount:formatN(2, false)}  // Saída: 1234.56
```

Aqui, o separador de milhares é desativado e apenas duas casas decimais são mantidas.

**Outras necessidades de formatação de valor monetário:**

- **Símbolo da moeda**: O próprio Carbone não oferece funções diretas de formatação de símbolo da moeda, mas você pode adicionar símbolos da moeda diretamente nos dados ou modelos. Por exemplo:
  ```
  {d.amount:formatN(2, true)} R$  // Saída: 1.234,56 R$
  ```

#### Formatação de String

Para campos de string, você pode usar `:upperCase` para especificar o formato do texto, como conversão de maiúsculas e minúsculas.

**Sintaxe:**

```
{nome_do_campo:upperCase:outros_comandos}
```

**Métodos de conversão comuns:**

- `upperCase` - Converter para todas maiúsculas
- `lowerCase` - Converter para todas minúsculas
- `upperCase:ucFirst` - Capitalizar primeira letra

**Exemplo:**

```
{d.party_a_signatory_name:upperCase}  // Saída: JOHN DOE
```

### 3.3 Impressão em Loop

#### Como Imprimir Listas de Objetos Filhos (como Detalhes do Produto)

Quando precisamos imprimir uma tabela contendo vários subitens (por exemplo, detalhes do produto), geralmente precisamos usar a impressão em loop. Dessa forma, o sistema gerará uma linha de conteúdo para cada item da lista até que todos os itens sejam percorridos.

Suponha que temos uma lista de produtos (por exemplo, `contract_items`), que contém vários objetos de produto. Cada objeto de produto tem vários atributos, como nome do produto, especificação, quantidade, preço unitário, valor total e observações.

**Passo 1: Preencher os Campos na Primeira Linha da Tabela**

Primeiro, na primeira linha da tabela (não no cabeçalho), você copia e preenche diretamente as variáveis do modelo. Essas variáveis serão substituídas pelos dados correspondentes e exibidas na saída.

Por exemplo, a primeira linha da tabela é a seguinte:

| Nome do Produto | Especificação / Modelo | Quantidade | Preço Unitário | Valor Total | Observação |
|-----------------|------------------------|------------|----------------|-------------|------------|
| {d.contract_items[i].product_name} | {d.contract_items[i].spec} | {d.contract_items[i].quantity} | {d.contract_items[i].unit_price} | {d.contract_items[i].total_amount} | {d.contract_items[i].remark} |

Aqui, `d.contract_items[i]` representa o i-ésimo item na lista de produtos, e `i` é um índice que representa a ordem do produto atual.

**Passo 2: Modificar o Índice na Segunda Linha**

Em seguida, na segunda linha da tabela, você modificará o índice do campo para `i+1` e preencherá apenas o primeiro atributo. Isso ocorre porque, durante a impressão em loop, precisamos recuperar o próximo item de dados da lista e exibi-lo na próxima linha.

Por exemplo, a segunda linha é preenchida da seguinte forma:
| Nome do Produto | Especificação / Modelo | Quantidade | Preço Unitário | Valor Total | Observação |
|-----------------|------------------------|------------|----------------|-------------|------------|
| {d.contract_items[i+1].product_name} | | | | | |

Neste exemplo, mudamos `[i]` para `[i+1]`, para que possamos obter os próximos dados do produto na lista.

**Passo 3: Impressão Automática em Loop Durante a Renderização do Modelo**

Quando o sistema processa este modelo, ele operará de acordo com a seguinte lógica:

1. A primeira linha será preenchida de acordo com os campos que você definiu no modelo.
2. Em seguida, o sistema excluirá automaticamente a segunda linha e começará a extrair dados de `d.contract_items`, preenchendo cada linha em loop no formato da tabela até que todos os detalhes do produto sejam impressos.

O `i` em cada linha será incrementado, garantindo que cada linha exiba informações de produto diferentes.

---

## 4. Carregar e Configurar o Modelo de Contrato

### 4.1 Carregar Modelo

1. Clique no botão "Adicionar modelo" e insira o nome do modelo, por exemplo, "Modelo de Contrato de Fornecimento e Compra".
2. Carregue o [arquivo de contrato Word (.docx)](https://static-docs.nocobase.com/template_print-2025-11-01-17-37-11.docx) preparado, que já contém todos os espaços reservados.

![template_print-2025-11-01-17-36-06](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-06.png)

3. Após a conclusão, o sistema listará o modelo na lista de modelos opcionais para uso futuro.
4. Clique em "Usar" para ativar este modelo.

![template_print-2025-11-01-17-36-13](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-13.png)

Neste ponto, saia do pop-up atual e clique em "Baixar modelo" para obter o modelo completo gerado.

**Dicas:**

- Se o modelo usar `.doc` ou outros formatos, pode ser necessário convertê-lo para `.docx`, dependendo do suporte do **plugin**.
- Em arquivos Word, tome cuidado para não dividir os espaços reservados em vários parágrafos ou caixas de texto, para evitar exceções de renderização.

---

Desejamos a você um bom uso! Com o recurso "Impressão de Modelo", você pode economizar muito trabalho repetitivo no gerenciamento de contratos, evitar erros de copiar e colar manualmente e alcançar a padronização e a saída automatizada de contratos.