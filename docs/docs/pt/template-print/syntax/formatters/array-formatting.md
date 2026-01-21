:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

### Formatação de Array

#### 1. :arrayJoin(separator, index, count)

##### Explicação da Sintaxe
Une um array de strings ou números em uma única string.
Parâmetros:
- `separator`: O delimitador (o padrão é uma vírgula `,`).
- `index`: Opcional; o índice inicial a partir do qual a união deve começar.
- `count`: Opcional; o número de itens a serem unidos a partir do `index` (pode ser negativo para contar a partir do final).

##### Exemplo
```
['homer','bart','lisa']:arrayJoin()              // Retorna "homer, bart, lisa"
['homer','bart','lisa']:arrayJoin(' | ')          // Retorna "homer | bart | lisa"
['homer','bart','lisa']:arrayJoin('')              // Retorna "homerbartlisa"
[10,50]:arrayJoin()                               // Retorna "10, 50"
[]:arrayJoin()                                    // Retorna ""
null:arrayJoin()                                  // Retorna null
{}:arrayJoin()                                    // Retorna {}
20:arrayJoin()                                    // Retorna 20
undefined:arrayJoin()                             // Retorna undefined
['homer','bart','lisa']:arrayJoin('', 1)          // Retorna "bartlisa"
['homer','bart','lisa']:arrayJoin('', 1, 1)       // Retorna "bart"
['homer','bart','lisa']:arrayJoin('', 1, 2)       // Retorna "bartlisa"
['homer','bart','lisa']:arrayJoin('', 0, -1)      // Retorna "homerbart"
```

##### Resultado
O resultado é uma string criada pela união dos elementos do array, conforme os parâmetros especificados.

#### 2. :arrayMap(objSeparator, attSeparator, attributes)

##### Explicação da Sintaxe
Transforma um array de objetos em uma string. Ele não processa objetos ou arrays aninhados.
Parâmetros:
- `objSeparator`: O separador entre os objetos (o padrão é `, `).
- `attSeparator`: O separador entre os atributos do objeto (o padrão é `:`).
- `attributes`: Opcional; uma lista de atributos do objeto a serem exibidos.

##### Exemplo
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap()
// Retorna "2:homer, 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' - ')
// Retorna "2:homer - 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|')
// Retorna "2|homer ; 3|bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|', 'id')
// Retorna "2 ; 3"

[{'id':2,'name':'homer','obj':{'id':20},'arr':[12,23]}]:arrayMap()
// Retorna "2:homer"

['homer','bart','lisa']:arrayMap()    // Retorna "homer, bart, lisa"
[10,50]:arrayMap()                    // Retorna "10, 50"
[]:arrayMap()                         // Retorna ""
null:arrayMap()                       // Retorna null
{}:arrayMap()                         // Retorna {}
20:arrayMap()                         // Retorna 20
undefined:arrayMap()                  // Retorna undefined
```

##### Resultado
O resultado é uma string gerada pelo mapeamento e união dos elementos do array, ignorando o conteúdo de objetos aninhados.

#### 3. :count(start)

##### Explicação da Sintaxe
Conta o número da linha em um array e retorna o número da linha atual.
Por exemplo:
```
{d[i].id:count()}
```
Independentemente do valor de `id`, ele retorna a contagem da linha atual.
A partir da v4.0.0, este formatador foi substituído internamente por `:cumCount`.

Parâmetro:
- `start`: Opcional; o valor inicial para a contagem.

##### Exemplo e Resultado
Ao ser utilizado, o resultado exibirá o número da linha de acordo com a sequência dos elementos do array.