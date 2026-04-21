#!/usr/bin/env bash
# Send a Feishu interactive card notification for release results.
#
# Required environment variables:
#   WEBHOOK_URL   - Feishu bot webhook URL
#   VERSION       - Release version (e.g. v2.0.34)
#   STATUS        - "success" or "failure"
#   WORKFLOW_URL  - Link to the GitHub Actions run
#
# Optional environment variables:
#   BUILD_TIME    - Build timestamp (defaults to current time in Asia/Shanghai)

set -euo pipefail

: "${WEBHOOK_URL:?WEBHOOK_URL is required}"
: "${VERSION:?VERSION is required}"
: "${STATUS:?STATUS must be 'success' or 'failure'}"
: "${WORKFLOW_URL:?WORKFLOW_URL is required}"

if ! command -v jq &>/dev/null; then
  echo "jq is required but not installed" >&2
  exit 1
fi

BUILD_TIME="${BUILD_TIME:-$(TZ="Asia/Shanghai" date +"%Y-%m-%d %H:%M:%S")}"

if [[ "$STATUS" == "success" ]]; then
  HEADER_TEMPLATE="green"
  STATUS_LABEL="✅ 构建成功"
else
  HEADER_TEMPLATE="red"
  STATUS_LABEL="❌ 构建失败"
fi

TITLE="NocoBase 版本 ${VERSION} Release 结果通知"
BODY_CONTENT="**版本：**${VERSION}\n**时间：**${BUILD_TIME}\n**状态：**${STATUS_LABEL}"

PAYLOAD=$(jq -n \
  --arg title        "$TITLE" \
  --arg template     "$HEADER_TEMPLATE" \
  --arg body         "$BODY_CONTENT" \
  --arg workflow_url "$WORKFLOW_URL" \
  '{
    msg_type: "interactive",
    card: {
      header: {
        title:    { tag: "plain_text", content: $title },
        template: $template
      },
      elements: [
        {
          tag:  "div",
          text: { tag: "lark_md", content: $body }
        },
        {
          tag: "action",
          actions: [
            {
              tag:  "button",
              text: { tag: "plain_text", content: "查看构建详情" },
              url:  $workflow_url,
              type: "primary"
            }
          ]
        }
      ]
    }
  }')

HTTP_CODE=$(curl -s -o /tmp/feishu_response.json -w "%{http_code}" \
  -X POST "$WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d "$PAYLOAD")

if [[ "$HTTP_CODE" -ge 200 && "$HTTP_CODE" -lt 300 ]]; then
  echo "Feishu notification sent successfully (HTTP ${HTTP_CODE})"
else
  echo "Failed to send Feishu notification (HTTP ${HTTP_CODE})" >&2
  echo "Response body: $(cat /tmp/feishu_response.json)" >&2
  exit 1
fi
