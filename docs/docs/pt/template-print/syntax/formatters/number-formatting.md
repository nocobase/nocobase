:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

### Formatação de Números

#### 1. :formatN(precision)

##### Explicação da Sintaxe
Formata um número de acordo com as configurações de localização.
Parâmetro:
- **precision:** O número de casas decimais.
  Para formatos ODS/XLSX, o número de casas decimais exibidas é determinado pelo editor de texto; para outros formatos, este parâmetro é utilizado.

##### Exemplo
```
// Ambiente de exemplo: opções da API { "lang": "en-us" }
'10':formatN()         // Saída: "10.000"
'1000.456':formatN()   // Saída: "1,000.456"
```

##### Resultado
O número é exibido de acordo com a precisão e o formato de localização especificados.

#### 2. :round(precision)

##### Explicação da Sintaxe
Arredonda o número para o número de casas decimais especificado.

##### Exemplo
```
10.05123:round(2)      // Saída: 10.05
1.05:round(1)          // Saída: 1.1
```

##### Resultado
A saída é o número arredondado com a precisão fornecida.

#### 3. :add(value)

##### Explicação da Sintaxe
Adiciona o valor especificado ao número atual.
Parâmetro:
- **value:** O número a ser adicionado.

##### Exemplo
```
1000.4:add(2)         // Saída: 1002.4
'1000.4':add('2')      // Saída: 1002.4
```

##### Resultado
A saída é a soma do número atual com o valor especificado.

#### 4. :sub(value)

##### Explicação da Sintaxe
Subtrai o valor especificado do número atual.
Parâmetro:
- **value:** O número a ser subtraído.

##### Exemplo
```
1000.4:sub(2)         // Saída: 998.4
'1000.4':sub('2')      // Saída: 998.4
```

##### Resultado
A saída é o número atual menos o valor especificado.

#### 5. :mul(value)

##### Explicação da Sintaxe
Multiplica o número atual pelo valor especificado.
Parâmetro:
- **value:** O multiplicador.

##### Exemplo
```
1000.4:mul(2)         // Saída: 2000.8
'1000.4':mul('2')      // Saída: 2000.8
```

##### Resultado
A saída é o produto do número atual pelo valor especificado.

#### 6. :div(value)

##### Explicação da Sintaxe
Divide o número atual pelo valor especificado.
Parâmetro:
- **value:** O divisor.

##### Exemplo
```
1000.4:div(2)         // Saída: 500.2
'1000.4':div('2')      // Saída: 500.2
```

##### Resultado
A saída é o resultado da divisão.

#### 7. :mod(value)

##### Explicação da Sintaxe
Calcula o módulo (resto) do número atual dividido pelo valor especificado.
Parâmetro:
- **value:** O divisor do módulo.

##### Exemplo
```
4:mod(2)              // Saída: 0
3:mod(2)              // Saída: 1
```

##### Resultado
A saída é o resto da operação de módulo.

#### 8. :abs

##### Explicação da Sintaxe
Retorna o valor absoluto do número.

##### Exemplo
```
-10:abs()             // Saída: 10
-10.54:abs()          // Saída: 10.54
10.54:abs()           // Saída: 10.54
'-200':abs()          // Saída: 200
```

##### Resultado
A saída é o valor absoluto do número de entrada.

#### 9. :ceil

##### Explicação da Sintaxe
Arredonda o número para cima, retornando o menor inteiro que é maior ou igual ao número atual.

##### Exemplo
```
10.05123:ceil()       // Saída: 11
1.05:ceil()           // Saída: 2
-1.05:ceil()          // Saída: -1
```

##### Resultado
A saída é o número arredondado para o inteiro mais próximo (para cima).

#### 10. :floor

##### Explicação da Sintaxe
Arredonda o número para baixo, retornando o maior inteiro que é menor ou igual ao número atual.

##### Exemplo
```
10.05123:floor()      // Saída: 10
1.05:floor()          // Saída: 1
-1.05:floor()         // Saída: -2
```

##### Resultado
A saída é o número arredondado para o inteiro mais próximo (para baixo).

#### 11. :int

##### Explicação da Sintaxe
Converte o número para um inteiro (não recomendado para uso).

##### Exemplo e Resultado
Depende do caso de conversão específico.

#### 12. :toEN

##### Explicação da Sintaxe
Converte o número para o formato inglês (usando '.' como separador decimal). Não recomendado para uso.

##### Exemplo e Resultado
Depende do caso de conversão específico.

#### 13. :toFixed

##### Explicação da Sintaxe
Converte o número para uma string, mantendo apenas o número especificado de casas decimais. Não recomendado para uso.

##### Exemplo e Resultado
Depende do caso de conversão específico.

#### 14. :toFR

##### Explicação da Sintaxe
Converte o número para o formato francês (usando ',' como separador decimal). Não recomendado para uso.

##### Exemplo e Resultado
Depende do caso de conversão específico.