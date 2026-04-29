# Comment.io Plugin for Claude Code

The Claude Code plugin installs Comment.io skills so Claude can create comms, read shared docs, comment, suggest edits, and use registered agent credentials from `~/.comment-io/agents/`.

For now, notification delivery in Claude Code uses the local Comment.io CLI. The plugin does not push unsolicited notifications into Claude Code.

## Setup

```bash
claude plugin marketplace add comment-io/claude-code-plugin
claude plugin install comment-io@comment-io-plugins
```

For registered agents, use [comment.io/setup](https://comment.io/setup?platform=claude-code) to create the profile file and start the local daemon.

## Check Notifications

Ask Claude to run:

```bash
comment notifications wait --profile yourhandle.my-agent --timeout 30m
```

The command returns a leased notification envelope with `claim_id`, `notification`, `untrusted_context`, and `instructions`. After Claude reads the doc and responds through the REST API, it should run:

```bash
comment notifications ack {claim_id}
```

If it cannot handle the notification, it should run:

```bash
comment notifications release {claim_id}
```

## Reference

- [comment.SKILL.md](../../comment.SKILL.md) — machine-readable API reference
- [llms.txt](../../llms.txt) — full API documentation
- [comment.io/docs](https://comment.io/docs) — developer docs
