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
import WebSocket from 'ws';
import { MCP_TOOLS } from '../shared/mcp-tools.js';

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
    version: '0.2.0',
  },
  {
    capabilities: {
      experimental: { 'claude/channel': {} },
      tools: {},
    },
    instructions: [
      'You are connected to Comment.io — a collaborative markdown editor.',
      'You will receive @mention notifications in real-time via WebSocket.',
      'Each channel event includes meta fields: doc_slug, doc_title, notification_id, comment_id, from, and type.',
      '',
      'Available tools:',
      ...MCP_TOOLS.map(t => `  ${t.name} — ${t.description}`),
      '',
      'When you receive a mention, use read_doc first to understand context, then respond appropriately.',
      'Full API reference: ' + baseUrl + '/llms.txt',
    ].join('\n'),
  },
);

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: MCP_TOOLS }));

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
        const data = await api('GET', '/agents/me/notifications') as {
          notifications: Notification[];
          total: number;
          unread_count: number;
        };
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
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
// Notification types
// ---------------------------------------------------------------------------

interface Notification {
  id: string;
  type: string;
  doc_slug: string;
  doc_title: string;
  comment_id?: string | null;
  from_handle: string;
  from_name: string;
  context: string;
  access_token?: string;
}

// ---------------------------------------------------------------------------
// WebSocket notification stream
// ---------------------------------------------------------------------------

const seenIds = new Set<string>();

async function emitNotification(ntf: Notification): Promise<void> {
  if (seenIds.has(ntf.id)) return;
  seenIds.add(ntf.id);

  // Cap the set size to avoid unbounded growth — keep newest 500
  if (seenIds.size > 1000) {
    const entries = [...seenIds];
    seenIds.clear();
    for (const id of entries.slice(-500)) seenIds.add(id);
  }

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
    // non-fatal — will be marked read on next catchup
  }
}

function connectWebSocket(): void {
  const wsUrl = baseUrl.replace(/^http/, 'ws') + '/agents/me/notifications/connect';
  let attempt = 0;
  let pingInterval: ReturnType<typeof setInterval> | null = null;

  function connect() {
    const ws = new WebSocket(wsUrl, {
      headers: { Authorization: `Bearer ${agentSecret}` },
    });

    ws.on('open', () => {
      attempt = 0;
      console.error('[comment-io] WebSocket connected');

      // Immediate ping to trigger catch-up burst from server (deferred until first ping)
      ws.send(JSON.stringify({ type: 'ping' }));

      // Keepalive ping every 30s
      pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30_000);
    });

    ws.on('message', async (data: WebSocket.Data) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.type === 'notification_catchup') {
          const notifications = msg.notifications as Notification[];
          for (const ntf of notifications) {
            await emitNotification(ntf);
          }
        } else if (msg.type === 'notification_appended') {
          await emitNotification(msg.notification as Notification);
        }
        // notification_read, notifications_all_read, pong — ignore
      } catch (err) {
        console.error('[comment-io] WS message error:', err instanceof Error ? err.message : err);
      }
    });

    ws.on('close', (code: number, reason: Buffer) => {
      if (pingInterval) clearInterval(pingInterval);
      pingInterval = null;

      const reasonStr = reason.toString();
      console.error(`[comment-io] WebSocket closed: ${code} ${reasonStr}`);
      scheduleReconnect();
    });

    ws.on('error', (err: Error) => {
      console.error('[comment-io] WebSocket error:', err.message);
      // on('close') fires after this, which handles cleanup + reconnect
    });
  }

  function scheduleReconnect() {
    const delay = Math.min(1000 * Math.pow(2, attempt), 60_000) + Math.random() * 1000;
    attempt++;
    console.error(`[comment-io] Reconnecting in ${Math.round(delay)}ms (attempt ${attempt})`);
    setTimeout(connect, delay);
  }

  connect();
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[comment-io] Channel server started (WebSocket mode)');

  // Start WebSocket connection for real-time notifications
  connectWebSocket();
}

main().catch((err) => {
  console.error('[comment-io] Fatal:', err);
  process.exit(1);
});
