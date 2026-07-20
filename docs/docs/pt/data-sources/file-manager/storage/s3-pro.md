---
title: "Armazenamento de arquivos: S3 (Pro)"
description: "Mecanismo de armazenamento S3 Pro, armazenamento empresarial compatível com o protocolo S3, com suporte a Endpoint personalizado e configurações avançadas."
keywords: "S3 Pro, armazenamento de objetos, armazenamento em nuvem, compatível com S3, NocoBase"
---

# Armazenamento de arquivos: S3 (Pro)

<PluginInfo commercial="true" name="file-storage-s3-pro"></PluginInfo>

## Introdução

Com base no plug-in de gerenciamento de arquivos, foi adicionado suporte a tipos de armazenamento de arquivos compatíveis com o protocolo S3. Qualquer serviço de armazenamento de objetos compatível com o protocolo S3 pode ser facilmente integrado, como Amazon S3, Alibaba Cloud OSS, Tencent Cloud COS, MinIO e Cloudflare R2, melhorando ainda mais a compatibilidade e a flexibilidade dos serviços de armazenamento.

## Principais recursos

1. Upload pelo cliente: o processo de upload de arquivos não precisa passar pelo servidor NocoBase, conectando-se diretamente ao serviço de armazenamento de arquivos para proporcionar uma experiência de upload mais eficiente e rápida.

2. Acesso privado: ao acessar os arquivos, todas as URLs são endereços temporários autorizados e assinados, garantindo a segurança e a validade do acesso aos arquivos.


## Cenários de uso

1. **Gerenciamento da tabela de arquivos**: gerencie e armazene centralmente todos os arquivos enviados, com suporte a vários tipos de arquivo e métodos de armazenamento, facilitando a classificação e a pesquisa de arquivos.

2. **Armazenamento no campo de anexo**: usado para armazenar anexos enviados em formulários ou registros, com suporte à associação a registros de dados específicos.


## Configuração do plug-in

1. Ative o plug-in plugin-file-storage-s3-pro

2. Clique em "Setting-> FileManager" para acessar as configurações de gerenciamento de arquivos

3. Clique no botão "Add new" e selecione "S3 Pro"

![](https://static-docs.nocobase.com/20250102160704938.png)

4. Após a abertura do painel flutuante, você verá que há muitos campos a serem preenchidos. Consulte a documentação a seguir para obter as informações dos parâmetros correspondentes ao serviço de arquivos e preencha o formulário corretamente.

![](https://static-docs.nocobase.com/20250413190828536.png)


## Configuração dos provedores de serviço

### Amazon S3

#### Criar um Bucket

1. Abra https://ap-southeast-1.console.aws.amazon.com/s3/home para acessar o console do S3

2. Clique no botão "Create bucket" à direita

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2. Preencha o Bucket Name (nome do bucket). Os demais campos podem permanecer com as configurações padrão. Role até a parte inferior da página e clique no botão **"**Create**"** para concluir a criação.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### Configuração do CORS

1. Entre na lista de buckets, localize e clique no Bucket recém-criado para acessar sua página de detalhes

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. Clique na guia "Permission" e role para baixo até encontrar a seção de configuração do CORS

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. Insira a configuração a seguir (você pode personalizá-la conforme necessário) e salve

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "POST",
            "PUT"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970494.png)

#### Obter AccessKey e SecretAccessKey

1. Clique no botão "Security credentials" no canto superior direito da página

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. Role para baixo, localize a seção "Access Keys" e clique no botão "Create Access Key".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. Clique em Concordar (esta demonstração usa a conta principal; em ambientes de produção, recomenda-se usar o IAM).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. Salve o Access key e o Secret access key exibidos na página

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Obtenção e configuração dos parâmetros

1. O AccessKey ID e o AccessKey Secret são os valores correspondentes obtidos na operação anterior. Preencha-os corretamente

2. Entre no painel de propriedades da página de detalhes do bucket, onde você poderá obter as informações do nome do Bucket e da Region (região).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Acesso público (opcional)

Esta configuração não é obrigatória; use-a quando precisar tornar os arquivos enviados totalmente públicos

1. Entre no painel Permissions, role para baixo até Object Ownership, clique em editar e ative ACLs

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Role até Block public access, clique em editar e defina como permitir o controle por ACLs

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. No NocoBase, marque Public access


#### Configuração de miniaturas (opcional)

Esta configuração é opcional e deve ser usada quando for necessário otimizar o tamanho ou o efeito da visualização de imagens. **Observe que esse método de implantação pode gerar custos adicionais; consulte os termos relevantes da AWS para obter informações específicas sobre os custos.**

1. Acesse [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. Clique no botão `Launch in the AWS Console` na parte inferior da página para iniciar a implantação da solução.
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. Conclua a configuração seguindo as instruções. Preste atenção especial às opções a seguir:
   1. Ao criar a pilha, você precisará especificar o nome de um bucket do Amazon S3 que contenha as imagens de origem. Informe o nome do bucket criado anteriormente.
   2. Se você optar por implantar a UI de demonstração, poderá testar os recursos de processamento de imagens por meio dessa interface após a conclusão da implantação. No console do AWS CloudFormation, selecione sua pilha, acesse a guia “Saídas”, localize o valor correspondente à chave DemoUrl e clique no link para abrir a interface de demonstração.
   3. Esta solução usa a biblioteca `sharp` Node.js para processar imagens com eficiência. Você pode baixar o código-fonte do repositório do GitHub e personalizá-lo conforme necessário.

   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. Após concluir a configuração, aguarde até que o status da implantação mude para `CREATE_COMPLETE`.

5. Na configuração do NocoBase, observe os seguintes pontos:
   1. `Thumbnail rule`: preencha os parâmetros relacionados ao processamento de imagens, como `?width=100`. Consulte a [documentação da AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html) para obter mais informações.
   2. `Access endpoint`: preencha com o valor de Outputs -> ApiEndpoint após a implantação.
   3. `Full access URL style`: marque **Ignore** (como o nome do bucket já foi preenchido durante a configuração, ele não será necessário no acesso).

   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Exemplo de configuração

![](https://static-docs.nocobase.com/20250414152344959.png)


### Alibaba Cloud OSS

#### Criar um Bucket

1. Abra o console do OSS em https://oss.console.aliyun.com/overview

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. Clique em "Buckets" no menu à esquerda e, em seguida, clique no botão "Create Bucket" para começar a criar o bucket

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. Preencha as informações relacionadas ao bucket e, por fim, clique no botão Create

    1. O Bucket Name deve ser adequado ao seu negócio; o nome fica a seu critério

    2. Escolha, em Region, a região mais próxima dos seus usuários

    3. Os demais campos podem permanecer com os valores padrão ou ser configurados conforme necessário

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)


#### Configuração do CORS

1. Acesse a página de detalhes do bucket criado na etapa anterior

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. Clique em "Content Security -> CORS" no menu central

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. Clique no botão "Create Rule", preencha as informações relevantes, role para baixo e clique em "OK". Consulte a captura de tela abaixo ou faça uma configuração mais detalhada

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Obter AccessKey e SecretAccessKey

1. Clique em "AccessKey" abaixo do avatar no canto superior direito

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. Para facilitar a demonstração, a criação do AccessKey usa a conta principal. Em cenários de uso em produção, recomenda-se usar o RAM para criá-lo. Consulte https://help.aliyun.com/zh/ram/user-guide/create-an-accesskey-pair-1?spm=5176.28366559.0.0.1b5c3c2fUI9Ql8#section-rjh-18m-7kp

3. Clique no botão "Create AccessKey"

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. Faça a verificação da conta

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. Salve o Access key e o Secret access key exibidos na página

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)


#### Obtenção e configuração dos parâmetros

1. O AccessKey ID e o AccessKey Secret são os valores obtidos na operação anterior

2. Entre na página de detalhes do bucket para obter o Bucket

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. Role para baixo para obter a Region (o ".aliyuncs.com" no final não é necessário)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. Obtenha o endereço do endpoint; ao preenchê-lo no NocoBase, adicione o prefixo https://

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Configuração de miniaturas (opcional)

Esta configuração é opcional e deve ser usada apenas quando for necessário otimizar o tamanho ou o efeito da visualização de imagens.

1. Preencha os parâmetros relacionados a `Thumbnail rule`. Consulte [Parâmetros de processamento de imagens](https://help.aliyun.com/zh/oss/user-guide/img-parameters/?spm=a2c4g.11186623.help-menu-31815.d_4_14_1_1.170243033CdbSm&scm=20140722.H_144582._.OR_help-T_cn~zh-V_1) para obter detalhes sobre a configuração dos parâmetros.

2. `Full upload URL style` e `Full access URL style` podem ser mantidos iguais.

#### Exemplo de configuração

![](https://static-docs.nocobase.com/20250414152525600.png)


### MinIO

#### Criar um Bucket

1. Clique no menu Buckets à esquerda -> clique em Create Bucket para acessar a página de criação
2. Preencha o nome do Bucket e clique no botão de salvar
#### Obter AccessKey e SecretAccessKey

1. Acesse Access Keys -> clique no botão Create access key para acessar a página de criação

![](https://static-docs.nocobase.com/20250106111922957.png)

2. Clique no botão de salvar

![](https://static-docs.nocobase.com/20250106111850639.png)

1. Salve o Access Key e o Secret Key exibidos na janela pop-up para usar na configuração posterior

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Configuração dos parâmetros

1. Acesse a página NocoBase -> File manager

2. Clique no botão Add new e selecione S3 Pro

3. Preencha o formulário
   - O **AccessKey ID** e o **AccessKey Secret** são os textos salvos na etapa anterior
   - **Region**: o MinIO implantado de forma privada não possui o conceito de Region; você pode configurá-lo como "auto"
   - **Endpoint**: informe o domínio ou endereço IP do serviço implantado
   - Defina Full access URL style como Path-Style

#### Exemplo de configuração

![](https://static-docs.nocobase.com/20250414152700671.png)


### Tencent COS

Você pode consultar o serviço de arquivos acima para fazer a configuração; a lógica é semelhante

#### Exemplo de configuração

![](https://static-docs.nocobase.com/20250414153252872.png)


### Cloudflare R2

Você pode consultar o serviço de arquivos acima para fazer a configuração; a lógica é semelhante

#### Exemplo de configuração

![](https://static-docs.nocobase.com/20250414154500264.png)


## Uso pelo usuário

Consulte o uso do plug-in file-manager em https://docs.nocobase.com/data-sources/file-manager/.