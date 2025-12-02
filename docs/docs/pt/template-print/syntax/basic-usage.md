:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

## Uso Básico

O **plugin** de Impressão de Modelos oferece várias sintaxes para você inserir dados dinâmicos e estruturas lógicas de forma flexível nos seus modelos. Abaixo, você encontra explicações detalhadas da sintaxe e exemplos de uso.

### Substituição Básica

Use placeholders no formato `{d.xxx}` para substituir dados. Por exemplo:

- `{d.title}`: Lê o campo `title` do conjunto de dados.
- `{d.date}`: Lê o campo `date` do conjunto de dados.

**Exemplo**:

Conteúdo do Modelo:
```
Prezado(a) cliente,

Obrigado(a) por adquirir nosso produto: {d.productName}.
ID do Pedido: {d.orderId}
Data do Pedido: {d.orderDate}

Desejamos que você tenha uma ótima experiência!
```

Conjunto de dados:
```json
{
  "productName": "Smart Watch",
  "orderId": "A123456789",
  "orderDate": "2025-01-01"
}
```

Resultado renderizado:
```
Prezado(a) cliente,

Obrigado(a) por adquirir nosso produto: Smart Watch.
ID do Pedido: A123456789
Data do Pedido: 2025-01-01

Desejamos que você tenha uma ótima experiência!
```

### Acessando Sub-objetos

Se o conjunto de dados contiver sub-objetos, você pode acessar as propriedades deles usando a notação de ponto.

**Sintaxe**: `{d.parent.child}`

**Exemplo**:

Conjunto de dados:
```json
{
  "customer": {
    "name": "Alex Smith",
    "contact": {
      "email": "alex.smith@example.com",
      "phone": "+1-555-012-3456"
    }
  }
}
```

Conteúdo do Modelo:
```
Nome do Cliente: {d.customer.name}
Endereço de E-mail: {d.customer.contact.email}
Número de Telefone: {d.customer.contact.phone}
```

Resultado renderizado:
```
Nome do Cliente: Alex Smith
Endereço de E-mail: alex.smith@example.com
Número de Telefone: +1-555-012-3456
```

### Acessando Arrays

Se o conjunto de dados contiver arrays, você pode usar a palavra-chave reservada `i` para acessar os elementos do array.

**Sintaxe**: `{d.arrayName[i].field}`

**Exemplo**:

Conjunto de dados:
```json
{
  "staffs": [
    { "firstname": "James", "lastname": "Anderson" },
    { "firstname": "Emily", "lastname": "Roberts" },
    { "firstname": "Michael", "lastname": "Johnson" }
  ]
}
```

Conteúdo do Modelo:
```
O sobrenome do primeiro funcionário é {d.staffs[i=0].lastname}, e o nome é {d.staffs[i=0].firstname}
```

Resultado renderizado:
```
O sobrenome do primeiro funcionário é Anderson, e o nome é James
```