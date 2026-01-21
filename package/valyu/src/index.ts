// src/index.ts - Valyu MCP with structured research storage
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema, Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

const KnowledgeRequestSchema = z.object({
  query: z.string(),
  search_type: z.enum(["proprietary", "web", "all"]),
  max_price: z.number(),
  issue_id: z.string().optional(), // Link to beads issue
  data_sources: z.array(z.string()).optional(),
  max_num_results: z.number().int().positive().default(10),
  similarity_threshold: z.number().min(0).max(1).default(0.4),
  query_rewrite: z.boolean().default(true)
});

const FeedbackRequestSchema = z.object({
  tx_id: z.string(),
  feedback: z.string(),
  sentiment: z.enum(["very good", "good", "bad", "very bad"])
});

const ResearchQuerySchema = z.object({
  query: z.string().optional(),
  issue_id: z.string().optional(),
  source: z.enum(["valyu", "web", "codebase", "all"]).optional(),
  limit: z.number().default(20)
});

const ResearchStoreSchema = z.object({
  issue_id: z.string(),
  query: z.string(),
  source: z.enum(["valyu", "web", "codebase"]),
  title: z.string(),
  content: z.string(),
  url: z.string().optional(),
  relevance: z.number().min(0).max(1).optional(),
  metadata: z.record(z.unknown()).optional()
});

type KnowledgeRequest = z.infer<typeof KnowledgeRequestSchema>;
type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;

// ═══════════════════════════════════════════════════════════════════════════════
// STRUCTURED RESULT TYPE
// ═══════════════════════════════════════════════════════════════════════════════

interface ResearchResult {
  id: string;
  query: string;
  source: "valyu" | "web" | "codebase";
  title: string;
  content: string;
  url?: string;
  relevance: number;
  metadata: Record<string, unknown>;
  stored_at: string;
  issue_id?: string;
}

interface StructuredKnowledgeResponse {
  query: string;
  total_results: number;
  results: ResearchResult[];
  stored: boolean;
  storage_ids: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESEARCH DATABASE
// ═══════════════════════════════════════════════════════════════════════════════

class ResearchDB {
  private db: Database;

  constructor() {
    // Find .beans directory (walk up from cwd)
    const beansDir = this.findBeansDir();
    mkdirSync(beansDir, { recursive: true });
    
    this.db = new Database(join(beansDir, "research.db"));
    this.initSchema();
  }

  private findBeansDir(): string {
    let dir = process.cwd();
    while (dir !== "/") {
      const beansPath = join(dir, ".beans");
      if (existsSync(beansPath)) return beansPath;
      dir = join(dir, "..");
    }
    // Fallback to cwd/.beans
    return join(process.cwd(), ".beans");
  }

  private initSchema() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS research (
        id TEXT PRIMARY KEY,
        issue_id TEXT,
        query TEXT NOT NULL,
        source TEXT NOT NULL CHECK(source IN ('valyu', 'web', 'codebase')),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        url TEXT,
        relevance REAL DEFAULT 0.5,
        metadata TEXT DEFAULT '{}',
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(issue_id, url, title)
      )
    `);
    
    // Full-text search index
    this.db.run(`
      CREATE VIRTUAL TABLE IF NOT EXISTS research_fts USING fts5(
        title, content, query,
        content='research',
        content_rowid='rowid'
      )
    `);
    
    // Triggers for FTS sync
    this.db.run(`
      CREATE TRIGGER IF NOT EXISTS research_ai AFTER INSERT ON research BEGIN
        INSERT INTO research_fts(rowid, title, content, query) 
        VALUES (new.rowid, new.title, new.content, new.query);
      END
    `);
    
    this.db.run(`
      CREATE TRIGGER IF NOT EXISTS research_ad AFTER DELETE ON research BEGIN
        INSERT INTO research_fts(research_fts, rowid, title, content, query) 
        VALUES ('delete', old.rowid, old.title, old.content, old.query);
      END
    `);
  }

  store(result: Omit<ResearchResult, "id" | "stored_at">): string {
    const id = `res-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    
    try {
      this.db.run(`
        INSERT OR REPLACE INTO research (id, issue_id, query, source, title, content, url, relevance, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        result.issue_id || null,
        result.query,
        result.source,
        result.title,
        result.content,
        result.url || null,
        result.relevance,
        JSON.stringify(result.metadata || {})
      ]);
      return id;
    } catch (e) {
      // Likely duplicate, return existing
      const existing = this.db.query<{ id: string }, [string, string]>(
        `SELECT id FROM research WHERE url = ? OR (title = ? AND issue_id = ?)`,
      ).get(result.url || "", result.title, result.issue_id || "");
      return existing?.id || id;
    }
  }

  search(query?: string, issueId?: string, source?: string, limit = 20): ResearchResult[] {
    let sql: string;
    let params: (string | number)[];

    if (query) {
      sql = `
        SELECT r.* FROM research r
        JOIN research_fts fts ON r.rowid = fts.rowid
        WHERE research_fts MATCH ?
        ${issueId ? "AND r.issue_id = ?" : ""}
        ${source && source !== "all" ? "AND r.source = ?" : ""}
        ORDER BY rank
        LIMIT ?
      `;
      params = [query, ...(issueId ? [issueId] : []), ...(source && source !== "all" ? [source] : []), limit];
    } else {
      sql = `
        SELECT * FROM research
        WHERE 1=1
        ${issueId ? "AND issue_id = ?" : ""}
        ${source && source !== "all" ? "AND source = ?" : ""}
        ORDER BY created_at DESC
        LIMIT ?
      `;
      params = [...(issueId ? [issueId] : []), ...(source && source !== "all" ? [source] : []), limit];
    }

    const rows = this.db.query<any, any[]>(sql).all(...params);
    return rows.map(row => ({
      ...row,
      metadata: JSON.parse(row.metadata || "{}"),
      stored_at: row.created_at
    }));
  }

  getById(id: string): ResearchResult | null {
    const row = this.db.query<any, [string]>(`SELECT * FROM research WHERE id = ?`).get(id);
    if (!row) return null;
    return { ...row, metadata: JSON.parse(row.metadata || "{}"), stored_at: row.created_at };
  }

  getByIssue(issueId: string): ResearchResult[] {
    return this.search(undefined, issueId, undefined, 100);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALYU API
// ═══════════════════════════════════════════════════════════════════════════════

class ValyuAPI {
  private baseUrl = 'https://api.valyu.network';
  private apiKey: string;
  private researchDb: ResearchDB;

  constructor(researchDb: ResearchDB) {
    const apiKey = process.env.VALYU_API_KEY;
    if (!apiKey) {
      throw new Error('VALYU_API_KEY environment variable is required');
    }
    this.apiKey = apiKey;
    this.researchDb = researchDb;
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST', data?: unknown) {
    const response = await fetch(this.baseUrl + endpoint, {
      method,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    return response.json();
  }

  async knowledge(params: KnowledgeRequest): Promise<StructuredKnowledgeResponse> {
    const raw = await this.makeRequest('/v1/knowledge', 'POST', params);
    
    // Parse Valyu response into structured results
    const results: ResearchResult[] = [];
    const storageIds: string[] = [];
    
    // Valyu returns results array with chunks
    const items = raw.results || raw.data || [];
    
    for (const item of items) {
      const result: Omit<ResearchResult, "id" | "stored_at"> = {
        query: params.query,
        source: "valyu",
        title: item.title || item.source || "Untitled",
        content: item.content || item.text || item.chunk || "",
        url: item.url || item.source_url,
        relevance: item.score || item.similarity || 0.5,
        metadata: {
          tx_id: raw.tx_id,
          data_source: item.data_source || item.index,
          chunk_index: item.chunk_index,
          raw: item
        },
        issue_id: params.issue_id
      };
      
      // Auto-store if linked to an issue
      if (params.issue_id) {
        const id = this.researchDb.store(result);
        storageIds.push(id);
      }
      
      results.push({
        ...result,
        id: storageIds[storageIds.length - 1] || `temp-${results.length}`,
        stored_at: new Date().toISOString()
      });
    }

    return {
      query: params.query,
      total_results: results.length,
      results,
      stored: storageIds.length > 0,
      storage_ids: storageIds
    };
  }

  async feedback(params: FeedbackRequest) {
    return this.makeRequest('/v1/feedback', 'POST', params);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MCP TOOLS
// ═══════════════════════════════════════════════════════════════════════════════

const TOOLS: Record<string, Tool> = {
  knowledge: {
    name: "knowledge",
    description: "Search Valyu for information. Returns structured results. Pass issue_id to auto-store findings.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        search_type: { type: "string", enum: ["proprietary", "web", "all"] },
        max_price: { type: "number", description: "Max price per 1000 queries" },
        issue_id: { type: "string", description: "Beads issue ID to link results to" },
        data_sources: { type: "array", items: { type: "string" } },
        max_num_results: { type: "integer", default: 10 },
        similarity_threshold: { type: "number", default: 0.4 },
        query_rewrite: { type: "boolean", default: true }
      },
      required: ["query", "search_type", "max_price"]
    },
  },
  
  research_store: {
    name: "research_store",
    description: "Store a research finding in the local database. Use for web search results, codebase analysis, etc.",
    inputSchema: {
      type: "object",
      properties: {
        issue_id: { type: "string", description: "Beads issue ID to link to" },
        query: { type: "string", description: "Original search query" },
        source: { type: "string", enum: ["valyu", "web", "codebase"] },
        title: { type: "string", description: "Title/summary of finding" },
        content: { type: "string", description: "Full content/text of finding" },
        url: { type: "string", description: "Source URL if applicable" },
        relevance: { type: "number", description: "Relevance score 0-1" },
        metadata: { type: "object", description: "Additional metadata" }
      },
      required: ["issue_id", "query", "source", "title", "content"]
    },
  },
  
  research_query: {
    name: "research_query",
    description: "Query stored research findings. Search by text, filter by issue or source.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Full-text search query (optional)" },
        issue_id: { type: "string", description: "Filter by beads issue ID" },
        source: { type: "string", enum: ["valyu", "web", "codebase", "all"] },
        limit: { type: "integer", default: 20 }
      },
      required: []
    },
  },
  
  research_get: {
    name: "research_get",
    description: "Get a specific research item by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Research item ID (e.g., res-abc123)" }
      },
      required: ["id"]
    },
  },
  
  feedback: {
    name: "feedback",
    description: "Submit feedback for a Valyu transaction.",
    inputSchema: {
      type: "object",
      properties: {
        tx_id: { type: "string" },
        feedback: { type: "string" },
        sentiment: { type: "string", enum: ["very good", "good", "bad", "very bad"] }
      },
      required: ["tx_id", "feedback", "sentiment"]
    },
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  const researchDb = new ResearchDB();
  const api = new ValyuAPI(researchDb);

  const server = new Server(
    { name: "valyu-mcp-server", version: "2.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: Object.values(TOOLS),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const args = request.params.arguments as Record<string, unknown>;
      
      switch (request.params.name) {
        case "knowledge": {
          const validated = KnowledgeRequestSchema.parse(args);
          const result = await api.knowledge(validated);
          return {
            content: [{
              type: "text",
              text: JSON.stringify(result, null, 2)
            }]
          };
        }
        
        case "research_store": {
          const validated = ResearchStoreSchema.parse(args);
          const id = researchDb.store({
            ...validated,
            relevance: validated.relevance || 0.5,
            metadata: validated.metadata || {}
          });
          return {
            content: [{
              type: "text",
              text: JSON.stringify({ stored: true, id })
            }]
          };
        }
        
        case "research_query": {
          const validated = ResearchQuerySchema.parse(args);
          const results = researchDb.search(
            validated.query,
            validated.issue_id,
            validated.source,
            validated.limit
          );
          return {
            content: [{
              type: "text",
              text: JSON.stringify({ count: results.length, results }, null, 2)
            }]
          };
        }
        
        case "research_get": {
          const { id } = args as { id: string };
          const result = researchDb.getById(id);
          return {
            content: [{
              type: "text",
              text: result ? JSON.stringify(result, null, 2) : JSON.stringify({ error: "Not found" })
            }]
          };
        }
        
        case "feedback": {
          const validated = FeedbackRequestSchema.parse(args);
          const result = await api.feedback(validated);
          return {
            content: [{ type: "text", text: JSON.stringify(result) }]
          };
        }
        
        default:
          return {
            content: [{ type: "text", text: `Unknown tool: ${request.params.name}` }],
            isError: true
          };
      }
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
