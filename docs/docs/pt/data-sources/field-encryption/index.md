---
pkg: "@nocobase/plugin-field-encryption"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Criptografia

## Introdução

Dados de negócios confidenciais, como número de celular de clientes, endereços de e-mail e números de cartão, podem ser criptografados. Após a criptografia, eles são armazenados no banco de dados como texto cifrado.

![20251104192513](https://static-docs.nocobase.com/20251104192513.png)

## Como funciona a Criptografia

:::warning
O plugin gera automaticamente uma `chave de aplicação`, que é armazenada no diretório `/storage/apps/main/encryption-field-keys`.

O arquivo da `chave de aplicação` é nomeado com o ID da chave e tem a extensão `.key`. Por favor, não altere o nome do arquivo.

Mantenha o arquivo da `chave de aplicação` em segurança. Se você perder o arquivo da `chave de aplicação`, os dados criptografados não poderão ser descriptografados.

Se o plugin for ativado por uma sub-aplicação, a chave será salva por padrão no diretório `/storage/apps/${sub-application name}/encryption-field-keys`.
:::

### Como funciona

Utiliza Criptografia de Envelope

![20251118151339](https://static-docs.nocobase.com/20251118151339.png)

### Processo de criação da chave
1. Na primeira vez que um campo criptografado é criado, o sistema gera automaticamente uma `chave de aplicação` de 32 bits e a armazena no diretório de armazenamento padrão, codificada em Base64.
2. Cada vez que um novo campo criptografado é criado, uma `chave de campo` aleatória de 32 bits é gerada para ele. Em seguida, essa chave é criptografada usando a `chave de aplicação` e um `vetor de criptografia de campo` de 16 bits gerado aleatoriamente (algoritmo de criptografia `AES`), sendo então armazenada no campo `options` da tabela `fields`.

### Processo de criptografia de campo
1. Cada vez que você escreve dados em um campo criptografado, você primeiro obtém a `chave de campo` criptografada e o `vetor de criptografia de campo` do campo `options` da tabela `fields`.
2. A `chave de campo` criptografada é descriptografada usando a `chave de aplicação` e o `vetor de criptografia de campo`. Em seguida, os dados são criptografados usando a `chave de campo` e um `vetor de criptografia de dados` de 16 bits gerado aleatoriamente (algoritmo de criptografia `AES`).
3. Os dados são assinados usando a `chave de campo` descriptografada (algoritmo de resumo `HMAC-SHA256`) e convertidos para uma string codificada em Base64 (a `assinatura de dados` resultante é usada posteriormente para recuperação de dados).
4. O `vetor de criptografia de dados` de 16 bits e o `texto cifrado` criptografado são concatenados em binário e convertidos para uma string codificada em Base64.
5. A string codificada em Base64 da `assinatura de dados` e a string codificada em Base64 do `texto cifrado` concatenado são unidas, separadas por um `.`.
6. A string final concatenada é salva no banco de dados.

## Variáveis de Ambiente

Se você quiser especificar uma `chave de aplicação` personalizada, defina a variável de ambiente `ENCRYPTION_FIELD_KEY_PATH`. O plugin carregará o arquivo nesse caminho como a `chave de aplicação`.

**Requisitos para o arquivo da chave de aplicação:**
1. A extensão do arquivo deve ser `.key`.
2. O nome do arquivo será usado como o ID da chave; é recomendado usar um UUID para garantir a exclusividade.
3. O conteúdo do arquivo deve ser 32 bytes de dados binários codificados em Base64.

```bash
ENCRYPTION_FIELD_KEY_PATH=/path/to/my/app-keys/270263524860909922913.key
```

## Configuração de campo

![20240802173721](https://static-docs.nocobase.com/20240802173721.png)

## Impacto na filtragem após a criptografia

Campos criptografados suportam apenas as seguintes operações: igual a, diferente de, existe e não existe.

![20240802174042](https://static-docs.nocobase.com/20240802174042.png)

Fluxo de filtragem de dados:
1. Obtenha a `chave de campo` do campo criptografado e descriptografe-a usando a `chave de aplicação`.
2. Use a `chave de campo` para assinar o texto de pesquisa inserido pelo usuário (algoritmo de resumo `HMAC-SHA256`).
3. Concatene o texto de pesquisa assinado com um separador `.` e realize uma pesquisa de correspondência de prefixo no campo criptografado no banco de dados.

## Rotação de chaves

:::warning
Antes de usar o comando de rotação de chaves `nocobase key-rotation`, certifique-se de que a aplicação já carregou este plugin.
:::

Após migrar uma aplicação para um novo ambiente, se você não quiser continuar usando a mesma chave do ambiente antigo, pode usar o comando `nocobase key-rotation` para substituir a `chave de aplicação`.

A execução do comando de rotação de chaves requer que você especifique a `chave de aplicação` do ambiente antigo. Após a execução, uma nova `chave de aplicação` será gerada e substituirá a chave antiga. A nova `chave de aplicação` será salva (codificada em Base64) no diretório de armazenamento padrão.

```bash
# --key-path especifica o arquivo da chave de aplicação do ambiente antigo que corresponde aos dados criptografados no banco de dados
 yarn nocobase key-rotation --key-path /path/to/old-app-keys/270263524860909922913.key
```

Se você for substituir a `chave de aplicação` de uma sub-aplicação, precisará adicionar o parâmetro `--app-name` para especificar o `name` da sub-aplicação.

```bash
 yarn nocobase key-rotation --app-name a_w0r211vv0az --key-path /path/to/old-app-keys/270263524860909922913.key
```