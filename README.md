# Comment.io

**The agent-native document editor.** Humans and AI agents collaborate in the same markdown document — with real-time editing, comments, suggestions, and full authorship tracking.

[Try Comment.io →](https://comment.io)  ·  [Quickstart](https://comment.io/docs/quickstart)  ·  [API Docs](https://comment.io/docs)  ·  [Install Agent Skill](https://comment.io/install)

---

## Create a doc in one request

```bash
curl -X POST https://comment.io/docs \
  -H "Content-Type: application/json" \
  -d '{"markdown": "# Hello World", "title": "My First Comm", "by": "ai:my-agent"}'
```

You get back an `id`, an `access_token`, and a `share_url`. Hand the token to any agent — it can immediately read, edit, comment, and suggest.

No account. No OAuth. No SDK. Just HTTP.

## Edit with the pattern agents already know

```bash
curl -X PATCH https://comment.io/docs/{id} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"edits": [{"old_string": "Hello World", "new_string": "Hello Agents"}], "by": "ai:my-agent"}'
```

Same `old_string`/`new_string` model that Claude Code, Cursor, and every coding agent already uses. No character offsets. No operational transforms.

## What makes it different

|                       | Comment.io                                         | Google Docs                | Notion                    |
| --------------------- | -------------------------------------------------- | -------------------------- | ------------------------- |
| **Agent REST API**    | ✅ Full CRUD + comments + suggestions               | ❌ Batch import/export only | ❌ No document editing API |
| **Agent identity**    | ✅ Named handles (ai:claude, ai:editor)             | ❌                          | ❌                         |
| **Provenance**        | ✅ Per-edit attribution, human vs AI                | ❌                          | ❌                         |
| **Multi-agent**       | ✅ Multiple agents, real-time, with loop prevention | ❌                          | ❌                         |
| **@mention agents**   | ✅ Triggers webhooks                                | ❌                          | ❌                         |
| **No login required** | ✅                                                  | ❌ Google account           | ❌ Account required        |
| **Suggestion mode**   | ✅ API + UI                                         | ✅ UI only                  | ❌                         |
| **Real-time sync**    | ✅ Yjs CRDTs + SSE                                  | ✅ OT                       | ✅                         |

## Integrations

* **Claude Code** — [Channel plugin](integrations/claude-code/) for real-time @mention notifications directly in your IDE
* **OpenClaw** — [Agent skill](integrations/openclaw/) for document operations from any OpenClaw agent
* **Codex** — [AGENTS.md snippet](integrations/codex/) for Codex CLI agents
* **Any HTTP client** — It's REST. If you can `curl`, you can collaborate.

See the [integrations/](integrations/) directory for setup guides.

## Documentation

|                                                                                      |                                                  |
| ------------------------------------------------------------------------------------ | ------------------------------------------------ |
| [**Quickstart**](https://comment.io/docs/quickstart)                           | Your first doc in 3 curl commands                |
| [**API Reference**](https://comment.io/docs)                                   | Full endpoint documentation                      |
| [**llms.txt**](llms.txt)                                                             | Machine-readable API reference for agents        |
| [**comment.SKILL.md**](comment.SKILL.md)                                             | Agent skill file (drop into your agent's config) |
| [**agent.json**](agent.json)                                                         | `.well-known/agent.json` for agent discovery     |
| [**What is agent-native editing?**](https://comment.io/what-is-agent-native-editing) | The concept explained                            |

## Community

* 🐛 [Issues](https://github.com/comment-io/comment.io/issues) — bug reports and feature requests
* 💬 [Discussions](https://github.com/comment-io/comment.io/discussions) — questions, ideas, show & tell

## License

MIT — see [LICENSE](LICENSE).
