:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/calculation-engine/formula).
:::

# Formula.js

[Formula.js](http://formulajs.info/) proporciona una amplia colección de funciones compatibles con Excel.

## Referencia de funciones

### Fechas

| Función | Definición | Ejemplo de llamada | Parámetros | Resultado esperado |
| :--- | :--- | :--- | :--- | :--- |
| **DATE** | Crea una fecha basada en el año, mes y día proporcionados. | `DATE(2008, 7, 8)` | Año (entero), mes (1-12), día (1-31). | Tue Jul 08 2008 00:00:00 GMT-0700 (PDT) |
| **DATEVALUE** | Convierte una fecha en formato de texto en un número de serie de fecha. | `DATEVALUE('8/22/2011')` | Cadena de texto que representa una fecha. | Mon Aug 22 2011 00:00:00 GMT-0700 (PDT) |
| **DAY** | Devuelve la parte del día de una fecha. | `DAY('15-Apr-11')` | Valor de fecha o una cadena de texto de fecha. | 15 |
| **DAYS** | Calcula el número de días entre dos fechas. | `DAYS('3/15/11', '2/1/11')` | Fecha final, fecha inicial. | 42 |
| **DAYS360** | Calcula el número de días entre dos fechas basándose en un año de 360 días. | `DAYS360('1-Jan-11', '31-Dec-11')` | Fecha inicial, fecha final. | 360 |
| **EDATE** | Devuelve la fecha que es un número especificado de meses antes o después de una fecha. | `EDATE('1/15/11', -1)` | Fecha inicial, número de meses (positivo para el futuro, negativo para el pasado). | Wed Dec 15 2010 00:00:00 GMT-0800 (PST) |
| **EOMONTH** | Devuelve el último día del mes antes o después del número especificado de meses. | `EOMONTH('1/1/11', -3)` | Fecha inicial, número de meses (positivo para el futuro, negativo para el pasado). | Sun Oct 31 2010 00:00:00 GMT-0700 (PDT) |
| **HOUR** | Devuelve la parte de la hora de un valor de tiempo. | `HOUR('7/18/2011 7:45:00 AM')` | Valor de tiempo o cadena de texto de tiempo. | 7 |
| **MINUTE** | Devuelve la parte de los minutos de un valor de tiempo. | `MINUTE('2/1/2011 12:45:00 PM')` | Valor de tiempo o cadena de texto de tiempo. | 45 |
| **ISOWEEKNUM** | Devuelve el número de semana ISO del año para una fecha determinada. | `ISOWEEKNUM('3/9/2012')` | Valor de fecha o una cadena de texto de fecha. | 10 |
| **MONTH** | Devuelve la parte del mes de una fecha. | `MONTH('15-Apr-11')` | Valor de fecha o una cadena de texto de fecha. | 4 |
| **NETWORKDAYS** | Cuenta el número de días laborables entre dos fechas, excluyendo fines de semana y días festivos opcionales. | `NETWORKDAYS('10/1/2012', '3/1/2013', ['11/22/2012'])` | Fecha inicial, fecha final, matriz opcional de días festivos. | 109 |
| **NETWORKDAYSINTL** | Cuenta los días laborables entre dos fechas, permitiendo personalizar los fines de semana y días festivos opcionales. | `NETWORKDAYSINTL('1/1/2006', '2/1/2006', 7, ['1/2/2006'])` | Fecha inicial, fecha final, modo de fin de semana, matriz opcional de días festivos. | 23 |
| **NOW** | Devuelve la fecha y hora actuales. | `NOW()` | Sin parámetros. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **SECOND** | Devuelve la parte de los segundos de un valor de tiempo. | `SECOND('2/1/2011 4:48:18 PM')` | Valor de tiempo o cadena de texto de tiempo. | 18 |
| **TIME** | Construye un valor de tiempo a partir de la hora, minuto y segundo proporcionados. | `TIME(16, 48, 10)` | Hora (0-23), minuto (0-59), segundo (0-59). | 0.7001157407407408 |
| **TIMEVALUE** | Convierte una hora en formato de texto en un número de serie de tiempo. | `TIMEVALUE('22-Aug-2011 6:35 AM')` | Cadena de texto que representa una hora. | 0.2743055555555556 |
| **TODAY** | Devuelve la fecha actual. | `TODAY()` | Sin parámetros. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **WEEKDAY** | Devuelve el número correspondiente al día de la semana. | `WEEKDAY('2/14/2008', 3)` | Valor de fecha o cadena de texto de fecha, tipo de retorno (1-3). | 3 |
| **YEAR** | Devuelve la parte del año de una fecha. | `YEAR('7/5/2008')` | Valor de fecha o una cadena de texto de fecha. | 2008 |
| **WEEKNUM** | Devuelve el número de semana en un año para una fecha determinada. | `WEEKNUM('3/9/2012', 2)` | Valor de fecha o cadena de texto de fecha, día de inicio de semana opcional (1=domingo, 2=lunes). | 11 |
| **WORKDAY** | Devuelve la fecha antes o después de un número determinado de días laborables, excluyendo fines de semana y días festivos opcionales. | `WORKDAY('10/1/2008', 151, ['11/26/2008', '12/4/2008'])` | Fecha inicial, número de días laborables, matriz opcional de días festivos. | Mon May 04 2009 00:00:00 GMT-0700 (PDT) |
| **WORKDAYINTL** | Devuelve la fecha antes o después de un número de días laborables con fines de semana personalizados y días festivos opcionales. | `WORKDAYINTL('1/1/2012', 30, 17)` | Fecha inicial, número de días laborables, modo de fin de semana. | Sun Feb 05 2012 00:00:00 GMT-0800 (PST) |
| **YEARFRAC** | Calcula la fracción de año que representa el número de días entre dos fechas. | `YEARFRAC('1/1/2012', '7/30/2012', 3)` | Fecha inicial, fecha final, base opcional (base de recuento de días). | 0.5780821917808219 |

### Finanzas

| Función | Definición | Ejemplo de llamada | Parámetros | Resultado esperado |
| :--- | :--- | :--- | :--- | :--- |
| **ACCRINT** | Calcula el interés devengado de un valor que paga intereses periódicos. | `ACCRINT('01/01/2011', '02/01/2011', '07/01/2014', 0.1, 1000, 1, 0)` | Fecha de emisión, primera fecha de interés, fecha de liquidación, tasa anual, valor nominal, frecuencia, base. | 350 |
| **CUMIPMT** | Calcula el interés acumulado pagado en una serie de pagos. | `CUMIPMT(0.1/12, 30*12, 100000, 13, 24, 0)` | Tasa, total de períodos, valor actual, período inicial, período final, tipo de pago (0=final, 1=inicio). | -9916.77251395708 |
| **CUMPRINC** | Calcula el capital acumulado pagado en una serie de pagos. | `CUMPRINC(0.1/12, 30*12, 100000, 13, 24, 0)` | Tasa, total de períodos, valor actual, período inicial, período final, tipo de pago (0=final, 1=inicio). | -614.0863271085149 |
| **DB** | Calcula la depreciación utilizando el método de saldo fijo decreciente. | `DB(1000000, 100000, 6, 1, 6)` | Costo, valor residual, vida útil, período, mes. | 159500 |
| **DDB** | Calcula la depreciación utilizando el método de saldo doble decreciente u otro método especificado. | `DDB(1000000, 100000, 6, 1, 1.5)` | Costo, valor residual, vida útil, período, factor. | 250000 |
| **DOLLARDE** | Convierte un precio expresado como una fracción en un número decimal. | `DOLLARDE(1.1, 16)` | Precio como dólar fraccionario, denominador. | 1.625 |
| **DOLLARFR** | Convierte un precio expresado como un número decimal en una fracción. | `DOLLARFR(1.625, 16)` | Precio como dólar decimal, denominador. | 1.1 |
| **EFFECT** | Calcula la tasa de interés anual efectiva. | `EFFECT(0.1, 4)` | Tasa nominal anual, número de períodos de capitalización por año. | 0.10381289062499977 |
| **FV** | Calcula el valor futuro de una inversión. | `FV(0.1/12, 10, -100, -1000, 0)` | Tasa por período, número de períodos, pago por período, valor actual, tipo de pago (0=final, 1=inicio). | 2124.874409194097 |
| **FVSCHEDULE** | Calcula el valor futuro de un capital inicial después de aplicar una serie de tasas de interés compuesto. | `FVSCHEDULE(100, [0.09,0.1,0.11])` | Capital inicial, matriz de tasas. | 133.08900000000003 |
| **IPMT** | Calcula el pago de intereses para un período específico. | `IPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | Tasa por período, período, total de períodos, valor actual, valor futuro, tipo de pago (0=final, 1=inicio). | 928.8235718400465 |
| **IRR** | Calcula la tasa interna de retorno (TIR). | `IRR([-75000,12000,15000,18000,21000,24000], 0.075)` | Matriz de flujos de caja, estimación. | 0.05715142887178447 |
| **ISPMT** | Calcula el interés pagado durante un período específico (para préstamos). | `ISPMT(0.1/12, 6, 2*12, 100000)` | Tasa por período, período, total de períodos, monto del préstamo. | -625 |
| **MIRR** | Calcula la tasa interna de retorno modificada. | `MIRR([-75000,12000,15000,18000,21000,24000], 0.1, 0.12)` | Matriz de flujos de caja, tasa de financiación, tasa de reinversión. | 0.07971710360838036 |
| **NOMINAL** | Calcula la tasa de interés anual nominal. | `NOMINAL(0.1, 4)` | Tasa anual efectiva, número de períodos de capitalización por año. | 0.09645475633778045 |
| **NPER** | Calcula el número de períodos necesarios para alcanzar un valor objetivo. | `NPER(0.1/12, -100, -1000, 10000, 0)` | Tasa por período, pago por período, valor actual, valor futuro, tipo de pago (0=final, 1=inicio). | 63.39385422740764 |
| **NPV** | Calcula el valor neto actual de una serie de flujos de caja futuros. | `NPV(0.1, -10000, 2000, 4000, 8000)` | Tasa de descuento por período, matriz de flujos de caja. | 1031.3503176012546 |
| **PDURATION** | Calcula el tiempo necesario para alcanzar un valor deseado. | `PDURATION(0.1, 1000, 2000)` | Tasa por período, valor actual, valor futuro. | 7.272540897341714 |
| **PMT** | Calcula el pago periódico de un préstamo. | `PMT(0.1/12, 2*12, 1000, 10000, 0)` | Tasa por período, total de períodos, valor actual, valor futuro, tipo de pago (0=final, 1=inicio). | -42426.08563793503 |
| **PPMT** | Calcula el pago de capital para un período específico. | `PPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | Tasa por período, período, total de períodos, valor actual, valor futuro, tipo de pago (0=final, 1=inicio). | -43354.909209775076 |
| **PV** | Calcula el valor actual de una inversión. | `PV(0.1/12, 2*12, 1000, 10000, 0)` | Tasa por período, número de períodos, pago por período, valor futuro, tipo de pago (0=final, 1=inicio). | -29864.950264779152 |
| **RATE** | Calcula la tasa de interés por período. | `RATE(2*12, -1000, -10000, 100000, 0, 0.1)` | Total de períodos, pago por período, valor actual, valor futuro, tipo de pago (0=final, 1=inicio), estimación. | 0.06517891177181533 |

### Ingeniería

| Función | Definición | Ejemplo de llamada | Parámetros | Resultado esperado |
| :--- | :--- | :--- | :--- | :--- |
| **BIN2DEC** | Convierte un número binario a decimal. | `BIN2DEC(101010)` | Número binario. | 42 |
| **BIN2HEX** | Convierte un número binario a hexadecimal. | `BIN2HEX(101010)` | Número binario. | 2a |
| **BIN2OCT** | Convierte un número binario a octal. | `BIN2OCT(101010)` | Número binario. | 52 |
| **BITAND** | Devuelve el AND bit a bit de dos números. | `BITAND(42, 24)` | Entero, entero. | 8 |
| **BITLSHIFT** | Realiza un desplazamiento bit a bit a la izquierda. | `BITLSHIFT(42, 24)` | Entero, número de bits a desplazar. | 704643072 |
| **BITOR** | Devuelve el OR bit a bit de dos números. | `BITOR(42, 24)` | Entero, entero. | 58 |
| **BITRSHIFT** | Realiza un desplazamiento bit a bit a la derecha. | `BITRSHIFT(42, 2)` | Entero, número de bits a desplazar. | 10 |
| **BITXOR** | Devuelve el XOR bit a bit de dos números. | `BITXOR(42, 24)` | Entero, entero. | 50 |
| **COMPLEX** | Crea un número complejo. | `COMPLEX(3, 4)` | Parte real, parte imaginaria. | 3+4i |
| **CONVERT** | Convierte un número de una unidad de medida a otra. | `CONVERT(64, 'kibyte', 'bit')` | Valor, unidad de origen, unidad de destino. | 524288 |
| **DEC2BIN** | Convierte un número decimal a binario. | `DEC2BIN(42)` | Número decimal. | 101010 |
| **DEC2HEX** | Convierte un número decimal a hexadecimal. | `DEC2HEX(42)` | Número decimal. | 2a |
| **DEC2OCT** | Convierte un número decimal a octal. | `DEC2OCT(42)` | Número decimal. | 52 |
| **DELTA** | Comprueba si dos valores son iguales. | `DELTA(42, 42)` | Número, número. | 1 |
| **ERF** | Devuelve la función de error. | `ERF(1)` | Límite superior. | 0.8427007929497149 |
| **ERFC** | Devuelve la función de error complementaria. | `ERFC(1)` | Límite inferior. | 0.1572992070502851 |
| **GESTEP** | Comprueba si un número es mayor o igual que un umbral. | `GESTEP(42, 24)` | Número, umbral. | 1 |
| **HEX2BIN** | Convierte un número hexadecimal a binario. | `HEX2BIN('2a')` | Número hexadecimal. | 101010 |
| **HEX2DEC** | Convierte un número hexadecimal a decimal. | `HEX2DEC('2a')` | Número hexadecimal. | 42 |
| **HEX2OCT** | Convierte un número hexadecimal a octal. | `HEX2OCT('2a')` | Número hexadecimal. | 52 |
| **IMABS** | Devuelve el valor absoluto (módulo) de un número complejo. | `IMABS('3+4i')` | Número complejo. | 5 |
| **IMAGINARY** | Devuelve la parte imaginaria de un número complejo. | `IMAGINARY('3+4i')` | Número complejo. | 4 |
| **IMARGUMENT** | Devuelve el argumento de un número complejo. | `IMARGUMENT('3+4i')` | Número complejo. | 0.9272952180016122 |
| **IMCONJUGATE** | Devuelve el conjugado complejo. | `IMCONJUGATE('3+4i')` | Número complejo. | 3-4i |
| **IMCOS** | Devuelve el coseno de un número complejo. | `IMCOS('1+i')` | Número complejo. | 0.8337300251311491-0.9888977057628651i |
| **IMCOSH** | Devuelve el coseno hiperbólico de un número complejo. | `IMCOSH('1+i')` | Número complejo. | 0.8337300251311491+0.9888977057628651i |
| **IMCOT** | Devuelve la cotangente de un número complejo. | `IMCOT('1+i')` | Número complejo. | 0.21762156185440265-0.8680141428959249i |
| **IMCSC** | Devuelve la cosecante de un número complejo. | `IMCSC('1+i')` | Número complejo. | 0.6215180171704283-0.3039310016284264i |
| **IMCSCH** | Devuelve la cosecante hiperbólica de un número complejo. | `IMCSCH('1+i')` | Número complejo. | 0.3039310016284264-0.6215180171704283i |
| **IMDIV** | Devuelve el cociente de dos números complejos. | `IMDIV('1+2i', '3+4i')` | Número complejo dividendo, número complejo divisor. | 0.44+0.08i |
| **IMEXP** | Devuelve el exponencial de un número complejo. | `IMEXP('1+i')` | Número complejo. | 1.4686939399158851+2.2873552871788423i |
| **IMLN** | Devuelve el logaritmo natural de un número complejo. | `IMLN('1+i')` | Número complejo. | 0.3465735902799727+0.7853981633974483i |
| **IMLOG10** | Devuelve el logaritmo en base 10 de un número complejo. | `IMLOG10('1+i')` | Número complejo. | 0.1505149978319906+0.3410940884604603i |
| **IMLOG2** | Devuelve el logaritmo en base 2 de un número complejo. | `IMLOG2('1+i')` | Número complejo. | 0.5000000000000001+1.1330900354567985i |
| **IMPOWER** | Devuelve un número complejo elevado a una potencia. | `IMPOWER('1+i', 2)` | Número complejo, exponente. | 1.2246063538223775e-16+2.0000000000000004i |
| **IMPRODUCT** | Devuelve el producto de números complejos. | `IMPRODUCT('1+2i', '3+4i', '5+6i')` | Matriz de números complejos. | -85+20i |
| **IMREAL** | Devuelve la parte real de un número complejo. | `IMREAL('3+4i')` | Número complejo. | 3 |
| **IMSEC** | Devuelve la secante de un número complejo. | `IMSEC('1+i')` | Número complejo. | 0.4983370305551868+0.591083841721045i |
| **IMSECH** | Devuelve la secante hiperbólica de un número complejo. | `IMSECH('1+i')` | Número complejo. | 0.4983370305551868-0.591083841721045i |
| **IMSIN** | Devuelve el seno de un número complejo. | `IMSIN('1+i')` | Número complejo. | 1.2984575814159773+0.6349639147847361i |
| **IMSINH** | Devuelve el seno hiperbólico de un número complejo. | `IMSINH('1+i')` | Número complejo. | 0.6349639147847361+1.2984575814159773i |
| **IMSQRT** | Devuelve la raíz cuadrada de un número complejo. | `IMSQRT('1+i')` | Número complejo. | 1.0986841134678098+0.45508986056222733i |
| **IMSUB** | Devuelve la diferencia entre dos números complejos. | `IMSUB('3+4i', '1+2i')` | Número complejo minuendo, número complejo sustraendo. | 2+2i |
| **IMSUM** | Devuelve la suma de números complejos. | `IMSUM('1+2i', '3+4i', '5+6i')` | Matriz de números complejos. | 9+12i |
| **IMTAN** | Devuelve la tangente de un número complejo. | `IMTAN('1+i')` | Número complejo. | 0.2717525853195117+1.0839233273386946i |
| **OCT2BIN** | Convierte un número octal a binario. | `OCT2BIN('52')` | Número octal. | 101010 |
| **OCT2DEC** | Convierte un número octal a decimal. | `OCT2DEC('52')` | Número octal. | 42 |
| **OCT2HEX** | Convierte un número octal a hexadecimal. | `OCT2HEX('52')` | Número octal. | 2a |

### Lógica

| Función | Definición | Ejemplo de llamada | Parámetros | Resultado esperado |
| :--- | :--- | :--- | :--- | :--- |
| **AND** | Devuelve VERDADERO solo cuando todos los argumentos son VERDADEROS; de lo contrario, FALSO. | `AND(true, false, true)` | Uno o más valores lógicos (booleanos); la función devuelve VERDADERO solo cuando cada argumento es VERDADERO. | |
| **FALSE** | Devuelve el valor lógico FALSO. | `FALSE()` | Sin parámetros. | |
| **IF** | Devuelve diferentes valores dependiendo de si una condición es VERDADERA o FALSA. | `IF(true, 'Hello!', 'Goodbye!')` | Condición, valor si es VERDADERO, valor si es FALSO. | Hello! |
| **IFS** | Evalúa múltiples condiciones y devuelve el resultado de la primera condición VERDADERA. | `IFS(false, 'Hello!', true, 'Goodbye!')` | Múltiples pares de condición y valor correspondiente. | Goodbye! |
| **NOT** | Invierte un valor lógico. VERDADERO se convierte en FALSO y viceversa. | `NOT(true)` | Un valor lógico (booleano). | |
| **OR** | Devuelve VERDADERO si cualquier argumento es VERDADERO; de lo contrario, FALSO. | `OR(true, false, true)` | Uno o más valores lógicos (booleanos); devuelve VERDADERO cuando cualquier argumento es VERDADERO. | |
| **SWITCH** | Devuelve el valor que coincide con una expresión; si ninguno coincide, devuelve el valor predeterminado. | `SWITCH(7, 9, 'Nine', 7, 'Seven')` | Expresión, valor de coincidencia 1, resultado 1, ..., [predeterminado]. | Seven |
| **TRUE** | Devuelve el valor lógico VERDADERO. | `TRUE()` | Sin parámetros. | |
| **XOR** | Devuelve VERDADERO solo cuando un número impar de argumentos son VERDADEROS; de lo contrario, FALSO. | `XOR(true, false, true)` | Uno o más valores lógicos (booleanos); devuelve VERDADERO cuando un recuento impar es VERDADERO. | |

### Matemáticas

| Función | Definición | Ejemplo de llamada | Parámetros | Resultado esperado |
| :--- | :--- | :--- | :--- | :--- |
| **ABS** | Devuelve el valor absoluto de un número. | `ABS(-4)` | Número. | 4 |
| **ACOS** | Devuelve el arcocoseno (en radianes). | `ACOS(-0.5)` | Número entre -1 y 1. | 2.0943951023931957 |
| **ACOSH** | Devuelve el coseno hiperbólico inverso. | `ACOSH(10)` | Número mayor o igual a 1. | 2.993222846126381 |
| **ACOT** | Devuelve la arcocotangente (en radianes). | `ACOT(2)` | Cualquier número. | 0.46364760900080615 |
| **ACOTH** | Devuelve la cotangente hiperbólica inversa. | `ACOTH(6)` | Número cuyo valor absoluto es mayor que 1. | 0.16823611831060645 |
| **AGGREGATE** | Realiza un cálculo agregado ignorando errores o filas ocultas. | `AGGREGATE(9, 4, [-5,15], [32,'Hello World!'])` | Número de función, opciones, matriz1, ..., matrizN. | 10,32 |
| **ARABIC** | Convierte un número romano a arábigo. | `ARABIC('MCMXII')` | Cadena de número romano. | 1912 |
| **ASIN** | Devuelve el arcoseno (en radianes). | `ASIN(-0.5)` | Número entre -1 y 1. | -0.5235987755982988 |
| **ASINH** | Devuelve el seno hiperbólico inverso. | `ASINH(-2.5)` | Cualquier número. | -1.6472311463710965 |
| **ATAN** | Devuelve la arcotangente (en radianes). | `ATAN(1)` | Cualquier número. | 0.7853981633974483 |
| **ATAN2** | Devuelve la arcotangente (en radianes) de un par de coordenadas. | `ATAN2(-1, -1)` | Coordenada y, coordenada x. | -2.356194490192345 |
| **ATANH** | Devuelve la tangente hiperbólica inversa. | `ATANH(-0.1)` | Número entre -1 y 1. | -0.10033534773107562 |
| **BASE** | Convierte un número a texto en la base especificada. | `BASE(15, 2, 10)` | Número, base (radix), [longitud mínima]. | 0000001111 |
| **CEILING** | Redondea un número hacia arriba al múltiplo más cercano. | `CEILING(-5.5, 2, -1)` | Número, múltiplo, [modo]. | -6 |
| **CEILINGMATH** | Redondea un número hacia arriba, utilizando el múltiplo y la dirección proporcionados. | `CEILINGMATH(-5.5, 2, -1)` | Número, [múltiplo], [modo]. | -6 |
| **CEILINGPRECISE** | Redondea un número hacia arriba al múltiplo más cercano, ignorando el signo. | `CEILINGPRECISE(-4.1, -2)` | Número, [múltiplo]. | -4 |
| **COMBIN** | Devuelve el número de combinaciones. | `COMBIN(8, 2)` | Elementos totales, número elegido. | 28 |
| **COMBINA** | Devuelve el número de combinaciones con repeticiones. | `COMBINA(4, 3)` | Elementos totales, número elegido. | 20 |
| **COS** | Devuelve el coseno (en radianes). | `COS(1)` | Ángulo en radianes. | 0.5403023058681398 |
| **COSH** | Devuelve el coseno hiperbólico. | `COSH(1)` | Cualquier número. | 1.5430806348152437 |
| **COT** | Devuelve la cotangente (en radianes). | `COT(30)` | Ángulo en radianes. | -0.15611995216165922 |
| **COTH** | Devuelve la cotangente hiperbólica. | `COTH(2)` | Cualquier número. | 1.0373147207275482 |
| **CSC** | Devuelve la cosecante (en radianes). | `CSC(15)` | Ángulo en radianes. | 1.5377805615408537 |
| **CSCH** | Devuelve la cosecante hiperbólica. | `CSCH(1.5)` | Cualquier número. | 0.46964244059522464 |
| **DECIMAL** | Convierte un número en formato de texto a decimal. | `DECIMAL('FF', 16)` | Texto, base. | 255 |
| **ERF** | Devuelve la función de error. | `ERF(1)` | Límite superior. | 0.8427007929497149 |
| **ERFC** | Devuelve la función de error complementaria. | `ERFC(1)` | Límite inferior. | 0.1572992070502851 |
| **EVEN** | Redondea un número hacia arriba al entero par más cercano. | `EVEN(-1)` | Número. | -2 |
| **EXP** | Devuelve e elevado a una potencia. | `EXP(1)` | Exponente. | 2.718281828459045 |
| **FACT** | Devuelve el factorial. | `FACT(5)` | Entero no negativo. | 120 |
| **FACTDOUBLE** | Devuelve el factorial doble. | `FACTDOUBLE(7)` | Entero no negativo. | 105 |
| **FLOOR** | Redondea un número hacia abajo al múltiplo más cercano. | `FLOOR(-3.1)` | Número, múltiplo. | -4 |
| **FLOORMATH** | Redondea un número hacia abajo utilizando el múltiplo y la dirección proporcionados. | `FLOORMATH(-4.1, -2, -1)` | Número, [múltiplo], [modo]. | -4 |
| **FLOORPRECISE** | Redondea un número hacia abajo al múltiplo más cercano, ignorando el signo. | `FLOORPRECISE(-3.1, -2)` | Número, [múltiplo]. | -4 |
| **GCD** | Devuelve el máximo común divisor. | `GCD(24, 36, 48)` | Dos o más enteros. | 12 |
| **INT** | Redondea un número hacia abajo al entero más cercano. | `INT(-8.9)` | Número. | -9 |
| **ISEVEN** | Comprueba si un número es par. | `ISEVEN(-2.5)` | Número. | |
| **ISOCEILING** | Redondea un número hacia arriba al múltiplo más cercano siguiendo las reglas ISO. | `ISOCEILING(-4.1, -2)` | Número, [múltiplo]. | -4 |
| **ISODD** | Comprueba si un número es impar. | `ISODD(-2.5)` | Número. | |
| **LCM** | Devuelve el mínimo común múltiplo. | `LCM(24, 36, 48)` | Dos o más enteros. | 144 |
| **LN** | Devuelve el logaritmo natural. | `LN(86)` | Número positivo. | 4.454347296253507 |
| **LOG** | Devuelve el logaritmo en la base especificada. | `LOG(8, 2)` | Número, base. | 3 |
| **LOG10** | Devuelve el logaritmo en base 10. | `LOG10(100000)` | Número positivo. | 5 |
| **MOD** | Devuelve el resto de una división. | `MOD(3, -2)` | Dividendo, divisor. | -1 |
| **MROUND** | Redondea un número al múltiplo más cercano. | `MROUND(-10, -3)` | Número, múltiplo. | -9 |
| **MULTINOMIAL** | Devuelve el coeficiente multinomial. | `MULTINOMIAL(2, 3, 4)` | Dos o más enteros no negativos. | 1260 |
| **ODD** | Redondea un número hacia arriba al entero impar más cercano. | `ODD(-1.5)` | Número. | -3 |
| **POWER** | Eleva un número a una potencia. | `POWER(5, 2)` | Base, exponente. | 25 |
| **PRODUCT** | Devuelve el producto de los números. | `PRODUCT(5, 15, 30)` | Uno o más números. | 2250 |
| **QUOTIENT** | Devuelve la parte entera de una división. | `QUOTIENT(-10, 3)` | Dividendo, divisor. | -3 |
| **RADIANS** | Convierte grados a radianes. | `RADIANS(180)` | Grados. | 3.141592653589793 |
| **RAND** | Devuelve un número real aleatorio entre 0 y 1. | `RAND()` | Sin parámetros. | [Número real aleatorio entre 0 y 1] |
| **RANDBETWEEN** | Devuelve un número entero aleatorio dentro de un rango especificado. | `RANDBETWEEN(-1, 1)` | Límite inferior, límite superior. | [Número entero aleatorio entre inferior y superior] |
| **ROUND** | Redondea un número al número de dígitos especificado. | `ROUND(626.3, -3)` | Número, dígitos. | 1000 |
| **ROUNDDOWN** | Redondea un número hacia abajo, hacia cero. | `ROUNDDOWN(-3.14159, 2)` | Número, dígitos. | -3.14 |
| **ROUNDUP** | Redondea un número hacia arriba, alejándose de cero. | `ROUNDUP(-3.14159, 2)` | Número, dígitos. | -3.15 |
| **SEC** | Devuelve la secante (en radianes). | `SEC(45)` | Ángulo en radianes. | 1.9035944074044246 |
| **SECH** | Devuelve la secante hiperbólica. | `SECH(45)` | Cualquier número. | 5.725037161098787e-20 |
| **SIGN** | Devuelve el signo de un número. | `SIGN(-0.00001)` | Número. | -1 |
| **SIN** | Devuelve el seno (en radianes). | `SIN(1)` | Ángulo en radianes. | 0.8414709848078965 |
| **SINH** | Devuelve el seno hiperbólico. | `SINH(1)` | Cualquier número. | 1.1752011936438014 |
| **SQRT** | Devuelve la raíz cuadrada. | `SQRT(16)` | Número no negativo. | 4 |
| **SQRTPI** | Devuelve la raíz cuadrada de (número * π). | `SQRTPI(2)` | Número no negativo. | 2.5066282746310002 |
| **SUBTOTAL** | Devuelve un subtotal para un conjunto de datos, ignorando las filas ocultas. | `SUBTOTAL(9, [-5,15], [32,'Hello World!'])` | Número de función, matriz1, ..., matrizN. | 10,32 |
| **SUM** | Devuelve la suma de los números, ignorando el texto. | `SUM(-5, 15, 32, 'Hello World!')` | Uno o más números. | 42 |
| **SUMIF** | Suma los valores que cumplen una única condición. | `SUMIF([2,4,8,16], '>5')` | Rango, criterio. | 24 |
| **SUMIFS** | Suma los valores que cumplen múltiples condiciones. | `SUMIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Rango de suma, rango de criterios 1, criterio 1, ..., rango de criterios N, criterio N. | 12 |
| **SUMPRODUCT** | Devuelve la suma de los productos de los elementos de las matrices. | `SUMPRODUCT([[1,2],[3,4]], [[1,0],[0,1]])` | Dos o más matrices. | 5 |
| **SUMSQ** | Devuelve la suma de los cuadrados. | `SUMSQ(3, 4)` | Uno o más números. | 25 |
| **SUMX2MY2** | Devuelve la suma de la diferencia de los cuadrados de los elementos correspondientes de las matrices. | `SUMX2MY2([1,2], [3,4])` | Matriz1, matriz2. | -20 |
| **SUMX2PY2** | Devuelve la suma de la suma de los cuadrados de los elementos correspondientes de las matrices. | `SUMX2PY2([1,2], [3,4])` | Matriz1, matriz2. | 30 |
| **SUMXMY2** | Devuelve la suma de los cuadrados de las diferencias de los elementos correspondientes de las matrices. | `SUMXMY2([1,2], [3,4])` | Matriz1, matriz2. | 8 |
| **TAN** | Devuelve la tangente (en radianes). | `TAN(1)` | Ángulo en radianes. | 1.5574077246549023 |
| **TANH** | Devuelve la tangente hiperbólica. | `TANH(-2)` | Cualquier número. | -0.9640275800758168 |
| **TRUNC** | Trunca un número a un entero sin redondear. | `TRUNC(-8.9)` | Número, [dígitos]. | -8 |

### Estadística

| Función | Definición | Ejemplo de llamada | Parámetros | Resultado esperado |
| :--- | :--- | :--- | :--- | :--- |
| **AVEDEV** | Devuelve el promedio de las desviaciones absolutas. | `AVEDEV([2,4], [8,16])` | Matrices de números que representan puntos de datos. | 4.5 |
| **AVERAGE** | Devuelve la media aritmética. | `AVERAGE([2,4], [8,16])` | Matrices de números que representan puntos de datos. | 7.5 |
| **AVERAGEA** | Devuelve el promedio de los valores, incluyendo texto y valores lógicos. | `AVERAGEA([2,4], [8,16])` | Matrices de números, texto o valores lógicos; se incluyen todos los valores no vacíos. | 7.5 |
| **AVERAGEIF** | Calcula el promedio basado en una única condición. | `AVERAGEIF([2,4,8,16], '>5', [1, 2, 3, 4])` | El primer parámetro es el rango a comprobar, el segundo es la condición, el tercero es el rango opcional utilizado para promediar. | 3.5 |
| **AVERAGEIFS** | Calcula el promedio basado en múltiples condiciones. | `AVERAGEIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | El primer parámetro son los valores a promediar, seguido de pares de rangos de criterios y expresiones de criterios. | 6 |
| **BETADIST** | Devuelve la densidad de probabilidad beta acumulada. | `BETADIST(2, 8, 10, true, 1, 3)` | Valor, alfa, beta, indicador acumulado, A (opcional), B (opcional). | 0.6854705810117458 |
| **BETAINV** | Devuelve la función inversa de la distribución acumulada beta. | `BETAINV(0.6854705810117458, 8, 10, 1, 3)` | Probabilidad, alfa, beta, A (opcional), B (opcional). | 1.9999999999999998 |
| **BINOMDIST** | Devuelve la probabilidad de una distribución binomial. | `BINOMDIST(6, 10, 0.5, false)` | Número de éxitos, ensayos, probabilidad de éxito, indicador acumulado. | 0.205078125 |
| **CORREL** | Devuelve el coeficiente de correlación entre dos conjuntos de datos. | `CORREL([3,2,4,5,6], [9,7,12,15,17])` | Dos matrices de números. | 0.9970544855015815 |
| **COUNT** | Cuenta las celdas numéricas. | `COUNT([1,2], [3,4])` | Matrices o rangos de números. | 4 |
| **COUNTA** | Cuenta las celdas no vacías. | `COUNTA([1, null, 3, 'a', '', 'c'])` | Matrices o rangos de cualquier tipo. | 4 |
| **COUNTBLANK** | Cuenta las celdas en blanco. | `COUNTBLANK([1, null, 3, 'a', '', 'c'])` | Matrices o rangos de cualquier tipo. | 2 |
| **COUNTIF** | Cuenta las celdas que coinciden con una condición. | `COUNTIF(['Caen', 'Melbourne', 'Palo Alto', 'Singapore'], 'a')` | Rango de números o texto, y la condición. | 3 |
| **COUNTIFS** | Cuenta las celdas que coinciden con múltiples condiciones. | `COUNTIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Pares de rangos de criterios y expresiones de criterios. | 2 |
| **COVARIANCEP** | Devuelve la covarianza poblacional. | `COVARIANCEP([3,2,4,5,6], [9,7,12,15,17])` | Dos matrices de números. | 5.2 |
| **COVARIANCES** | Devuelve la covarianza muestral. | `COVARIANCES([2,4,8], [5,11,12])` | Dos matrices de números. | 9.666666666666668 |
| **DEVSQ** | Devuelve la suma de los cuadrados de las desviaciones. | `DEVSQ([2,4,8,16])` | Matriz de números que representan puntos de datos. | 115 |
| **EXPONDIST** | Devuelve la distribución exponencial. | `EXPONDIST(0.2, 10, true)` | Valor, lambda, indicador acumulado. | 0.8646647167633873 |
| **FDIST** | Devuelve la distribución de probabilidad F. | `FDIST(15.2069, 6, 4, false)` | Valor, grados de libertad 1, grados de libertad 2, indicador acumulado. | 0.0012237917087831735 |
| **FINV** | Devuelve la función inversa de la distribución F. | `FINV(0.01, 6, 4)` | Probabilidad, grados de libertad 1, grados de libertad 2. | 0.10930991412457851 |
| **FISHER** | Devuelve la transformación de Fisher. | `FISHER(0.75)` | Número que representa un coeficiente de correlación. | 0.9729550745276566 |
| **FISHERINV** | Devuelve la transformación inversa de Fisher. | `FISHERINV(0.9729550745276566)` | Número que representa un resultado de la transformación de Fisher. | 0.75 |
| **FORECAST** | Predice un valor y para un valor x dado utilizando valores x e y conocidos. | `FORECAST(30, [6,7,9,15,21], [20,28,31,38,40])` | Nuevo valor x, matriz de valores y conocidos, matriz de valores x conocidos. | 10.607253086419755 |
| **FREQUENCY** | Devuelve una distribución de frecuencias. | `FREQUENCY([79,85,78,85,50,81,95,88,97], [70,79,89])` | Matriz de datos, matriz de intervalos. | 1,2,4,2 |
| **GAMMA** | Devuelve la función gamma. | `GAMMA(2.5)` | Número positivo. | 1.3293403919101043 |
| **GAMMALN** | Devuelve el logaritmo natural de la función gamma. | `GAMMALN(10)` | Número positivo. | 12.801827480081961 |
| **GAUSS** | Devuelve la probabilidad basada en la distribución normal estándar. | `GAUSS(2)` | Número que representa una puntuación z. | 0.4772498680518208 |
| **GEOMEAN** | Devuelve la media geométrica. | `GEOMEAN([2,4], [8,16])` | Matrices de números. | 5.656854249492381 |
| **GROWTH** | Predice valores de crecimiento exponencial basados en datos conocidos. | `GROWTH([2,4,8,16], [1,2,3,4], [5])` | Matriz de valores y conocidos, matriz de valores x conocidos, nuevos valores x. | 32.00000000000003 |
| **HARMEAN** | Devuelve la media armónica. | `HARMEAN([2,4], [8,16])` | Matrices de números. | 4.266666666666667 |
| **HYPGEOMDIST** | Devuelve la distribución hipergeométrica. | `HYPGEOMDIST(1, 4, 8, 20, false)` | Éxitos de la muestra, tamaño de la muestra, éxitos de la población, tamaño de la población, indicador acumulado. | 0.3632610939112487 |
| **INTERCEPT** | Devuelve la intersección de una línea de regresión lineal. | `INTERCEPT([2,3,9,1,8], [6,5,11,7,5])` | Matriz de valores y conocidos, matriz de valores x conocidos. | 0.04838709677419217 |
| **KURT** | Devuelve la curtosis. | `KURT([3,4,5,2,3,4,5,6,4,7])` | Matriz de números. | -0.15179963720841627 |
| **LARGE** | Devuelve el k-ésimo valor más grande. | `LARGE([3,5,3,5,4,4,2,4,6,7], 3)` | Matriz de números, k. | 5 |
| **LINEST** | Realiza un análisis de regresión lineal. | `LINEST([1,9,5,7], [0,4,2,3], true, true)` | Matriz de valores y conocidos, matriz de valores x conocidos, devolver estadísticas adicionales, devolver más estadísticas. | 2,1 |
| **LOGNORMDIST** | Devuelve la distribución lognormal. | `LOGNORMDIST(4, 3.5, 1.2, true)` | Valor, media, desviación estándar, indicador acumulado. | 0.0390835557068005 |
| **LOGNORMINV** | Devuelve la función inversa de la distribución lognormal. | `LOGNORMINV(0.0390835557068005, 3.5, 1.2, true)` | Probabilidad, media, desviación estándar, indicador acumulado. | 4.000000000000001 |
| **MAX** | Devuelve el valor máximo. | `MAX([0.1,0.2], [0.4,0.8], [true, false])` | Matrices de números. | 0.8 |
| **MAXA** | Devuelve el valor máximo incluyendo texto y valores lógicos. | `MAXA([0.1,0.2], [0.4,0.8], [true, false])` | Matrices de números, texto o valores lógicos. | 1 |
| **MEDIAN** | Devuelve la mediana. | `MEDIAN([1,2,3], [4,5,6])` | Matrices de números. | 3.5 |
| **MIN** | Devuelve el valor mínimo. | `MIN([0.1,0.2], [0.4,0.8], [true, false])` | Matrices de números. | 0.1 |
| **MINA** | Devuelve el valor mínimo incluyendo texto y valores lógicos. | `MINA([0.1,0.2], [0.4,0.8], [true, false])` | Matrices de números, texto o valores lógicos. | 0 |
| **MODEMULT** | Devuelve una matriz de los valores que ocurren con más frecuencia. | `MODEMULT([1,2,3,4,3,2,1,2,3])` | Matriz de números. | 2,3 |
| **MODESNGL** | Devuelve el valor único que ocurre con más frecuencia. | `MODESNGL([1,2,3,4,3,2,1,2,3])` | Matriz de números. | 2 |
| **NORMDIST** | Devuelve la distribución normal. | `NORMDIST(42, 40, 1.5, true)` | Valor, media, desviación estándar, indicador acumulado. | 0.9087887802741321 |
| **NORMINV** | Devuelve la función inversa de la distribución normal. | `NORMINV(0.9087887802741321, 40, 1.5)` | Probabilidad, media, desviación estándar. | 42 |
| **NORMSDIST** | Devuelve la distribución normal estándar. | `NORMSDIST(1, true)` | Número que representa una puntuación z. | 0.8413447460685429 |
| **NORMSINV** | Devuelve la función inversa de la distribución normal estándar. | `NORMSINV(0.8413447460685429)` | Probabilidad. | 1.0000000000000002 |
| **PEARSON** | Devuelve el coeficiente de correlación producto-momento de Pearson. | `PEARSON([9,7,5,3,1], [10,6,1,5,3])` | Dos matrices de números. | 0.6993786061802354 |
| **PERCENTILEEXC** | Devuelve el k-ésimo percentil, exclusivo. | `PERCENTILEEXC([1,2,3,4], 0.3)` | Matriz de números, k. | 1.5 |
| **PERCENTILEINC** | Devuelve el k-ésimo percentil, inclusivo. | `PERCENTILEINC([1,2,3,4], 0.3)` | Matriz de números, k. | 1.9 |
| **PERCENTRANKEXC** | Devuelve el rango de un valor en un conjunto de datos como un porcentaje (exclusivo). | `PERCENTRANKEXC([1,2,3,4], 2, 2)` | Matriz de números, valor x, significancia (opcional). | 0.4 |
| **PERCENTRANKINC** | Devuelve el rango de un valor en un conjunto de datos como un porcentaje (inclusivo). | `PERCENTRANKINC([1,2,3,4], 2, 2)` | Matriz de números, valor x, significancia (opcional). | 0.33 |
| **PERMUT** | Devuelve el número de permutaciones. | `PERMUT(100, 3)` | Número total n, número elegido k. | 970200 |
| **PERMUTATIONA** | Devuelve el número de permutaciones con repeticiones. | `PERMUTATIONA(4, 3)` | Número total n, número elegido k. | 64 |
| **PHI** | Devuelve la función de densidad de la distribución normal estándar. | `PHI(0.75)` | Número que representa una puntuación z. | 0.30113743215480443 |
| **POISSONDIST** | Devuelve la distribución de Poisson. | `POISSONDIST(2, 5, true)` | Número de eventos, media, indicador acumulado. | 0.12465201948308113 |
| **PROB** | Devuelve la suma de probabilidades. | `PROB([1,2,3,4], [0.1,0.2,0.2,0.1], 2, 3)` | Matriz de valores, matriz de probabilidades, límite inferior, límite superior. | 0.4 |
| **QUARTILEEXC** | Devuelve el cuartil del conjunto de datos, exclusivo. | `QUARTILEEXC([1,2,3,4], 1)` | Matriz de números, cuartil. | 1.25 |
| **QUARTILEINC** | Devuelve el cuartil del conjunto de datos, inclusivo. | `QUARTILEINC([1,2,3,4], 1)` | Matriz de números, cuartil. | 1.75 |
| **RANKAVG** | Devuelve el rango promedio. | `RANKAVG(4, [2,4,4,8,8,16], false)` | Número, matriz de números, orden (ascendente/descendente). | 4.5 |
| **RANKEQ** | Devuelve el rango de un número. | `RANKEQ(4, [2,4,4,8,8,16], false)` | Número, matriz de números, orden (ascendente/descendente). | 4 |
| **RSQ** | Devuelve el coeficiente de determinación. | `RSQ([9,7,5,3,1], [10,6,1,5,3])` | Dos matrices de números. | 0.4891304347826088 |
| **SKEW** | Devuelve la asimetría. | `SKEW([3,4,5,2,3,4,5,6,4,7])` | Matriz de números. | 0.3595430714067974 |
| **SKEWP** | Devuelve la asimetría poblacional. | `SKEWP([3,4,5,2,3,4,5,6,4,7])` | Matriz de números. | 0.303193339354144 |
| **SLOPE** | Devuelve la pendiente de la línea de regresión lineal. | `SLOPE([1,9,5,7], [0,4,2,3])` | Matriz de valores y conocidos, matriz de valores x conocidos. | 2 |
| **SMALL** | Devuelve el k-ésimo valor más pequeño. | `SMALL([3,5,3,5,4,4,2,4,6,7], 3)` | Matriz de números, k. | 3 |
| **STANDARDIZE** | Devuelve un valor normalizado como una puntuación z. | `STANDARDIZE(42, 40, 1.5)` | Valor, media, desviación estándar. | 1.3333333333333333 |
| **STDEVA** | Devuelve la desviación estándar, incluyendo texto y valores lógicos. | `STDEVA([2,4], [8,16], [true, false])` | Matrices de números, texto o valores lógicos. | 6.013872850889572 |
| **STDEVP** | Devuelve la desviación estándar poblacional. | `STDEVP([2,4], [8,16], [true, false])` | Matrices de números. | 5.361902647381804 |
| **STDEVPA** | Devuelve la desviación estándar poblacional, incluyendo texto y valores lógicos. | `STDEVPA([2,4], [8,16], [true, false])` | Matrices de números, texto o valores lógicos. | 5.489889697333535 |
| **STDEVS** | Devuelve la desviación estándar muestral. | `VARS([2,4], [8,16], [true, false])` | Matrices de números. | 6.191391873668904 |
| **STEYX** | Devuelve el error estándar del valor y predicho. | `STEYX([2,3,9,1,8,7,5], [6,5,11,7,5,4,4])` | Matriz de valores y conocidos, matriz de valores x conocidos. | 3.305718950210041 |
| **TINV** | Devuelve la función inversa de la distribución t. | `TINV(0.9946953263673741, 1)` | Probabilidad, grados de libertad. | 59.99999999996535 |
| **TRIMMEAN** | Devuelve la media de la parte interior de un conjunto de datos. | `TRIMMEAN([4,5,6,7,2,3,4,5,1,2,3], 0.2)` | Matriz de números, proporción de recorte. | 3.7777777777777777 |
| **VARA** | Devuelve la varianza incluyendo texto y valores lógicos. | `VARA([2,4], [8,16], [true, false])` | Matrices de números, texto o valores lógicos. | 36.16666666666667 |
| **VARP** | Devuelve la varianza poblacional. | `VARP([2,4], [8,16], [true, false])` | Matrices de números. | 28.75 |
| **VARPA** | Devuelve la varianza poblacional incluyendo texto y valores lógicos. | `VARPA([2,4], [8,16], [true, false])` | Matrices de números, texto o valores lógicos. | 30.13888888888889 |
| **VARS** | Devuelve la varianza muestral. | `VARS([2,4], [8,16], [true, false])` | Matrices de números. | 38.333333333333336 |
| **WEIBULLDIST** | Devuelve la distribución de Weibull. | `WEIBULLDIST(105, 20, 100, true)` | Valor, alfa, beta, indicador acumulado. | 0.9295813900692769 |
| **ZTEST** | Devuelve la probabilidad de una cola de una prueba z. | `ZTEST([3,6,7,8,6,5,4,2,1,9], 4)` | Matriz de números, media hipotética. | 0.09057419685136381 |

### Texto

| Función | Definición | Ejemplo de llamada | Parámetros | Resultado esperado |
| :--- | :--- | :--- | :--- | :--- |
| **CHAR** | Convierte un código numérico al carácter correspondiente. | `CHAR(65)` | Número que representa el código del carácter. | A |
| **CLEAN** | Elimina todos los caracteres no imprimibles del texto. | `CLEAN('Monthly report')` | Cadena de texto a limpiar. | Monthly report |
| **CODE** | Devuelve el código numérico del primer carácter de una cadena de texto. | `CODE('A')` | Cadena de texto que contiene un solo carácter. | 65 |
| **CONCATENATE** | Une varias cadenas de texto en una sola. | `CONCATENATE('Andreas', ' ', 'Hauser')` | Una o más cadenas de texto a unir. | Andreas Hauser |
| **EXACT** | Comprueba si dos cadenas son exactamente iguales, distinguiendo entre mayúsculas y minúsculas. | `EXACT('Word', 'word')` | Dos cadenas de texto a comparar. | |
| **FIND** | Busca la posición de una subcadena a partir de una posición dada. | `FIND('M', 'Miriam McGovern', 3)` | Texto a buscar, texto de origen, posición inicial opcional. | 8 |
| **LEFT** | Devuelve un número especificado de caracteres del lado izquierdo de una cadena. | `LEFT('Sale Price', 4)` | Cadena de texto y número de caracteres. | Sale |
| **LEN** | Devuelve el número de caracteres de una cadena de texto. | `LEN('Phoenix, AZ')` | Cadena de texto a contar. | 11 |
| **LOWER** | Convierte todos los caracteres a minúsculas. | `LOWER('E. E. Cummings')` | Cadena de texto a convertir. | e. e. cummings |
| **MID** | Devuelve un número especificado de caracteres de la parte central de una cadena. | `MID('Fluid Flow', 7, 20)` | Cadena de texto, posición inicial, número de caracteres. | Flow |
| **NUMBERVALUE** | Convierte texto en un número utilizando los separadores especificados. | `NUMBERVALUE('2.500,27', ',', '.')` | Cadena de texto, separador decimal, separador de grupo. | 2500.27 |
| **PROPER** | Pone en mayúscula la primera letra de cada palabra. | `PROPER('this is a TITLE')` | Cadena de texto a la que dar formato. | This Is A Title |
| **REPLACE** | Reemplaza parte de una cadena de texto con texto nuevo. | `REPLACE('abcdefghijk', 6, 5, '*')` | Texto original, posición inicial, número de caracteres, texto nuevo. | abcde*k |
| **REPT** | Repite el texto un número especificado de veces. | `REPT('*-', 3)` | Cadena de texto y recuento de repeticiones. | *-*-*- |
| **RIGHT** | Devuelve un número especificado de caracteres del lado derecho de una cadena. | `RIGHT('Sale Price', 5)` | Cadena de texto y número de caracteres. | Price |
| **ROMAN** | Convierte un número arábigo a números romanos. | `ROMAN(499)` | Número arábigo a convertir. | CDXCIX |
| **SEARCH** | Busca la posición de una subcadena, sin distinguir entre mayúsculas y minúsculas. | `SEARCH('margin', 'Profit Margin')` | Texto a buscar, texto de origen. | 8 |
| **SUBSTITUTE** | Reemplaza una instancia específica de texto antiguo por texto nuevo. | `SUBSTITUTE('Quarter 1, 2011', '1', '2', 3)` | Texto original, texto antiguo, texto nuevo, número de instancia opcional. | Quarter 1, 2012 |
| **T** | Devuelve el texto si el valor es texto; de lo contrario, devuelve una cadena vacía. | `T('Rainfall')` | El argumento puede ser cualquier tipo de dato. | Rainfall |
| **TRIM** | Elimina los espacios del texto, excepto los espacios individuales entre palabras. | `TRIM(' First Quarter Earnings ')` | Cadena de texto a recortar. | First Quarter Earnings |
| **TEXTJOIN** | Une varios elementos de texto en una sola cadena utilizando un delimitador. | `TEXTJOIN(' ', true, 'The', '', 'sun', 'will', 'come', 'up', 'tomorrow.')` | Delimitador, indicador de ignorar vacíos, elementos de texto a unir. | The sun will come up tomorrow. |
| **UNICHAR** | Devuelve el carácter para un número Unicode dado. | `UNICHAR(66)` | Punto de código Unicode. | B |
| **UNICODE** | Devuelve el número Unicode del primer carácter del texto. | `UNICODE('B')` | Cadena de texto que contiene un solo carácter. | 66 |
| **UPPER** | Convierte todos los caracteres a mayúsculas. | `UPPER('total')` | Cadena de texto a convertir. | TOTAL |