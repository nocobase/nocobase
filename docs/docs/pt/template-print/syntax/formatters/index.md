:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

## Formatadores

Formatadores são usados para converter dados brutos em texto de fácil leitura. Eles são aplicados aos dados usando dois pontos (`:`) e podem ser encadeados, de modo que a saída de um formatador se torna a entrada para o próximo. Alguns formatadores suportam parâmetros constantes ou parâmetros dinâmicos.

### Visão Geral

#### 1. Explicação da Sintaxe
A forma básica de invocar um formatador é a seguinte:
```
{d.propriedade:formatador1:formatador2(...)}
```  
Por exemplo, para converter a string `"JOHN"` para `"John"`, o formatador `lowerCase` é usado primeiro para transformar todas as letras em minúsculas, e então `ucFirst` é usado para colocar a primeira letra em maiúscula.

#### 2. Exemplo
Dados:
```json
{
  "name": "JOHN",
  "birthday": "2000-01-31"
}
```
Modelo:
```
My name is {d.name:lowerCase:ucFirst}. I was born on {d.birthday:formatD(LL)}.
```

#### 3. Resultado
Após a renderização, a saída é:
```
My name is John. I was born on January 31, 2000.
```

### Parâmetros Constantes

#### 1. Explicação da Sintaxe
Muitos formatadores suportam um ou mais parâmetros constantes, que são separados por vírgulas e colocados entre parênteses para modificar a saída. Por exemplo, `:prepend(myPrefix)` adicionará "myPrefix" na frente do texto.  
**Atenção:** Se o parâmetro contiver vírgulas ou espaços, ele deve ser envolvido por aspas simples, por exemplo: `prepend('my prefix')`.

#### 2. Exemplo
Exemplo de modelo (veja o uso específico do formatador para mais detalhes).

#### 3. Resultado
A saída terá o prefixo especificado adicionado na frente do texto.

### Parâmetros Dinâmicos

#### 1. Explicação da Sintaxe
Os formatadores também suportam parâmetros dinâmicos. Esses parâmetros começam com um ponto (`.`) e não são envolvidos por aspas.  
Existem duas formas de especificar parâmetros dinâmicos:
- **Caminho JSON Absoluto:** Começa com `d.` ou `c.` (referindo-se aos dados raiz ou dados suplementares).
- **Caminho JSON Relativo:** Começa com um único ponto (`.`), indicando que a propriedade é procurada a partir do objeto pai atual.

Por exemplo:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}
```
Também pode ser escrito como um caminho relativo:
```
{d.subObject.qtyB:add(.qtyC)}
```
Se você precisar acessar dados de um nível superior (pai ou acima), pode usar múltiplos pontos:
```
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}
```

#### 2. Exemplo
Dados:
```json
{
  "id": 10,
  "qtyA": 20,
  "subObject": {
    "qtyB": 5,
    "qtyC": 3
  },
  "subArray": [{
    "id": 1000,
    "qtyE": 3
  }]
}
```
Uso no Modelo:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}      // Resultado: 8 (5 + 3)
{d.subObject.qtyB:add(.qtyC)}                   // Resultado: 8
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}        // Resultado: 28 (5 + 20 + 3)
{d.subArray[0].qtyE:add(..subObject.qtyC)}       // Resultado: 6 (3 + 3)
```

#### 3. Resultado
Os exemplos resultam em 8, 8, 28 e 6, respectivamente.

> **Atenção:** O uso de iteradores personalizados ou filtros de array como parâmetros dinâmicos não é permitido, por exemplo:
> ```
> {d.subObject.qtyB:add(..subArray[i].qtyE)}
> {d.subObject.qtyB:add(d.subArray[i].qtyE)}
> ```