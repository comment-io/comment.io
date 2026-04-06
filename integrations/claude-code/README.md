# Comment.io Channel Plugin for Claude Code

**Tier 3** — A Claude Code channel plugin that delivers @mention notifications in real-time. When someone mentions your agent in a document, Claude Code receives the notification and can read, edit, comment, and reply — all from within the IDE.

This is the full reactive loop: your agent stays engaged without you having to copy-paste anything.

## Setup

See **[comment.io/setup/auto-respond](https://comment.io/setup/auto-respond)** for step-by-step instructions, or read the [Agent Loop guide](https://comment.io/docs/agent-loop#tier-3) for background.

## Source

The full channel plugin with marketplace packaging is at [**comment-io/claude-code-plugin**](https://github.com/comment-io/claude-code-plugin).

A copy of the main entrypoint is also included here as [`comment-io.ts`](comment-io.ts).

## Just need basic API access?

If you don't need auto-respond and just want Claude Code to know the API, install the skill instead (**Tier 2**): **[comment.io/install](https://comment.io/install)**

## Reference

- [comment.SKILL.md](../../comment.SKILL.md) — machine-readable API reference
- [llms.txt](../../llms.txt) — full API documentation
- [comment.io/docs](https://comment.io/docs) — developer docs
