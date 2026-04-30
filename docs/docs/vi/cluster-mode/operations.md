---
pkg: "@nocobase/preset-cluster"
title: "Quy trình vận hành Cluster"
description: "Vận hành chế độ Cluster: thứ tự khởi động lần đầu, quy trình nâng cấp phiên bản (dừng dịch vụ, sao lưu, cập nhật, xác minh), bảo trì trong ứng dụng (quản lý plugin, sao lưu khôi phục) cần thu nhỏ về thao tác single-node."
keywords: "vận hành cluster,nâng cấp phiên bản,bảo trì trong ứng dụng,quản lý plugin,sao lưu khôi phục,nâng cấp dừng dịch vụ,NocoBase"
---

# Quy trình vận hành

## Khởi động ứng dụng lần đầu

Khi khởi động ứng dụng lần đầu, nên khởi động một trong các node trước, đợi plugin được cài đặt xong và kích hoạt, sau đó khởi động các node khác.

## Nâng cấp phiên bản

Khi cần nâng cấp phiên bản NocoBase, tham khảo quy trình này.

:::warning{title=Lưu ý}
Trong **môi trường production** của cluster cần thận trọng hoặc cấm sử dụng các tính năng quản lý plugin và nâng cấp phiên bản.

NocoBase tạm thời chưa triển khai online upgrade phiên bản cluster. Để đảm bảo tính nhất quán dữ liệu, cần tạm dừng dịch vụ public trong quá trình nâng cấp.
:::

Các bước thực hiện:

1.  Dừng dịch vụ hiện tại

    Dừng tất cả các instance ứng dụng NocoBase, chuyển traffic của load balancer đến trang trạng thái 503.

2.  Sao lưu dữ liệu

    Trước khi nâng cấp, khuyến nghị mạnh mẽ sao lưu dữ liệu database để tránh các bất thường trong quá trình nâng cấp.

3.  Cập nhật phiên bản

    Tham khảo [Nâng cấp Docker](../get-started/upgrading/docker) để cập nhật phiên bản image của ứng dụng NocoBase.

4.  Khởi động dịch vụ

    1. Khởi động một node trong cluster, đợi update xong và khởi động thành công
    2. Xác minh chức năng hoạt động chính xác, nếu có bất thường và không thể khắc phục, có thể rollback về phiên bản trước
    3. Khởi động các node khác
    4. Chuyển traffic của load balancer sang application cluster

## Bảo trì trong ứng dụng

Bảo trì trong ứng dụng nghĩa là thực hiện các tính năng liên quan đến bảo trì khi ứng dụng đang chạy, bao gồm:

* Quản lý plugin (cài đặt, kích hoạt, vô hiệu hóa plugin, v.v.)
* Sao lưu và khôi phục
* Quản lý migrate môi trường

Các bước thực hiện:

1.  Thu nhỏ node

    Thu nhỏ số node chạy ứng dụng trong cluster về 1, các node khác dừng dịch vụ.

2.  Thực hiện thao tác bảo trì trong ứng dụng, như cài đặt kích hoạt plugin, sao lưu dữ liệu, v.v.

3.  Khôi phục node

    Sau khi thao tác bảo trì hoàn tất, xác minh chức năng đúng, khởi động các node khác, đợi node khởi động thành công, khôi phục trạng thái chạy của cluster.
