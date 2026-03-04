:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/calculation-engine/formula).
:::

# Formula.js

[Formula.js](http://formulajs.info/) fornece uma grande coleção de funções compatíveis com o Excel.

## Referência de Funções

### Datas

| Função | Definição | Exemplo de chamada | Parâmetros | Resultado esperado |
| :--- | :--- | :--- | :--- | :--- |
| **DATE** | Cria uma data com base no ano, mês e dia fornecidos. | `DATE(2008, 7, 8)` | Ano (inteiro), mês (1-12), dia (1-31). | Tue Jul 08 2008 00:00:00 GMT-0700 (PDT) |
| **DATEVALUE** | Converte uma data em formato de texto para um número de série de data. | `DATEVALUE('8/22/2011')` | String de texto que representa uma data. | Mon Aug 22 2011 00:00:00 GMT-0700 (PDT) |
| **DAY** | Retorna a parte do dia de uma data. | `DAY('15-Apr-11')` | Valor de data ou uma string de texto de data. | 15 |
| **DAYS** | Calcula o número de dias entre duas datas. | `DAYS('3/15/11', '2/1/11')` | Data final, data de início. | 42 |
| **DAYS360** | Calcula o número de dias entre duas datas com base em um ano de 360 dias. | `DAYS360('1-Jan-11', '31-Dec-11')` | Data de início, data final. | 360 |
| **EDATE** | Retorna a data que ocorre um número especificado de meses antes ou depois de uma data. | `EDATE('1/15/11', -1)` | Data de início, número de meses (positivo para o futuro, negativo para o passado). | Wed Dec 15 2010 00:00:00 GMT-0800 (PST) |
| **EOMONTH** | Retorna o último dia do mês antes ou depois do número especificado de meses. | `EOMONTH('1/1/11', -3)` | Data de início, número de meses (positivo para o futuro, negativo para o passado). | Sun Oct 31 2010 00:00:00 GMT-0700 (PDT) |
| **HOUR** | Retorna a parte da hora de um valor de tempo. | `HOUR('7/18/2011 7:45:00 AM')` | Valor de tempo ou string de texto de tempo. | 7 |
| **MINUTE** | Retorna a parte dos minutos de um valor de tempo. | `MINUTE('2/1/2011 12:45:00 PM')` | Valor de tempo ou string de texto de tempo. | 45 |
| **ISOWEEKNUM** | Retorna o número da semana ISO do ano para uma determinada data. | `ISOWEEKNUM('3/9/2012')` | Valor de data ou uma string de texto de data. | 10 |
| **MONTH** | Retorna a parte do mês de uma data. | `MONTH('15-Apr-11')` | Valor de data ou uma string de texto de data. | 4 |
| **NETWORKDAYS** | Conta o número de dias úteis entre duas datas, excluindo fins de semana e feriados opcionais. | `NETWORKDAYS('10/1/2012', '3/1/2013', ['11/22/2012'])` | Data de início, data final, array opcional de feriados. | 109 |
| **NETWORKDAYSINTL** | Conta os dias úteis entre duas datas, permitindo fins de semana personalizados e feriados opcionais. | `NETWORKDAYSINTL('1/1/2006', '2/1/2006', 7, ['1/2/2006'])` | Data de início, data final, modo de fim de semana, array opcional de feriados. | 23 |
| **NOW** | Retorna a data e hora atuais. | `NOW()` | Sem parâmetros. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **SECOND** | Retorna a parte dos segundos de um valor de tempo. | `SECOND('2/1/2011 4:48:18 PM')` | Valor de tempo ou string de texto de tempo. | 18 |
| **TIME** | Constrói um valor de tempo a partir da hora, minuto e segundo fornecidos. | `TIME(16, 48, 10)` | Hora (0-23), minuto (0-59), segundo (0-59). | 0.7001157407407408 |
| **TIMEVALUE** | Converte um tempo em formato de texto para um número de série de tempo. | `TIMEVALUE('22-Aug-2011 6:35 AM')` | String de texto que representa um tempo. | 0.2743055555555556 |
| **TODAY** | Retorna a data atual. | `TODAY()` | Sem parâmetros. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **WEEKDAY** | Retorna o número correspondente ao dia da semana. | `WEEKDAY('2/14/2008', 3)` | Valor de data ou uma string de texto de data, tipo de retorno (1-3). | 3 |
| **YEAR** | Retorna a parte do ano de uma data. | `YEAR('7/5/2008')` | Valor de data ou uma string de texto de data. | 2008 |
| **WEEKNUM** | Retorna o número da semana em um ano para uma determinada data. | `WEEKNUM('3/9/2012', 2)` | Valor de data ou uma string de texto de data, dia de início da semana opcional (1=Domingo, 2=Segunda-feira). | 11 |
| **WORKDAY** | Retorna a data antes ou depois de um determinado número de dias úteis, excluindo fins de semana e feriados opcionais. | `WORKDAY('10/1/2008', 151, ['11/26/2008', '12/4/2008'])` | Data de início, número de dias úteis, array opcional de feriados. | Mon May 04 2009 00:00:00 GMT-0700 (PDT) |
| **WORKDAYINTL** | Retorna a data antes ou depois de um número de dias úteis com fins de semana personalizados e feriados opcionais. | `WORKDAYINTL('1/1/2012', 30, 17)` | Data de início, número de dias úteis, modo de fim de semana. | Sun Feb 05 2012 00:00:00 GMT-0800 (PST) |
| **YEARFRAC** | Calcula a fração de anos entre duas datas. | `YEARFRAC('1/1/2012', '7/30/2012', 3)` | Data de início, data final, base opcional (base de contagem de dias). | 0.5780821917808219 |

### Financeiro

| Função | Definição | Exemplo de chamada | Parâmetros | Resultado esperado |
| :--- | :--- | :--- | :--- | :--- |
| **ACCRINT** | Calcula os juros acumulados de um título que paga juros periódicos. | `ACCRINT('01/01/2011', '02/01/2011', '07/01/2014', 0.1, 1000, 1, 0)` | Data de emissão, primeira data de juros, data de liquidação, taxa anual, valor nominal, frequência, base. | 350 |
| **CUMIPMT** | Calcula os juros cumulativos pagos em uma série de pagamentos. | `CUMIPMT(0.1/12, 30*12, 100000, 13, 24, 0)` | Taxa, total de períodos, valor presente, período inicial, período final, tipo de pagamento (0=final, 1=início). | -9916.77251395708 |
| **CUMPRINC** | Calcula o principal cumulativo pago em uma série de pagamentos. | `CUMPRINC(0.1/12, 30*12, 100000, 13, 24, 0)` | Taxa, total de períodos, valor presente, período inicial, período final, tipo de pagamento (0=final, 1=início). | -614.0863271085149 |
| **DB** | Calcula a depreciação usando o método de saldo decrescente fixo. | `DB(1000000, 100000, 6, 1, 6)` | Custo, valor residual, vida útil, período, mês. | 159500 |
| **DDB** | Calcula a depreciação usando o saldo decrescente duplo ou outro método especificado. | `DDB(1000000, 100000, 6, 1, 1.5)` | Custo, valor residual, vida útil, período, fator. | 250000 |
| **DOLLARDE** | Converte um preço expresso como uma fração em um decimal. | `DOLLARDE(1.1, 16)` | Preço como um dólar fracionário, denominador. | 1.625 |
| **DOLLARFR** | Converte um preço expresso como um decimal em uma fração. | `DOLLARFR(1.625, 16)` | Preço como um dólar decimal, denominador. | 1.1 |
| **EFFECT** | Calcula a taxa de juros anual efetiva. | `EFFECT(0.1, 4)` | Taxa anual nominal, número de períodos de capitalização por ano. | 0.10381289062499977 |
| **FV** | Calcula o valor futuro de um investimento. | `FV(0.1/12, 10, -100, -1000, 0)` | Taxa por período, número de períodos, pagamento por período, valor presente, tipo de pagamento (0=final, 1=início). | 2124.874409194097 |
| **FVSCHEDULE** | Calcula o valor futuro do principal usando uma série de taxas compostas. | `FVSCHEDULE(100, [0.09,0.1,0.11])` | Principal, array de taxas. | 133.08900000000003 |
| **IPMT** | Calcula o pagamento de juros para um período específico. | `IPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | Taxa por período, período, total de períodos, valor presente, valor futuro, tipo de pagamento (0=final, 1=início). | 928.8235718400465 |
| **IRR** | Calcula a taxa interna de retorno. | `IRR([-75000,12000,15000,18000,21000,24000], 0.075)` | Array de fluxos de caixa, estimativa. | 0.05715142887178447 |
| **ISPMT** | Calcula os juros pagos durante um período específico (para empréstimos). | `ISPMT(0.1/12, 6, 2*12, 100000)` | Taxa por período, período, total de períodos, valor do empréstimo. | -625 |
| **MIRR** | Calcula a taxa interna de retorno modificada. | `MIRR([-75000,12000,15000,18000,21000,24000], 0.1, 0.12)` | Array de fluxos de caixa, taxa de financiamento, taxa de reinvestimento. | 0.07971710360838036 |
| **NOMINAL** | Calcula a taxa de juros anual nominal. | `NOMINAL(0.1, 4)` | Taxa anual efetiva, número de períodos de capitalização por ano. | 0.09645475633778045 |
| **NPER** | Calcula o número de períodos necessários para atingir um valor alvo. | `NPER(0.1/12, -100, -1000, 10000, 0)` | Taxa por período, pagamento por período, valor presente, valor futuro, tipo de pagamento (0=final, 1=início). | 63.39385422740764 |
| **NPV** | Calcula o valor presente líquido de uma série de fluxos de caixa futuros. | `NPV(0.1, -10000, 2000, 4000, 8000)` | Taxa de desconto por período, array de fluxos de caixa. | 1031.3503176012546 |
| **PDURATION** | Calcula o tempo necessário para atingir um valor desejado. | `PDURATION(0.1, 1000, 2000)` | Taxa por período, valor presente, valor futuro. | 7.272540897341714 |
| **PMT** | Calcula o pagamento periódico de um empréstimo. | `PMT(0.1/12, 2*12, 1000, 10000, 0)` | Taxa por período, total de períodos, valor presente, valor futuro, tipo de pagamento (0=final, 1=início). | -42426.08563793503 |
| **PPMT** | Calcula o pagamento do principal para um período específico. | `PPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | Taxa por período, período, total de períodos, valor presente, valor futuro, tipo de pagamento (0=final, 1=início). | -43354.909209775076 |
| **PV** | Calcula o valor presente de um investimento. | `PV(0.1/12, 2*12, 1000, 10000, 0)` | Taxa por período, número de períodos, pagamento por período, valor futuro, tipo de pagamento (0=final, 1=início). | -29864.950264779152 |
| **RATE** | Calcula a taxa de juros por período. | `RATE(2*12, -1000, -10000, 100000, 0, 0.1)` | Total de períodos, pagamento por período, valor presente, valor futuro, tipo de pagamento (0=final, 1=início), estimativa. | 0.06517891177181533 |

### Engenharia

| Função | Definição | Exemplo de chamada | Parâmetros | Resultado esperado |
| :--- | :--- | :--- | :--- | :--- |
| **BIN2DEC** | Converte um número binário em decimal. | `BIN2DEC(101010)` | Número binário. | 42 |
| **BIN2HEX** | Converte um número binário em hexadecimal. | `BIN2HEX(101010)` | Número binário. | 2a |
| **BIN2OCT** | Converte um número binário em octal. | `BIN2OCT(101010)` | Número binário. | 52 |
| **BITAND** | Retorna o AND bit a bit de dois números. | `BITAND(42, 24)` | Inteiro, inteiro. | 8 |
| **BITLSHIFT** | Executa um deslocamento bit a bit para a esquerda. | `BITLSHIFT(42, 24)` | Inteiro, número de bits para deslocar. | 704643072 |
| **BITOR** | Retorna o OR bit a bit de dois números. | `BITOR(42, 24)` | Inteiro, inteiro. | 58 |
| **BITRSHIFT** | Executa um deslocamento bit a bit para a direita. | `BITRSHIFT(42, 2)` | Inteiro, número de bits para deslocar. | 10 |
| **BITXOR** | Retorna o XOR bit a bit de dois números. | `BITXOR(42, 24)` | Inteiro, inteiro. | 50 |
| **COMPLEX** | Cria um número complexo. | `COMPLEX(3, 4)` | Parte real, parte imaginária. | 3+4i |
| **CONVERT** | Converte um número de uma unidade de medida para outra. | `CONVERT(64, 'kibyte', 'bit')` | Valor, unidade de origem, unidade de destino. | 524288 |
| **DEC2BIN** | Converte um número decimal em binário. | `DEC2BIN(42)` | Número decimal. | 101010 |
| **DEC2HEX** | Converte um número decimal em hexadecimal. | `DEC2HEX(42)` | Número decimal. | 2a |
| **DEC2OCT** | Converte um número decimal em octal. | `DEC2OCT(42)` | Número decimal. | 52 |
| **DELTA** | Testa se dois valores são iguais. | `DELTA(42, 42)` | Número, número. | 1 |
| **ERF** | Retorna a função de erro. | `ERF(1)` | Limite superior. | 0.8427007929497149 |
| **ERFC** | Retorna a função de erro complementar. | `ERFC(1)` | Limite inferior. | 0.1572992070502851 |
| **GESTEP** | Testa se um número é maior ou igual a um limite. | `GESTEP(42, 24)` | Número, limite. | 1 |
| **HEX2BIN** | Converte um número hexadecimal em binário. | `HEX2BIN('2a')` | Número hexadecimal. | 101010 |
| **HEX2DEC** | Converte um número hexadecimal em decimal. | `HEX2DEC('2a')` | Número hexadecimal. | 42 |
| **HEX2OCT** | Converte um número hexadecimal em octal. | `HEX2OCT('2a')` | Número hexadecimal. | 52 |
| **IMABS** | Retorna o valor absoluto (magnitude) de um número complexo. | `IMABS('3+4i')` | Número complexo. | 5 |
| **IMAGINARY** | Retorna a parte imaginária de um número complexo. | `IMAGINARY('3+4i')` | Número complexo. | 4 |
| **IMARGUMENT** | Retorna o argumento de um número complexo. | `IMARGUMENT('3+4i')` | Número complexo. | 0.9272952180016122 |
| **IMCONJUGATE** | Retorna o conjugado complexo. | `IMCONJUGATE('3+4i')` | Número complexo. | 3-4i |
| **IMCOS** | Retorna o cosseno de um número complexo. | `IMCOS('1+i')` | Número complexo. | 0.8337300251311491-0.9888977057628651i |
| **IMCOSH** | Retorna o cosseno hiperbólico de um número complexo. | `IMCOSH('1+i')` | Número complexo. | 0.8337300251311491+0.9888977057628651i |
| **IMCOT** | Retorna a cotangente de um número complexo. | `IMCOT('1+i')` | Número complexo. | 0.21762156185440265-0.8680141428959249i |
| **IMCSC** | Retorna a cossecante de um número complexo. | `IMCSC('1+i')` | Número complexo. | 0.6215180171704283-0.3039310016284264i |
| **IMCSCH** | Retorna a cossecante hiperbólica de um número complexo. | `IMCSCH('1+i')` | Número complexo. | 0.3039310016284264-0.6215180171704283i |
| **IMDIV** | Retorna o quociente de dois números complexos. | `IMDIV('1+2i', '3+4i')` | Número complexo dividendo, número complexo divisor. | 0.44+0.08i |
| **IMEXP** | Retorna a exponencial de um número complexo. | `IMEXP('1+i')` | Número complexo. | 1.4686939399158851+2.2873552871788423i |
| **IMLN** | Retorna o logaritmo natural de um número complexo. | `IMLN('1+i')` | Número complexo. | 0.3465735902799727+0.7853981633974483i |
| **IMLOG10** | Retorna o logaritmo de base 10 de um número complexo. | `IMLOG10('1+i')` | Número complexo. | 0.1505149978319906+0.3410940884604603i |
| **IMLOG2** | Retorna o logaritmo de base 2 de um número complexo. | `IMLOG2('1+i')` | Número complexo. | 0.5000000000000001+1.1330900354567985i |
| **IMPOWER** | Retorna um número complexo elevado a uma potência. | `IMPOWER('1+i', 2)` | Número complexo, expoente. | 1.2246063538223775e-16+2.0000000000000004i |
| **IMPRODUCT** | Retorna o produto de números complexos. | `IMPRODUCT('1+2i', '3+4i', '5+6i')` | Array de números complexos. | -85+20i |
| **IMREAL** | Retorna a parte real de um número complexo. | `IMREAL('3+4i')` | Número complexo. | 3 |
| **IMSEC** | Retorna a secante de um número complexo. | `IMSEC('1+i')` | Número complexo. | 0.4983370305551868+0.591083841721045i |
| **IMSECH** | Retorna a secante hiperbólica de um número complexo. | `IMSECH('1+i')` | Número complexo. | 0.4983370305551868-0.591083841721045i |
| **IMSIN** | Retorna o seno de um número complexo. | `IMSIN('1+i')` | Número complexo. | 1.2984575814159773+0.6349639147847361i |
| **IMSINH** | Retorna o seno hiperbólico de um número complexo. | `IMSINH('1+i')` | Número complexo. | 0.6349639147847361+1.2984575814159773i |
| **IMSQRT** | Retorna a raiz quadrada de um número complexo. | `IMSQRT('1+i')` | Número complexo. | 1.0986841134678098+0.45508986056222733i |
| **IMSUB** | Retorna a diferença entre dois números complexos. | `IMSUB('3+4i', '1+2i')` | Número complexo minuendo, número complexo subtraendo. | 2+2i |
| **IMSUM** | Retorna a soma de números complexos. | `IMSUM('1+2i', '3+4i', '5+6i')` | Array de números complexos. | 9+12i |
| **IMTAN** | Retorna a tangente de um número complexo. | `IMTAN('1+i')` | Número complexo. | 0.2717525853195117+1.0839233273386946i |
| **OCT2BIN** | Converte um número octal em binário. | `OCT2BIN('52')` | Número octal. | 101010 |
| **OCT2DEC** | Converte um número octal em decimal. | `OCT2DEC('52')` | Número octal. | 42 |
| **OCT2HEX** | Converte um número octal em hexadecimal. | `OCT2HEX('52')` | Número octal. | 2a |

### Lógica

| Função | Definição | Exemplo de chamada | Parâmetros | Resultado esperado |
| :--- | :--- | :--- | :--- | :--- |
| **AND** | Retorna VERDADEIRO apenas quando todos os argumentos são VERDADEIROS, caso contrário, FALSO. | `AND(true, false, true)` | Um ou mais valores lógicos (Booleanos); a função retorna VERDADEIRO apenas quando cada argumento é VERDADEIRO. | |
| **FALSE** | Retorna o valor lógico FALSO. | `FALSE()` | Sem parâmetros. | |
| **IF** | Retorna valores diferentes dependendo se uma condição é VERDADEIRA ou FALSA. | `IF(true, 'Hello!', 'Goodbye!')` | Condição, valor se VERDADEIRO, valor se FALSO. | Hello! |
| **IFS** | Avalia várias condições e retorna o resultado da primeira condição VERDADEIRA. | `IFS(false, 'Hello!', true, 'Goodbye!')` | Múltiplos pares de condição e valor correspondente. | Goodbye! |
| **NOT** | Inverte um valor lógico. VERDADEIRO torna-se FALSO e vice-versa. | `NOT(true)` | Um valor lógico (Booleano). | |
| **OR** | Retorna VERDADEIRO se qualquer argumento for VERDADEIRO, caso contrário, FALSO. | `OR(true, false, true)` | Um ou mais valores lógicos (Booleanos); retorna VERDADEIRO quando qualquer argumento é VERDADEIRO. | |
| **SWITCH** | Retorna o valor que corresponde a uma expressão; se nenhum corresponder, retorna o padrão. | `SWITCH(7, 9, 'Nine', 7, 'Seven')` | Expressão, valor de correspondência 1, resultado 1, ..., [padrão]. | Seven |
| **TRUE** | Retorna o valor lógico VERDADEIRO. | `TRUE()` | Sem parâmetros. | |
| **XOR** | Retorna VERDADEIRO apenas quando um número ímpar de argumentos é VERDADEIRO, caso contrário, FALSO. | `XOR(true, false, true)` | Um ou mais valores lógicos (Booleanos); retorna VERDADEIRO quando uma contagem ímpar é VERDADEIRA. | |

### Matemática

| Função | Definição | Exemplo de chamada | Parâmetros | Resultado esperado |
| :--- | :--- | :--- | :--- | :--- |
| **ABS** | Retorna o valor absoluto de um número. | `ABS(-4)` | Número. | 4 |
| **ACOS** | Retorna o arco cosseno (em radianos). | `ACOS(-0.5)` | Número entre -1 e 1. | 2.0943951023931957 |
| **ACOSH** | Retorna o cosseno hiperbólico inverso. | `ACOSH(10)` | Número maior ou igual a 1. | 2.993222846126381 |
| **ACOT** | Retorna a arco cotangente (em radianos). | `ACOT(2)` | Qualquer número. | 0.46364760900080615 |
| **ACOTH** | Retorna a cotangente hiperbólica inversa. | `ACOTH(6)` | Número cujo valor absoluto é maior que 1. | 0.16823611831060645 |
| **AGGREGATE** | Executa um cálculo de agregação ignorando erros ou linhas ocultas. | `AGGREGATE(9, 4, [-5,15], [32,'Hello World!'])` | Número da função, opções, array1, ..., arrayN. | 10,32 |
| **ARABIC** | Converte um número romano em arábico. | `ARABIC('MCMXII')` | String de número romano. | 1912 |
| **ASIN** | Retorna o arco seno (em radianos). | `ASIN(-0.5)` | Número entre -1 e 1. | -0.5235987755982988 |
| **ASINH** | Retorna o seno hiperbólico inverso. | `ASINH(-2.5)` | Qualquer número. | -1.6472311463710965 |
| **ATAN** | Retorna a arco tangente (em radianos). | `ATAN(1)` | Qualquer número. | 0.7853981633974483 |
| **ATAN2** | Retorna a arco tangente (em radianos) de um par de coordenadas. | `ATAN2(-1, -1)` | coordenada y, coordenada x. | -2.356194490192345 |
| **ATANH** | Retorna a tangente hiperbólica inversa. | `ATANH(-0.1)` | Número entre -1 e 1. | -0.10033534773107562 |
| **BASE** | Converte um número em texto na base especificada. | `BASE(15, 2, 10)` | Número, base, [comprimento mínimo]. | 0000001111 |
| **CEILING** | Arredonda um número para cima até o múltiplo mais próximo. | `CEILING(-5.5, 2, -1)` | Número, significância, [modo]. | -6 |
| **CEILINGMATH** | Arredonda um número para cima, usando o múltiplo e a direção fornecidos. | `CEILINGMATH(-5.5, 2, -1)` | Número, [significância], [modo]. | -6 |
| **CEILINGPRECISE** | Arredonda um número para cima até o múltiplo mais próximo, ignorando o sinal. | `CEILINGPRECISE(-4.1, -2)` | Número, [significância]. | -4 |
| **COMBIN** | Retorna o número de combinações. | `COMBIN(8, 2)` | Itens totais, número escolhido. | 28 |
| **COMBINA** | Retorna o número de combinações com repetições. | `COMBINA(4, 3)` | Itens totais, número escolhido. | 20 |
| **COS** | Retorna o cosseno (em radianos). | `COS(1)` | Ângulo em radianos. | 0.5403023058681398 |
| **COSH** | Retorna o cosseno hiperbólico. | `COSH(1)` | Qualquer número. | 1.5430806348152437 |
| **COT** | Retorna a cotangente (em radianos). | `COT(30)` | Ângulo em radianos. | -0.15611995216165922 |
| **COTH** | Retorna a cotangente hiperbólica. | `COTH(2)` | Qualquer número. | 1.0373147207275482 |
| **CSC** | Retorna a cossecante (em radianos). | `CSC(15)` | Ângulo em radianos. | 1.5377805615408537 |
| **CSCH** | Retorna a cossecante hiperbólica. | `CSCH(1.5)` | Qualquer número. | 0.46964244059522464 |
| **DECIMAL** | Converte um número em formato de texto para decimal. | `DECIMAL('FF', 16)` | Texto, base. | 255 |
| **ERF** | Retorna a função de erro. | `ERF(1)` | Limite superior. | 0.8427007929497149 |
| **ERFC** | Retorna a função de erro complementar. | `ERFC(1)` | Limite inferior. | 0.1572992070502851 |
| **EVEN** | Arredonda um número para cima até o número inteiro par mais próximo. | `EVEN(-1)` | Número. | -2 |
| **EXP** | Retorna e elevado a uma potência. | `EXP(1)` | Expoente. | 2.718281828459045 |
| **FACT** | Retorna o fatorial. | `FACT(5)` | Inteiro não negativo. | 120 |
| **FACTDOUBLE** | Retorna o fatorial duplo. | `FACTDOUBLE(7)` | Inteiro não negativo. | 105 |
| **FLOOR** | Arredonda um número para baixo até o múltiplo mais próximo. | `FLOOR(-3.1)` | Número, significância. | -4 |
| **FLOORMATH** | Arredonda um número para baixo usando o múltiplo e a direção fornecidos. | `FLOORMATH(-4.1, -2, -1)` | Número, [significância], [modo]. | -4 |
| **FLOORPRECISE** | Arredonda um número para baixo até o múltiplo mais próximo, ignorando o sinal. | `FLOORPRECISE(-3.1, -2)` | Número, [significância]. | -4 |
| **GCD** | Retorna o máximo divisor comum. | `GCD(24, 36, 48)` | Dois ou mais inteiros. | 12 |
| **INT** | Arredonda um número para baixo até o número inteiro mais próximo. | `INT(-8.9)` | Número. | -9 |
| **ISEVEN** | Testa se um número é par. | `ISEVEN(-2.5)` | Número. | |
| **ISOCEILING** | Arredonda um número para cima até o múltiplo mais próximo seguindo as regras ISO. | `ISOCEILING(-4.1, -2)` | Número, [significância]. | -4 |
| **ISODD** | Testa se um número é ímpar. | `ISODD(-2.5)` | Número. | |
| **LCM** | Retorna o mínimo múltiplo comum. | `LCM(24, 36, 48)` | Dois ou mais inteiros. | 144 |
| **LN** | Retorna o logaritmo natural. | `LN(86)` | Número positivo. | 4.454347296253507 |
| **LOG** | Retorna o logaritmo na base especificada. | `LOG(8, 2)` | Número, base. | 3 |
| **LOG10** | Retorna o logaritmo de base 10. | `LOG10(100000)` | Número positivo. | 5 |
| **MOD** | Retorna o resto de uma divisão. | `MOD(3, -2)` | Dividendo, divisor. | -1 |
| **MROUND** | Arredonda um número para o múltiplo mais próximo. | `MROUND(-10, -3)` | Número, múltiplo. | -9 |
| **MULTINOMIAL** | Retorna o coeficiente multinomial. | `MULTINOMIAL(2, 3, 4)` | Dois ou mais inteiros não negativos. | 1260 |
| **ODD** | Arredonda um número para cima até o número inteiro ímpar mais próximo. | `ODD(-1.5)` | Número. | -3 |
| **POWER** | Eleva um número a uma potência. | `POWER(5, 2)` | Base, expoente. | 25 |
| **PRODUCT** | Retorna o produto de números. | `PRODUCT(5, 15, 30)` | Um ou mais números. | 2250 |
| **QUOTIENT** | Retorna a parte inteira de uma divisão. | `QUOTIENT(-10, 3)` | Dividendo, divisor. | -3 |
| **RADIANS** | Converte graus em radianos. | `RADIANS(180)` | Graus. | 3.141592653589793 |
| **RAND** | Retorna um número real aleatório entre 0 e 1. | `RAND()` | Sem parâmetros. | [Número real aleatório entre 0 e 1] |
| **RANDBETWEEN** | Retorna um número inteiro aleatório dentro de um intervalo especificado. | `RANDBETWEEN(-1, 1)` | Inferior, superior. | [Número inteiro aleatório entre inferior e superior] |
| **ROUND** | Arredonda um número para o número especificado de dígitos. | `ROUND(626.3, -3)` | Número, dígitos. | 1000 |
| **ROUNDDOWN** | Arredonda um número para baixo em direção a zero. | `ROUNDDOWN(-3.14159, 2)` | Número, dígitos. | -3.14 |
| **ROUNDUP** | Arredonda um número para cima afastando-se de zero. | `ROUNDUP(-3.14159, 2)` | Número, dígitos. | -3.15 |
| **SEC** | Retorna a secante (em radianos). | `SEC(45)` | Ângulo em radianos. | 1.9035944074044246 |
| **SECH** | Retorna a secante hiperbólica. | `SECH(45)` | Qualquer número. | 5.725037161098787e-20 |
| **SIGN** | Retorna o sinal de um número. | `SIGN(-0.00001)` | Número. | -1 |
| **SIN** | Retorna o seno (em radianos). | `SIN(1)` | Ângulo em radianos. | 0.8414709848078965 |
| **SINH** | Retorna o seno hiperbólico. | `SINH(1)` | Qualquer número. | 1.1752011936438014 |
| **SQRT** | Retorna a raiz quadrada. | `SQRT(16)` | Número não negativo. | 4 |
| **SQRTPI** | Retorna a raiz quadrada de (número * π). | `SQRTPI(2)` | Número não negativo. | 2.5066282746310002 |
| **SUBTOTAL** | Retorna um subtotal para um conjunto de dados, ignorando linhas ocultas. | `SUBTOTAL(9, [-5,15], [32,'Hello World!'])` | Número da função, array1, ..., arrayN. | 10,32 |
| **SUM** | Retorna a soma de números, ignorando texto. | `SUM(-5, 15, 32, 'Hello World!')` | Um ou mais números. | 42 |
| **SUMIF** | Soma valores que atendem a uma única condição. | `SUMIF([2,4,8,16], '>5')` | Intervalo, critério. | 24 |
| **SUMIFS** | Soma valores que atendem a várias condições. | `SUMIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Intervalo de soma, intervalo de critérios 1, critério 1, ..., intervalo de critérios N, critério N. | 12 |
| **SUMPRODUCT** | Retorna a soma dos produtos dos elementos da matriz. | `SUMPRODUCT([[1,2],[3,4]], [[1,0],[0,1]])` | Duas ou mais matrizes. | 5 |
| **SUMSQ** | Retorna a soma dos quadrados. | `SUMSQ(3, 4)` | Um ou mais números. | 25 |
| **SUMX2MY2** | Retorna a soma da diferença dos quadrados dos elementos correspondentes da matriz. | `SUMX2MY2([1,2], [3,4])` | Matriz1, matriz2. | -20 |
| **SUMX2PY2** | Retorna a soma da soma dos quadrados dos elementos correspondentes da matriz. | `SUMX2PY2([1,2], [3,4])` | Matriz1, matriz2. | 30 |
| **SUMXMY2** | Retorna a soma dos quadrados das diferenças dos elementos correspondentes da matriz. | `SUMXMY2([1,2], [3,4])` | Matriz1, matriz2. | 8 |
| **TAN** | Retorna a tangente (em radianos). | `TAN(1)` | Ângulo em radianos. | 1.5574077246549023 |
| **TANH** | Retorna a tangente hiperbólica. | `TANH(-2)` | Qualquer número. | -0.9640275800758168 |
| **TRUNC** | Trunca um número para um inteiro sem arredondar. | `TRUNC(-8.9)` | Número, [dígitos]. | -8 |

### Estatística

| Função | Definição | Exemplo de chamada | Parâmetros | Resultado esperado |
| :--- | :--- | :--- | :--- | :--- |
| **AVEDEV** | Retorna o desvio médio absoluto. | `AVEDEV([2,4], [8,16])` | Matrizes de números representando pontos de dados. | 4.5 |
| **AVERAGE** | Retorna a média aritmética. | `AVERAGE([2,4], [8,16])` | Matrizes de números representando pontos de dados. | 7.5 |
| **AVERAGEA** | Retorna a média dos valores, incluindo texto e valores lógicos. | `AVERAGEA([2,4], [8,16])` | Matrizes de números, texto ou valores lógicos; todos os valores não vazios são incluídos. | 7.5 |
| **AVERAGEIF** | Calcula a média com base em uma única condição. | `AVERAGEIF([2,4,8,16], '>5', [1, 2, 3, 4])` | O primeiro parâmetro é o intervalo a ser verificado, o segundo é a condição, o terceiro é o intervalo opcional usado para a média. | 3.5 |
| **AVERAGEIFS** | Calcula a média com base em várias condições. | `AVERAGEIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | O primeiro parâmetro são os valores para a média, seguidos por pares de intervalos de critérios e expressões de critérios. | 6 |
| **BETADIST** | Retorna a densidade de probabilidade beta cumulativa. | `BETADIST(2, 8, 10, true, 1, 3)` | Valor, alfa, beta, sinalizador cumulativo, A (opcional), B (opcional). | 0.6854705810117458 |
| **BETAINV** | Retorna o inverso da distribuição beta cumulativa. | `BETAINV(0.6854705810117458, 8, 10, 1, 3)` | Probabilidade, alfa, beta, A (opcional), B (opcional). | 1.9999999999999998 |
| **BINOMDIST** | Retorna a probabilidade de uma distribuição binomial. | `BINOMDIST(6, 10, 0.5, false)` | Número de sucessos, tentativas, probabilidade de sucesso, sinalizador cumulativo. | 0.205078125 |
| **CORREL** | Retorna o coeficiente de correlação entre dois conjuntos de dados. | `CORREL([3,2,4,5,6], [9,7,12,15,17])` | Duas matrizes de números. | 0.9970544855015815 |
| **COUNT** | Conta células numéricas. | `COUNT([1,2], [3,4])` | Matrizes ou intervalos de números. | 4 |
| **COUNTA** | Conta células não vazias. | `COUNTA([1, null, 3, 'a', '', 'c'])` | Matrizes ou intervalos de qualquer tipo. | 4 |
| **COUNTBLANK** | Conta células vazias. | `COUNTBLANK([1, null, 3, 'a', '', 'c'])` | Matrizes ou intervalos de qualquer tipo. | 2 |
| **COUNTIF** | Conta células que correspondem a uma condição. | `COUNTIF(['Caen', 'Melbourne', 'Palo Alto', 'Singapore'], 'a')` | Intervalo de números ou texto, e a condição. | 3 |
| **COUNTIFS** | Conta células que correspondem a várias condições. | `COUNTIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Pares de intervalos de critérios e expressões de critérios. | 2 |
| **COVARIANCEP** | Retorna a covariância populacional. | `COVARIANCEP([3,2,4,5,6], [9,7,12,15,17])` | Duas matrizes de números. | 5.2 |
| **COVARIANCES** | Retorna a covariância amostral. | `COVARIANCES([2,4,8], [5,11,12])` | Duas matrizes de números. | 9.666666666666668 |
| **DEVSQ** | Retorna a soma dos quadrados dos desvios. | `DEVSQ([2,4,8,16])` | Matriz de números representando pontos de dados. | 115 |
| **EXPONDIST** | Retorna a distribuição exponencial. | `EXPONDIST(0.2, 10, true)` | Valor, lambda, sinalizador cumulativo. | 0.8646647167633873 |
| **FDIST** | Retorna a distribuição de probabilidade F. | `FDIST(15.2069, 6, 4, false)` | Valor, graus de liberdade 1, graus de liberdade 2, sinalizador cumulativo. | 0.0012237917087831735 |
| **FINV** | Retorna o inverso da distribuição F. | `FINV(0.01, 6, 4)` | Probabilidade, graus de liberdade 1, graus de liberdade 2. | 0.10930991412457851 |
| **FISHER** | Retorna a transformação Fisher. | `FISHER(0.75)` | Número representando um coeficiente de correlação. | 0.9729550745276566 |
| **FISHERINV** | Retorna o inverso da transformação Fisher. | `FISHERINV(0.9729550745276566)` | Número representando um resultado da transformação Fisher. | 0.75 |
| **FORECAST** | Prevê um valor y para um x dado usando valores x e y conhecidos. | `FORECAST(30, [6,7,9,15,21], [20,28,31,38,40])` | Novo valor x, matriz de valores y conhecidos, matriz de valores x conhecidos. | 10.607253086419755 |
| **FREQUENCY** | Retorna uma distribuição de frequência. | `FREQUENCY([79,85,78,85,50,81,95,88,97], [70,79,89])` | Matriz de dados, matriz de classes. | 1,2,4,2 |
| **GAMMA** | Retorna a função gama. | `GAMMA(2.5)` | Número positivo. | 1.3293403919101043 |
| **GAMMALN** | Retorna o logaritmo natural da função gama. | `GAMMALN(10)` | Número positivo. | 12.801827480081961 |
| **GAUSS** | Retorna a probabilidade baseada na distribuição normal padrão. | `GAUSS(2)` | Número representando um escore z. | 0.4772498680518208 |
| **GEOMEAN** | Retorna a média geométrica. | `GEOMEAN([2,4], [8,16])` | Matrizes de números. | 5.656854249492381 |
| **GROWTH** | Prevê valores de crescimento exponencial com base em dados conhecidos. | `GROWTH([2,4,8,16], [1,2,3,4], [5])` | Matriz de valores y conhecidos, matriz de valores x conhecidos, novos valores x. | 32.00000000000003 |
| **HARMEAN** | Retorna a média harmônica. | `HARMEAN([2,4], [8,16])` | Matrizes de números. | 4.266666666666667 |
| **HYPGEOMDIST** | Retorna a distribuição hipergeométrica. | `HYPGEOMDIST(1, 4, 8, 20, false)` | Sucessos na amostra, tamanho da amostra, sucessos na população, tamanho da população, sinalizador cumulativo. | 0.3632610939112487 |
| **INTERCEPT** | Retorna a intercepção de uma linha de regressão linear. | `INTERCEPT([2,3,9,1,8], [6,5,11,7,5])` | Matriz de valores y conhecidos, matriz de valores x conhecidos. | 0.04838709677419217 |
| **KURT** | Retorna a curtose. | `KURT([3,4,5,2,3,4,5,6,4,7])` | Matriz de números. | -0.15179963720841627 |
| **LARGE** | Retorna o k-ésimo maior valor. | `LARGE([3,5,3,5,4,4,2,4,6,7], 3)` | Matriz de números, k. | 5 |
| **LINEST** | Executa análise de regressão linear. | `LINEST([1,9,5,7], [0,4,2,3], true, true)` | Matriz de valores y conhecidos, matriz de valores x conhecidos, retornar estatísticas adicionais, retornar mais estatísticas. | 2,1 |
| **LOGNORMDIST** | Retorna a distribuição lognormal. | `LOGNORMDIST(4, 3.5, 1.2, true)` | Valor, média, desvio padrão, sinalizador cumulativo. | 0.0390835557068005 |
| **LOGNORMINV** | Retorna o inverso da distribuição lognormal. | `LOGNORMINV(0.0390835557068005, 3.5, 1.2, true)` | Probabilidade, média, desvio padrão, sinalizador cumulativo. | 4.000000000000001 |
| **MAX** | Retorna o valor máximo. | `MAX([0.1,0.2], [0.4,0.8], [true, false])` | Matrizes de números. | 0.8 |
| **MAXA** | Retorna o valor máximo incluindo texto e valores lógicos. | `MAXA([0.1,0.2], [0.4,0.8], [true, false])` | Matrizes de números, texto ou valores lógicos. | 1 |
| **MEDIAN** | Retorna a mediana. | `MEDIAN([1,2,3], [4,5,6])` | Matrizes de números. | 3.5 |
| **MIN** | Retorna o valor mínimo. | `MIN([0.1,0.2], [0.4,0.8], [true, false])` | Matrizes de números. | 0.1 |
| **MINA** | Retorna o valor mínimo incluindo texto e valores lógicos. | `MINA([0.1,0.2], [0.4,0.8], [true, false])` | Matrizes de números, texto ou valores lógicos. | 0 |
| **MODEMULT** | Retorna uma matriz dos valores que ocorrem com mais frequência. | `MODEMULT([1,2,3,4,3,2,1,2,3])` | Matriz de números. | 2,3 |
| **MODESNGL** | Retorna o valor único que ocorre com mais frequência. | `MODESNGL([1,2,3,4,3,2,1,2,3])` | Matriz de números. | 2 |
| **NORMDIST** | Retorna a distribuição normal. | `NORMDIST(42, 40, 1.5, true)` | Valor, média, desvio padrão, sinalizador cumulativo. | 0.9087887802741321 |
| **NORMINV** | Retorna o inverso da distribuição normal. | `NORMINV(0.9087887802741321, 40, 1.5)` | Probabilidade, média, desvio padrão. | 42 |
| **NORMSDIST** | Retorna a distribuição normal padrão. | `NORMSDIST(1, true)` | Número representando um escore z. | 0.8413447460685429 |
| **NORMSINV** | Retorna o inverso da distribuição normal padrão. | `NORMSINV(0.8413447460685429)` | Probabilidade. | 1.0000000000000002 |
| **PEARSON** | Retorna o coeficiente de correlação de produto-momento de Pearson. | `PEARSON([9,7,5,3,1], [10,6,1,5,3])` | Duas matrizes de números. | 0.6993786061802354 |
| **PERCENTILEEXC** | Retorna o k-ésimo percentil, exclusivo. | `PERCENTILEEXC([1,2,3,4], 0.3)` | Matriz de números, k. | 1.5 |
| **PERCENTILEINC** | Retorna o k-ésimo percentil, inclusivo. | `PERCENTILEINC([1,2,3,4], 0.3)` | Matriz de números, k. | 1.9 |
| **PERCENTRANKEXC** | Retorna a classificação de um valor em um conjunto de dados como uma porcentagem (exclusiva). | `PERCENTRANKEXC([1,2,3,4], 2, 2)` | Matriz de números, valor x, significância (opcional). | 0.4 |
| **PERCENTRANKINC** | Retorna a classificação de um valor em um conjunto de dados como uma porcentagem (inclusiva). | `PERCENTRANKINC([1,2,3,4], 2, 2)` | Matriz de números, valor x, significância (opcional). | 0.33 |
| **PERMUT** | Retorna o número de permutações. | `PERMUT(100, 3)` | Número total n, número escolhido k. | 970200 |
| **PERMUTATIONA** | Retorna o número de permutações com repetições. | `PERMUTATIONA(4, 3)` | Número total n, número escolhido k. | 64 |
| **PHI** | Retorna a função de densidade da distribuição normal padrão. | `PHI(0.75)` | Número representando um escore z. | 0.30113743215480443 |
| **POISSONDIST** | Retorna a distribuição de Poisson. | `POISSONDIST(2, 5, true)` | Número de eventos, média, sinalizador cumulativo. | 0.12465201948308113 |
| **PROB** | Retorna a soma das probabilidades. | `PROB([1,2,3,4], [0.1,0.2,0.2,0.1], 2, 3)` | Matriz de valores, matriz de probabilidades, limite inferior, limite superior. | 0.4 |
| **QUARTILEEXC** | Retorna o quartil do conjunto de dados, exclusivo. | `QUARTILEEXC([1,2,3,4], 1)` | Matriz de números, quartil. | 1.25 |
| **QUARTILEINC** | Retorna o quartil do conjunto de dados, inclusivo. | `QUARTILEINC([1,2,3,4], 1)` | Matriz de números, quartil. | 1.75 |
| **RANKAVG** | Retorna a classificação média. | `RANKAVG(4, [2,4,4,8,8,16], false)` | Número, matriz de números, ordem (ascendente/descendente). | 4.5 |
| **RANKEQ** | Retorna a classificação de um número. | `RANKEQ(4, [2,4,4,8,8,16], false)` | Número, matriz de números, ordem (ascendente/descendente). | 4 |
| **RSQ** | Retorna o coeficiente de determinação. | `RSQ([9,7,5,3,1], [10,6,1,5,3])` | Duas matrizes de números. | 0.4891304347826088 |
| **SKEW** | Retorna a assimetria. | `SKEW([3,4,5,2,3,4,5,6,4,7])` | Matriz de números. | 0.3595430714067974 |
| **SKEWP** | Retorna a assimetria populacional. | `SKEWP([3,4,5,2,3,4,5,6,4,7])` | Matriz de números. | 0.303193339354144 |
| **SLOPE** | Retorna a inclinação da linha de regressão linear. | `SLOPE([1,9,5,7], [0,4,2,3])` | Matriz de valores y conhecidos, matriz de valores x conhecidos. | 2 |
| **SMALL** | Retorna o k-ésimo menor valor. | `SMALL([3,5,3,5,4,4,2,4,6,7], 3)` | Matriz de números, k. | 3 |
| **STANDARDIZE** | Retorna um valor normalizado como um escore z. | `STANDARDIZE(42, 40, 1.5)` | Valor, média, desvio padrão. | 1.3333333333333333 |
| **STDEVA** | Retorna o desvio padrão, incluindo texto e valores lógicos. | `STDEVA([2,4], [8,16], [true, false])` | Matrizes de números, texto ou valores lógicos. | 6.013872850889572 |
| **STDEVP** | Retorna o desvio padrão populacional. | `STDEVP([2,4], [8,16], [true, false])` | Matrizes de números. | 5.361902647381804 |
| **STDEVPA** | Retorna o desvio padrão populacional, incluindo texto e valores lógicos. | `STDEVPA([2,4], [8,16], [true, false])` | Matrizes de números, texto ou valores lógicos. | 5.489889697333535 |
| **STDEVS** | Retorna o desvio padrão amostral. | `VARS([2,4], [8,16], [true, false])` | Matrizes de números. | 6.191391873668904 |
| **STEYX** | Retorna o erro padrão do valor y previsto. | `STEYX([2,3,9,1,8,7,5], [6,5,11,7,5,4,4])` | Matriz de valores y conhecidos, matriz de valores x conhecidos. | 3.305718950210041 |
| **TINV** | Retorna o inverso da distribuição t. | `TINV(0.9946953263673741, 1)` | Probabilidade, graus de liberdade. | 59.99999999996535 |
| **TRIMMEAN** | Retorna a média da parte interna de um conjunto de dados. | `TRIMMEAN([4,5,6,7,2,3,4,5,1,2,3], 0.2)` | Matriz de números, proporção de corte. | 3.7777777777777777 |
| **VARA** | Retorna a variância incluindo texto e valores lógicos. | `VARA([2,4], [8,16], [true, false])` | Matrizes de números, texto ou valores lógicos. | 36.16666666666667 |
| **VARP** | Retorna a variância populacional. | `VARP([2,4], [8,16], [true, false])` | Matrizes de números. | 28.75 |
| **VARPA** | Retorna a variância populacional incluindo texto e valores lógicos. | `VARPA([2,4], [8,16], [true, false])` | Matrizes de números, texto ou valores lógicos. | 30.13888888888889 |
| **VARS** | Retorna a variância amostral. | `VARS([2,4], [8,16], [true, false])` | Matrizes de números. | 38.333333333333336 |
| **WEIBULLDIST** | Retorna a distribuição de Weibull. | `WEIBULLDIST(105, 20, 100, true)` | Valor, alfa, beta, sinalizador cumulativo. | 0.9295813900692769 |
| **ZTEST** | Retorna a probabilidade de cauda única de um teste z. | `ZTEST([3,6,7,8,6,5,4,2,1,9], 4)` | Matriz de números, média hipotética. | 0.09057419685136381 |

### Texto

| Função | Definição | Exemplo de chamada | Parâmetros | Resultado esperado |
| :--- | :--- | :--- | :--- | :--- |
| **CHAR** | Converte um código numérico no caractere correspondente. | `CHAR(65)` | Número representando o código do caractere. | A |
| **CLEAN** | Remove todos os caracteres não imprimíveis do texto. | `CLEAN('Monthly report')` | String de texto para limpar. | Monthly report |
| **CODE** | Retorna o código numérico do primeiro caractere em uma string de texto. | `CODE('A')` | String de texto contendo um único caractere. | 65 |
| **CONCATENATE** | Junta várias strings de texto em uma única string. | `CONCATENATE('Andreas', ' ', 'Hauser')` | Uma ou mais strings de texto para juntar. | Andreas Hauser |
| **EXACT** | Verifica se duas strings são exatamente iguais, diferenciando maiúsculas de minúsculas. | `EXACT('Word', 'word')` | Duas strings de texto para comparar. | |
| **FIND** | Encontra a posição de uma substring a partir de uma posição fornecida. | `FIND('M', 'Miriam McGovern', 3)` | Texto a encontrar, texto de origem, posição inicial opcional. | 8 |
| **LEFT** | Retorna um número especificado de caracteres do lado esquerdo de uma string. | `LEFT('Sale Price', 4)` | String de texto e número de caracteres. | Sale |
| **LEN** | Retorna o número de caracteres em uma string de texto. | `LEN('Phoenix, AZ')` | String de texto para contar. | 11 |
| **LOWER** | Converte todos os caracteres para minúsculas. | `LOWER('E. E. Cummings')` | String de texto para converter. | e. e. cummings |
| **MID** | Retorna um número especificado de caracteres do meio de uma string. | `MID('Fluid Flow', 7, 20)` | String de texto, posição inicial, número de caracteres. | Flow |
| **NUMBERVALUE** | Converte texto em um número usando separadores especificados. | `NUMBERVALUE('2.500,27', ',', '.')` | String de texto, separador decimal, separador de grupo. | 2500.27 |
| **PROPER** | Coloca a primeira letra de cada palavra em maiúscula. | `PROPER('this is a TITLE')` | String de texto para formatar. | This Is A Title |
| **REPLACE** | Substitui parte de uma string de texto por um novo texto. | `REPLACE('abcdefghijk', 6, 5, '*')` | Texto original, posição inicial, número de caracteres, novo texto. | abcde*k |
| **REPT** | Repete o texto um número especificado de vezes. | `REPT('*-', 3)` | String de texto e contagem de repetições. | *-*-*- |
| **RIGHT** | Retorna um número especificado de caracteres do lado direito de uma string. | `RIGHT('Sale Price', 5)` | String de texto e número de caracteres. | Price |
| **ROMAN** | Converte um algarismo arábico em algarismos romanos. | `ROMAN(499)` | Número arábico para converter. | CDXCIX |
| **SEARCH** | Encontra a posição de uma substring, sem diferenciar maiúsculas de minúsculas. | `SEARCH('margin', 'Profit Margin')` | Texto a encontrar, texto de origem. | 8 |
| **SUBSTITUTE** | Substitui uma instância específica de um texto antigo por um novo texto. | `SUBSTITUTE('Quarter 1, 2011', '1', '2', 3)` | Texto original, texto antigo, novo texto, número de instância opcional. | Quarter 1, 2012 |
| **T** | Retorna o texto se o valor for texto; caso contrário, retorna uma string vazia. | `T('Rainfall')` | O argumento pode ser qualquer tipo de dado. | Rainfall |
| **TRIM** | Remove espaços do texto, exceto espaços simples entre as palavras. | `TRIM(' First Quarter Earnings ')` | String de texto para aparar. | First Quarter Earnings |
| **TEXTJOIN** | Junta vários itens de texto em uma string usando um delimitador. | `TEXTJOIN(' ', true, 'The', '', 'sun', 'will', 'come', 'up', 'tomorrow.')` | Delimitador, sinalizador para ignorar vazios, itens de texto para juntar. | The sun will come up tomorrow. |
| **UNICHAR** | Retorna o caractere para um determinado número Unicode. | `UNICHAR(66)` | Ponto de código Unicode. | B |
| **UNICODE** | Retorna o número Unicode do primeiro caractere do texto. | `UNICODE('B')` | String de texto contendo um único caractere. | 66 |
| **UPPER** | Converte todos os caracteres para maiúsculas. | `UPPER('total')` | String de texto para converter. | TOTAL |