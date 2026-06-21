# Cách Triển khai NocoBase nhanh hơn

Nhiều bạn khi triển khai NocoBase có thể cảm thấy tốc độ truy cập không lý tưởng. Điều này thường do ảnh hưởng của môi trường mạng, cấu hình server hoặc kiến trúc triển khai. Trước khi giới thiệu các kỹ thuật tối ưu, tôi sẽ trình bày tốc độ truy cập NocoBase tham khảo trong cấu hình bình thường, để tránh lo lắng không cần thiết.

### Tốc độ tải NocoBase bình thường tham khảo

Dưới đây là tốc độ tải được kiểm tra trong môi trường demo NocoBase:

- Nhập URL, thời gian lần đầu vào ứng dụng khoảng 2 giây
- Thời gian chuyển trang trong ứng dụng khoảng 50-300 mili giây

<video autoplay loop width="100%">
      <source src="https://static-docs.nocobase.com/886b8e6afd4eea8fd1ff601fdbaecaf0.mp4">
</video>

<video autoplay loop width="100%">
      <source src="https://static-docs.nocobase.com/c240cf4029820f0e4c2bbb58723e2d76.mp4">
</video>

Tiếp theo, tôi sẽ chia sẻ một loạt các kỹ thuật tối ưu Triển khai đơn giản nhưng hiệu quả, các phương pháp này không cần sửa đổi code, chỉ cần điều chỉnh cài đặt Triển khai, có thể nâng cao đáng kể tốc độ truy cập:

## I. Tối ưu mạng và hạ tầng

### 1. Phiên bản giao thức HTTP: Dễ dàng đón nhận HTTP/2

【Điều kiện tiên quyết】

- **Cần hỗ trợ HTTPS**: Điều này rất quan trọng! Hầu như tất cả các trình duyệt hiện đại chỉ hỗ trợ HTTP/2 trên kết nối HTTPS, vì vậy bạn phải cấu hình chứng chỉ SSL trước.
- **Yêu cầu server**: Bạn cần sử dụng phần mềm server hỗ trợ HTTP/2, như Nginx 1.9.5+ hoặc Apache 2.4.17+.
- **Phiên bản TLS**: Khuyến nghị sử dụng TLS 1.2 hoặc cao hơn (TLS 1.3 là tốt nhất), các phiên bản SSL cũ không hỗ trợ HTTP/2.

【Mẹo】

Giao thức HTTP/1.1 truyền thống có giới hạn khi xử lý nhiều yêu cầu - thường chỉ có thể xử lý đồng thời 6-8 kết nối, giống như xếp hàng mua vé, dễ gây trễ.
![250409http1](https://static-docs.nocobase.com/250409http1.png)

HTTP/2 sử dụng công nghệ "đa kênh", có thể xử lý đồng thời nhiều yêu cầu, tăng tốc đáng kể việc tải tài nguyên; còn HTTP/3 mới nhất hoạt động tốt hơn trong mạng không ổn định, hiệu quả cũng rất tốt.

![250409http2](https://static-docs.nocobase.com/250409http2.png)

【Đề xuất tối ưu】

- Vui lòng đảm bảo Web server của bạn đã bật hỗ trợ HTTP/2, hiện nay hầu hết các server (như Nginx, Caddy) đều dễ cấu hình.
- Trong Nginx, chỉ cần thêm tham số `http2` sau lệnh listen:

```nginx
listen 443 ssl http2;
```

【Xác minh】

Bảng điều khiển dành cho nhà phát triển trình duyệt, mở tab "Network", nhấp chuột phải chọn "Protocol", có thể thấy phiên bản giao thức của kết nối hiện tại:
![20250407145442](https://static-docs.nocobase.com/20250407145442.png)

Theo thử nghiệm thực tế của chúng tôi, tốc độ tổng thể tăng khoảng 10%, trong trường hợp có nhiều Block và tài nguyên trong hệ thống, hiệu suất tăng càng rõ rệt.

### 2. Băng thông mạng: Lớn hơn và tốt hơn, tính phí linh hoạt

【Mẹo】

Giống như đường cao tốc sẽ thông thoáng hơn đường thấp, băng thông quyết định hiệu quả truyền dữ liệu. Khi NocoBase tải lần đầu cần tải xuống nhiều tài nguyên frontend, nếu băng thông không đủ, dễ tạo ra điểm tắc nghẽn.

【Đề xuất tối ưu】

- Chọn băng thông đủ (nếu nhiều người dùng sử dụng, khuyến nghị 50M trở lên), đừng tiết kiệm tài nguyên quan trọng này.
- Khuyến nghị sử dụng phương thức "tính phí theo lưu lượng": Nhiều nhà cung cấp dịch vụ đám mây cung cấp mô hình linh hoạt này, trong giờ cao điểm bạn có thể tận hưởng băng thông cao hơn, còn bình thường có thể kiểm soát chi phí.

### 3. Độ trễ mạng và vị trí địa lý của server: Khoảng cách gần, phản hồi nhanh

【Mẹo】

Độ trễ thực ra là thời gian chờ truyền dữ liệu. Ngay cả khi băng thông đủ, nếu server cách quá xa người dùng (ví dụ người dùng ở Trung Quốc, server ở Mỹ), mỗi yêu cầu phản hồi đều có thể bị chậm do khoảng cách xa.

【Đề xuất tối ưu】

- Cố gắng Triển khai NocoBase ở khu vực gần nhóm người dùng chính của bạn.
- Nếu người dùng của bạn phân bố toàn cầu, có thể xem xét sử dụng dịch vụ tăng tốc toàn cầu (ví dụ Alibaba Cloud Global Acceleration hoặc AWS Global Accelerator), tối ưu định tuyến mạng, giảm độ trễ.

【Xác minh】

Qua lệnh ping, kiểm tra độ trễ của server ở các khu vực khác nhau.
Phương pháp này nâng cao rõ rệt nhất, theo các khu vực khác nhau, tốc độ truy cập tăng gấp 1-3 lần trở lên.
Cách 12 múi giờ, 13 giây:
![20250409130618](https://static-docs.nocobase.com/20250409130618.png)

Cách 2 múi giờ, 8 giây:
![20250409131039](https://static-docs.nocobase.com/20250409131039.png)

Khu vực hiện tại, khoảng 3 giây:
![20250409130928](https://static-docs.nocobase.com/20250409130928.png)

## II. Tối ưu kiến trúc Triển khai

### 4. Triển khai phía server và phương thức Proxy: Chọn kiến trúc phù hợp nhất

【Điều kiện tiên quyết】

- **Quyền server**: Bạn cần có quyền root hoặc sudo trên server để cấu hình các dịch vụ như Nginx.
- **Kỹ năng cơ bản**: Cần một số kiến thức cấu hình server cơ bản, nhưng đừng lo, ở đây sẽ cung cấp ví dụ cấu hình cụ thể.
- **Truy cập port**: Đảm bảo tường lửa cho phép truy cập port 80 (HTTP) và port 443 (HTTPS).

【Mẹo】

Khi người dùng truy cập NocoBase, yêu cầu sẽ trực tiếp đến server của bạn. Phương thức Triển khai phù hợp có thể giúp server xử lý yêu cầu hiệu quả hơn, từ đó cung cấp phản hồi nhanh hơn.

【Các giải pháp khác nhau và đề xuất】

**Sau khi khởi động NocoBase, không sử dụng reverse proxy cho tài nguyên tĩnh (không khuyến nghị):**

- Nhược điểm: Cách này tuy đơn giản, nhưng hiệu suất khá yếu khi xử lý đồng thời cao hoặc file tĩnh, phù hợp với phát triển và kiểm thử;
- Đề xuất: Vui lòng cố gắng tránh cách này.

> Tham khảo "[Tài liệu cài đặt](https://docs.nocobase.com/cn/get-started/quickstart)"

Không sử dụng reverse proxy, tải trang chủ khoảng 6.1 giây
![20250409131357](https://static-docs.nocobase.com/20250409131357.png)

**Sử dụng reverse proxy như Nginx / Caddy (rất khuyến nghị):**

- Ưu điểm: Server reverse proxy có thể xử lý hiệu quả các kết nối đồng thời, cung cấp file tĩnh, thực hiện cân bằng tải, và cấu hình HTTP/2 cũng rất đơn giản;
- Đề xuất: Trong môi trường production, sau khi Triển khai ứng dụng (Triển khai source code / create-nocobase-app / Docker image), sử dụng Nginx hoặc Caddy làm reverse proxy.

> Tham khảo "[Tài liệu Triển khai](https://docs.nocobase.com/cn/get-started/deployment/production)"

Sau khi sử dụng Nginx proxy, tải trang chủ khoảng 3-4 giây
![20250409131541](https://static-docs.nocobase.com/20250409131541.png)

![20250407192453](https://static-docs.nocobase.com/20250407192453.png)

**Sử dụng Triển khai cluster và cân bằng tải (phù hợp với tình huống đồng thời cao và độ sẵn sàng cao):**

- Ưu điểm: Bằng cách Triển khai nhiều instance để xử lý yêu cầu, có thể nâng cao đáng kể độ ổn định tổng thể và khả năng đồng thời của hệ thống;
- Cách Triển khai cụ thể xem **[Chế độ cluster](https://docs-cn.nocobase.com/welcome/getting-started/deployment/cluster-mode)**

### 5. Sử dụng CDN để tăng tốc tài nguyên tĩnh

【Điều kiện tiên quyết】

- **Yêu cầu domain**: Bạn cần có một domain đã đăng ký và có thể quản lý cài đặt DNS của nó.
- **Chứng chỉ SSL**: Hầu hết các dịch vụ CDN cần cấu hình chứng chỉ SSL (có thể sử dụng Let's Encrypt miễn phí).
- **Lựa chọn dịch vụ**: Chọn nhà cung cấp dịch vụ CDN phù hợp theo khu vực người dùng (người dùng ở Trung Quốc đại lục cần chọn CDN có ICP đăng ký).

【Mẹo】

CDN (Content Delivery Network) lưu cache tài nguyên tĩnh của bạn vào các node khắp nơi trên thế giới, người dùng có thể lấy tài nguyên từ node gần nhất, giống như lấy nước gần đó, có thể giảm đáng kể độ trễ tải.

Ngoài ra, ưu điểm lớn nhất của CDN là có thể **giảm đáng kể tải và áp lực băng thông của server ứng dụng**. Khi nhiều người dùng truy cập NocoBase đồng thời, nếu không có CDN, tất cả các yêu cầu tài nguyên tĩnh (như JavaScript, CSS, hình ảnh, v.v.) sẽ trực tiếp truy cập server của bạn, có thể dẫn đến băng thông server không đủ, hiệu suất giảm, thậm chí ngừng hoạt động. Thông qua việc CDN phân tán các yêu cầu này, server của bạn có thể tập trung vào xử lý logic nghiệp vụ cốt lõi, cung cấp trải nghiệm ổn định hơn cho người dùng.

![202504071845_cdn](https://static-docs.nocobase.com/202504071845_cdn.png)

【Đề xuất tối ưu】• Cấu hình server để các yêu cầu tài nguyên tĩnh được phân phối qua CDN; • Chọn nhà cung cấp dịch vụ CDN phù hợp theo vị trí của người dùng:

- Người dùng toàn cầu: Cloudflare, Akamai, AWS CloudFront;
- Người dùng Trung Quốc đại lục: Alibaba Cloud CDN, Tencent Cloud CDN, Baidu Cloud Acceleration. Ví dụ cấu hình:

```nginx
# Chuyển hướng tài nguyên tĩnh đến domain CDN
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    rewrite ^(.*)$ https://your-cdn-domain.com$1 permanent;
}
```

Đối với các dự án nhỏ, phiên bản miễn phí của Cloudflare cũng có thể cung cấp hiệu quả tăng tốc CDN khá tốt:

1. Đăng ký tài khoản trên Cloudflare và thêm domain của bạn;
2. Sửa DNS để trỏ domain đến server mà Cloudflare cung cấp;
3. Đặt mức cache phù hợp trong bảng điều khiển.

**Lưu ý đặc biệt**: Ngay cả khi nhóm người dùng của bạn đều ở cùng một khu vực, vẫn rất khuyến nghị sử dụng CDN, vì nó có thể giảm hiệu quả tải server, nâng cao độ ổn định tổng thể của hệ thống, đặc biệt trong trường hợp lưu lượng truy cập lớn.

## III. Tối ưu tài nguyên tĩnh

### 6. Cấu hình nén và cache server

【Điều kiện tiên quyết】

- **Tài nguyên CPU**: Nén sẽ tăng tải CPU server, vì vậy server của bạn cần có đủ năng lực xử lý.
- **Hỗ trợ module Nginx**: Nén Gzip thường được tích hợp sẵn, nhưng nén Brotli có thể cần cài đặt module bổ sung.
- **Quyền cấu hình**: Cần có quyền sửa đổi cấu hình server.

【Mẹo】

Bằng cách bật nén và chiến lược cache hợp lý, có thể giảm đáng kể lượng dữ liệu truyền và yêu cầu lặp lại, tương đương với việc "giảm cân" cho tài nguyên của bạn, làm cho tốc độ tải bay nhanh.
![20250409175241](https://static-docs.nocobase.com/20250409175241.png)

【Đề xuất tối ưu】

- Giải pháp đơn giản nhất: Sử dụng dịch vụ CDN miễn phí của Cloudflare, có thể tự động bật nén Gzip.
- Bật nén Gzip hoặc Brotli, trong Nginx có thể cài đặt như sau:

```nginx
# Bật nén Gzip
gzip on;
gzip_comp_level 6;
gzip_min_length 1000;
gzip_proxied any;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Nếu hỗ trợ nén Brotli, có thể bật để có hiệu quả nén cao hơn
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

• Đặt header cache phù hợp cho tài nguyên tĩnh, giảm tải lặp lại:

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 30d;
    add_header Cache-Control "public, max-age=2592000";
    access_log off;
}
```

### 7. Sử dụng SSL/TLS và tối ưu hiệu suất

【Điều kiện tiên quyết】

- **Chứng chỉ SSL**: Bạn cần có chứng chỉ SSL hợp lệ (có thể sử dụng Let's Encrypt miễn phí).
- **Quyền cấu hình server**: Cần có thể sửa đổi cấu hình SSL.
- **Cấu hình DNS**: Cấu hình DNS resolver đáng tin cậy cho OCSP Stapling.

【Mẹo】

Bảo mật luôn là ưu tiên hàng đầu, nhưng nếu cấu hình HTTPS không đúng cách, cũng có thể tăng một số độ trễ. Đây là một số mẹo tối ưu, giúp bạn vừa đảm bảo bảo mật, vừa duy trì hiệu suất cao.

【Đề xuất tối ưu】

- Sử dụng TLS 1.3, đây là phiên bản TLS nhanh nhất hiện nay. Cấu hình trong Nginx:

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
```

- Bật OCSP Stapling để giảm thời gian xác minh chứng chỉ:

```nginx
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
```

- Giảm thời gian bắt tay lặp lại thông qua tái sử dụng phiên:

```nginx
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

【Hiệu quả tối ưu trong tình huống xuyên quốc gia】
**Lưu ý đặc biệt**: Sau đây là hiệu quả tối ưu trong tình huống xuyên quốc gia/cách 12 múi giờ, đây có sự khác biệt cơ bản với tình huống truy cập cục bộ đã đề cập (khoảng 3 giây). Độ trễ mạng do khoảng cách địa lý là không thể tránh khỏi, nhưng thông qua tối ưu vẫn có thể nâng cao đáng kể tốc độ:

Sau khi áp dụng tổng hợp Http2 + Cache CDN + Nén Gzip + Nén Brotli:
Trước tối ưu (truy cập xuyên quốc gia), 13 giây:
![20250409130618](https://static-docs.nocobase.com/20250409130618.png)
Sau tối ưu (truy cập xuyên quốc gia), 8 giây:
![20250409173528](https://static-docs.nocobase.com/20250409173528.png)

Ví dụ này cho thấy, ngay cả trong trường hợp vị trí địa lý cách xa, các biện pháp tối ưu hợp lý vẫn có thể rút ngắn thời gian tải khoảng 40%, cải thiện đáng kể trải nghiệm người dùng.

## IV. Giám sát và xử lý sự cố

### 8. Giám sát hiệu suất và phân tích cơ bản

【Điều kiện tiên quyết】

- **Khả năng truy cập**: Trang web của bạn phải có thể truy cập công khai để sử dụng hầu hết các công cụ kiểm tra trực tuyến.
- **Kỹ năng cơ bản**: Cần hiểu ý nghĩa cơ bản của các chỉ số hiệu suất, nhưng chúng tôi sẽ giải thích từng chỉ số chính.

【Mẹo】

Nếu không biết điểm tắc nghẽn ở đâu, sẽ rất khó tối ưu chính xác. Khuyến nghị sử dụng một số công cụ miễn phí để giám sát hiệu suất trang web, giúp mọi người tìm ra vấn đề.

【Đề xuất tối ưu】

**Sử dụng các công cụ miễn phí sau để kiểm tra hiệu suất trang web:**

- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest](https://www.webpagetest.org/)
- [Pingdom](https://tools.pingdom.com/)

**Chú ý các chỉ số chính sau:**

- Thời gian tải trang
- Thời gian phản hồi server
- Thời gian giải DNS
- Thời gian bắt tay SSL

**Đối phó với các vấn đề thường gặp:**

- Giải DNS chậm? Xem xét thay đổi dịch vụ DNS hoặc bật DNS prefetch.
- Bắt tay SSL chậm? Tối ưu cấu hình SSL, bật tái sử dụng phiên.
- Phản hồi server chậm? Kiểm tra tài nguyên server, nâng cấp khi cần.
- Tài nguyên tĩnh tải chậm? Có thể thử triển khai CDN và điều chỉnh chiến lược cache.

## Danh sách kiểm tra nhanh tối ưu Triển khai

Danh sách dưới đây có thể giúp mọi người kiểm tra và tối ưu nhanh việc Triển khai NocoBase:

1. **Kiểm tra phiên bản HTTP**

   - [ ]  Đã bật HTTPS (điều kiện tiên quyết của HTTP/2)
   - [ ]  Đã bật HTTP/2
   - [ ]  Nếu điều kiện cho phép, có thể xem xét hỗ trợ HTTP/3
2. **Đánh giá băng thông**

   - [ ]  Băng thông server đủ (khuyến nghị tối thiểu 10Mbps, ưu tiên 50Mbps trở lên)
   - [ ]  Có thể sử dụng mô hình tính phí theo lưu lượng thay vì băng thông cố định
3. **Lựa chọn vị trí server**

   - [ ]  Vị trí server nên gần khu vực người dùng
   - [ ]  Đối với người dùng toàn cầu, xem xét sử dụng dịch vụ tăng tốc toàn cầu
4. **Kiến trúc Triển khai**

   - [ ]  Sử dụng Nginx/Caddy làm reverse proxy, tách tài nguyên tĩnh và API
   - [ ]  Nếu cần, áp dụng Triển khai nhiều instance và công nghệ cân bằng tải
5. **Triển khai CDN**

   - [ ]  Tăng tốc phân phối tài nguyên tĩnh qua CDN
   - [ ]  Cấu hình chiến lược cache phù hợp
   - [ ]  Đảm bảo CDN hỗ trợ HTTP/2 hoặc HTTP/3
6. **Nén và cache**

   - [ ]  Bật nén Gzip hoặc Brotli
   - [ ]  Đặt header cache trình duyệt phù hợp
7. **Tối ưu SSL/TLS**

   - [ ]  Sử dụng TLS 1.3 để nâng cao tốc độ bắt tay
   - [ ]  Bật OCSP Stapling
   - [ ]  Cấu hình tái sử dụng phiên SSL
8. **Giám sát hiệu suất**

   - [ ]  Định kỳ sử dụng công cụ kiểm tra hiệu suất để đánh giá trang web
   - [ ]  Giám sát các chỉ số chính (thời gian tải, phản hồi, giải, bắt tay)
   - [ ]  Điều chỉnh tối ưu cho các vấn đề

## Câu hỏi thường gặp và giải đáp

【Hỏi】Server của tôi Triển khai ở nước ngoài, người dùng Trung Quốc truy cập chậm, phải làm sao?

【Đáp】Cách tốt nhất là chọn server đám mây trong khu vực Trung Quốc để Triển khai lại. Nếu thực sự không thể thay đổi, cũng có thể:

1. Sử dụng CDN trong nước để tăng tốc tài nguyên tĩnh;
2. Sử dụng dịch vụ tăng tốc toàn cầu để tối ưu định tuyến mạng;
3. Bật tất cả các biện pháp tối ưu nén và cache nếu có thể.

【Hỏi】Tại sao NocoBase của tôi tải lần đầu rất chậm, nhưng sau đó lại rất nhanh?

【Đáp】Tải lần đầu chậm là khá bình thường, vì lần đầu cần tải xuống nhiều tài nguyên, lấy Demo chính thức của chúng tôi làm ví dụ, thường thời gian tải lần đầu khoảng 3 giây.

Tốc độ nhập URL, vào ứng dụng hàng ngày sau đó khoảng 1-2 giây, và tốc độ chuyển trang trong ứng dụng khoảng 50-300 mili giây, độ trễ rất thấp.

![20250416130719](https://static-docs.nocobase.com/20250416130719.png)

Đối với trường hợp thời gian tải quá dài, vẫn còn không gian tối ưu:

1. Đảm bảo đã bật HTTP/2;
2. Triển khai tăng tốc CDN;
3. Bật nén Gzip/Brotli;
4. Kiểm tra băng thông server có đủ không.

【Hỏi】Tôi hiện đang sử dụng virtual hosting, không thể sửa cấu hình Nginx, phải làm sao?

【Đáp】Trong tình huống này, mặc dù tùy chọn tối ưu ít hơn, nhưng vẫn khuyến nghị:

1. Thử sử dụng dịch vụ CDN (như Cloudflare);
2. Tối ưu các tham số có thể điều chỉnh trong ứng dụng;
3. Nếu điều kiện cho phép, có thể xem xét nâng cấp lên VPS hỗ trợ nhiều cấu hình tùy chỉnh hơn.

---

Thông qua các chiến lược tối ưu Triển khai đơn giản và thực tế này, bạn có thể nâng cao đáng kể tốc độ truy cập NocoBase, mang lại trải nghiệm mượt mà hơn cho người dùng. Nhiều biện pháp tối ưu chỉ cần hoàn thành cài đặt trong vài giờ, không cần thay đổi code, dễ dàng thấy hiệu quả.
