---
pkg: '@nocobase/plugin-workflow-javascript'
---

:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/workflow/nodes/javascript).
:::

# Script JavaScript

## Introdução

O nó de script JavaScript permite que os usuários executem um script JavaScript personalizado no lado do servidor dentro de um fluxo de trabalho. O script pode usar variáveis de etapas anteriores do fluxo como parâmetros, e o valor de retorno do script pode ser fornecido para nós subsequentes.

O script é executado em uma *worker thread* no servidor da aplicação NocoBase. Por padrão, utiliza um sandbox seguro (isolated-vm) que não suporta `require` nem APIs nativas do Node.js. Para mais detalhes, consulte [Motor de execução](#motor-de-execução) e [Lista de recursos](#lista-de-recursos).

## Criar nó

Na interface de configuração do fluxo de trabalho, clique no botão de adição ("+") no fluxo para adicionar um nó "JavaScript":

![20241202203457](https://static-docs.nocobase.com/20241202203457.png)

## Configuração do nó

![20241202203655](https://static-docs.nocobase.com/20241202203655.png)

### Parâmetros

Usado para passar variáveis ou valores estáticos do contexto do fluxo de trabalho para o script, para que sejam utilizados na lógica do código. O `name` é o nome do parâmetro, que se torna o nome da variável assim que é passado para o script. O `value` é o valor do parâmetro, podendo ser uma variável ou uma constante.

### Conteúdo do script

O conteúdo do script pode ser visto como uma função. Você pode escrever qualquer código JavaScript suportado no ambiente Node.js e usar a instrução `return` para retornar um valor como resultado da execução do nó, para ser usado como uma variável por nós subsequentes.

Após escrever o código, você pode clicar no botão de teste abaixo da caixa de edição para abrir uma caixa de diálogo de execução de teste, onde pode preencher os parâmetros com valores estáticos para uma execução simulada. Após a execução, você poderá ver o valor de retorno e o conteúdo da saída (log) na caixa de diálogo.

![20241202203833](https://static-docs.nocobase.com/20241202203833.png)

### Configuração de tempo limite

A unidade é em milissegundos. Quando definido como `0`, significa que nenhum tempo limite foi configurado.

### Continuar o fluxo após erro

Se selecionado, os nós subsequentes ainda serão executados mesmo que o script encontre um erro ou atinja o tempo limite.

:::info{title="Dica"}
Se o script falhar, ele não terá valor de retorno, e o resultado do nó será preenchido com a mensagem de erro. Se nós subsequentes utilizarem a variável de resultado do nó de script, você precisará lidar com isso com cautela.
:::

## Motor de execução

O nó de script JavaScript suporta dois motores de execução, selecionados automaticamente com base na configuração da variável de ambiente `WORKFLOW_SCRIPT_MODULES`:

### Modo seguro (padrão)

Quando `WORKFLOW_SCRIPT_MODULES` **não está configurada**, os scripts são executados usando o motor [isolated-vm](https://github.com/laverdet/isolated-vm). Este motor executa o código em um ambiente V8 isolado com as seguintes características:

- **Não suporta** `require` — nenhum módulo pode ser importado
- **Não suporta** APIs nativas do Node.js (como `process`, `Buffer`, `global`, etc.)
- Apenas objetos integrados do padrão ECMAScript estão disponíveis (como `JSON`, `Math`, `Promise`, `Date`, etc.)
- Suporta passagem de dados via parâmetros, `console` para logs e `async`/`await`

Este é o modo padrão recomendado, adequado para lógica de computação pura e processamento de dados, oferecendo o mais alto nível de isolamento de segurança.

### Modo não seguro (suporte a módulos)

Quando `WORKFLOW_SCRIPT_MODULES` **está configurada**, os scripts utilizam o motor `vm` nativo do Node.js para habilitar a funcionalidade `require`.

:::warning{title="Aviso de segurança"}
No modo não seguro, embora os scripts sejam executados em um sandbox `vm` com uma lista restrita de módulos permitidos, o módulo `vm` do Node.js não é um mecanismo de sandbox seguro. Habilitar este modo implica confiar em todos os usuários que têm permissão para editar scripts de fluxo de trabalho. Os administradores devem avaliar os riscos de segurança de forma independente e controlar rigorosamente a lista de módulos permitidos e as permissões de edição de fluxos de trabalho.
:::

Os módulos podem ser usados no script de forma consistente com o CommonJS, utilizando a diretiva `require()` para importar módulos.

Suporta módulos nativos do Node.js e módulos instalados em `node_modules` (incluindo pacotes de dependência já utilizados pelo NocoBase). Os módulos a serem disponibilizados para o código devem ser declarados na variável de ambiente da aplicação `WORKFLOW_SCRIPT_MODULES`, com múltiplos nomes de pacotes separados por vírgulas, por exemplo:

```ini
WORKFLOW_SCRIPT_MODULES=crypto,timers,lodash,dayjs
```

:::info{title="Dica"}
Módulos não declarados na variável de ambiente `WORKFLOW_SCRIPT_MODULES` **não podem** ser usados no script, mesmo que sejam nativos do Node.js ou já estejam instalados em `node_modules`. Essa estratégia pode ser utilizada no nível operacional para controlar a lista de módulos disponíveis para os usuários, evitando que os scripts tenham permissões excessivas em alguns cenários.
:::

Em ambientes que não sejam de implantação por código-fonte, se um módulo não estiver instalado em `node_modules`, você pode instalar manualmente o pacote necessário no diretório `storage`. Por exemplo, para usar o pacote `exceljs`, você pode executar as seguintes operações:

```shell
cd storage
npm i --no-save --no-package-lock --prefix . exceljs
```

Em seguida, adicione o caminho relativo (ou absoluto) do pacote, baseado no CWD (diretório de trabalho atual) da aplicação, à variável de ambiente `WORKFLOW_SCRIPT_MODULES`:

```ini
WORKFLOW_SCRIPT_MODULES=./storage/node_modules/exceljs
```

Você poderá então usar o pacote `exceljs` no script (o nome no `require` deve ser exatamente igual ao definido na variável de ambiente):

```js
const ExcelJS = require('./storage/node_modules/exceljs');
// ...
```

## Lista de recursos

### Versão do Node.js

É a mesma versão do Node.js que executa a aplicação principal.

### Variáveis Globais

**Não suporta** variáveis globais como `global`, `process`, `__dirname` e `__filename`.

```js
console.log(global); // lançará o erro: "global is not defined"
```

### Parâmetros de entrada

Os parâmetros configurados no nó tornam-se variáveis globais dentro do script e podem ser usados diretamente. Os parâmetros passados para o script suportam apenas tipos básicos, como `boolean`, `number`, `string`, `object` e arrays. Um objeto `Date` será convertido para uma string no formato ISO ao ser passado. Outros tipos complexos, como instâncias de classes personalizadas, não podem ser passados diretamente.

### Valor de retorno

Através da instrução `return`, você pode retornar dados de tipos básicos (seguindo as mesmas regras dos parâmetros) para o nó como resultado. Se a instrução `return` não for chamada no código, a execução do nó não terá valor de retorno.

```js
return 123;
```

### Saída (Log)

**Suporta** o uso de `console` para saída de logs.

```js
console.log('hello world!');
```

Quando o fluxo de trabalho é executado, a saída do nó de script também será registrada no arquivo de log do fluxo de trabalho correspondente.

### Assíncrono

**Suporta** o uso de `async` para definir funções assíncronas e `await` para chamar funções assíncronas. **Suporta** o uso do objeto global `Promise`.

```js
async function test() {
  return Promise.resolve(1);
}

const value = await test();
return value;
```

### Timers

Para usar métodos como `setTimeout`, `setInterval` ou `setImmediate`, você precisa importá-los do pacote `timers` do Node.js (disponível apenas no modo não seguro).

```js
const { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate } = require('timers');

async function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

await sleep(1000);

return 123;
```
