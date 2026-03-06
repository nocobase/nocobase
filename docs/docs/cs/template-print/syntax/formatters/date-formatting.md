:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/template-print/syntax/formatters/date-formatting).
:::

### Formátování data

#### 1. :formatD(patternOut, patternIn)

##### Vysvětlení syntaxe
Formátuje datum, přijímá vzor výstupního formátu `patternOut` a vzor vstupního formátu `patternIn` (výchozí je ISO 8601).

##### Časté příklady
```
{d.createdAt:formatD(YYYY-MM-DD)}           // Výstup 2024-01-15
{d.createdAt:formatD(YYYY年M月D日)}          // Výstup 2024年1月15日
{d.updatedAt:formatD(YYYY年M月D日 HH:mm)}    // Výstup 2024年1月15日 14:30
{d.orderDate:formatD(YYYY/MM/DD HH:mm:ss)}  // Výstup 2024/01/15 14:30:25
{d.birthday:formatD(M月D日)}                 // Výstup 1月15日
{d.meetingTime:formatD(HH:mm)}              // Výstup 14:30
{d.deadline:formatD(YYYY年M月D日 dddd)}      // Výstup 2024年1月15日 星期一
```

##### Další příklady formátů
```
'20160131':formatD(L)      // Výstup 01/31/2016
'20160131':formatD(LL)     // Výstup January 31, 2016
'20160131':formatD(LLLL)   // Výstup Sunday, January 31, 2016 12:00 AM
'20160131':formatD(dddd)   // Výstup Sunday
```

##### Výsledek
Výstupem je řetězec data v určeném formátu.


#### 2. :addD(amount, unit, patternIn)

##### Vysvětlení syntaxe
Přidá k datu určené množství času. Podporované jednotky: day, week, month, quarter, year, hour, minute, second, millisecond.  
Parametry:
- amount: Přidané množství
- unit: Časová jednotka (nerozlišuje velká a malá písmena)
- patternIn: Volitelné, vstupní formát, výchozí je ISO8601

##### Příklad
```
'2017-05-10T15:57:23.769561+03:00':addD('3', 'day')    // Výstup "2017-05-13T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':addD('3', 'month')      // Výstup "2017-08-10T12:57:23.769Z"
'20160131':addD('3', 'day')       // Výstup "2016-02-03T00:00:00.000Z"
'20160131':addD('3', 'month')     // Výstup "2016-04-30T00:00:00.000Z"
'31-2016-01':addD('3', 'month', 'DD-YYYY-MM')  // Výstup "2016-04-30T00:00:00.000Z"
```

##### Výsledek
Výstupem je nové datum po přidání času.


#### 3. :subD(amount, unit, patternIn)

##### Vysvětlení syntaxe
Odečte od data určené množství času. Parametry jsou stejné jako u `addD`.

##### Příklad
```
'2017-05-10T15:57:23.769561+03:00':subD('3', 'day')    // Výstup "2017-05-07T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':subD('3', 'month')      // Výstup "2017-02-10T12:57:23.769Z"
'20160131':subD('3', 'day')       // Výstup "2016-01-28T00:00:00.000Z"
'20160131':subD('3', 'month')     // Výstup "2015-10-31T00:00:00.000Z"
'31-2016-01':subD('3', 'month', 'DD-YYYY-MM')  // Výstup "2015-10-31T00:00:00.000Z"
```

##### Výsledek
Výstupem je nové datum po odečtení času.


#### 4. :startOfD(unit, patternIn)

##### Vysvětlení syntaxe
Nastaví datum na počáteční okamžik určené časové jednotky.  
Parametry:
- unit: Časová jednotka
- patternIn: Volitelné, vstupní formát

##### Příklad
```
'2017-05-10T15:57:23.769561+03:00':startOfD('day')    // Výstup "2017-05-10T00:00:00.000Z"
'2017-05-10 15:57:23.769561+03:00':startOfD('month')      // Výstup "2017-05-01T00:00:00.000Z"
'20160131':startOfD('day')       // Výstup "2016-01-31T00:00:00.000Z"
'20160131':startOfD('month')     // Výstup "2016-01-01T00:00:00.000Z"
'31-2016-01':startOfD('month', 'DD-YYYY-MM')  // Výstup "2016-01-01T00:00:00.000Z"
```

##### Výsledek
Výstupem je řetězec data počátečního okamžiku.


#### 5. :endOfD(unit, patternIn)

##### Vysvětlení syntaxe
Nastaví datum na koncový okamžik určené časové jednotky.  
Parametry jsou stejné jako výše.

##### Příklad
```
'2017-05-10T15:57:23.769561+03:00':endOfD('day')    // Výstup "2017-05-10T23:59:59.999Z"
'2017-05-10 15:57:23.769561+03:00':endOfD('month')      // Výstup "2017-05-31T23:59:59.999Z"
'20160131':endOfD('day')       // Výstup "2016-01-31T23:59:59.999Z"
'20160131':endOfD('month')     // Výstup "2016-01-31T23:59:59.999Z"
'31-2016-01':endOfD('month', 'DD-YYYY-MM')  // Výstup "2016-01-31T23:59:59.999Z"
```

##### Výsledek
Výstupem je řetězec data koncového okamžiku.


#### 6. :diffD(toDate, unit, patternFromDate, patternToDate)

##### Vysvětlení syntaxe
Vypočítá rozdíl mezi dvěma daty a vypíše jej v určené jednotce. Podporované výstupní jednotky zahrnují:
- `day(s)` nebo `d`
- `week(s)` nebo `w`
- `quarter(s)` nebo `Q`
- `month(s)` nebo `M`
- `year(s)` nebo `y`
- `hour(s)` nebo `h`
- `minute(s)` nebo `m`
- `second(s)` nebo `s`
- `millisecond(s)` nebo `ms` (výchozí jednotka)

Parametry:
- toDate: Cílové datum
- unit: Výstupní jednotka
- patternFromDate: Volitelné, formát počátečního data
- patternToDate: Volitelné, formát cílového data

##### Příklad
```
'20101001':diffD('20101201')              // Výstup 5270400000
'20101001':diffD('20101201', 'second')      // Výstup 5270400
'20101001':diffD('20101201', 's')           // Výstup 5270400
'20101001':diffD('20101201', 'm')           // Výstup 87840
'20101001':diffD('20101201', 'h')           // Výstup 1464
'20101001':diffD('20101201', 'weeks')       // Výstup 8
'20101001':diffD('20101201', 'days')        // Výstup 61
'2010+10+01':diffD('2010=12=01', 'ms', 'YYYY+MM+DD', 'YYYY=MM=DD')  // Výstup 5270400000
```