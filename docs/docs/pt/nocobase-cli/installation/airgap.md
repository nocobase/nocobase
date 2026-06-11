#Instalação de intranet

Se o seu servidor não puder acessar a rede pública, o método de instalação exigirá que você prepare antecipadamente as imagens, dependências e pacotes de plug-ins necessários para uso offline. Por padrão, é recomendado usar primeiro o Docker, que possui o caminho mais curto e é mais fácil de reproduzir.

## Recomendação padrão: preparar imagem Docker offline

Em uma máquina que pode acessar a rede pública, primeiro baixe a imagem do aplicativo e a imagem do banco de dados:

```bash
docker pull registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full
docker pull registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
```

Em seguida, exporte como arquivo offline:

```bash
docker save -o nocobase-app.tar \
  registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full

docker save -o nocobase-postgres.tar \
  registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
```

Se você ainda precisar de plug-ins comerciais, também é recomendável preparar o pacote de plug-ins no ambiente de rede externo e, em seguida, trazê-lo juntos para a intranet.

## Copie o arquivo para o servidor da intranet

Prepare pelo menos estes documentos:

- `nocobase-app.tar`
- `nocobase-postgres.tar`
- `docker-compose.yml`
- `.env` ou suas próprias instruções de implantação

## Importe a imagem para o servidor da intranet

```bash
docker load -i nocobase-app.tar
docker load -i nocobase-postgres.tar
```

## Iniciar aplicativo

Depois de preparar `docker-compose.yml`, comece diretamente:

```bash
docker compose up -d
docker compose logs -f app
```

Se você ainda não escreveu um arquivo de composição, primeiro leia [Instalação via Docker Compose](./docker-compose.md) e salve os exemplos localmente.

## O que fazer se você não conseguir usar o Docker

Se o Docker não puder ser usado em seu ambiente de intranet, você também poderá usar `create-nocobase-app` para criar um projeto completo no ambiente de rede externo, instalar dependências e empacotá-lo e, em seguida, copiar todo o projeto para o servidor de intranet.

Esse caminho será mais longo, porém mais prático em ambientes sem recursos de contêiner. O processo geral é geralmente:

1. Crie um projeto em um ambiente de rede externo e instale dependências.
2. Compacte o diretório do projeto.
3. Copie para o servidor da intranet.
4. Descompacte o arquivo na intranet, preencha `.env` e inicie a aplicação.

## Onde procurar em seguida

- Se você não confirmou a configuração do aplicativo, continue em [Variáveis de ambiente do aplicativo](./env.md)
- Se você estiver pronto para abrir oficialmente o aplicativo para usuários corporativos, continue lendo [Nginx](../production/reverse-proxy/nginx.md) ou [Caddy](../production/reverse-proxy/caddy.md)
