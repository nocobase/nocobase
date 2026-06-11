# Instalação e atualização de plug-ins de terceiros

Se você obtiver um pacote de plug-in de terceiros, geralmente importe-o para o `storage/plugins` do aplicativo de destino, reinicie o aplicativo e continue a ativar ou verificar se o plug-in entra em vigor.

## Índice rápido

| Eu quero... | Onde procurar |
| --- | --- |
| Primeiro mude para o ambiente de destino e, em seguida, comece a importar ou reiniciar o plug-in | [Confirme o ambiente de destino primeiro](#Confirme o ambiente de destino primeiro) |
| Importe plug-ins de terceiros de pacotes compactados remotos, pacotes compactados locais ou npm | [Use `nb plugin import` para importar pacotes de plug-ins](#Use -nb-plugin-import-Import pacotes de plug-ins) |
| Especifique o plug-in de importação de armazenamento | [Especifique o caminho de armazenamento para importar](#Especifique o caminho de armazenamento para importar) |
| Após a conclusão da importação, deixe o aplicativo recarregar o diretório do plug-in | [`nb app restart`](../../api/cli/app/restart.md) |
| Habilite oficialmente o plug-in após a primeira instalação | [`nb plugin enable`](../../api/cli/plugin/enable.md) |
| Atualizar um plug-in de terceiros ativado | [O que fazer ao atualizar o plug-in](#O que fazer ao atualizar o plug-in) |
| Deseja confirmar se o plug-in apareceu no aplicativo atual | [`nb plugin list`](../../api/cli/plugin/list.md) |
| A máquina de destino não pode ser conectada diretamente à Internet e só pode ser carregada manualmente `.tgz` e depois importada | [Quando a Internet não pode ser conectada diretamente](#Quando a Internet não pode ser conectada diretamente) |

## Confirme primeiro o ambiente de destino

Se você gerencia vários aplicativos localmente, primeiro mude para o ambiente de destino e depois opere:

```bash
nb env use app1
```

## Use `nb plugin import` para importar o pacote de plug-in

`nb plugin import` suporta três tipos de fontes: pacotes compactados remotos, pacotes compactados locais e nomes de pacotes npm. Este comando é responsável apenas por importar o plug-in para `storage/plugins` e não ativará o plug-in automaticamente.

Se você obteve o endereço de download do pacote de plug-in, o caminho do arquivo local ou se o plug-in foi publicado no npm, você pode executar:

```bash
# 远程压缩包
nb plugin import https://github.com/nocobase/plugin-auth-cas/releases/download/v1.4.0/plugin-auth-cas-1.4.0.tgz

# 本地压缩包
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz

# npm 包名或 tag
nb plugin import @my-scope/plugin-auth-cas@beta
```

Se você estiver usando uma fonte npm privada, geralmente faça login primeiro e depois especifique o registro:

```bash
npm login --registry=https://registry.example.com
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com
```

## Especifique o caminho de armazenamento para importar

Se você já conhece o diretório raiz `storage` do aplicativo de destino, também pode passar `--storage-path` diretamente sem depender do ambiente atual:

```bash
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz --storage-path ./storage
```

A CLI gravará o plugin em `<storage-path>/plugins`. Neste momento, você não pode executar `nb env use` primeiro ou passar `--env`.

## Reinicie após importar

Após a conclusão da importação, reinicie o aplicativo de destino:

```bash
nb app restart
```

Se você não mudar o ambiente atual primeiro, também poderá passar explicitamente `-e <env>` no comando.

## Habilite ou verifique após reiniciar

Se esta for a primeira instalação, reinicie e habilite o plugin:

```bash
nb plugin enable @nocobase/plugin-auth-cas
```

A instalação será concluída automaticamente quando ativada pela primeira vez.

## O que fazer ao atualizar plug-ins

Se o plug-in já estiver ativado e você apenas mudar para uma nova versão desta vez, geralmente há apenas duas etapas:

```bash
nb plugin import /your/path/plugin-auth-cas-1.5.0.tgz
nb app restart
```

O mesmo se aplica se você importar um pacote npm:

```bash
nb plugin import @my-scope/plugin-auth-cas@latest
nb app restart
```

Em outras palavras, o cenário de atualização não requer execução adicional de `nb plugin enable`. Basta importar o novo pacote e reiniciar o aplicativo.

## Quando a Internet não pode ser conectada diretamente

Se a máquina de destino não puder acessar diretamente o endereço de download do plug-in, você poderá primeiro fazer upload do arquivo `.tgz` para qualquer diretório na máquina de destino e, em seguida, executar a importação local na máquina de destino.

por exemplo:

```bash
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz
nb app restart
```

:::nota de aviso

Não há necessidade de extrair manualmente para `storage/plugins` aqui. `nb plugin import` colocará automaticamente o plug-in no diretório correto.

:::
