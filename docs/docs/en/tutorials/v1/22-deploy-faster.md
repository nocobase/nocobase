# How to Deploy NocoBase Faster

Many users may find that NocoBase runs slower than expected after deployment. This is often due to network environment, server configurations, or deployment architecture. Before diving into optimization techniques, let's first look at reference values for normal NocoBase loading speeds to avoid unnecessary concerns.

### NocoBase Normal Loading Speed Reference

The following are loading speeds tested in the NocoBase demo environment:

* Time required to enter the application for the first time by entering the URL: approximately 2 seconds
* Time required to switch pages within the application: approximately 50-300 milliseconds

<video autoplay loop width="100%">
      <source src="https://static-docs.nocobase.com/886b8e6afd4eea8fd1ff601fdbaecaf0.mp4">
</video>

<video autoplay loop width="100%">
      <source src="https://static-docs.nocobase.com/c240cf4029820f0e4c2bbb58723e2d76.mp4">
</video>

Next, I'll share a series of simple yet effective deployment optimization techniques that can significantly improve access speed by adjusting deployment settings, without needing to modify any code:

## I. Network and Infrastructure Optimization

### 1. HTTP Protocol Version: Easily Embrace HTTP/2

【Prerequisites】

- **HTTPS Support Required**: This is important! Almost all modern browsers only support HTTP/2 over HTTPS connections, so you must configure SSL certificates first.
- **Server Requirements**: You need to use server software that supports HTTP/2, such as Nginx 1.9.5+ or Apache 2.4.17+.
- **TLS Version**: TLS 1.2 or higher is recommended (TLS 1.3 is best), as older SSL versions don't support HTTP/2.

【Tips】

Traditional HTTP/1.1 protocol has limitations when handling multiple requests—typically only 6-8 connections simultaneously, which is like waiting in line to buy tickets, easily causing delays.
![250416_http1_en](https://static-docs.nocobase.com/250416_http1_en.png)

HTTP/2 uses "multiplexing" technology to handle multiple requests simultaneously, greatly accelerating resource loading; while the latest HTTP/3 performs even better in unstable networks, with excellent results.

![250416_http2_en](https://static-docs.nocobase.com/250416_http2_en.png)

【Optimization Suggestions】

- Make sure your web server has HTTP/2 support enabled, which is easy to configure on most servers (like Nginx, Caddy).
- In Nginx, simply add the `http2` parameter after the listen directive:

```nginx
listen 443 ssl http2;
```

【Verification】

In your browser's developer panel, open the "Network" option, right-click and check "Protocol" to see the current connection protocol version:
![20250407145442](https://static-docs.nocobase.com/20250407145442.png)

Based on our tests, overall speed improves by about 10%, with more significant performance improvements when the system has many blocks and resources.

### 2. Network Bandwidth: Bigger is Better, Flexible Billing

【Tips】

Just like highways are smoother than local roads, bandwidth determines data transmission efficiency. When NocoBase loads for the first time, it needs to download many frontend resources, and insufficient bandwidth can easily become a bottleneck.

【Optimization Suggestions】

- Choose sufficient bandwidth (50Mbps+ recommended for many users), don't skimp on this critical resource.
- Recommend "pay-as-you-go" billing: many cloud providers offer this flexible model, allowing you to enjoy higher bandwidth during peak times while controlling costs during normal usage.

### 3. Network Latency and Server Geographic Location: Closer Means Faster

【Tips】

Latency is the waiting time for data transmission. Even with sufficient bandwidth, if the server is too far from users (e.g., users in China but server in the US), each request response may be slowed down due to the long distance.

【Optimization Suggestions】

- Try to deploy NocoBase in regions closer to your main user base.
- If your users are globally distributed, consider using global acceleration services (such as Alibaba Cloud Global Accelerator or AWS Global Accelerator) to optimize network routing and reduce latency.

【Verification】

Use the ping command to test latency from different regions.
This approach shows the most obvious improvement, with access speed increasing 1-3 times or more depending on the region.
Across 12 time zones, 13 seconds:
![20250416130618](https://static-docs.nocobase.com/20250416130618.png)

Across 2 time zones, 8 seconds:
![20250409131039](https://static-docs.nocobase.com/20250409131039.png)

Current region, about 3 seconds:
![20250409130928](https://static-docs.nocobase.com/20250409130928.png)

## II. Deployment Architecture Optimization

### 4. Server Deployment and Proxy Methods: Choose the Most Suitable Architecture

【Prerequisites】

- **Server Permissions**: You need root or sudo access to configure services like Nginx.
- **Basic Skills**: Some basic server configuration knowledge is required, but don't worry, specific configuration examples will be provided.
- **Port Access**: Ensure your firewall allows access to ports 80 (HTTP) and 443 (HTTPS).

【Tips】

When users access NocoBase, requests go directly to your server. An appropriate deployment method allows your server to handle requests more efficiently, providing faster responses.

【Different Solutions and Recommendations】

**Starting NocoBase without using a reverse proxy for static resources (not recommended):**

- Disadvantages: This method is simple but performs poorly when handling high concurrency or static files; suitable for development and testing only.
- Recommendation: Please avoid this method if possible.

> Reference "[Installation Documentation](https://v2.docs.nocobase.com/get-started/quickstart)"

Without a reverse proxy, homepage loading takes about 6.1 seconds
![20250409131357](https://static-docs.nocobase.com/20250409131357.png)

**Using Nginx / Caddy as reverse proxy (strongly recommended):**

- Advantages: Reverse proxy servers can efficiently handle concurrent connections, serve static files, implement load balancing, and make HTTP/2 configuration simple.
- Recommendation: In production environments, after application deployment (source code deployment / create-nocobase-app / Docker image), use Nginx or Caddy as a reverse proxy.

> Reference "[Deployment Documentation](https://v2.docs.nocobase.com/get-started/deployment/production)"

With Nginx proxy, homepage loading takes about 3-4 seconds
![20250409131541](https://static-docs.nocobase.com/20250409131541.png)

![20250416081410](https://static-docs.nocobase.com/20250416081410.png)

**Using cluster deployment with load balancing (suitable for high concurrency and high availability scenarios):**

- Advantages: By deploying multiple instances to handle requests, you can significantly improve overall system stability and concurrency capacity.
- For specific deployment methods, see **[Cluster Mode](https://docs.nocobase.com/welcome/getting-started/deployment/cluster-mode)**

### 5. Using CDN to Accelerate Static Resources

【Prerequisites】

- **Domain Requirements**: You need a registered domain name and the ability to manage its DNS settings.
- **SSL Certificate**: Most CDN services require SSL certificate configuration (you can use free Let's Encrypt certificates).
- **Service Selection**: Choose appropriate CDN providers based on user regions (users in mainland China need CDNs with ICP filing).

【Tips】
CDN (Content Delivery Network) caches your static resources at nodes around the world, allowing users to get resources from the nearest node, like getting water from a nearby source, greatly reducing loading delays.

Additionally, the greatest advantage of CDNs is their ability to **significantly reduce the load and bandwidth pressure on your application server**. When many users access NocoBase simultaneously without a CDN, all static resource requests (JavaScript, CSS, images, etc.) hit your server directly, potentially causing bandwidth saturation, performance degradation, or even server crashes. By offloading these requests to a CDN, your server can focus on processing core business logic, providing users with a more stable experience.

![20250416_0826](https://static-docs.nocobase.com/20250416_0826.png)

【Optimization Suggestions】• Configure your server to distribute static resource requests through CDN.• Choose suitable CDN providers based on user location:

- Global users: Cloudflare, Akamai, AWS CloudFront;
- Mainland China users: Alibaba Cloud CDN, Tencent Cloud CDN, Baidu Cloud Acceleration.Example configuration:

```nginx
# Redirect static resources to CDN domain
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    rewrite ^(.*)$ https://your-cdn-domain.com$1 permanent;
}
```

- For small projects, Cloudflare's free plan can provide good CDN acceleration:

1. Register a Cloudflare account and add your domain;
2. Modify DNS to point your domain to Cloudflare's servers;
3. Set appropriate cache levels in the control panel.

**Special Note**: Even if all your users are in the same region, it's still strongly recommended to use a CDN as it effectively reduces server burden, improves overall system stability, especially during high traffic periods.

## III. Static Resource Optimization

### 6. Server Compression and Cache Configuration

【Prerequisites】

- **CPU Resources**: Compression increases server CPU load, so your server should have sufficient processing power.
- **Nginx Module Support**: Gzip compression is generally built-in, but Brotli compression may require additional module installation.
- **Configuration Permissions**: You need permission to modify server configurations.

【Tips】

By enabling compression and implementing reasonable cache strategies, you can significantly reduce data transfer volume and repeated requests, essentially "slimming down" your resources to make loading speeds take off.
![20250416081719](https://static-docs.nocobase.com/20250416081719.png)

【Optimization Suggestions】

- Simplest solution: Use Cloudflare's free CDN service, which automatically enables Gzip compression.
- Enable Gzip or Brotli compression, which can be set in Nginx like this:

```nginx
# Enable Gzip compression
gzip on;
gzip_comp_level 6;
gzip_min_length 1000;
gzip_proxied any;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# If Brotli compression is supported, enable it for more efficient compression
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

- Set appropriate cache headers for static resources to reduce repeated loading:

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 30d;
    add_header Cache-Control "public, max-age=2592000";
    access_log off;
}
```

### 7. Using SSL/TLS and Optimizing Performance

【Prerequisites】

- **SSL Certificate**: You need a valid SSL certificate (you can use free Let's Encrypt certificates).
- **Server Configuration Permissions**: You need to be able to modify SSL configurations.
- **DNS Configuration**: Configure reliable DNS resolvers for OCSP Stapling.

【Tips】

Security always comes first, but improper HTTPS configuration can add some delay. Here are some optimization tricks to help you maintain high performance while ensuring security.

【Optimization Suggestions】

- Use TLS 1.3, which is currently the fastest TLS version. Configure in Nginx:

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
```

- Enable OCSP Stapling to reduce certificate verification time:

```nginx
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
```

- Reduce repeated handshake time through session reuse:

```nginx
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

【Cross-Region Optimization Effect】
**Special Note**: The following shows optimization effects in a cross-region/cross-12-timezone scenario, which is fundamentally different from the local access scenario (about 3 seconds) mentioned earlier. Network latency caused by geographical distance is unavoidable, but optimization can still significantly improve speed:

With Http2 + CDN caching + Gzip compression + Brotli compression combined:
Before optimization (cross-region access), 13 seconds:
![20250416130618](https://static-docs.nocobase.com/20250416130618.png)
After optimization (cross-region access), 8 seconds:
![20250409173528](https://static-docs.nocobase.com/20250409173528.png)

This example shows that even when geographical locations are far apart, appropriate optimization measures can still reduce loading time by about 40%, greatly improving user experience.

## IV. Monitoring and Troubleshooting

### 8. Performance Monitoring and Basic Analysis

【Prerequisites】

- **Accessibility**: Your website must be publicly accessible to use most online testing tools.
- **Basic Skills**: You need to understand the basic meaning of performance metrics, though we'll explain each key indicator.

【Tips】

It's difficult to optimize precisely without knowing where the bottlenecks are. We recommend using some free tools to monitor website performance to help identify problems.

【Optimization Suggestions】

**Use the following free tools to check website performance:**

- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest](https://www.webpagetest.org/)
- [Pingdom](https://tools.pingdom.com/)

**Focus on these key metrics:**

- Page load time
- Server response time
- DNS resolution time
- SSL handshake time

**Common problem solutions:**

- Slow DNS resolution? Consider changing DNS service or enabling DNS pre-resolution.
- Slow SSL handshake? Optimize SSL configuration, enable session reuse.
- Slow server response? Check server resources, upgrade if necessary.
- Slow static resource loading? Try implementing CDN and adjusting cache strategies.

## Deployment Optimization Quick Checklist

The following checklist can help you quickly check and optimize your NocoBase deployment:

1. **HTTP Version Check**

   - [ ]  HTTPS enabled (prerequisite for HTTP/2)
   - [ ]  HTTP/2 enabled
   - [ ]  Consider supporting HTTP/3 if conditions allow
2. **Bandwidth Assessment**

   - [ ]  Sufficient server bandwidth (at least 10Mbps recommended, 50Mbps+ preferred)
   - [ ]  Consider pay-as-you-go billing model rather than fixed bandwidth
3. **Server Location Selection**

   - [ ]  Server location should be close to user regions
   - [ ]  Consider using global acceleration services for worldwide users
4. **Deployment Architecture**

   - [ ]  Use Nginx/Caddy as reverse proxy to separate static resources from API
   - [ ]  If needed, adopt multi-instance deployment and load balancing technology
5. **CDN Implementation**

   - [ ]  Accelerate static resource distribution through CDN
   - [ ]  Configure appropriate caching strategies
   - [ ]  Ensure CDN supports HTTP/2 or HTTP/3
6. **Compression and Caching**

   - [ ]  Enable Gzip or Brotli compression
   - [ ]  Set appropriate browser cache headers
7. **SSL/TLS Optimization**

   - [ ]  Use TLS 1.3 to improve handshake speed
   - [ ]  Enable OCSP Stapling
   - [ ]  Configure SSL session reuse
8. **Performance Monitoring**

   - [ ]  Regularly use performance testing tools to evaluate your website
   - [ ]  Monitor key metrics (loading, response, resolution, handshake times)
   - [ ]  Optimize based on identified issues

## Frequently Asked Questions

【Q】My server is deployed in a different region than my users, causing slow access. What should I do?

【A】The best solution is to choose a cloud server in the same region as your primary users. If that's not possible, you can also:

1. Use a CDN service to accelerate static resources;
2. Utilize global acceleration services to optimize network routing;
3. Enable all compression and cache optimization measures as much as possible.

【Q】Why is my NocoBase slow on first load but fast afterward?

【A】Slow first load is normal because it needs to download many resources initially.

Using our official Demo as an example, the first load typically takes about 3 seconds. Subsequent daily access when entering the URL takes about 1-2 seconds, while navigating between pages within the application is very fast at approximately 50-300 milliseconds, with very low latency.

![20250416130719](https://static-docs.nocobase.com/20250416130719.png)

For excessively long loading times, there's still room for optimization:

1. Ensure HTTP/2 is enabled;
2. Implement CDN acceleration;
3. Enable Gzip/Brotli compression;
4. Check if server bandwidth is sufficient.

【Q】I'm currently using shared hosting and cannot modify Nginx configuration. What should I do?

【A】In this case, although optimization options are fewer, we still recommend:

1. Try using CDN services (like Cloudflare);
2. Optimize parameters that can be adjusted within the application;
3. If conditions allow, consider upgrading to a VPS that supports more custom configurations.

---

Through these simple yet practical deployment optimization strategies, you can significantly improve NocoBase access speed and provide users with a smoother experience. Many optimization measures can be completed within a few hours, require no code changes, and easily show results.

Daily operations:
![2504161639operatio_user2](https://static-docs.nocobase.com/2504161639operatio_user2.gif)
![2504161639operation3](https://static-docs.nocobase.com/2504161639operation3.gif)
