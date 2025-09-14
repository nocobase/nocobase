---
group:
  title: Client
  order: 1
---

# useVariables

## Usage

```ts
const { registerVariable, parseVariable } = useVariables();

// Register variable
registerVariable({
  name: '$user',
  // If you are certain that the `association field` data does not need to be loaded on-demand in the variable, you can omit this field
  collectionName: 'users',
  ctx: {
    name: 'Zhang San',
    nickname: 'Xiao Zhang',
  },
});

// Parse variable
const userName = await parseVariable('{{ $user.name }}');
console.log(userName); // 'Zhang San'
```

## Built-in Global Variables
Some variables that are used globally are registered within the `VariablesProvider`. These variables are defined in `useBuiltinVariables` and can be modified by changing the return value of `useBuiltinVariables`.

## Local Variables
When using the `parseVariable` method in `useVariables`, in addition to parsing based on the built-in global variables, you can also use some temporary local variables.

```ts
const { parseVariable } = useVariables();
const localVariable = {
  name: '$user',
  // If you are certain that the `association field` data does not need to be loaded on-demand in the variable, you can omit this field
  collectionName: 'users',
  ctx: {
    name: 'Zhang San',
    nickname: 'Xiao Zhang',
  },
}

// Use local variable for parsing
const userName = await parseVariable('{{ $user.name }}', localVariable);
console.log(userName); // 'Zhang San'
```

The registered local variables will be automatically destroyed after parsing and will not affect the value of global variables.

### useLocalVariables
This hook encapsulates some variables that are quite common but cannot be treated as global variables.
