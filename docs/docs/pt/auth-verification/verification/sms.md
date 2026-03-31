---
pkg: '@nocobase/plugin-verification'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Verificação: SMS

## Introdução

O código de verificação por SMS é um tipo de verificação integrado, usado para gerar uma senha dinâmica de uso único (OTP) e enviá-la ao usuário via SMS.

## Adicionando um Verificador SMS

Acesse a página de gerenciamento de verificação.

![](https://static-docs.nocobase.com/202502271726791.png)

Adicionar - SMS OTP

![](https://static-docs.nocobase.com/202502271726056.png)

## Configuração do Administrador

![](https://static-docs.nocobase.com/202502271727711.png)

Atualmente, os provedores de serviço de SMS suportados são:

- <a href="https://www.aliyun.com/product/sms" target="_blank">SMS Aliyun</a>
- <a href="https://cloud.tencent.com/product/sms" target="_blank">SMS Tencent Cloud</a>

Ao configurar o modelo de SMS no painel administrativo do provedor de serviço, você precisará reservar um parâmetro para o código de verificação.

- Exemplo de configuração Aliyun: `Seu código de verificação é: ${code}`

- Exemplo de configuração Tencent Cloud: `Seu código de verificação é: {1}`

Os desenvolvedores também podem estender o suporte para outros provedores de serviço de SMS na forma de **plugins**. Consulte: [Estendendo Provedores de Serviço de SMS](./dev/sms-type)

## Vinculação do Usuário

Após adicionar o verificador, os usuários podem vincular um número de telefone na sua gestão de verificação pessoal.

![](https://static-docs.nocobase.com/202502271737016.png)

![](https://static-docs.nocobase.com/202502271737769.png)

![](https://static-docs.nocobase.com/202502271738515.png)

Após a vinculação ser bem-sucedida, a verificação de identidade poderá ser realizada em qualquer cenário que utilize este verificador.

![](https://static-docs.nocobase.com/202502271739607.png)

## Desvinculação do Usuário

Para desvincular um número de telefone, é necessário realizar a verificação através de um método de verificação já vinculado.

![](https://static-docs.nocobase.com/202502282103205.png)