### 货币格式化

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### 语法说明
格式化货币数字，可指定小数位数或特定输出格式。  
参数：
- precisionOrFormat：可选参数，既可以是数字（指定小数位数），也可以是特定格式标识：
  - 整数：改变默认小数精度
  - `'M'`：仅输出主要货币名称
  - `'L'`：输出数字并附带货币符号（默认）
  - `'LL'`：输出数字并附带主要货币名称
- targetCurrency：可选，目标货币代码（大写，如 USD、EUR），会覆盖全局设置

##### 示例
```
'1000.456':formatC()      // 输出 "$2,000.91"
'1000.456':formatC('M')    // 输出 "dollars"
'1':formatC('M')           // 输出 "dollar"
'1000':formatC('L')        // 输出 "$2,000.00"
'1000':formatC('LL')       // 输出 "2,000.00 dollars"
```

##### 结果
输出结果依据 API 选项及汇率设置。


#### 2. :convCurr(target, source)

##### 语法说明
将数字从一种货币转换为另一种货币。汇率可通过 API 选项传入或全局设置。  
若不指定参数，则自动从 `options.currencySource` 转换到 `options.currencyTarget`。  
参数：
- target：可选，目标货币代码（默认等于 `options.currencyTarget`）
- source：可选，源货币代码（默认等于 `options.currencySource`）

##### 示例
```
10:convCurr()              // 输出 20
1000:convCurr()            // 输出 2000
1000:convCurr('EUR')        // 输出 1000
1000:convCurr('USD')        // 输出 2000
1000:convCurr('USD', 'USD') // 输出 1000
```

##### 结果
输出为转换后的货币数值。


