# Migração

## app

## db

## plugin

## sequelize

## queryInterface

## Criando arquivo de Migration

Crie via comando CLI:

```bash
nb scaffold migration my-migration --pkg @my-project/plugin-hello
```

O comando gera um arquivo com timestamp no diretório `src/server/migrations/` do plugin, com o seguinte template:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad';
  appVersion = '<versão atual>';

  async up() {
    // coding
  }
}
```

Parâmetros do comando:

| Parâmetro | Descrição |
|------|------|
| `<name>` | Nome da migration, usado para gerar o nome do arquivo |
| `--pkg <pkg>` | Nome do pacote, determina o caminho de destino do arquivo |
| `--on <on>` | Momento de execução, padrão `'afterLoad'` |