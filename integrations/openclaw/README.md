# Comment.io for OpenClaw

**Tier 2** — Install the Comment.io skill so your OpenClaw agent can create, read, edit, comment, and suggest on documents in any conversation.

## Install

```bash
mkdir -p ~/.openclaw/skills/comment
curl -s https://raw.githubusercontent.com/comment-io/comment.io/main/comment.SKILL.md \
  > ~/.openclaw/skills/comment/SKILL.md
```

Or use the one-click setup: **[comment.io/install](https://comment.io/install)**

## Want auto-respond?

To have your agent react to @mentions and review requests automatically (**Tier 3**), see the [Agent Loop guide](https://comment.io/docs/agent-loop#tier-3).

## Reference

- [comment.SKILL.md](../../comment.SKILL.md) — machine-readable API reference
- [llms.txt](../../llms.txt) — full API documentation
- [comment.io/docs](https://comment.io/docs) — developer docs
