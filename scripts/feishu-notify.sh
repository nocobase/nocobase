#!/usr/bin/env bash
# Send a Feishu interactive card notification.
#
# Required environment variables:
#   WEBHOOK_URL   - Feishu bot webhook URL
#   TITLE         - Card title
#   STATUS        - "success" or "failure"
#   WORKFLOW_URL  - Link to the GitHub Actions run
#
# Optional environment variables:
#   STATUS_TEXT_SUCCESS - Custom success text (defaults to "构建成功")
#   STATUS_TEXT_FAILURE - Custom failure text (defaults to "构建失败")
#   CONTENT       - Card body content in Markdown (defaults to auto-generated)
#   BUILD_TIME    - Build timestamp (defaults to current time in Asia/Shanghai)
#   ACTOR         - Who triggered the run; appended to the footer when set
#   REPOSITORY    - owner/repo; appended to the footer when set
#   REGISTRY_URL  - Package registry; adds a button when set
#   RELEASE_URL   - GitHub Releases page; adds the primary button when set
#   TABLE_JSON    - `[{"pkg":…,"ver":…}]`; renders a real table under CONTENT
#
# The card uses schema 2.0. Card 1.0 could not render a package list: its
# `lark_md` has no table syntax, so a Markdown table arrived as literal pipes.
# 2.0 has a `table` element that takes structured rows, which is what TABLE_JSON
# feeds. Note that 2.0 drops the `action` element — buttons live in a
# `column_set` and take `behaviors` instead of a bare `url`.

set -euo pipefail

: "${WEBHOOK_URL:?WEBHOOK_URL is required}"
: "${TITLE:?TITLE is required}"
: "${STATUS:?STATUS must be 'success' or 'failure'}"
: "${WORKFLOW_URL:?WORKFLOW_URL is required}"

BUILD_TIME="${BUILD_TIME:-$(TZ="Asia/Shanghai" date +"%Y-%m-%d %H:%M:%S")}"

if [[ "$STATUS" == "success" ]]; then
  HEADER_TEMPLATE="green"
  STATUS_TEXT="${STATUS_TEXT_SUCCESS:-构建成功}"
  STATUS_EMOJI="✅"
else
  HEADER_TEMPLATE="red"
  STATUS_TEXT="${STATUS_TEXT_FAILURE:-构建失败}"
  STATUS_EMOJI="❌"
fi

# 状态、时间、触发者、仓库这几项每条通知都该有，但自定义 CONTENT 时
# 容易漏掉，所以在脚本里统一追加，调用方只负责写正文。
#
# 冒号写在 `**` 外面：CommonMark 规定右侧的 `**` 前面是标点、后面紧跟非空白
# 字符时不构成有效的加粗结束标记，`**状态：**✅` 因此会原样显示星号。卡片 1.0
# 的 lark_md 解析宽松，看不出问题；2.0 的 markdown 严格按 CommonMark 走。
#
# 这里必须用真换行而不是字面的 \n：CONTENT 从 workflow 的 YAML 块标量
# 传进来时带的就是真换行，jq --arg 会把两者分别转义成 \n 和 \\n，后者
# 在飞书里原样显示成反斜杠加 n。
# 兼容旧调用方（main 上的 v1/v2 发版 workflow）：它们按卡片 1.0 写 CONTENT，用
# 字面的 \n 换行、把冒号写在 `**` 里面，还自己拼了状态和时间。这里把字面 \n
# 换成真换行、把 `**xx：**` 改成 `**xx**：`，再去掉和页脚重复的状态、时间行，
# 新旧两种写法都能正确渲染，旧 workflow 不用改。
if [[ -n "${CONTENT:-}" ]]; then
  CONTENT="${CONTENT//\\n/$'\n'}"
  CONTENT=$(sed -E 's/\*\*([^*：:]+)[：:]\*\*/**\1**：/g' <<< "$CONTENT" | grep -vE '^\*\*(状态|时间)\*\*：' || true)
fi

FOOTER="**状态**：${STATUS_EMOJI} ${STATUS_TEXT}
**时间**：${BUILD_TIME}"
[[ -n "${ACTOR:-}" ]] && FOOTER="${FOOTER}
**触发者**：${ACTOR}"
[[ -n "${REPOSITORY:-}" ]] && FOOTER="${FOOTER}
**仓库**：${REPOSITORY}"

# 表格是独立元素，不能拼进 Markdown 正文，所以正文和页脚分开传给 jq，
# 由它按 CONTENT -> table -> hr -> FOOTER 的顺序组装。
TABLE_JSON="${TABLE_JSON:-}"
if [[ -n "$TABLE_JSON" ]] && ! jq -e 'type == "array"' <<< "$TABLE_JSON" > /dev/null 2>&1; then
  echo "TABLE_JSON must be a JSON array; ignoring it" >&2
  TABLE_JSON=""
fi
# 空数组和没传是一回事，渲染出来只会是一个空表头。
if [[ -n "$TABLE_JSON" ]] && [[ "$(jq -r 'length' <<< "$TABLE_JSON")" == "0" ]]; then
  TABLE_JSON=""
fi

PAYLOAD=$(jq -n \
  --arg title "$TITLE" \
  --arg template "$HEADER_TEMPLATE" \
  --arg content "${CONTENT:-}" \
  --arg footer "$FOOTER" \
  --arg url "$WORKFLOW_URL" \
  --arg registry "${REGISTRY_URL:-}" \
  --arg release "${RELEASE_URL:-}" \
  --argjson rows "${TABLE_JSON:-null}" \
  '
  def button($label; $link; $type):
    {
      tag: "column",
      width: "auto",
      elements: [
        {
          tag: "button",
          text: { tag: "plain_text", content: $label },
          type: $type,
          width: "default",
          behaviors: [ { type: "open_url", default_url: $link } ]
        }
      ]
    };
  {
    msg_type: "interactive",
    card: {
      schema: "2.0",
      header: {
        title: { tag: "plain_text", content: $title },
        template: $template
      },
      body: {
        elements: (
          (if $content == "" then [] else [
            { tag: "markdown", content: $content }
          ] end)
          + (if $rows == null then [] else [
            {
              tag: "table",
              page_size: 20,
              row_height: "low",
              header_style: {
                background_style: "grey",
                bold: true,
                text_size: "normal"
              },
              columns: [
                { name: "pkg", display_name: "Package", data_type: "text" },
                { name: "ver", display_name: "版本", data_type: "text" }
              ],
              rows: $rows
            }
          ] end)
          + [
            { tag: "hr" },
            { tag: "markdown", content: $footer },
            {
              tag: "column_set",
              horizontal_spacing: "8px",
              columns: (
                # Release 详情放第一位并设为 primary：发版通知里它是最常点的。
                (if $release == "" then [] else [
                  button("查看 Release 详情"; $release; "primary")
                ] end)
                + [
                  button(
                    "查看构建详情";
                    $url;
                    (if $release == "" then "primary" else "default" end)
                  )
                ]
                + (if $registry == "" then [] else [
                  button("打开 Registry"; $registry; "default")
                ] end)
              )
            }
          ]
        )
      }
    }
  }')

RESPONSE_BODY=$(mktemp)
HTTP_CODE=$(curl -s -o "$RESPONSE_BODY" -w "%{http_code}" -X POST "$WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d "$PAYLOAD")

# 飞书对格式错误的卡片返回 HTTP 200 加一个非零的 code，只看状态码会把
# 「消息没发出去」当成成功。
RESPONSE_CODE=$(jq -r '.code // 0' < "$RESPONSE_BODY" 2>/dev/null || echo 0)
if [[ "$HTTP_CODE" -ge 200 && "$HTTP_CODE" -lt 300 && "$RESPONSE_CODE" == "0" ]]; then
  echo "Feishu notification sent successfully (HTTP ${HTTP_CODE})"
else
  echo "Failed to send Feishu notification (HTTP ${HTTP_CODE})" >&2
  echo "Response: $(cat "$RESPONSE_BODY")" >&2
  rm -f "$RESPONSE_BODY"
  exit 1
fi
rm -f "$RESPONSE_BODY"
