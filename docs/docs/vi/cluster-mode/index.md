---
pkg: "@nocobase/preset-cluster"
title: "Chế độ Cluster"
description: "Chế độ Cluster của NocoBase: triển khai multi-instance, load balancing, shared storage, cache và message queue Redis, distributed lock, triển khai Kubernetes, nâng cao khả năng xử lý concurrent cao."
keywords: "Chế độ Cluster,triển khai multi-instance,load balancing,shared storage,Redis,Kubernetes,distributed lock,message queue,NocoBase"
---

# Chế độ Cluster

## Giới thiệu

NocoBase từ phiên bản v1.6.0 trở đi hỗ trợ chạy ứng dụng ở chế độ Cluster. Khi ứng dụng chạy ở chế độ Cluster, có thể nâng cao hiệu năng xử lý concurrent của ứng dụng thông qua nhiều instance và sử dụng chế độ multi-core.

## Kiến trúc hệ thống

![20251031221530](https://static-docs.nocobase.com/20251031221530.png)

* Application Cluster: Cluster gồm nhiều instance của ứng dụng NocoBase, có thể được triển khai trên nhiều server hoặc chạy nhiều process ở chế độ multi-core trên cùng một server.
* Database: Lưu trữ dữ liệu của ứng dụng, có thể là database single-node hoặc distributed database.
* Shared Storage: Dùng để lưu trữ file và dữ liệu của ứng dụng, hỗ trợ truy cập đọc/ghi từ nhiều instance.
* Middleware: Bao gồm các thành phần như cache, sync signal, message queue và distributed lock, hỗ trợ giao tiếp và phối hợp giữa các instance trong cluster.
* Load Balancer: Chịu trách nhiệm phân phối request từ client đến các instance khác nhau trong cluster, đồng thời thực hiện health check và failover.

## Tìm hiểu thêm

Tài liệu này chỉ giới thiệu các khái niệm cơ bản và thành phần của chế độ Cluster trong NocoBase. Để biết về triển khai cụ thể và các mục cấu hình khác, có thể tham khảo các tài liệu sau:

- Triển khai
  - [Chuẩn bị](./preparations)
  - [Triển khai Kubernetes](./kubernetes)
  - [Quy trình vận hành](./operations)
- Nâng cao
  - [Tách dịch vụ](./services-splitting)
- [Tài liệu phát triển](./development)
