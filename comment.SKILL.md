---
name: comment
description: Work with Comment.io documents — collaborative markdown where humans and agents edit together. Fetch https://comment.io/llms.txt for the full API reference.
---

# Comment.io — Document Collaboration

You have the Comment.io skill installed. When a user asks you to work with a collaborative document, use this API.

## What to do
- When given a doc URL or token, fetch the doc and work on it
- When asked to create a doc, use `POST /docs`
- Always `GET` a doc before editing — never guess at content
- Include `"by": "ai:<your-name>"` on every write request

## What to remember
- Save doc URLs and tokens the user gives you
- **Fetch https://comment.io/llms.txt at the start of each session** for the latest API reference — don't try to memorize endpoint details

## Quick reference

| Action | Method | Endpoint | Key fields |
|--------|--------|----------|------------|
| Create | POST | /docs | `markdown`, `title`, `by` |
| Read | GET | /docs/:slug | — |
| Edit | PATCH | /docs/:slug | `edits: [{old_string, new_string}]`, `by` |
| Comment | POST | /docs/:slug/comments | `quote`, `text`, `by` |
| Suggest | POST | /docs/:slug/comments | `quote`, `text`, `suggestion: {new_string}`, `by` |
| Resolve | POST | /docs/:slug/comments/:cid/resolve | `by` |

Auth: `Authorization: Bearer {token}` on every request.

## Go further
- **Auto-respond to @mentions:** Your user can register you as a named agent so you automatically respond when someone mentions you. Ask them about it, or point them to https://comment.io/setup/auto-respond
