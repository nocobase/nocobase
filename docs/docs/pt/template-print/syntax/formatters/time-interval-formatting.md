:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

### Formatação de Intervalos

#### 1. :formatI(patternOut, patternIn)

##### Explicação da Sintaxe
Formata uma duração ou um intervalo. Os formatos de saída suportados incluem:
- `human+` ou `human` (adequado para exibição humanizada)
- E unidades como `millisecond(s)`, `second(s)`, `minute(s)`, `hour(s)`, `year(s)`, `month(s)`, `week(s)`, `day(s)` (ou suas abreviações).

Parâmetros:
- **patternOut:** O formato de saída (por exemplo, `'second'` ou `'human+'`).
- **patternIn:** Opcional, a unidade de entrada (por exemplo, `'milliseconds'` ou `'s'`).

##### Exemplo
```
// Ambiente de exemplo: opções da API { "lang": "en", "timezone": "Europe/Paris" }
2000:formatI('second')       // Retorna 2
2000:formatI('seconds')      // Retorna 2
2000:formatI('s')            // Retorna 2
3600000:formatI('minute')    // Retorna 60
3600000:formatI('hour')      // Retorna 1
2419200000:formatI('days')   // Retorna 28

// Exemplo em francês:
2000:formatI('human')        // Retorna "quelques secondes"
2000:formatI('human+')       // Retorna "dans quelques secondes"
-2000:formatI('human+')      // Retorna "il y a quelques secondes"

// Exemplo em inglês:
2000:formatI('human')        // Retorna "a few seconds"
2000:formatI('human+')       // Retorna "in a few seconds"
-2000:formatI('human+')      // Retorna "a few seconds ago"

// Exemplo de conversão de unidade:
60:formatI('ms', 'minute')   // Retorna 3600000
4:formatI('ms', 'weeks')      // Retorna 2419200000
'P1M':formatI('ms')          // Retorna 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // Retorna 10296.085
```

##### Resultado
O resultado é exibido como a duração ou o intervalo correspondente, com base no valor de entrada e na conversão de unidade.