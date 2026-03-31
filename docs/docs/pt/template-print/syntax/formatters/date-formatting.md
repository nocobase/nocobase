:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

### Formatação de Datas

#### 1. :formatD(patternOut, patternIn)

##### Explicação da Sintaxe
Formata uma data, aceitando um padrão de formato de saída (`patternOut`) e um padrão de formato de entrada opcional (`patternIn`), que por padrão é ISO 8601. Você pode ajustar o fuso horário e o idioma usando as opções `options.timezone` e `options.lang`.

##### Exemplo
```
// Exemplo de ambiente: opções da API { "lang": "en-us", "timezone": "Europe/Paris" }
'20160131':formatD(L)      // Retorna 01/31/2016
'20160131':formatD(LL)     // Retorna January 31, 2016
'20160131':formatD(LLLL)   // Retorna Sunday, January 31, 2016 12:00 AM
'20160131':formatD(dddd)   // Retorna Sunday

// Exemplo em francês:
'2017-05-10T15:57:23.769561+03:00':formatD(LLLL)  // Retorna mercredi 10 mai 2017 14:57
'20160131':formatD(LLLL)   // Retorna dimanche 31 janvier 2016 00:00
1410715640:formatD(LLLL, X) // Retorna dimanche 14 septembre 2014 19:27
```

##### Resultado
A saída é a data formatada conforme especificado.

#### 2. :addD(amount, unit, patternIn)

##### Explicação da Sintaxe
Adiciona uma quantidade de tempo especificada a uma data. As unidades suportadas incluem: day, week, month, quarter, year, hour, minute, second, millisecond.
Parâmetros:
- `amount`: A quantidade a ser adicionada.
- `unit`: A unidade de tempo (não diferencia maiúsculas de minúsculas).
- `patternIn`: Opcional, o formato de entrada (padrão é ISO8601).

##### Exemplo
```
// Exemplo de ambiente: opções da API { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':addD('3', 'day')    // Retorna "2017-05-13T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':addD('3', 'month')      // Retorna "2017-08-10T12:57:23.769Z"
'20160131':addD('3', 'day')       // Retorna "2016-02-03T00:00:00.000Z"
'20160131':addD('3', 'month')     // Retorna "2016-04-30T00:00:00.000Z"
'31-2016-01':addD('3', 'month', 'DD-YYYY-MM')  // Retorna "2016-04-30T00:00:00.000Z"
```

##### Resultado
A saída é a nova data após a adição do tempo especificado.

#### 3. :subD(amount, unit, patternIn)

##### Explicação da Sintaxe
Subtrai uma quantidade de tempo especificada de uma data. Os parâmetros são os mesmos que em `addD`.

##### Exemplo
```
// Exemplo de ambiente: opções da API { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':subD('3', 'day')    // Retorna "2017-05-07T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':subD('3', 'month')      // Retorna "2017-02-10T12:57:23.769Z"
'20160131':subD('3', 'day')       // Retorna "2016-01-28T00:00:00.000Z"
'20160131':subD('3', 'month')     // Retorna "2015-10-31T00:00:00.000Z"
'31-2016-01':subD('3', 'month', 'DD-YYYY-MM')  // Retorna "2015-10-31T00:00:00.000Z"
```

##### Resultado
A saída é a nova data após a subtração do tempo especificado.

#### 4. :startOfD(unit, patternIn)

##### Explicação da Sintaxe
Define a data para o início da unidade de tempo especificada.
Parâmetros:
- `unit`: A unidade de tempo.
- `patternIn`: Opcional, o formato de entrada.

##### Exemplo
```
// Exemplo de ambiente: opções da API { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':startOfD('day')    // Retorna "2017-05-10T00:00:00.000Z"
'2017-05-10 15:57:23.769561+03:00':startOfD('month')      // Retorna "2017-05-01T00:00:00.000Z"
'20160131':startOfD('day')       // Retorna "2016-01-31T00:00:00.000Z"
'20160131':startOfD('month')     // Retorna "2016-01-01T00:00:00.000Z"
'31-2016-01':startOfD('month', 'DD-YYYY-MM')  // Retorna "2016-01-01T00:00:00.000Z"
```

##### Resultado
A saída é a data definida para o início da unidade especificada.

#### 5. :endOfD(unit, patternIn)

##### Explicação da Sintaxe
Define a data para o final da unidade de tempo especificada. Os parâmetros são os mesmos que para `startOfD`.

##### Exemplo
```
// Exemplo de ambiente: opções da API { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':endOfD('day')    // Retorna "2017-05-10T23:59:59.999Z"
'2017-05-10 15:57:23.769561+03:00':endOfD('month')      // Retorna "2017-05-31T23:59:59.999Z"
'20160131':endOfD('day')       // Retorna "2016-01-31T23:59:59.999Z"
'20160131':endOfD('month')     // Retorna "2016-01-31T23:59:59.999Z"
'31-2016-01':endOfD('month', 'DD-YYYY-MM')  // Retorna "2016-01-31T23:59:59.999Z"
```

##### Resultado
A saída é a data definida para o final da unidade especificada.

#### 6. :diffD(toDate, unit, patternFromDate, patternToDate)

##### Explicação da Sintaxe
Calcula a diferença entre duas datas e a retorna na unidade especificada. As unidades de saída suportadas incluem:
- `day(s)` ou `d`
- `week(s)` ou `w`
- `quarter(s)` ou `Q`
- `month(s)` ou `M`
- `year(s)` ou `y`
- `hour(s)` ou `h`
- `minute(s)` ou `m`
- `second(s)` ou `s`
- `millisecond(s)` ou `ms` (unidade padrão)

Parâmetros:
- `toDate`: A data de destino.
- `unit`: A unidade para a saída.
- `patternFromDate`: Opcional, o formato da data de início.
- `patternToDate`: Opcional, o formato da data de destino.

##### Exemplo
```
'20101001':diffD('20101201')              // Retorna 5270400000
'20101001':diffD('20101201', 'second')      // Retorna 5270400
'20101001':diffD('20101201', 's')           // Retorna 5270400
'20101001':diffD('20101201', 'm')           // Retorna 87840
'20101001':diffD('20101201', 'h')           // Retorna 1464
'20101001':diffD('20101201', 'weeks')       // Retorna 8
'20101001':diffD('20101201', 'days')        // Retorna 61
'2010+10+01':diffD('2010=12=01', 'ms', 'YYYY+MM+DD', 'YYYY=MM=DD')  // Retorna 5270400000
```

##### Resultado
A saída é a diferença de tempo entre as duas datas, convertida para a unidade especificada.

#### 7. :convDate(patternIn, patternOut)

##### Explicação da Sintaxe
Converte uma data de um formato para outro (não recomendado para uso).
Parâmetros:
- `patternIn`: O formato de entrada da data.
- `patternOut`: O formato de saída da data.

##### Exemplo
```
// Exemplo de ambiente: opções da API { "lang": "en", "timezone": "Europe/Paris" }
'20160131':convDate('YYYYMMDD', 'L')      // Retorna "01/31/2016"
'20160131':convDate('YYYYMMDD', 'LL')     // Retorna "January 31, 2016"
'20160131':convDate('YYYYMMDD', 'LLLL')   // Retorna "Sunday, January 31, 2016 12:00 AM"
'20160131':convDate('YYYYMMDD', 'dddd')   // Retorna "Sunday"
1410715640:convDate('X', 'LLLL')          // Retorna "Sunday, September 14, 2014 7:27 PM"
// Exemplo em francês:
'20160131':convDate('YYYYMMDD', 'LLLL')   // Retorna "dimanche 31 janvier 2016 00:00"
'20160131':convDate('YYYYMMDD', 'dddd')   // Retorna "dimanche"
```

##### Resultado
A saída é a data convertida para o formato especificado.

#### 8. Padrões de Formato de Data
Símbolos comuns de formato de data (consulte a documentação do DayJS):
- `X`: Timestamp Unix (em segundos), ex: 1360013296
- `x`: Timestamp Unix em milissegundos, ex: 1360013296123
- `YY`: Ano com dois dígitos, ex: 18
- `YYYY`: Ano com quatro dígitos, ex: 2018
- `M`, `MM`, `MMM`, `MMMM`: Mês (número, dois dígitos, abreviado, nome completo)
- `D`, `DD`: Dia (número, dois dígitos)
- `d`, `dd`, `ddd`, `dddd`: Dia da semana (número, mínimo, abreviado, nome completo)
- `H`, `HH`, `h`, `hh`: Hora (formato 24 horas ou 12 horas)
- `m`, `mm`: Minuto
- `s`, `ss`: Segundo
- `SSS`: Milissegundo (3 dígitos)
- `Z`, `ZZ`: Offset UTC, ex: +05:00 ou +0500
- `A`, `a`: AM/PM
- `Q`: Trimestre (1-4)
- `Do`: Dia do mês com ordinal, ex: 1º, 2º, ...
- Para outros formatos, consulte a documentação completa.
  Além disso, existem formatos localizados baseados no idioma, como `LT`, `LTS`, `L`, `LL`, `LLL`, `LLLL`, etc.