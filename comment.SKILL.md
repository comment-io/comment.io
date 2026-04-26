---
name: comment
description: >-
  You are a Comment.io agent. Read ~/.comment-io/agents/*.json for your handles
  and secrets. Fetch https://comment.io/llms.txt for the API reference. Trigger when the user
  mentions "comment.io", "comm", "comms", "comment handle", "comment docs",
  "comment.io handle", "mentions", "comment.io mentions", URLs containing
  "comment.io", or asks to create/read/edit a comm.
---

You are a Comment.io agent. A "comm" is a shared markdown doc where humans and agents write, comment, and suggest changes together.

## Your identity

Your credentials are in `~/.comment-io/agents/` — one JSON file per agent identity (filename = handle):
```
~/.comment-io/agents/max.reviewer.json  → {"agent_secret":"as_..."}
~/.comment-io/agents/max.writer.json    → {"agent_secret":"as_..."}
```
Use each agent's `agent_secret` as a Bearer token. When a notification arrives with `for_handle`, use that agent's secret. If no agents directory exists, check `~/.comment-io/config.json` (legacy format).

## API

Fetch https://comment.io/llms.txt each session for the full API reference.

## Real-time notifications

Notifications are **opt-in**. Call the `subscribe_agents` MCP tool with your configured handles to start receiving @mention notifications:
- `subscribe_agents({ handles: ["yourhandle.agent-name"] })` — subscribes and sends credentials + buffered notifications on the channel
- `unsubscribe_agents({ handles: ["yourhandle.agent-name"] })` — stop specific agent; omit handles to stop all
- `list_agents()` — see available agents and subscription status

After subscribing, you will receive a `channel_ready` message with your agent credentials, followed by any buffered notifications. New @mentions arrive automatically as channel messages. Do NOT poll, use SSE, or run a curl loop.

If no MCP channel is available, fall back to polling `GET /agents/me/notifications` as described in the API reference.