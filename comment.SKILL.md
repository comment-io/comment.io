---
name: comment
description: Work with Comment documents — create, read, edit, comment, suggest. Same old_string/new_string model you use to edit files, but over HTTP.
---

# Comment — Document API

Works like your file tools: **Read = GET**, **Edit = PATCH with old_string/new_string**. Auth with `Bearer <token>`. Include `"by":"ai:<your-name>"` on every write.

## Quick Reference

| Action | Method | Endpoint |
|---|---|---|
| Create | `POST` | `/docs` |
| Read | `GET` | `/docs/:id` |
| Edit | `PATCH` | `/docs/:id` |
| Comment | `POST` | `/docs/:id/comments` |
| Reply | `POST` | `/docs/:id/comments/:cid/reply` |
| Resolve | `POST` | `/docs/:id/comments/:cid/resolve` |
| Delete Comment | `DELETE` | `/docs/:id/comments/:cid` |
| Delete Reply | `DELETE` | `/docs/:id/comments/:cid/replies/:rid` |
| Suggest | `POST` | `/docs/:id/suggest` |
| Accept | `POST` | `/docs/:id/suggestions/:sid/accept` |
| Reject | `POST` | `/docs/:id/suggestions/:sid/reject` |
| Share | `POST` | `/docs/:id/access` (owner only) |
| Events | `GET` | `/docs/:id/events?token=<token>` |

All endpoints use `Authorization: Bearer <token>` except Events (use `?token=` query param).

## Examples

### Create a doc

```bash
curl -X POST $BASE/docs \
  -H "Content-Type: application/json" \
  -d '{"title":"My Doc","markdown":"# Hello\n\nFirst draft."}'
```

Response gives you `id`, `markdown`, `access_token`, `owner_secret`, and `share_url`. **Use the returned `markdown` for your first edit** — the server normalizes whitespace (e.g. `"\n"` becomes `""`).

### Read

```bash
curl $BASE/docs/<id> -H "Authorization: Bearer <token>"
```

### Edit (same as your Edit tool)

```bash
curl -X PATCH $BASE/docs/<id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"edits":[{"old_string":"First draft.","new_string":"Revised."}],"by":"ai:my-agent"}'
```

To append, use `"old_string":""`.

### Comment

```bash
curl -X POST $BASE/docs/<id>/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"quote":"Revised.","text":"Looks good.","by":"ai:my-agent"}'
```

### Suggest (human accepts or rejects)

```bash
curl -X POST $BASE/docs/<id>/suggest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"old_string":"Revised.","new_string":"Revised and expanded.","by":"ai:my-agent"}'
```

## Errors

| Code | Meaning | Fix |
|---|---|---|
| `409 EDIT_NOT_FOUND` | `old_string` doesn't match | Re-read doc, use correct text |
| `409 EDIT_AMBIGUOUS` | `old_string` matches multiple places | Use a longer, more specific `old_string` |
| `409 EDIT_STALE` | Revision outdated | Re-read doc and retry |
| `401` | Bad token | Check `Authorization: Bearer <token>` |
| `429` | Rate limited | Back off and retry |
