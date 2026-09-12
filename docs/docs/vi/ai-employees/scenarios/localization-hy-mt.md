---
pkg: '@nocobase/plugin-ai'
title: 'Dùng Lina và HY-MT1.5-1.8B cục bộ để dịch mục bản địa hóa'
description: 'Triển khai mô hình dịch HY-MT1.5 GGUF bằng llama-server và cấu hình cho Lina dịch hàng loạt các mục bản địa hóa của NocoBase.'
keywords: 'Lina,localization,HY-MT,GGUF,llama-server,OpenAI compatible,AI translation,NocoBase'
---

# Dùng Lina và HY-MT1.5-1.8B cục bộ để dịch mục bản địa hóa

Tài liệu này mô tả một thực hành dịch bản địa hóa: triển khai cục bộ một mô hình nhỏ chuyên cho dịch thuật, cung cấp nó như dịch vụ tương thích OpenAI, rồi cấu hình cho Lina dịch hàng loạt các mục bản địa hóa của NocoBase.

Cách này phù hợp để dịch nhiều mục hệ thống, văn bản plugin, menu, tiêu đề collection và nhãn field. So với mô hình trực tuyến, mô hình cục bộ không bị ảnh hưởng bởi giới hạn RPM, TPM hay đồng thời của API bên ngoài, và có thể điều chỉnh số lượng đồng thời theo năng lực máy và mô hình.

## Tổng quan

Tài liệu này sử dụng:

- Mô hình: `tencent/HY-MT1.5-1.8B-GGUF`
- Dịch vụ suy luận: `llama-server`
- Tích hợp: OpenAI-compatible API
- Nhân viên AI: Lina
- Điểm vào: trang Localization Management

:::info{title=Ghi chú}
HY-MT1.5-1.8B là mô hình nhỏ chuyên cho dịch thuật. Nó phù hợp hơn với mục ngắn, văn bản UI và dịch hàng loạt. Không nên ưu tiên dùng mô hình chat tổng quát cho tác vụ bản địa hóa.
:::

## Điều kiện chuẩn bị

- Plugin **Localization Management** đã được bật.
- Ngôn ngữ đích đã được bật.
- Các mục bản địa hóa đã được đồng bộ.
- Máy cục bộ hoặc máy chủ có thể chạy [`llama-server`](https://github.com/ggml-org/llama.cpp).
- Dịch vụ NocoBase có thể truy cập địa chỉ HTTP của `llama-server`.

## Triển khai HY-MT GGUF

### Cài đặt llama.cpp

Trên macOS, bạn có thể cài bằng Homebrew:

```bash
brew install llama.cpp
```

Bạn cũng có thể dùng binary llama.cpp dựng sẵn hoặc biên dịch từ mã nguồn. Yêu cầu cuối cùng là `llama-server` khả dụng.

### Khởi động dịch vụ tương thích OpenAI

Khởi động dịch vụ với mô hình GGUF từ Hugging Face:

```bash
llama-server \
  -hf tencent/HY-MT1.5-1.8B-GGUF:Q4_K_M \
  --host 0.0.0.0 \
  --port 8000 \
  -c 2048 \
  -np 4
```

| Tham số | Mô tả |
| --- | --- |
| `-hf` | Tải mô hình từ Hugging Face. |
| `--host` | Địa chỉ lắng nghe. Dùng `127.0.0.1` để kiểm thử cục bộ hoặc `0.0.0.0` cho truy cập từ container hoặc từ xa. |
| `--port` | Cổng dịch vụ HTTP. |
| `-c` | Độ dài ngữ cảnh. Các mục bản địa hóa thường ngắn, vì vậy `2048` thường là đủ. |
| `-np` | Số slot song song. Điều chỉnh theo hiệu năng máy. |

:::info{title=Mẹo}
Nếu tài nguyên máy chủ hạn chế, bắt đầu với `-np 1` hoặc `-np 2`, rồi tăng dần sau khi xác nhận ổn định.
:::

## Kiểm thử dịch vụ mô hình

Sau khi `llama-server` khởi động, kiểm tra trạng thái dịch vụ:

```bash
curl http://127.0.0.1:8000/health
```

Sau đó kiểm thử dịch qua API tương thích OpenAI:

```bash
curl http://127.0.0.1:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tencent/HY-MT1.5-1.8B-GGUF:Q4_K_M",
    "messages": [
      {
        "role": "user",
        "content": "Translate the following text into Chinese. Output only the translated result without any additional explanation:\n\nSave"
      }
    ]
  }'
```

Nếu bạn khởi động từ file mô hình cục bộ, hãy đổi `model` thành tên mô hình thực tế do dịch vụ trả về hoặc đã cấu hình.

:::warning{title=Ghi chú}
Nếu request không phản hồi trong thời gian dài, mô hình có thể quá chậm, số lượng đồng thời quá cao hoặc ngữ cảnh quá lớn. Trước tiên giảm `-np` và số lượng đồng thời dịch của NocoBase, rồi quan sát thời gian phản hồi.
:::

## Cấu hình dịch vụ LLM trong NocoBase

Vào `System Settings -> AI Employees -> LLM service` và thêm một dịch vụ LLM.

| Thiết lập | Ví dụ |
| --- | --- |
| Provider | OpenAI (completions) |
| Title | HY-MT Local |
| Base URL | `http://127.0.0.1:8000/v1` |
| API Key | Nếu `llama-server` không có xác thực, dùng giá trị placeholder như `dummy`. |
| Enabled Models | Chọn `tencent/HY-MT1.5-1.8B-GGUF:Q4_K_M` hoặc nhập tên mô hình thực tế. |

Sau khi cấu hình, dùng `Test flight` để kiểm tra mô hình.

:::info{title=Mẹo}
Nếu NocoBase chạy trong Docker, `127.0.0.1` trỏ tới chính container và có thể không truy cập được dịch vụ trên host. Hãy dùng IP host, địa chỉ mạng container hoặc `host.docker.internal`.
:::

## Cấu hình mô hình chuyên dụng cho Lina

Vào `System Settings -> AI Employees -> AI employees`, mở Lina và chuyển sang `Model settings`.

1. Bật `Enable dedicated model configuration`.
2. Chọn mô hình HY-MT cục bộ trong `Models`.
3. Lưu cấu hình.

Sau đó, Lina sẽ dùng mô hình này cho tác vụ dịch bản địa hóa và tránh chuyển sang mô hình chat tổng quát.

Xem chi tiết tại [Cấu hình mô hình cho nhân viên AI](/ai-employees/features/model-settings).

## Cấu hình số lượng đồng thời dịch

Số lượng đồng thời của tác vụ dịch bản địa hóa được kiểm soát bằng `AI_LOCALIZATION_CONCURRENCY`:

```bash
AI_LOCALIZATION_CONCURRENCY=10
```

Quy tắc:

- Mặc định: `10`
- Tối thiểu: `1`
- Tối đa: `20`
- Giá trị ngoài phạm vi dùng mặc định

Số lượng đồng thời phù hợp phụ thuộc vào CPU, GPU, bộ nhớ, lượng tử hóa mô hình và `llama-server -np`. Nếu giá trị mặc định gây vấn đề:

1. Bắt đầu với `AI_LOCALIZATION_CONCURRENCY=1` và kiểm tra dịch một mục.
2. Đặt cả `llama-server -np` và `AI_LOCALIZATION_CONCURRENCY` thành `2` hoặc `4`.
3. Quan sát thời gian phản hồi, mức dùng CPU/GPU và tiến độ tác vụ.
4. Chỉ tăng dần khi hệ thống ổn định.

:::warning{title=Ghi chú}
Không đặt số lượng đồng thời quá cao ngay từ đầu. Nếu vượt quá năng lực thực tế của mô hình, tác vụ có thể chậm hơn do hàng đợi, timeout hoặc dịch vụ bị treo.
:::

## Thực hiện dịch bản địa hóa

Vào `System Management -> Localization Management`.

1. Chuyển sang ngôn ngữ đích.
2. Bấm `Synchronize` để đảm bảo các mục đã được đồng bộ.
3. Bấm avatar của Lina.
4. Chọn phạm vi tác vụ:
   - `Incremental translation`: dịch các mục chưa có bản dịch.
   - `Selected translation`: dịch các mục được chọn trong bảng.
   - `Full translation`: dịch toàn bộ mục của ngôn ngữ hiện tại.
5. Kiểm tra số lượng mục, provider và model trong hộp thoại xác nhận.
6. Nếu chọn dịch tăng dần hoặc dịch toàn bộ, hãy chọn phạm vi dịch:
   - `All`
   - `Built-in entries`: mục hệ thống và plugin.
   - `Custom entries`: tên route, tên collection và field, cùng nội dung UI.
7. Điều chỉnh ngôn ngữ bản dịch tham chiếu nếu cần. Dịch tăng dần và dịch toàn bộ cấu hình riêng ngôn ngữ tham chiếu cho mục tích hợp và mục tùy chỉnh; dịch mục đã chọn chỉ hiển thị một cấu hình ngôn ngữ tham chiếu chung.
8. Xác nhận để tạo tác vụ bất đồng bộ.
9. Chờ hoàn tất, rà soát bản dịch và publish.

Hãy bắt đầu bằng `Selected translation` với vài mục để kiểm tra phong cách đầu ra và tốc độ trước khi chạy dịch tăng dần hoặc toàn bộ.

## Cách Lina tạo request dịch

Lina tạo request từ mục và bản dịch tham chiếu. Với các mục ngắn, tham chiếu hiện có giúp tăng tính nhất quán:

- Mục tích hợp dùng bản dịch tiếng Trung làm tham chiếu mặc định và tiếng Nhật làm tham chiếu dự phòng.
- Mục tùy chỉnh dùng ngôn ngữ mặc định của hệ thống làm tham chiếu mặc định và tiếng Trung làm tham chiếu dự phòng.
- Người dùng có thể điều chỉnh ngôn ngữ mặc định và ngôn ngữ dự phòng trong hộp thoại xác nhận tác vụ.
- Hệ thống ưu tiên dùng bản dịch tham chiếu trong ngôn ngữ mặc định. Nếu không có, hệ thống sẽ thử ngôn ngữ dự phòng.
- Kết quả được ghi vào ngôn ngữ đích nhưng không tự động publish.

Ngữ nghĩa của prompt tương tự như sau:

```text
Refer to the following translation:
{source_term} is translated as {target_term}

Translate the following text into {target_language}. Output only the translated result without any additional explanation:

{source_text}
```

## Khắc phục sự cố

### Không có tiến độ sau khi tạo tác vụ

Kiểm tra `llama-server` có nhận request hay không. Xem log dịch vụ hoặc gọi `/v1/chat/completions` bằng `curl`.

Nếu mô hình nhận request nhưng không trả kết quả, hãy giảm:

- `AI_LOCALIZATION_CONCURRENCY`
- `llama-server -np`
- `llama-server -c`

### Mô hình trả về giải thích thay vì bản dịch

Mô hình dịch cục bộ thường ổn định hơn mô hình chat tổng quát. Nếu vẫn có giải thích, trước tiên thử cùng prompt bằng `curl` để kiểm tra kiểu đầu ra của mô hình. Bạn cũng có thể dịch các mục ngắn hơn trước hoặc giảm tham số sampling như temperature.

### NocoBase không kết nối được dịch vụ mô hình

Kiểm tra:

- Base URL có bao gồm `/v1` hay không.
- Môi trường chạy NocoBase có truy cập được địa chỉ đó hay không.
- Firewall hoặc mạng container có chặn cổng hay không.
- `llama-server` còn đang chạy hay không.

## Rà soát trước khi publish

Sau khi AI dịch xong, hãy rà soát trước khi publish:

- Lọc theo module và kiểm tra mục ngắn như menu, nút, tên field và trạng thái.
- Kiểm tra biến, placeholder, thẻ HTML và ký hiệu định dạng.
- Kiểm tra tính nhất quán của thuật ngữ nghiệp vụ quan trọng.
- Nếu bản dịch mục tích hợp bị ghi đè, đồng bộ lại trong Localization Management và chọn `Reset system built-in entry translations` để khôi phục mặc định. Để đóng góp bản dịch mặc định cho hệ thống và plugin chính thức, xem [Translation Contribution](/get-started/translations).
- Publish trong môi trường kiểm thử trước, sau đó đồng bộ lên production.

## Tham khảo

- [tencent/HY-MT1.5-1.8B-GGUF](https://huggingface.co/tencent/HY-MT1.5-1.8B-GGUF)
- [Tài liệu llama-server](https://www.mintlify.com/ggml-org/llama.cpp/inference/server)
- [Lina: kỹ sư bản địa hóa](/ai-employees/built-in/lina)
