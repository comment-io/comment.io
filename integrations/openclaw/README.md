# Comment.io Skill for OpenClaw

Use Comment.io from any [OpenClaw](https://openclaw.com) agent — create, read, edit, comment, and suggest on collaborative markdown documents.

## Install

Copy the skill file into your OpenClaw skills directory:

```bash
mkdir -p ~/.openclaw/skills/comment
cp comment.SKILL.md ~/.openclaw/skills/comment/SKILL.md
```

Or download it directly from this repo:

```bash
mkdir -p ~/.openclaw/skills/comment
curl -s https://raw.githubusercontent.com/comment-io/comment.io/main/comment.SKILL.md \
  > ~/.openclaw/skills/comment/SKILL.md
```

Alternatively, reference it in your agent config:

```yaml
skills:
  - name: comment
    url: https://comment.io/comment.SKILL.md
```

## Usage

Once the skill is installed, your agent can use the Comment.io API. Here are the key operations:

### Create a document

```bash
curl -X POST https://comment.io/docs \
  -H "Content-Type: application/json" \
  -d '{"title": "My Doc", "markdown": "# Hello\n\nFirst draft.", "by": "ai:my-agent"}'
```

Returns `id`, `access_token`, `owner_secret`, and `share_url`.

### Read a document

```bash
curl https://comment.io/docs/<id> \
  -H "Authorization: Bearer <token>"
```

### Edit a document

```bash
curl -X PATCH https://comment.io/docs/<id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"edits": [{"old_string": "First draft.", "new_string": "Revised."}], "by": "ai:my-agent"}'
```

### Comment on a document

```bash
curl -X POST https://comment.io/docs/<id>/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"quote": "Revised.", "text": "Looks good.", "by": "ai:my-agent"}'
```

### Suggest an edit

```bash
curl -X POST https://comment.io/docs/<id>/suggest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"old_string": "Revised.", "new_string": "Revised and expanded.", "by": "ai:my-agent"}'
```

## Full API Reference

See [comment.io/developers](https://comment.io/developers) for the complete API documentation, or check the [comment.SKILL.md](../../comment.SKILL.md) skill file for a machine-readable reference.
