:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

### Formatação de Moeda

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### Explicação da Sintaxe
Formata um número de moeda, permitindo que você especifique o número de casas decimais ou um formato de saída específico.

Parâmetros:
- **precisionOrFormat:** Um parâmetro opcional que pode ser um número (especificando o número de casas decimais) ou um especificador de formato:
  - Um número inteiro: altera a precisão decimal padrão.
  - `'M'`: exibe apenas o nome principal da moeda.
  - `'L'`: exibe o número junto com o símbolo da moeda (padrão).
  - `'LL'`: exibe o número junto com o nome principal da moeda.
- **targetCurrency:** Opcional; o código da moeda de destino (em maiúsculas, por exemplo, USD, EUR) que substitui as configurações globais.

##### Exemplo
```
// Ambiente de exemplo: opções da API { "lang": "en-us", "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
'1000.456':formatC()      // Saída: "$2,000.91"
'1000.456':formatC('M')    // Saída: "dollars"
'1':formatC('M')           // Saída: "dollar"
'1000':formatC('L')        // Saída: "$2,000.00"
'1000':formatC('LL')       // Saída: "2,000.00 dollars"

// Exemplo em francês (com configurações de ambiente diferentes):
'1000.456':formatC()      // Saída: "2 000,91 ..."  
'1000.456':formatC()      // Quando as moedas de origem e destino são as mesmas, a saída é "1 000,46 €"
```

##### Resultado
O resultado depende das opções da API e das configurações da taxa de câmbio.

#### 2. :convCurr(target, source)

##### Explicação da Sintaxe
Converte um número de uma moeda para outra. A taxa de câmbio pode ser passada através das opções da API ou definida globalmente.

Se nenhum parâmetro for especificado, a conversão é realizada automaticamente de `options.currencySource` para `options.currencyTarget`.

Parâmetros:
- **target:** Opcional; o código da moeda de destino (o padrão é `options.currencyTarget`).
- **source:** Opcional; o código da moeda de origem (o padrão é `options.currencySource`).

##### Exemplo
```
// Ambiente de exemplo: opções da API { "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
10:convCurr()              // Saída: 20
1000:convCurr()            // Saída: 2000
1000:convCurr('EUR')        // Saída: 1000
1000:convCurr('USD')        // Saída: 2000
1000:convCurr('USD', 'USD') // Saída: 1000
```

##### Resultado
A saída é o valor da moeda convertido.