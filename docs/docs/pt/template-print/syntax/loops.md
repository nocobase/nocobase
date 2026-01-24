:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

## Processamento de Loop

O processamento de loop é usado para renderizar dados repetidamente de arrays ou objetos, definindo marcadores de início e fim para identificar o conteúdo que precisa ser repetido. Abaixo, descrevemos alguns cenários comuns.

### Iterando sobre Arrays

#### 1. Descrição da Sintaxe

- Use a tag `{d.array[i].propriedade}` para definir o item atual do loop e use `{d.array[i+1].propriedade}` para especificar o próximo item, delimitando a área do loop.
- Durante o loop, a primeira linha (a parte `[i]`) é automaticamente usada como modelo para repetição; você só precisa escrever o exemplo do loop uma vez no modelo.

Formato de sintaxe de exemplo:
```
{d.nomeDoArray[i].propriedade}
{d.nomeDoArray[i+1].propriedade}
```

#### 2. Exemplo: Loop Simples em Array

##### Dados
```json
{
  "cars": [
    { "brand": "Toyota", "id": 1 },
    { "brand": "Hyundai", "id": 2 },
    { "brand": "BMW",    "id": 3 },
    { "brand": "Peugeot","id": 4 }
  ]
}
```

##### Modelo
```
Carsid
{d.cars[i].brand}{d.cars[i].id}
{d.cars[i+1].brand}
```

##### Resultado
```
Carsid
Toyota1
Hyundai2
BMW3
Peugeot4
```

#### 3. Exemplo: Loop de Array Aninhado

Ideal para casos em que um array contém outros arrays aninhados; o aninhamento pode ter níveis infinitos.

##### Dados
```json
[
  {
    "brand": "Toyota",
    "models": [
      { "size": "Prius 4", "power": 125 },
      { "size": "Prius 5", "power": 139 }
    ]
  },
  {
    "brand": "Kia",
    "models": [
      { "size": "EV4", "power": 450 },
      { "size": "EV6", "power": 500 }
    ]
  }
]
```

##### Modelo
```
{d[i].brand}

Models
{d[i].models[i].size} - {d[i].models[i].power}
{d[i].models[i+1].size}

{d[i+1].brand}
```

##### Resultado
```
Toyota

Models
Prius 4 - 125
Prius 5 - 139

Kia
```

#### 4. Exemplo: Loop Bidirecional (Recurso Avançado, v4.8.0+)

Loops bidirecionais permitem iterar simultaneamente sobre linhas e colunas, sendo ideais para gerar tabelas de comparação e outros layouts complexos (observação: atualmente, alguns formatos são oficialmente suportados apenas em modelos DOCX, HTML e MD).

##### Dados
```json
{
  "titles": [
    { "name": "Kia" },
    { "name": "Toyota" },
    { "name": "Hopium" }
  ],
  "cars": [
    { "models": [ "EV3", "Prius 1", "Prototype" ] },
    { "models": [ "EV4", "Prius 2", "" ] },
    { "models": [ "EV6", "Prius 3", "" ] }
  ]
}
```

##### Modelo
```
{d.titles[i].name}{d.titles[i+1].name}
{d.cars[i].models[i]}{d.cars[i].models[i+1]}
{d.cars[i+1].models[i]}
```

##### Resultado
```
KiaToyotaHopium
EV3Prius 1Prototype
EV4Prius 2
EV6Prius 3
```

#### 5. Exemplo: Acessando Valores do Iterador de Loop (v4.0.0+)

Dentro de um loop, você pode acessar diretamente o índice da iteração atual, o que facilita o atendimento a requisitos de formatação especiais.

##### Exemplo de Modelo
```
{d[i].cars[i].other.wheels[i].tire.subObject:add(.i):add(..i):add(...i)}
```

> Observação: O número de pontos indica o nível do índice (por exemplo, `.i` representa o nível atual, enquanto `..i` representa o nível anterior). Atualmente, existe um problema com a ordem inversa; consulte a documentação oficial para mais detalhes.

### Iterando sobre Objetos

#### 1. Descrição da Sintaxe

- Para propriedades em um objeto, use `.att` para obter o nome da propriedade e `.val` para obter o valor da propriedade.
- Durante a iteração, cada item de propriedade é percorrido um por um.

Formato de sintaxe de exemplo:
```
{d.nomeDoObjeto[i].att}  // nome da propriedade
{d.nomeDoObjeto[i].val}  // valor da propriedade
```

#### 2. Exemplo: Iteração de Propriedades de Objeto

##### Dados
```json
{
  "myObject": {
    "paul": "10",
    "jack": "20",
    "bob":  "30"
  }
}
```

##### Modelo
```
People namePeople age
{d.myObject[i].att}{d.myObject[i].val}
{d.myObject[i+1].att}{d.myObject[i+1].val}
```

##### Resultado
```
People namePeople age
paul10
jack20
bob30
```

### Ordenação

Com o recurso de ordenação, você pode classificar dados de arrays diretamente no modelo.

#### 1. Descrição da Sintaxe: Ordenação Crescente

- Use um atributo como critério de ordenação na tag do loop. O formato da sintaxe é:
  ```
  {d.array[atributoDeOrdenacao, i].propriedade}
  {d.array[atributoDeOrdenacao+1, i+1].propriedade}
  ```
- Para múltiplos critérios de ordenação, separe os atributos com vírgulas dentro dos colchetes.

#### 2. Exemplo: Ordenação por Atributo Numérico

##### Dados
```json
{
  "cars": [
    { "brand": "Ferrari", "power": 3 },
    { "brand": "Peugeot", "power": 1 },
    { "brand": "BMW",     "power": 2 },
    { "brand": "Lexus",   "power": 1 }
  ]
}
```

##### Modelo
```
Cars
{d.cars[power, i].brand}
{d.cars[power+1, i+1].brand}
```

##### Resultado
```
Cars
Peugeot
Lexus
BMW
Ferrari
```

#### 3. Exemplo: Ordenação por Múltiplos Atributos

##### Dados
```json
{
  "cars": [
    { "brand": "Ferrari", "power": 3, "sub": { "size": 1 } },
    { "brand": "Aptera",  "power": 1, "sub": { "size": 20 } },
    { "brand": "Peugeot", "power": 1, "sub": { "size": 20 } },
    { "brand": "BMW",     "power": 2, "sub": { "size": 1 } },
    { "brand": "Kia",     "power": 1, "sub": { "size": 10 } }
  ]
}
```

##### Modelo
```
Cars
{d.cars[power, sub.size, i].brand}
{d.cars[power+1, sub.size+1, i+1].brand}
```

##### Resultado
```
Cars
Kia
Aptera
Peugeot
BMW
Ferrari
```

### Filtragem

A filtragem é usada para remover linhas de um loop com base em condições específicas.

#### 1. Descrição da Sintaxe: Filtragem Numérica

- Adicione condições na tag do loop (por exemplo, `age > 19`). O formato da sintaxe é:
  ```
  {d.array[i, condicao].propriedade}
  ```

#### 2. Exemplo: Filtragem Numérica

##### Dados
```json
[
  { "name": "John",   "age": 20 },
  { "name": "Eva",    "age": 18 },
  { "name": "Bob",    "age": 25 },
  { "name": "Charly", "age": 30 }
]
```

##### Modelo
```
People
{d[i, age > 19, age < 30].name}
{d[i+1, age > 19, age < 30].name}
```

##### Resultado
```
People
John
Bob
```

#### 3. Descrição da Sintaxe: Filtragem de String

- Especifique condições de string usando aspas simples. Por exemplo:
  ```
  {d.array[i, type='rocket'].name}
  ```

#### 4. Exemplo: Filtragem de String

##### Dados
```json
[
  { "name": "Falcon 9",    "type": "rocket" },
  { "name": "Model S",     "type": "car" },
  { "name": "Model 3",     "type": "car" },
  { "name": "Falcon Heavy","type": "rocket" }
]
```

##### Modelo
```
People
{d[i, type='rocket'].name}
{d[i+1, type='rocket'].name}
```

##### Resultado
```
People
Falcon 9
Falcon Heavy
```

#### 5. Descrição da Sintaxe: Filtrar os Primeiros N Itens

- Você pode usar o índice do loop `i` para filtrar os primeiros N elementos. Por exemplo:
  ```
  {d.array[i, i < N].propriedade}
  ```

#### 6. Exemplo: Filtrando os Dois Primeiros Itens

##### Dados
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Modelo
```
People
{d[i, i < 2].name}
{d[i+1, i < 2].name}
```

##### Resultado
```
People
Falcon 9
Model S
```

#### 7. Descrição da Sintaxe: Excluir os Últimos N Itens

- Use a indexação negativa `i` para representar itens a partir do final. Por exemplo:
  - `{d.array[i=-1].propriedade}` recupera o último item.
  - `{d.array[i, i!=-1].propriedade}` exclui o último item.

#### 8. Exemplo: Excluindo o Último e os Dois Últimos Itens

##### Dados
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Modelo
```
Último item: {d[i=-1].name}

Excluindo o último item:
{d[i, i!=-1].name}
{d[i+1, i!=-1].name}

Excluindo os dois últimos itens:
{d[i, i<-2].name}
{d[i+1, i<-2].name}
```

##### Resultado
```
Último item: Falcon Heavy

Excluindo o último item:
Falcon 9
Model S
Model 3

Excluindo os dois últimos itens:
Falcon 9
Model S
```

#### 9. Descrição da Sintaxe: Filtragem Inteligente

- Usando blocos de condição inteligentes, você pode ocultar uma linha inteira com base em condições complexas. Por exemplo:
  ```
  {d.array[i].propriedade:ifIN('palavra-chave'):drop(row)}
  ```

#### 10. Exemplo: Filtragem Inteligente

##### Dados
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Modelo
```
People
{d[i].name}
{d[i].name:ifIN('Falcon'):drop(row)}
{d[i+1].name}
```

##### Resultado
```
People
Model S
Model 3
```
(Observação: As linhas que contêm "Falcon" no modelo são removidas pela condição de filtragem inteligente.)

### Deduplicação

#### 1. Descrição da Sintaxe

- Usando um iterador personalizado, você pode obter itens únicos (não duplicados) com base no valor de uma propriedade. A sintaxe é semelhante a um loop normal, mas ignora automaticamente os itens duplicados.

Formato de exemplo:
```
{d.array[propriedade].propriedade}
{d.array[propriedade+1].propriedade}
```

#### 2. Exemplo: Selecionando Dados Únicos

##### Dados
```json
[
  { "type": "car",   "brand": "Hyundai" },
  { "type": "plane", "brand": "Airbus" },
  { "type": "plane", "brand": "Boeing" },
  { "type": "car",   "brand": "Toyota" }
]
```

##### Modelo
```
Vehicles
{d[type].brand}
{d[type+1].brand}
```

##### Resultado
```
Vehicles
Hyundai
Airbus
```