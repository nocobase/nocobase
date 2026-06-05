:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Atualizando uma instalação do create-nocobase-app

:::warning Preparação antes de atualizar

- Certifique-se de fazer backup do banco de dados antes de prosseguir.
- Pare a instância do NocoBase em execução.

:::

## 1. Pare a instância do NocoBase em execução

Se não for um processo em segundo plano, pare-o com `Ctrl + C`. Em um ambiente de produção, execute o comando `pm2-stop` para pará-lo.

```bash
yarn nocobase pm2-stop
```

## 2. Execute o comando de atualização

Basta executar o comando `yarn nocobase upgrade`.

```bash
# Navegue até o diretório correspondente
cd my-nocobase-app
# Execute o comando de atualização
yarn nocobase upgrade
# Inicie
yarn dev
```

### Atualizando para uma versão específica

Modifique o arquivo `package.json` no diretório raiz do projeto e altere os números de versão para `@nocobase/cli` e `@nocobase/devtools` (você só pode atualizar, não fazer downgrade). Por exemplo:

```diff
{
  "dependencies": {
-   "@nocobase/cli": "1.5.11"
+   "@nocobase/cli": "1.6.0-beta.8"
  },
  "devDependencies": {
-   "@nocobase/devtools": "1.5.11"
+   "@nocobase/devtools": "1.6.0-beta.8"
  }
}
```

Em seguida, execute o comando de atualização

```bash
yarn install
yarn nocobase upgrade --skip-code-update
```