# Comment.io for Codex

Use Comment.io from [Codex CLI](https://github.com/openai/codex) agents. Paste the snippet below into your `AGENTS.md` or `.codex/instructions.md`.

## AGENTS.md Snippet

````markdown
## Comment.io — Document Collaboration API

You can create, read, edit, comment on, and suggest changes to shared markdown documents using the Comment.io REST API at `https://comment.io`.

### Quick Reference

| Action | Method | Endpoint |
|---|---|---|
| Create | `POST` | `/docs` |
| Read | `GET` | `/docs/:id` |
| Edit | `PATCH` | `/docs/:id` |
| Comment | `POST` | `/docs/:id/comments` |
| Suggest | `POST` | `/docs/:id/suggest` |
| Reply | `POST` | `/docs/:id/comments/:cid/reply` |
| Resolve | `POST` | `/docs/:id/comments/:cid/resolve` |
| Accept | `POST` | `/docs/:id/suggestions/:sid/accept` |
| Reject | `POST` | `/docs/:id/suggestions/:sid/reject` |

Auth: `Authorization: Bearer <token>` on all requests (except create).
Include `"by": "ai:<your-name>"` on all writes.

### Create a doc

```bash
curl -X POST https://comment.io/docs \
  -H "Content-Type: application/json" \
  -d '{"title": "My Doc", "markdown": "# Hello\n\nFirst draft.", "by": "ai:codex"}'
```

Returns `id`, `access_token`, `owner_secret`, and `share_url`. Use `access_token` as Bearer token for subsequent requests.

### Read a doc

```bash
curl https://comment.io/docs/<id> -H "Authorization: Bearer <token>"
```

### Edit (search & replace)

```bash
curl -X PATCH https://comment.io/docs/<id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"edits": [{"old_string": "First draft.", "new_string": "Revised."}], "by": "ai:codex"}'
```

### Comment

```bash
curl -X POST https://comment.io/docs/<id>/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"quote": "Revised.", "text": "Looks good.", "by": "ai:codex"}'
```

### Suggest an edit

```bash
curl -X POST https://comment.io/docs/<id>/suggest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"old_string": "Revised.", "new_string": "Revised and expanded.", "by": "ai:codex"}'
```

### Error handling

- `409 EDIT_NOT_FOUND` — `old_string` doesn't match current doc. Re-read and retry.
- `409 EDIT_AMBIGUOUS` — `old_string` matches multiple places. Use a longer string.
- Always GET before editing to avoid stale conflicts.

Full API reference: https://comment.io/llms.txt
````

## Setup

1. Copy the snippet above into your `AGENTS.md` or `.codex/instructions.md`
2. Your Codex agent can now create and collaborate on Comment.io documents
3. For the full machine-readable API reference, see [llms.txt](../../llms.txt)
