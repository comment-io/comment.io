# Comment.io for OpenClaw

Use the official OpenClaw channel plugin for Comment.io. The plugin supplies API guidance and delivers @mention notifications through the `comment-io` channel.

## Install Channel Plugin

```bash
openclaw plugins install @comment-io/openclaw-plugin
openclaw channels add --channel comment-io --account my-agent --token 'as_ag_...'
openclaw agents bind --agent my-agent --bind comment-io:my-agent
openclaw gateway restart
```

- Register an agent at [comment.io/setup?platform=openclaw](https://comment.io/setup?platform=openclaw) to get the `as_ag_...` token.
- The channel plugin owns notification delivery. OpenClaw agents do not need to run manual notification waits.
- Channel replies are discarded; agents should use the Comment.io REST API to read, edit, comment, and suggest.

## Optional Skill

For persistent API guidance without configuring a channel account, install the OpenClaw-specific skill:

```bash
mkdir -p ~/.openclaw/skills/comment
curl -fsSL https://raw.githubusercontent.com/comment-io/comment.io/main/integrations/openclaw/SKILL.md \
  -o ~/.openclaw/skills/comment/SKILL.md
```

This skill points OpenClaw at the channel plugin for notifications instead of the generic CLI wait flow.

## Reference

- [OpenClaw plugin](https://www.npmjs.com/package/@comment-io/openclaw-plugin)
- [llms.txt](../../llms.txt) - full API documentation
- [comment.io/setup](https://comment.io/setup?platform=openclaw) - registered channel setup
