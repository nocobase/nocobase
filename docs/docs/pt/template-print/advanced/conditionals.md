:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

## Condições

As condições permitem que você controle dinamicamente a exibição ou ocultação de conteúdo no documento com base nos valores dos dados. Existem três formas principais de escrever condições:

- **Condições inline**: Saem diretamente um texto (ou o substituem por outro).
- **Blocos condicionais**: Exibem ou ocultam uma seção do documento, sendo adequados para várias tags, parágrafos, tabelas, etc.
- **Condições inteligentes**: Removem ou mantêm elementos específicos (como linhas, parágrafos, imagens, etc.) diretamente com uma única tag, usando uma sintaxe mais concisa.

Todas as condições começam com um formatador de avaliação lógica (por exemplo, ifEQ, ifGT, etc.), seguido por formatadores de ação (como show, elseShow, drop, keep, etc.).

### Visão Geral

Os operadores lógicos e formatadores de ação suportados nas condições incluem:

- **Operadores Lógicos**
  - **ifEQ(value)**: Verifica se o dado é igual ao valor especificado.
  - **ifNE(value)**: Verifica se o dado é diferente do valor especificado.
  - **ifGT(value)**: Verifica se o dado é maior que o valor especificado.
  - **ifGTE(value)**: Verifica se o dado é maior ou igual ao valor especificado.
  - **ifLT(value)**: Verifica se o dado é menor que o valor especificado.
  - **ifLTE(value)**: Verifica se o dado é menor ou igual ao valor especificado.
  - **ifIN(value)**: Verifica se o dado está contido em um array ou string.
  - **ifNIN(value)**: Verifica se o dado NÃO está contido em um array ou string.
  - **ifEM()**: Verifica se o dado está vazio (por exemplo, null, undefined, string vazia, array vazio ou objeto vazio).
  - **ifNEM()**: Verifica se o dado NÃO está vazio.
  - **ifTE(type)**: Verifica se o tipo de dado é igual ao tipo especificado (por exemplo, "string", "number", "boolean", etc.).
  - **and(value)**: "E" lógico, usado para conectar múltiplas condições.
  - **or(value)**: "OU" lógico, usado para conectar múltiplas condições.

- **Formatadores de Ação**
  - **:show(text) / :elseShow(text)**: Usados em condições inline para exibir diretamente o texto especificado.
  - **:hideBegin / :hideEnd** e **:showBegin / :showEnd**: Usados em blocos condicionais para ocultar ou exibir seções do documento.
  - **:drop(element) / :keep(element)**: Usados em condições inteligentes para remover ou manter elementos específicos do documento.

As seções a seguir apresentam a sintaxe detalhada, exemplos e resultados para cada uso.

### Condições Inline

#### 1. :show(text) / :elseShow(text)

##### Sintaxe
```
{data:condition:show(texto)}
{data:condition:show(texto):elseShow(texto_alternativo)}
```

##### Exemplo
Suponha que os dados sejam:
```json
{
  "val2": 2,
  "val5": 5
}
```
O template é o seguinte:
```
val2 = {d.val2:ifGT(3):show('high')}
val2 = {d.val2:ifGT(3):show('high'):elseShow('low')}
val5 = {d.val5:ifGT(3):show('high')}
```

##### Resultado
```
val2 = 2
val2 = low
val5 = high
```

#### 2. Switch Case (Múltiplas Condições)

##### Sintaxe
Use formatadores de condição consecutivos para construir uma estrutura semelhante a um switch-case:
```
{data:ifEQ(valor1):show(resultado1):ifEQ(valor2):show(resultado2):elseShow(resultado_padrao)}
```
Ou obtenha o mesmo resultado com o operador `or`:
```
{data:ifEQ(valor1):show(resultado1):or(data):ifEQ(valor2):show(resultado2):elseShow(resultado_padrao)}
```

##### Exemplo
Dados:
```json
{
  "val1": 1,
  "val2": 2,
  "val3": 3
}
```
Template:
```
val1 = {d.val1:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val2 = {d.val2:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val3 = {d.val3:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
```

##### Resultado
```
val1 = A
val2 = B
val3 = C
```

#### 3. Condições com Múltiplas Variáveis

##### Sintaxe
Use os operadores lógicos `and`/`or` para testar múltiplas variáveis:
```
{data1:ifEQ(condicao1):and(.data2):ifEQ(condicao2):show(resultado):elseShow(resultado_alternativo)}
{data1:ifEQ(condicao1):or(.data2):ifEQ(condicao2):show(resultado):elseShow(resultado_alternativo)}
```

##### Exemplo
Dados:
```json
{
  "val2": 2,
  "val5": 5
}
```
Template:
```
and = {d.val2:ifEQ(1):and(.val5):ifEQ(5):show(OK):elseShow(KO)}
or = {d.val2:ifEQ(1):or(.val5):ifEQ(5):show(OK):elseShow(KO)}
```

##### Resultado
```
and = KO
or = OK
```

### Operadores Lógicos e Formatadores

Nas seções a seguir, os formatadores descritos usam a sintaxe de condição inline com o seguinte formato:
```
{data:formatador(parametro):show(texto):elseShow(texto_alternativo)}
```

#### 1. :and(value)

##### Sintaxe
```
{data:ifEQ(valor):and(novos_dados_ou_condicao):ifGT(outro_valor):show(texto):elseShow(texto_alternativo)}
```

##### Exemplo
```
{d.car:ifEQ('delorean'):and(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Resultado
Se `d.car` for igual a `'delorean'` E `d.speed` for maior que 80, a saída será `TravelInTime`; caso contrário, a saída será `StayHere`.

#### 2. :or(value)

##### Sintaxe
```
{data:ifEQ(valor):or(novos_dados_ou_condicao):ifGT(outro_valor):show(texto):elseShow(texto_alternativo)}
```

##### Exemplo
```
{d.car:ifEQ('delorean'):or(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Resultado
Se `d.car` for igual a `'delorean'` OU `d.speed` for maior que 80, a saída será `TravelInTime`; caso contrário, a saída será `StayHere`.

#### 3. :ifEM()

##### Sintaxe
```
{data:ifEM():show(texto):elseShow(texto_alternativo)}
```

##### Exemplo
```
null:ifEM():show('Result true'):elseShow('Result false')
[]:ifEM():show('Result true'):elseShow('Result false')
```

##### Resultado
Para `null` ou um array vazio, a saída é `Result true`; caso contrário, é `Result false`.

#### 4. :ifNEM()

##### Sintaxe
```
{data:ifNEM():show(texto):elseShow(texto_alternativo)}
```

##### Exemplo
```
0:ifNEM():show('Result true'):elseShow('Result false')
'homer':ifNEM():show('Result true'):elseShow('Result false')
```

##### Resultado
Para dados não vazios (como o número 0 ou a string 'homer'), a saída é `Result true`; para dados vazios, a saída é `Result false`.

#### 5. :ifEQ(value)

##### Sintaxe
```
{data:ifEQ(valor):show(texto):elseShow(texto_alternativo)}
```

##### Exemplo
```
100:ifEQ(100):show('Result true'):elseShow('Result false')
'homer':ifEQ('homer'):show('Result true'):elseShow('Result false')
```

##### Resultado
Se o dado for igual ao valor especificado, a saída é `Result true`; caso contrário, é `Result false`.

#### 6. :ifNE(value)

##### Sintaxe
```
{data:ifNE(valor):show(texto):elseShow(texto_alternativo)}
```

##### Exemplo
```
100:ifNE(100):show('Result true'):elseShow('Result false')
100:ifNE(101):show('Result true'):elseShow('Result false')
```

##### Resultado
O primeiro exemplo resulta em `Result false`, enquanto o segundo resulta em `Result true`.

#### 7. :ifGT(value)

##### Sintaxe
```
{data:ifGT(valor):show(texto):elseShow(texto_alternativo)}
```

##### Exemplo
```
1234:ifGT(1):show('Result true'):elseShow('Result false')
-23:ifGT(19):show('Result true'):elseShow('Result false')
```

##### Resultado
O primeiro exemplo resulta em `Result true`, e o segundo em `Result false`.

#### 8. :ifGTE(value)

##### Sintaxe
```
{data:ifGTE(valor):show(texto):elseShow(texto_alternativo)}
```

##### Exemplo
```
50:ifGTE(-29):show('Result true'):elseShow('Result false')
1:ifGTE(768):show('Result true'):elseShow('Result false')
```

##### Resultado
O primeiro exemplo resulta em `Result true`, enquanto o segundo resulta em `Result false`.

#### 9. :ifLT(value)

##### Sintaxe
```
{data:ifLT(valor):show(texto):elseShow(texto_alternativo)}
```

##### Exemplo
```
-23:ifLT(19):show('Result true'):elseShow('Result false')
1290:ifLT(768):show('Result true'):elseShow('Result false')
```

##### Resultado
O primeiro exemplo resulta em `Result true`, e o segundo em `Result false`.

#### 10. :ifLTE(value)

##### Sintaxe
```
{data:ifLTE(valor):show(texto):elseShow(texto_alternativo)}
```

##### Exemplo
```
5:ifLTE(5):show('Result true'):elseShow('Result false')
1290:ifLTE(768):show('Result true'):elseShow('Result false')
```

##### Resultado
O primeiro exemplo resulta em `Result true`, e o segundo em `Result false`.

#### 11. :ifIN(value)

##### Sintaxe
```
{data:ifIN(valor):show(texto):elseShow(texto_alternativo)}
```

##### Exemplo
```
'car is broken':ifIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifIN(2):show('Result true'):elseShow('Result false')
```

##### Resultado
Ambos os exemplos resultam em `Result true` (porque a string contém 'is', e o array contém 2).

#### 12. :ifNIN(value)

##### Sintaxe
```
{data:ifNIN(valor):show(texto):elseShow(texto_alternativo)}
```

##### Exemplo
```
'car is broken':ifNIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifNIN(2):show('Result true'):elseShow('Result false')
```

##### Resultado
O primeiro exemplo resulta em `Result false` (porque a string contém 'is'), e o segundo exemplo resulta em `Result false` (porque o array contém 2).

#### 13. :ifTE(type)

##### Sintaxe
```
{data:ifTE('tipo'):show(texto):elseShow(texto_alternativo)}
```

##### Exemplo
```
'homer':ifTE('string'):show('Result true'):elseShow('Result false')
10.5:ifTE('number'):show('Result true'):elseShow('Result false')
```

##### Resultado
O primeiro exemplo resulta em `Result true` (já que 'homer' é uma string), e o segundo resulta em `Result true` (já que 10.5 é um número).

### Blocos Condicionais

Blocos condicionais são usados para exibir ou ocultar uma seção do documento, geralmente para envolver múltiplas tags ou um bloco de texto inteiro.

#### 1. :showBegin / :showEnd

##### Sintaxe
```
{data:ifEQ(condicao):showBegin}
Conteúdo do bloco do documento
{data:showEnd}
```

##### Exemplo
Dados:
```json
{
  "toBuy": true
}
```
Template:
```
Banana{d.toBuy:ifEQ(true):showBegin}
Apple
Pineapple
{d.toBuy:showEnd}Grapes
```

##### Resultado
Quando a condição é atendida, o conteúdo intermediário é exibido:
```
Banana
Apple
Pineapple
Grapes
```

#### 2. :hideBegin / :hideEnd

##### Sintaxe
```
{data:ifEQ(condicao):hideBegin}
Conteúdo do bloco do documento
{data:hideEnd}
```

##### Exemplo
Dados:
```json
{
  "toBuy": true
}
```
Template:
```
Banana{d.toBuy:ifEQ(true):hideBegin}
Apple
Pineapple
{d.toBuy:hideEnd}Grapes
```

##### Resultado
Quando a condição é atendida, o conteúdo intermediário é ocultado, resultando em:
```
Banana
Grapes
```