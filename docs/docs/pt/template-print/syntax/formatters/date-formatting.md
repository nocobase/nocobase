:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/template-print/syntax/formatters/date-formatting).
:::

### Formatação de Data

#### 1. :formatD(patternOut, patternIn)

##### Explicação da Sintaxe
Formata uma data, aceitando um padrão de formato de saída `patternOut` e um padrão de formato de entrada `patternIn` (o padrão é ISO 8601).

##### Exemplos Comuns
```
{d.createdAt:formatD(YYYY-MM-DD)}           // Saída 2024-01-15
{d.createdAt:formatD(YYYY年M月D日)}          // Saída 2024年1月15日
{d.updatedAt:formatD(YYYY年M月D日 HH:mm)}    // Saída 2024年1月15日 14:30
{d.orderDate:formatD(YYYY/MM/DD HH:mm:ss)}  // Saída 2024/01/15 14:30:25
{d.birthday:formatD(M月D日)}                 // Saída 1月15日
{d.meetingTime:formatD(HH:mm)}              // Saída 14:30
{d.deadline:formatD(YYYY年M月D日 dddd)}      // Saída 2024年1月15日 Segunda-feira
```

##### Mais Exemplos de Formato
```
'20160131':formatD(L)      // Saída 01/31/2016
'20160131':formatD(LL)     // Saída January 31, 2016
'20160131':formatD(LLLL)   // Saída Sunday, January 31, 2016 12:00 AM
'20160131':formatD(dddd)   // Saída Sunday
```

##### Resultado
A saída é uma string de data no formato especificado.


#### 2. :addD(amount, unit, patternIn)

##### Explicação da Sintaxe
Adiciona uma quantidade de tempo especificada a uma data. Unidades suportadas: day, week, month, quarter, year, hour, minute, second, millisecond.  
Parâmetros:
- amount: A quantidade a ser adicionada
- unit: Unidade de tempo (não diferencia maiúsculas de minúsculas)
- patternIn: Opcional, formato de entrada, o padrão é ISO8601

##### Exemplo
```
'2017-05-10T15:57:23.769561+03:00':addD('3', 'day')    // Saída "2017-05-13T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':addD('3', 'month')      // Saída "2017-08-10T12:57:23.769Z"
'20160131':addD('3', 'day')       // Saída "2016-02-03T00:00:00.000Z"
'20160131':addD('3', 'month')     // Saída "2016-04-30T00:00:00.000Z"
'31-2016-01':addD('3', 'month', 'DD-YYYY-MM')  // Saída "2016-04-30T00:00:00.000Z"
```

##### Resultado
A saída é a nova data após a adição do tempo.


#### 3. :subD(amount, unit, patternIn)

##### Explicação da Sintaxe
Subtrai uma quantidade de tempo especificada de uma data. Parâmetros iguais ao `addD`.

##### Exemplo
```
'2017-05-10T15:57:23.769561+03:00':subD('3', 'day')    // Saída "2017-05-07T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':subD('3', 'month')      // Saída "2017-02-10T12:57:23.769Z"
'20160131':subD('3', 'day')       // Saída "2016-01-28T00:00:00.000Z"
'20160131':subD('3', 'month')     // Saída "2015-10-31T00:00:00.000Z"
'31-2016-01':subD('3', 'month', 'DD-YYYY-MM')  // Saída "2015-10-31T00:00:00.000Z"
```

##### Resultado
A saída é a nova data após a subtração do tempo.


#### 4. :startOfD(unit, patternIn)

##### Explicação da Sintaxe
Define a data para o momento inicial da unidade de tempo especificada.  
Parâmetros:
- unit: Unidade de tempo
- patternIn: Opcional, formato de entrada

##### Exemplo
```
'2017-05-10T15:57:23.769561+03:00':startOfD('day')    // Saída "2017-05-10T00:00:00.000Z"
'2017-05-10 15:57:23.769561+03:00':startOfD('month')      // Saída "2017-05-01T00:00:00.000Z"
'20160131':startOfD('day')       // Saída "2016-01-31T00:00:00.000Z"
'20160131':startOfD('month')     // Saída "2016-01-01T00:00:00.000Z"
'31-2016-01':startOfD('month', 'DD-YYYY-MM')  // Saída "2016-01-01T00:00:00.000Z"
```

##### Resultado
A saída é a string da data no momento inicial.


#### 5. :endOfD(unit, patternIn)

##### Explicação da Sintaxe
Define a data para o momento final da unidade de tempo especificada.  
Parâmetros iguais aos anteriores.

##### Exemplo
```
'2017-05-10T15:57:23.769561+03:00':endOfD('day')    // Saída "2017-05-10T23:59:59.999Z"
'2017-05-10 15:57:23.769561+03:00':endOfD('month')      // Saída "2017-05-31T23:59:59.999Z"
'20160131':endOfD('day')       // Saída "2016-01-31T23:59:59.999Z"
'20160131':endOfD('month')     // Saída "2016-01-31T23:59:59.999Z"
'31-2016-01':endOfD('month', 'DD-YYYY-MM')  // Saída "2016-01-31T23:59:59.999Z"
```

##### Resultado
A saída é a string da data no momento final.


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
- toDate: Data de destino
- unit: Unidade de saída
- patternFromDate: Opcional, formato da data de início
- patternToDate: Opcional, formato da data de destino

##### Exemplo
```
'20101001':diffD('20101201')              // Saída 5270400000
'20101001':diffD('20101201', 'second')      // Saída 5270400
'20101001':diffD('20101201', 's')           // Saída 5270400
'20101001':diffD('20101201', 'm')           // Saída 87840
'20101001':diffD('20101201', 'h')           // Saída 1464
'20101001':diffD('20101201', 'weeks')       // Saída 8
'20101001':diffD('20101201', 'days')        // Saída 61
'2010+10+01':diffD('2010=12=01', 'ms', 'YYYY+MM+DD', 'YYYY=MM=DD')  // Saída 5270400000
```

##### Resultado
A saída é a diferença de tempo entre as duas datas, convertida conforme a unidade especificada.


#### 7. :convDate(patternIn, patternOut)

##### Explicação da Sintaxe
Converte uma data de um formato para outro. (Não recomendado para uso)  
Parâmetros:
- patternIn: Formato da data de entrada
- patternOut: Formato da data de saída

##### Exemplo
```
'20160131':convDate('YYYYMMDD', 'L')      // Saída "01/31/2016"
'20160131':convDate('YYYYMMDD', 'LL')     // Saída "January 31, 2016"
'20160131':convDate('YYYYMMDD', 'LLLL')   // Saída "Sunday, January 31, 2016 12:00 AM"
'20160131':convDate('YYYYMMDD', 'dddd')   // Saída "Sunday"
1410715640:convDate('X', 'LLLL')          // Saída "Sunday, September 14, 2014 7:27 PM"
```

##### Resultado
A saída é a string da data convertida.


#### 8. Padrões de Formato de Data
Descrição de formatos de data comuns (consulte a descrição do DayJS):
- `X`: Timestamp Unix (segundos), ex: 1360013296
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
- `Z`, `ZZ`: Desvio UTC, ex: +05:00 ou +0500
- `A`, `a`: AM/PM
- `Q`: Trimestre (1-4)
- `Do`: Dia do mês com ordinal, como 1st, 2nd, …
- Para outros formatos, consulte a documentação completa.  
  Além disso, existem formatos localizados baseados no idioma: como `LT`, `LTS`, `L`, `LL`, `LLL`, `LLLL`, etc.