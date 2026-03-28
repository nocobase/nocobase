:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/template-print/syntax/formatters/number-formatting).
:::

### Formatação de números

#### 1. :formatN(precision)

##### Explicação da sintaxe
Formata números de acordo com as configurações de localização.  
Parâmetros:
- precision: casas decimais  
  Para formatos ODS/XLSX, o número de casas decimais exibidas é determinado pelo editor de texto; outros formatos dependem deste parâmetro.

##### Exemplo
```
'10':formatN()         // Saída "10.000"
'1000.456':formatN()   // Saída "1,000.456"
```

##### Resultado
O número é exibido de acordo com a precisão especificada e o formato de localização.


#### 2. :round(precision)

##### Explicação da sintaxe
Realiza o arredondamento do número, o parâmetro especifica o número de casas decimais.

##### Exemplo
```
10.05123:round(2)      // Saída 10.05
1.05:round(1)          // Saída 1.1
```

##### Resultado
A saída é o valor após o arredondamento.


#### 3. :add(value)

##### Explicação da sintaxe
Soma o número atual com o valor especificado.  
Parâmetros:
- value: o número a ser somado

##### Exemplo
```
1000.4:add(2)         // Saída 1002.4
'1000.4':add('2')      // Saída 1002.4
```

##### Resultado
A saída é o valor após a soma.


#### 4. :sub(value)

##### Explicação da sintaxe
Subtrai o valor especificado do número atual.  
Parâmetros:
- value: subtraendo

##### Exemplo
```
1000.4:sub(2)         // Saída 998.4
'1000.4':sub('2')      // Saída 998.4
```

##### Resultado
A saída é o valor após a subtração.


#### 5. :mul(value)

##### Explicação da sintaxe
Multiplica o número atual pelo valor especificado.  
Parâmetros:
- value: multiplicador

##### Exemplo
```
1000.4:mul(2)         // Saída 2000.8
'1000.4':mul('2')      // Saída 2000.8
```

##### Resultado
A saída é o valor após a multiplicação.


#### 6. :div(value)

##### Explicação da sintaxe
Divide o número atual pelo valor especificado.  
Parâmetros:
- value: divisor

##### Exemplo
```
1000.4:div(2)         // Saída 500.2
'1000.4':div('2')      // Saída 500.2
```

##### Resultado
A saída é o valor após a divisão.


#### 7. :mod(value)

##### Explicação da sintaxe
Calcula o módulo (resto da divisão) do número atual pelo valor especificado.  
Parâmetros:
- value: o divisor do módulo

##### Exemplo
```
4:mod(2)              // Saída 0
3:mod(2)              // Saída 1
```

##### Resultado
A saída é o resultado da operação de módulo.


#### 8. :abs

##### Explicação da sintaxe
Retorna o valor absoluto do número.

##### Exemplo
```
-10:abs()             // Saída 10
-10.54:abs()          // Saída 10.54
10.54:abs()           // Saída 10.54
'-200':abs()          // Saída 200
```

##### Resultado
A saída é o valor absoluto.


#### 9. :ceil

##### Explicação da sintaxe
Arredonda para cima, ou seja, retorna o menor inteiro que é maior ou igual ao número atual.

##### Exemplo
```
10.05123:ceil()       // Saída 11
1.05:ceil()           // Saída 2
-1.05:ceil()          // Saída -1
```

##### Resultado
A saída é o número inteiro após o arredondamento.


#### 10. :floor

##### Explicação da sintaxe
Arredonda para baixo, ou seja, retorna o maior inteiro que é menor ou igual ao número atual.

##### Exemplo
```
10.05123:floor()      // Saída 10
1.05:floor()          // Saída 1
-1.05:floor()         // Saída -2
```

##### Resultado
A saída é o número inteiro após o arredondamento.


#### 11. :int

##### Explicação da sintaxe
Converte o número em um inteiro (não recomendado).

##### Exemplo e resultado
Depende da situação específica da conversão.


#### 12. :toEN

##### Explicação da sintaxe
Converte o número para o formato inglês (ponto decimal é '.'), não recomendado.

##### Exemplo e resultado
Depende da situação específica da conversão.


#### 13. :toFixed

##### Explicação da sintaxe
Converte o número em uma string, mantendo apenas o número especificado de casas decimais, não recomendado.

##### Exemplo e resultado
Depende da situação específica da conversão.


#### 14. :toFR

##### Explicação da sintaxe
Converte o número para o formato francês (ponto decimal é ','), não recomendado.

##### Exemplo e resultado
Depende da situação específica da conversão.