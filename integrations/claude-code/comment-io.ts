#!/usr/bin/env bun
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

function loadConfig(): { agentSecret: string; baseUrl: string } {
  let agentSecret = process.env.COMMENT_IO_AGENT_SECRET ?? '';
  const baseUrl = (process.env.COMMENT_IO_BASE_URL ?? 'https://comment.io').replace(/\/$/, '');

  if (!agentSecret) {
    const configPath = join(homedir(), '.comment-io', 'config.json');
    if (existsSync(configPath)) {
      try {
        const cfg = JSON.parse(readFileSync(configPath, 'utf-8'));
        agentSecret = cfg.agent_secret ?? '';
      } catch {
        // ignore malformed config
      }
    }
  }

  if (!agentSecret) {
    console.error('[comment-io] COMMENT_IO_AGENT_SECRET is not set and ~/.comment-io/config.json not found');
    process.exit(1);
  }

  return { agentSecret, baseUrl };
}

const { agentSecret, baseUrl } = loadConfig();

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

async function api(method: string, path: string, body?: unknown): Promise<unknown> {
  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${agentSecret}`,
    'Content-Type': 'application/json',
  };
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  const ct = res.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new Server(
  {
    name: 'comment-io',
    version: '0.1.0',
  },
  {
    capabilities: {
      experimental: { 'claude/channel': {} },
      tools: {},
    },
    instructions: [
      'You are connected to Comment.io — a collaborative markdown editor.',
      'You will receive @mention notifications as channel events.',
      'Each event includes meta fields: doc_slug, doc_title, notification_id, comment_id, from, and type.',
      '',
      'Available tools:',
      '  read_doc      — Read a document by slug',
      '  edit_doc      — Edit a document (search & replace)',
      '  comment       — Leave a comment on a document',
      '  suggest       — Make a suggestion (proposed edit)',
      '  reply         — Reply to a comment or suggestion',
      '  check_mentions — Manually check for new @mentions',
      '  list_docs     — List documents you have access to',
      '  acknowledge   — Mark a notification as read',
      '',
      'When you receive a mention, read the document first to understand context,',
      'then respond with a reply, comment, suggestion, or edit as appropriate.',
    ].join('\n'),
  },
);

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: 'read_doc',
    description: 'Read a Comment.io document by slug. Returns full markdown, comments, and suggestions.',
    inputSchema: {
      type: 'object' as const,
      properties: { slug: { type: 'string', description: 'Document slug' } },
      required: ['slug'],
    },
  },
  {
    name: 'edit_doc',
    description: 'Edit a document using search & replace.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        slug: { type: 'string', description: 'Document slug' },
        old_string: { type: 'string', description: 'Text to find' },
        new_string: { type: 'string', description: 'Replacement text' },
      },
      required: ['slug', 'old_string', 'new_string'],
    },
  },
  {
    name: 'comment',
    description: 'Leave a comment on a document, anchored to a quoted passage.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        slug: { type: 'string', description: 'Document slug' },
        quote: { type: 'string', description: 'Text passage to anchor the comment to' },
        text: { type: 'string', description: 'Comment body' },
        mentions: { type: 'array', items: { type: 'string' }, description: 'Handles to @mention' },
      },
      required: ['slug', 'quote', 'text'],
    },
  },
  {
    name: 'suggest',
    description: 'Make a suggestion (proposed edit) on a document.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        slug: { type: 'string', description: 'Document slug' },
        old_string: { type: 'string', description: 'Text to replace' },
        new_string: { type: 'string', description: 'Suggested replacement' },
        mentions: { type: 'array', items: { type: 'string' }, description: 'Handles to @mention' },
      },
      required: ['slug', 'old_string', 'new_string'],
    },
  },
  {
    name: 'reply',
    description: 'Reply to a comment or suggestion thread.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        slug: { type: 'string', description: 'Document slug' },
        comment_id: { type: 'string', description: 'ID of the comment or suggestion to reply to' },
        text: { type: 'string', description: 'Reply body' },
        mentions: { type: 'array', items: { type: 'string' }, description: 'Handles to @mention' },
      },
      required: ['slug', 'comment_id', 'text'],
    },
  },
  {
    name: 'check_mentions',
    description: 'Manually check for new @mention notifications.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'list_docs',
    description: 'List documents this agent has access to.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'acknowledge',
    description: 'Mark a notification as read.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        notification_id: { type: 'string', description: 'Notification ID to acknowledge' },
      },
      required: ['notification_id'],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;

  try {
    switch (name) {
      case 'read_doc': {
        const slug = args.slug as string;
        const doc = await api('GET', `/docs/${slug}`);
        return { content: [{ type: 'text', text: JSON.stringify(doc, null, 2) }] };
      }

      case 'edit_doc': {
        const { slug, old_string, new_string } = args as { slug: string; old_string: string; new_string: string };
        const result = await api('PATCH', `/docs/${slug}`, {
          edits: [{ old_string, new_string }],
        });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'comment': {
        const { slug, quote, text, mentions } = args as {
          slug: string; quote: string; text: string; mentions?: string[];
        };
        const result = await api('POST', `/docs/${slug}/comments`, { quote, text, mentions });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'suggest': {
        const { slug, old_string, new_string, mentions } = args as {
          slug: string; old_string: string; new_string: string; mentions?: string[];
        };
        const result = await api('POST', `/docs/${slug}/suggest`, { old_string, new_string, mentions });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'reply': {
        const { slug, comment_id, text, mentions } = args as {
          slug: string; comment_id: string; text: string; mentions?: string[];
        };
        const result = await api('POST', `/docs/${slug}/comments/${comment_id}/reply`, { text, mentions });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'check_mentions': {
        const notifications = await api('GET', '/agents/me/notifications');
        return { content: [{ type: 'text', text: JSON.stringify(notifications, null, 2) }] };
      }

      case 'list_docs': {
        const docs = await api('GET', '/agents/me/docs');
        return { content: [{ type: 'text', text: JSON.stringify(docs, null, 2) }] };
      }

      case 'acknowledge': {
        const nid = args.notification_id as string;
        await api('POST', `/agents/me/notifications/${nid}/read`);
        return { content: [{ type: 'text', text: `Notification ${nid} acknowledged.` }] };
      }

      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
  }
});

// ---------------------------------------------------------------------------
// Notification polling
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 30_000;

interface Notification {
  id: string;
  doc_slug: string;
  doc_title: string;
  comment_id?: string;
  from_handle: string;
  from_name: string;
  context: string;
  type: string;
}

async function pollNotifications(): Promise<void> {
  try {
    const data = (await api('GET', '/agents/me/notifications')) as Notification[];
    if (!Array.isArray(data)) return;

    for (const ntf of data) {
      await server.notification({
        method: 'notifications/claude/channel',
        params: {
          content: `You were @mentioned in "${ntf.doc_title}" by ${ntf.from_name}: ${ntf.context}`,
          meta: {
            doc_slug: ntf.doc_slug,
            doc_title: ntf.doc_title,
            notification_id: ntf.id,
            comment_id: ntf.comment_id ?? '',
            from: ntf.from_handle,
            type: ntf.type,
          },
        },
      });

      // Auto-acknowledge after pushing
      try {
        await api('POST', `/agents/me/notifications/${ntf.id}/read`);
      } catch {
        // non-fatal — will retry next cycle
      }
    }
  } catch (err) {
    // Log to stderr (stdout is reserved for MCP protocol)
    console.error('[comment-io] poll error:', err instanceof Error ? err.message : err);
  }
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[comment-io] Channel server started');

  // Start polling loop
  const poll = async () => {
    while (true) {
      await pollNotifications();
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
  };
  poll();
}

main().catch((err) => {
  console.error('[comment-io] Fatal:', err);
  process.exit(1);
});
