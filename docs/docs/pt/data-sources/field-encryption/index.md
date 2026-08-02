---
pkg: "@nocobase/plugin-field-encryption"
title: "Criptografia de campos"
description: "Armazene dados comerciais privados (números de celular, e-mails, números de cartão etc.) de forma criptografada, salvando-os no banco de dados como texto cifrado para proteger informações sensíveis."
keywords: "Criptografia de campos,Encryption,dados sensíveis,armazenamento de texto cifrado,NocoBase"
---
# Criptografia

## Introdução

Alguns dados comerciais privados, como números de celular de clientes, endereços de e-mail e números de cartão, podem ser criptografados. Após a criptografia, eles são armazenados no banco de dados na forma de texto cifrado.

![20251104192513](https://static-docs.nocobase.com/20251104192513.png)

## Método de criptografia

:::warning
O plugin gera automaticamente um`应用密钥`, e essa chave é armazenada no diretório `/storage/apps/main/encryption-field-keys`.

O nome do arquivo `应用密钥` é o ID da chave, e a extensão é `.key`. Não altere o nome do arquivo sem necessidade.

Guarde o arquivo `应用密钥` com segurança. Se o arquivo `应用密钥` for perdido, os dados criptografados não poderão ser descriptografados.

Se o plugin for ativado por uma subaplicação, o diretório padrão de armazenamento da chave será `/storage/apps/${子应用name}/encryption-field-keys`
:::

### Como funciona

É utilizado o método de criptografia envelope.

![20251118151339](https://static-docs.nocobase.com/20251118151339.png)

### Processo de criação da chave
1. Na primeira vez que um campo criptografado é criado, o sistema gera automaticamente um `应用密钥` de 32 bytes e o salva no diretório de armazenamento padrão usando codificação base64.
2. Cada vez que um novo campo criptografado é criado, é gerado um `字段密钥` aleatório de 32 bytes para esse campo. Em seguida, ele é criptografado usando `应用密钥` e um `字段加密向量` aleatório de 16 bytes (algoritmo de criptografia `AES`) e salvo no campo `options` da tabela `fields`.

### Processo de criptografia de campos
1. Cada vez que dados são gravados em um campo criptografado, o `字段密钥` criptografado e o `字段加密向量` são obtidos primeiro do campo options da tabela fields.
2. Use `应用密钥` e `字段加密向量` para descriptografar o `字段密钥` criptografado. Em seguida, use `字段密钥` e um `数据加密向量` aleatório de 16 bytes para criptografar os dados (algoritmo de criptografia `AES`).
3. Assine os dados usando o `字段密钥` descriptografado (algoritmo de resumo `HMAC-SHA256`) e converta o resultado em uma string usando codificação base64 (o `数据签名` gerado será usado posteriormente para a busca de dados).
4. Concatene em formato binário o `数据加密向量` de 16 bytes e o `数据密文` criptografado, e converta o resultado em uma string usando codificação base64.
5. Concatene a string codificada em base64 de `数据签名` e a string codificada em base64 de `数据密文`, usando '.' como separador.
6. Salve a string concatenada final no banco de dados.


## Variáveis de ambiente

Para especificar `应用密钥`, use a variável de ambiente `ENCRYPTION_FIELD_KEY_PATH`. O plugin carregará o arquivo nesse caminho como `应用密钥`.

`应用密钥`Requisitos de formato do arquivo:
1. A extensão do arquivo deve ser `.key`.
2. O nome do arquivo será usado como ID da chave; recomenda-se usar um UUID para garantir a exclusividade.
3. O conteúdo do arquivo deve ser um dado binário de 32 bytes codificado em base64.

```bash
ENCRYPTION_FIELD_KEY_PATH=/path/to/my/app-keys/270263524860909922913.key
```

## Configuração de campos

![20240802173721](https://static-docs.nocobase.com/20240802173721.png)

## Impacto da criptografia na filtragem

Os campos criptografados oferecem suporte apenas a: igual, diferente, existe e não existe.

![20240802174042](https://static-docs.nocobase.com/20240802174042.png)

Método de filtragem de dados:
1. Obtenha o `字段密钥` do campo criptografado e use `应用密钥` para descriptografar `字段密钥`.
2. Use `字段密钥` para assinar o texto de busca inserido pelo usuário (algoritmo de resumo `HMAC-SHA256`).
3. Concatene o texto de busca assinado com o separador `.` e realize uma busca por correspondência de prefixo no campo criptografado do banco de dados.

## Rotação de chaves

:::warning
Antes de usar o comando de rotação de chaves `nocobase key-rotation`, confirme se a aplicação já carregou este plugin.
:::

Depois de migrar a aplicação para um novo ambiente, se você não quiser continuar usando a mesma chave do ambiente antigo, poderá usar o comando `nocobase key-rotation` para substituir `应用密钥`.

Para executar o comando de rotação de chaves, é necessário especificar a chave da aplicação do ambiente antigo. Após a execução, uma nova chave da aplicação será gerada para substituir a chave antiga. A nova chave da aplicação será salva no diretório de armazenamento padrão usando codificação base64.

```bash
# --key-path 指定的是和数据库加密数据对应的旧环境的应用密钥文件
 yarn nocobase key-rotation --key-path /path/to/old-app-keys/270263524860909922913.key
```

Se estiver substituindo a subaplicação `应用密钥`, adicione o parâmetro `--app-name` para especificar `name`.

```bash
 yarn nocobase key-rotation --app-name a_w0r211vv0az --key-path /path/to/old-app-keys/270263524860909922913.key
```
