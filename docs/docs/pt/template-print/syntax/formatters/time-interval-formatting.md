:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/template-print/syntax/formatters/time-interval-formatting).
:::

### Formatação de intervalo de tempo

#### 1. :formatI(patternOut, patternIn)

##### Explicação da sintaxe
Formata a duração ou o intervalo, os formatos de saída suportados incluem:
- `human+`, `human` (adequado para exibição humanizada)
- e unidades como `millisecond(s)`, `second(s)`, `minute(s)`, `hour(s)`, `year(s)`, `month(s)`, `week(s)`, `day(s)` (ou suas abreviações).

Parâmetros:
- patternOut: formato de saída (por exemplo, `'second'`, `'human+'`, etc.)
- patternIn: opcional, unidade de entrada (por exemplo, `'milliseconds'`, `'s'`, etc.)

##### Exemplo
```
2000:formatI('second')       // Saída 2
2000:formatI('seconds')      // Saída 2
2000:formatI('s')            // Saída 2
3600000:formatI('minute')    // Saída 60
3600000:formatI('hour')      // Saída 1
2419200000:formatI('days')   // Saída 28

// Exibição humanizada:
2000:formatI('human')        // Saída "a few seconds"
2000:formatI('human+')       // Saída "in a few seconds"
-2000:formatI('human+')      // Saída "a few seconds ago"

// Exemplo de conversão de unidade:
60:formatI('ms', 'minute')   // Saída 3600000
4:formatI('ms', 'weeks')      // Saída 2419200000
'P1M':formatI('ms')          // Saída 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // Saída 10296.085
```

##### Resultado
O resultado da saída é exibido como a duração ou o intervalo correspondente com base no valor de entrada e na conversão de unidade.