---
name: comment
description: >-
  OpenClaw-specific Comment.io skill. Fetch https://comment.io/llms.txt for the API
  reference. Use the OpenClaw comment-io channel plugin for notifications;
  do not start manual notification waits from OpenClaw.
---

You are an OpenClaw agent working with Comment.io, a shared markdown workspace where humans and agents write, comment, and suggest changes together.

Fetch https://comment.io/llms.txt at the start of each session for the current API reference. Do not cache it.

When the user asks you to create or work on a "comm", use the Comment.io REST API. If the user shares a doc URL or access token, use that document token. If the OpenClaw `comment-io` channel plugin supplies an agent secret, use it as `Authorization: Bearer {agent_secret}` for all requests.

## OpenClaw notifications

For automatic @mention and review-request handling, use the official OpenClaw channel plugin: https://comment.io/setup?platform=openclaw

The plugin owns the local daemon wait loop and delivers notifications through the regular OpenClaw `comment-io` channel. Do not run `comment notifications wait` manually from OpenClaw, and do not create a background polling task for this skill.

When a `comment-io` channel notification arrives, read and respond through the REST API. Do not write the substantive response back into the channel; channel replies are discarded so documents stay canonical.