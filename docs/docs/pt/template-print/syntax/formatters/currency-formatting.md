:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/template-print/syntax/formatters/currency-formatting).
:::

### Formatação de Moeda

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### Explicação da Sintaxe
Formata números de moeda, podendo especificar o número de casas decimais ou um formato de saída específico.  
Parâmetros:
- precisionOrFormat: Parâmetro opcional, pode ser tanto um número (especificando as casas decimais) quanto um identificador de formato específico:
  - Inteiro: altera a precisão decimal padrão
  - `'M'`: exibe apenas o nome principal da moeda
  - `'L'`: exibe o número acompanhado pelo símbolo da moeda (padrão)
  - `'LL'`: exibe o número acompanhado pelo nome principal da moeda
- targetCurrency: Opcional, código da moeda de destino (em maiúsculas, como USD, EUR), substituirá as configurações globais

##### Exemplo
```
'1000.456':formatC()      // Saída "$2,000.91"
'1000.456':formatC('M')    // Saída "dollars"
'1':formatC('M')           // Saída "dollar"
'1000':formatC('L')        // Saída "$2,000.00"
'1000':formatC('LL')       // Saída "2,000.00 dollars"
```

##### Resultado
O resultado da saída baseia-se nas opções da API e nas configurações de taxa de câmbio.


#### 2. :convCurr(target, source)

##### Explicação da Sintaxe
Converte um número de uma moeda para outra. A taxa de câmbio pode ser enviada via opções da API ou configurada globalmente.  
Se você não especificar os parâmetros, a conversão é feita automaticamente de `options.currencySource` para `options.currencyTarget`.  
Parâmetros:
- target: Opcional, código da moeda de destino (o padrão é igual a `options.currencyTarget`)
- source: Opcional, código da moeda de origem (o padrão é igual a `options.currencySource`)

##### Exemplo
```
10:convCurr()              // Saída 20
1000:convCurr()            // Saída 2000
1000:convCurr('EUR')        // Saída 1000
1000:convCurr('USD')        // Saída 2000
1000:convCurr('USD', 'USD') // Saída 1000
```

##### Resultado
A saída é o valor monetário convertido.