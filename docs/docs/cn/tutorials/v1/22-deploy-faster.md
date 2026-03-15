# 如何更快部署 NocoBase

很多朋友在部署 NocoBase 时可能会觉得访问速度不够理想。这通常是由于网络环境、服务器配置或部署架构的影响所致。在开始介绍优化技巧前，我先展示一下正常配置下的 NocoBase 访问速度参考，避免不必要的担忧。

### NocoBase 正常加载速度参考

以下是在 NocoBase demo 环境中测试的加载速度：

- 输入网址、首次进入应用所需时间约为 2 秒
- 在应用内切换页面所需时间约为 50-300 毫秒

<video autoplay loop width="100%">
      <source src="https://static-docs.nocobase.com/886b8e6afd4eea8fd1ff601fdbaecaf0.mp4">
</video>

<video autoplay loop width="100%">
      <source src="https://static-docs.nocobase.com/c240cf4029820f0e4c2bbb58723e2d76.mp4">
</video>

接下来，我将分享一系列简单但高效的部署优化技巧，这些方法无需修改代码，只需调整部署设置，就能显著提升访问速度：

## I. 网络和基础设施优化

### 1. HTTP 协议版本：轻松拥抱 HTTP/2

【前提条件】

- **需要 HTTPS 支持**：这点很重要！几乎所有现代浏览器都只在 HTTPS 连接上支持 HTTP/2，所以您必须先配置好 SSL 证书。
- **服务器要求**：您需要使用支持 HTTP/2 的服务器软件，比如 Nginx 1.9.5+ 或 Apache 2.4.17+。
- **TLS 版本**：建议使用 TLS 1.2 或更高版本（TLS 1.3 最佳），老旧的 SSL 版本不支持 HTTP/2。

【提示】

传统的 HTTP/1.1 协议在处理多个请求时会有限制——通常只能同时处理 6-8 个连接，这就像排队买票一样，容易造成延迟。
![250409http1](https://static-docs.nocobase.com/250409http1.png)

HTTP/2 采用了"多路复用"技术，可以同时处理多个请求，大大加速了资源加载；而最新的 HTTP/3 在不稳定网络中表现更佳，效果也很棒。

![250409http2](https://static-docs.nocobase.com/250409http2.png)

【优化建议】

- 请确保您的 Web 服务器已经开启了 HTTP/2 支持，现在大多数服务器（如 Nginx、Caddy）都很容易配置。
- 在 Nginx 中，只需要在监听指令后加入 `http2` 参数即可：

```nginx
listen 443 ssl http2;
```

【验证】

浏览器开发者面板，打开"网络"选项，鼠标右键勾选"协议"，即可看到当前连接的协议版本：
![20250407145442](https://static-docs.nocobase.com/20250407145442.png)

经过我们实测，整体速度提升约10%，在系统中大量区块和资源的情况下，性能提升更明显。

### 2. 网络带宽：更大更好，灵活计费

【提示】

就像高速公路会比低速公路更顺畅一样，带宽决定了数据传输的效率。当 NocoBase 首次加载时需要下载大量前端资源，如果带宽不足，就容易形成瓶颈。

【优化建议】

- 选择足够的带宽（大量用户使用的话，推荐50M以上），不要吝啬这一关键资源。
- 推荐采用"按流量计费"的方式：很多云服务商都提供这种灵活模式，在高峰期您可以享受更高的带宽，而平时也能控制成本。

### 3. 网络延迟与服务器地理位置：距离近，反应快

【提示】

延迟其实就是数据传输的等待时间。即便带宽充足，如果服务器离用户太远（比如用户在中国，而服务器在美国），每次请求响应都可能因为距离遥远而拖慢速度。

【优化建议】

- 尽量把 NocoBase 部署在离您主要用户群体更近的地区。
- 如果您的用户遍布全球，可以考虑使用全球加速服务（例如阿里云全球加速或 AWS Global Accelerator），优化网络路由，降低延迟。

【验证】

通过ping命令，测试不同地区服务器的延迟。
这个方式提升最为明显，根据不同地区，访问速度提升1-3倍以上。
跨12个时区，13秒：
![20250409130618](https://static-docs.nocobase.com/20250409130618.png)

跨2个时区，8秒：
![20250409131039](https://static-docs.nocobase.com/20250409131039.png)

当前地区，约3秒：
![20250409130928](https://static-docs.nocobase.com/20250409130928.png)

## II. 部署架构优化

### 4. 服务端部署与代理方式：选择最适合的架构

【前提条件】

- **服务器权限**：您需要有服务器的 root 或 sudo 权限才能配置 Nginx 等服务。
- **基本技能**：需要一些基础的服务器配置知识，不过别担心，这里会提供具体的配置示例。
- **端口访问**：确保防火墙允许 80 端口（HTTP）和 443 端口（HTTPS）的访问。

【提示】

当用户访问 NocoBase 时，请求会直接到达您的服务器。合适的部署方式能让服务器更高效地处理请求，从而提供更快的响应。

【不同方案及建议】

**启动 NocoBase 后，不使用反向代理静态资源（不推荐）：**

- 缺点：这种方式虽然简单，但在处理高并发或静态文件时性能较弱，适合开发和测试；
- 建议：请尽量避免此方式。

> 参考"[安装文档](https://v2.docs.nocobase.com/cn/get-started/quickstart)"

不使用反向代理，首页加载约为6.1秒
![20250409131357](https://static-docs.nocobase.com/20250409131357.png)

**使用 Nginx / Caddy 等反向代理（强烈推荐）：**

- 优点：反向代理服务器能够高效处理并发连接、服务静态文件、实现负载均衡，并且配置 HTTP/2 也很简单；
- 建议：在生产环境中，应用部署完成之后（源码部署 / create-nocobase-app / Docker 镜像），使用 Nginx 或 Caddy 作为反向代理。

> 参考"[部署文档](https://v2.docs.nocobase.com/cn/get-started/deployment/production)"

使用Nginx代理后，首页加载约为3-4秒
![20250409131541](https://static-docs.nocobase.com/20250409131541.png)

![20250407192453](https://static-docs.nocobase.com/20250407192453.png)

**使用集群部署与负载均衡（适合高并发及高可用场景）：**

- 优点：通过部署多个实例处理请求，可以显著提升系统的整体稳定性和并发能力；
- 具体部署方式见 **[集群模式](https://docs-cn.nocobase.com/welcome/getting-started/deployment/cluster-mode)**

### 5. 使用 CDN 加速静态资源

【前提条件】

- **域名要求**：您需要有一个已注册的域名，并且能够管理其 DNS 设置。
- **SSL 证书**：大多数 CDN 服务需要配置 SSL 证书（可以使用免费的 Let's Encrypt）。
- **服务选择**：根据用户地区选择合适的 CDN 服务商（中国大陆用户需要选择有 ICP 备案的 CDN）。

【提示】

CDN（内容分发网络）将您的静态资源缓存到全球各地的节点，用户可以从最近的节点获取资源，就像就近取水一样，能极大降低加载延迟。

此外，CDN 最大的优势在于能够**显著减轻应用服务器的负载和带宽压力**。当大量用户同时访问 NocoBase 时，如果没有 CDN，所有的静态资源请求（如 JavaScript、CSS、图片等）都将直接访问您的服务器，可能导致服务器带宽不足、性能下降，甚至宕机。通过 CDN 分流这些请求，您的服务器可以专注于处理核心业务逻辑，为用户提供更稳定的体验。

![202504071845_cdn](https://static-docs.nocobase.com/202504071845_cdn.png)

【优化建议】• 配置您的服务器，让静态资源请求通过 CDN 分发；• 根据用户所在地选择合适的 CDN 服务商：

- 全球用户：Cloudflare、Akamai、AWS CloudFront；
- 中国大陆用户：阿里云 CDN、腾讯云 CDN、百度云加速。示例配置：

```nginx
# 将静态资源重定向到 CDN 域名
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    rewrite ^(.*)$ https://your-cdn-domain.com$1 permanent;
}
```

对于小型项目，Cloudflare 免费版也能提供不错的 CDN 加速效果：

1. 在 Cloudflare 注册账号并添加您的域名；
2. 修改 DNS 将域名指向 Cloudflare 提供的服务器；
3. 在控制面板中设置适当的缓存级别。

**特别提示**：即使您的用户群都在同一地区，仍然强烈建议使用 CDN，因为它能有效减轻服务器负担，提高系统整体稳定性，尤其是在访问量大的情况下。

## III. 静态资源优化

### 6. 服务器压缩与缓存配置

【前提条件】

- **CPU 资源**：压缩会增加服务器的 CPU 负载，所以您的服务器应有足够的处理能力。
- **Nginx 模块支持**：Gzip 压缩一般内置支持，但 Brotli 压缩可能需要额外安装模块。
- **配置权限**：需要有修改服务器配置的权限。

【提示】

通过启用压缩和合理的缓存策略，可以显著减少数据传输量和重复请求，相当于给您的资源做"瘦身"处理，让加载速度飞起来。
![20250409175241](https://static-docs.nocobase.com/20250409175241.png)

【优化建议】

- 最简单的方案：用 Cloudflare 的免费CDN服务，即可自动开启Gzip压缩。
- 启用 Gzip 或 Brotli 压缩，在 Nginx 中可以这样设置：

```nginx
# 启用 Gzip 压缩
gzip on;
gzip_comp_level 6;
gzip_min_length 1000;
gzip_proxied any;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# 如果支持 Brotli 压缩，可启用以获得更高效的压缩效果
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

• 为静态资源设置合适的缓存头，减少重复加载：

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 30d;
    add_header Cache-Control "public, max-age=2592000";
    access_log off;
}
```

### 7. 使用 SSL/TLS 并优化性能

【前提条件】

- **SSL 证书**：您需要有一个有效的 SSL 证书（可以使用免费的 Let's Encrypt）。
- **服务器配置权限**：需要能够修改 SSL 配置。
- **DNS 配置**：为 OCSP Stapling 配置可靠的 DNS 解析器。

【提示】

安全总是第一位的，但 HTTPS 的配置如果不当，也可能增加一些延迟。这里有一些优化的小技巧，可以帮助您在确保安全的同时，又能保持高效性能。

【优化建议】

- 使用 TLS 1.3，这是目前最快的 TLS 版本。在 Nginx 中配置：

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
```

- 启用 OCSP Stapling 来减少证书验证所花费的时间：

```nginx
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
```

- 通过会话复用减少重复握手的时间：

```nginx
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

【跨国场景优化效果】
**特别说明**：以下是在跨国/跨12个时区场景下的优化效果，这与前面提到的本地访问场景（约3秒）有本质区别。地理距离造成的网络延迟是不可避免的，但通过优化仍能显著提升速度：

综合应用 Http2 + CDN缓存 + Gzip压缩 + Brotli压缩后：
优化前（跨国访问），13秒：
![20250409130618](https://static-docs.nocobase.com/20250409130618.png)
优化后（跨国访问），8秒：
![20250409173528](https://static-docs.nocobase.com/20250409173528.png)

这个例子说明，即使在地理位置相距遥远的情况下，合理的优化措施仍然能将加载时间缩短约40%，大幅改善用户体验。

## IV. 监控与问题排查

### 8. 性能监控与基本分析

【前提条件】

- **可访问性**：您的网站必须是公开可访问的才能使用大多数在线测试工具。
- **基本技能**：需要理解性能指标的基本含义，不过我们会解释每个关键指标。

【提示】

如果不知道哪里成为了瓶颈，就很难精确地进行优化。建议使用一些免费工具来监控网站性能，帮助大家找到问题所在。

【优化建议】

**使用如下免费工具检查网站性能：**

- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest](https://www.webpagetest.org/)
- [Pingdom](https://tools.pingdom.com/)

**关注以下关键指标：**

- 页面加载时间
- 服务器响应时间
- DNS 解析时间
- SSL 握手时间

**常见问题应对：**

- DNS 解析慢？考虑更换 DNS 服务或启用 DNS 预解析。
- SSL 握手慢？优化 SSL 配置，启用会话复用。
- 服务器响应慢？检查服务器资源，必要时进行升级。
- 静态资源加载慢？可尝试实施 CDN 和调整缓存策略。

## 部署优化快速检查清单

下面这份清单可以帮助大家快速检查和优化 NocoBase 的部署：

1. **HTTP 版本检查**

   - [ ]  已启用 HTTPS（HTTP/2 的前提条件）
   - [ ]  已启用 HTTP/2
   - [ ]  如条件允许，可考虑支持 HTTP/3
2. **带宽评估**

   - [ ]  服务器带宽充足（建议至少 10Mbps，优选 50Mbps 以上）
   - [ ]  可采用按流量计费模式而非固定带宽
3. **服务器位置选择**

   - [ ]  服务器选址应靠近用户所在地区
   - [ ]  针对全球用户，考虑使用全球加速服务
4. **部署架构**

   - [ ]  使用 Nginx/Caddy 作为反向代理，将静态资源与 API 分离
   - [ ]  如有需要，采用多实例部署和负载均衡技术
5. **CDN 实施**

   - [ ]  通过 CDN 加速静态资源分发
   - [ ]  配置合适的缓存策略
   - [ ]  确保 CDN 支持 HTTP/2 或 HTTP/3
6. **压缩与缓存**

   - [ ]  启用 Gzip 或 Brotli 压缩
   - [ ]  设置合适的浏览器缓存头
7. **SSL/TLS 优化**

   - [ ]  使用 TLS 1.3 提升握手速度
   - [ ]  启用 OCSP Stapling
   - [ ]  配置 SSL 会话复用
8. **性能监控**

   - [ ]  定期使用性能测试工具评估网站
   - [ ]  监控关键指标（加载、响应、解析、握手时间）
   - [ ]  针对问题进行优化调整

## 常见问题与解答

【问】我的服务器部署在海外，中国用户访问速度缓慢，该怎么办呢？

【答】最好的办法是选择中国区域内的云服务器重新部署。如果实在无法更换，也可以：

1. 使用国内 CDN 加速静态资源；
2. 利用全球加速服务来优化网络路由；
3. 尽可能启用所有压缩和缓存优化措施。

【问】为什么我的 NocoBase 首次加载很慢，而之后却很快？

【答】首次加载慢比较正常，因为首次需要下载大量资源，以我们的官方 Demo 为例，通常首次加载时间为3秒左右。

后续日常输入网址、进入应用的速度约为1-2秒，而应用内切换页面的速度约为50-300毫秒，延迟很低。

![20250416130719](https://static-docs.nocobase.com/20250416130719.png)

对于加载时间过长的情况，仍有优化空间：

1. 确保启用了 HTTP/2；
2. 实施 CDN 加速；
3. 启用 Gzip/Brotli 压缩；
4. 检查服务器带宽是否足够。

【问】我目前使用虚拟主机，无法修改 Nginx 配置怎么办？

【答】在此情况下，虽然优化选项较少，但仍建议：

1. 尝试使用 CDN 服务（如 Cloudflare）；
2. 优化应用程序中可以调整的参数；
3. 如果条件允许，可考虑升级到支持更多自定义配置的 VPS。

---

通过这些简单而实用的部署优化策略，您可以显著提升 NocoBase 的访问速度，给用户带来更流畅的体验。很多优化措施只需在几小时内完成设置，无需改动代码，轻轻松松就能见到效果。
