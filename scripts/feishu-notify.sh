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
#   CONTENT       - Card body content in lark_md format (defaults to auto-generated)
#   BUILD_TIME    - Build timestamp (defaults to current time in Asia/Shanghai)

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

CONTENT="${CONTENT:-"**时间：**${BUILD_TIME}\n**状态：**${STATUS_EMOJI} ${STATUS_TEXT}"}"

PAYLOAD=$(jq -n \
  --arg title "$TITLE" \
  --arg template "$HEADER_TEMPLATE" \
  --arg content "$CONTENT" \
  --arg url "$WORKFLOW_URL" \
  '{
    msg_type: "interactive",
    card: {
      header: {
        title: { tag: "plain_text", content: $title },
        template: $template
      },
      elements: [
        {
          tag: "div",
          text: { tag: "lark_md", content: $content }
        },
        {
          tag: "action",
          actions: [
            {
              tag: "button",
              text: { tag: "plain_text", content: "查看构建详情" },
              url: $url,
              type: "primary"
            }
          ]
        }
      ]
    }
  }')

RESPONSE_BODY=$(mktemp)
HTTP_CODE=$(curl -s -o "$RESPONSE_BODY" -w "%{http_code}" -X POST "$WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d "$PAYLOAD")

if [[ "$HTTP_CODE" -ge 200 && "$HTTP_CODE" -lt 300 ]]; then
  echo "Feishu notification sent successfully (HTTP ${HTTP_CODE})"
else
  echo "Failed to send Feishu notification (HTTP ${HTTP_CODE})" >&2
  echo "Response: $(cat "$RESPONSE_BODY")" >&2
  rm -f "$RESPONSE_BODY"
  exit 1
fi
rm -f "$RESPONSE_BODY"
