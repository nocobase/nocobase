---
pkg: '@nocobase/plugin-workflow-javascript'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Script JavaScript

## Introdução

O nó de Script JavaScript permite que você execute um script JavaScript personalizado no lado do servidor dentro de um **fluxo de trabalho**. O script pode usar variáveis de etapas anteriores do **fluxo de trabalho** como parâmetros, e seu valor de retorno pode ser fornecido para nós subsequentes.

O script é executado em uma *worker thread* no servidor da aplicação NocoBase e suporta a maioria dos recursos do Node.js. No entanto, existem algumas diferenças em relação ao ambiente de execução nativo. Para mais detalhes, consulte a [Lista de Recursos](#feature-list).

## Criar Nó

Na interface de configuração do **fluxo de trabalho**, clique no botão de adição (“+”) no fluxo para adicionar um nó “JavaScript”:

![20241202203457](https://static-docs.nocobase.com/20241202203457.png)

## Configuração do Nó

![20241202203655](https://static-docs.nocobase.com/20241202203655.png)

### Parâmetros

Usado para passar variáveis ou valores estáticos do contexto do **fluxo de trabalho** para o script, para que sejam utilizados na lógica do código. O `name` é o nome do parâmetro, que se torna o nome da variável assim que é passado para o script. O `value` é o valor do parâmetro, podendo ser uma variável ou uma constante.

### Conteúdo do Script

O conteúdo do script pode ser considerado uma função. Você pode escrever qualquer código JavaScript suportado no ambiente Node.js e usar a instrução `return` para retornar um valor como resultado da execução do nó, que pode ser usado como uma variável por nós subsequentes.

Após escrever o código, você pode clicar no botão de teste abaixo do editor para abrir uma caixa de diálogo de execução de teste, onde é possível preencher os parâmetros com valores estáticos para uma execução simulada. Após a execução, você verá o valor de retorno e o conteúdo da saída (*log*) na caixa de diálogo.

![20241202203833](https://static-docs.nocobase.com/20241202203833.png)

### Configuração de Tempo Limite

A unidade é em milissegundos. Um valor de `0` significa que nenhum tempo limite é definido.

### Continuar em caso de erro

Se marcada, os nós subsequentes ainda serão executados mesmo que o script encontre um erro ou atinja o tempo limite.

:::info{title="Dica"}
Se o script falhar, ele não terá valor de retorno, e o resultado do nó será preenchido com a mensagem de erro. Se nós subsequentes utilizarem a variável de resultado do nó de script, você precisará lidar com isso com cautela.
:::

## Lista de Recursos

### Versão do Node.js

É a mesma versão do Node.js que executa a aplicação principal.

### Suporte a Módulos

Os módulos podem ser usados no script com algumas limitações, de forma consistente com o CommonJS, utilizando a diretiva `require()` para importar módulos.

Suporta módulos nativos do Node.js e módulos instalados em `node_modules` (incluindo dependências já utilizadas pelo NocoBase). Os módulos a serem disponibilizados para o código devem ser declarados na variável de ambiente da aplicação `WORKFLOW_SCRIPT_MODULES`, com múltiplos nomes de pacotes separados por vírgulas, por exemplo:

```ini
WORKFLOW_SCRIPT_MODULES=crypto,timers,lodash,dayjs
```

:::info{title="Dica"}
Módulos não declarados na variável de ambiente `WORKFLOW_SCRIPT_MODULES` **não podem** ser usados no script, mesmo que sejam nativos do Node.js ou já estejam instalados em `node_modules`. Essa política pode ser utilizada no nível operacional para controlar a lista de módulos disponíveis para os usuários, evitando que os scripts tenham permissões excessivas em alguns cenários.
:::

Em um ambiente que não seja de implantação por código-fonte, se um módulo não estiver instalado em `node_modules`, você pode instalar manualmente o pacote necessário no diretório `storage`. Por exemplo, para usar o pacote `exceljs`, você pode seguir estas etapas:

```shell
cd storage
npm i --no-save --no-package-lock --prefix . exceljs
```

Em seguida, adicione o caminho relativo (ou absoluto) do pacote, baseado no CWD (diretório de trabalho atual) da aplicação, à variável de ambiente `WORKFLOW_SCRIPT_MODULES`:

```ini
WORKFLOW_SCRIPT_MODULES=./storage/node_modules/exceljs
```

Você pode então usar o pacote `exceljs` em seu script:

```js
const ExcelJS = require('exceljs');
// ...
```

### Variáveis Globais

**Não suporta** variáveis globais como `global`, `process`, `__dirname` e `__filename`.

```js
console.log(global); // will throw error: "global is not defined"
```

### Parâmetros de Entrada

Os parâmetros configurados no nó se tornam variáveis globais dentro do script e podem ser usados diretamente. Os parâmetros passados para o script suportam apenas tipos básicos, como `boolean`, `number`, `string`, `object` e arrays. Um objeto `Date` será convertido para uma string no formato ISO ao ser passado. Outros tipos complexos, como instâncias de classes personalizadas, não podem ser passados diretamente.

### Valor de Retorno

A instrução `return` pode ser usada para retornar tipos de dados básicos (seguindo as mesmas regras dos parâmetros) para o nó como seu resultado. Se a instrução `return` não for chamada no código, a execução do nó não terá valor de retorno.

```js
return 123;
```

### Saída (Log)

**Suporta** o uso de `console` para exibir logs.

```js
console.log('hello world!');
```

Quando o **fluxo de trabalho** é executado, a saída do nó de script também é registrada no arquivo de log do **fluxo de trabalho** correspondente.

### Assíncrono

**Suporta** o uso de `async` para definir funções assíncronas e `await` para chamá-las. **Suporta** o uso do objeto global `Promise`.

```js
async function test() {
  return Promise.resolve(1);
}

const value = await test();
return value;
```

### Timers

Para usar métodos como `setTimeout`, `setInterval` ou `setImmediate`, você precisa importá-los do pacote `timers` do Node.js.

```js
const { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate } = require('timers');

async function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

await sleep(1000);

return 123;
```