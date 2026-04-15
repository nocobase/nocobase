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

BUILD_TIME="${BUILD_TIME:-$(TZ="Asia/Shanghai" date +"%Y-%m-%d %H:%M:%S")}"

if [[ "$STATUS" == "success" ]]; then
  HEADER_TEMPLATE="green"
  STATUS_TEXT="构建成功"
  STATUS_EMOJI="✅"
else
  HEADER_TEMPLATE="red"
  STATUS_TEXT="构建失败"
  STATUS_EMOJI="❌"
fi

TITLE="NocoBase 版本 ${VERSION} Release 结果通知"

PAYLOAD=$(cat <<EOF
{
  "msg_type": "interactive",
  "card": {
    "header": {
      "title": {
        "tag": "plain_text",
        "content": "${TITLE}"
      },
      "template": "${HEADER_TEMPLATE}"
    },
    "elements": [
      {
        "tag": "div",
        "text": {
          "tag": "lark_md",
          "content": "**版本：**${VERSION}\n**时间：**${BUILD_TIME}\n**状态：**${STATUS_EMOJI} ${STATUS_TEXT}"
        }
      },
      {
        "tag": "action",
        "actions": [
          {
            "tag": "button",
            "text": {
              "tag": "plain_text",
              "content": "查看构建详情"
            },
            "url": "${WORKFLOW_URL}",
            "type": "primary"
          }
        ]
      }
    ]
  }
}
EOF
)

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d "$PAYLOAD")

if [[ "$RESPONSE" -ge 200 && "$RESPONSE" -lt 300 ]]; then
  echo "Feishu notification sent successfully (HTTP ${RESPONSE})"
else
  echo "Failed to send Feishu notification (HTTP ${RESPONSE})" >&2
  exit 1
fi
