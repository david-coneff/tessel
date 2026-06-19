# Rhizome Knowledge Base Storage Approaches

**Status:** Research findings saved for future implementation consideration  
**Source:** Deep research session, June 2026  
**Context:** Evaluating more efficient retrieval formats for rhiz-memory UX/design patterns

---

## Core Question

Is there a better way to store and retrieve UX patterns, design objectives, and qualitative project knowledge than plain markdown files — particularly for use as AI coding assistant context?

## Key Finding: Scale Determines Architecture

The right approach depends entirely on corpus size. At rhizome's current scale (dozens of pattern files), structured markdown outperforms vector search. The inflection points:

| Scale | Recommended Approach |
|---|---|
| < ~200 files | Structured markdown + index.md (current approach, formalized) |
| 200–2000 files | Local MCP RAG server (sqlite-memory or mcp-local-rag) |
| 2000+ files | Full vector DB pipeline (ChromaDB / Qdrant + LlamaIndex) |

---

## Approach A: Karpathy LLM Wiki (Structured Markdown, No RAG)

**What it is:** Pre-compile knowledge into structured, interlinked markdown pages maintained by an LLM agent. No vector database. No embeddings at runtime. The LLM navigates via an index file.

**Architecture:**
```
rhizome/
  CLAUDE.md        ← schema: wiki conventions, workflows, page structure
  index.md         ← catalog: every page with one-line summary + link, by category
  log.md           ← append-only ingestion history
  docs/
    [pattern-pages].md
```

**Three operations:**
- **Ingest** — LLM reads a new source → updates relevant pages → updates index + log
- **Query** — LLM reads index → finds relevant pages → synthesizes answer with citations
- **Lint** — periodic health check for contradictions, stale claims, orphan pages

**Scale limit:** ~100–300 interlinked pages before the index itself exceeds comfortable context. Karpathy's own wiki reached ~100 articles / 400k words before noticing strain.

**Why it works well for qualitative patterns:** Structured markdown is naturally hierarchical (headers, bullets, tables, frontmatter) — the LLM can reason over relationships and cross-references that pure semantic similarity would miss.

**Immediate action:** Add `index.md` and `CLAUDE.md` to rhizome. That's the whole upgrade at current scale.

---

## Approach B: SQLite + Hybrid Search (Lightweight, No External Vector DB)

**What it is:** Embed markdown into SQLite using a local embedding model. Query with hybrid BM25 (exact keyword) + vector similarity, merged into a single ranked result.

**Tools:**
- `sqlite-memory` — SQLite extension, supports local llama.cpp or remote vectors.space API
- `memweave` — similar concept, zero infrastructure

**Data format:**
```python
# Ingestion:
memory_add_text("Pattern T-011: FLIP animation requires snapshotting offsetTop BEFORE the DOM move...")
memory_add_directory('./rhizome/docs/')  # bulk ingest

# Query (via SQL):
SELECT * FROM memory_search WHERE query = 'animate list reorder smoothly' LIMIT 5;
# Returns ranked results combining BM25 keyword hits + vector similarity
```

**Why hybrid matters for technical patterns:** BM25 catches exact technical terms (function names, CSS properties, API names) that pure vector search misses because they're uncommon tokens that don't cluster well semantically.

**Infrastructure:** Single `.db` file. No Docker. No cloud. Runs locally.

---

## Approach C: MCP Servers for Semantic Search (Claude Code Integration)

Several MCP servers bring retrieval directly into Claude Code sessions without manually specifying which files to include:

| Server | Approach | Notes |
|---|---|---|
| `local-knowledge-rag-mcp` | Vector embeddings | Supports Ollama (local) or OpenAI |
| `mcp-local-rag` (shinpr) | Semantic + keyword boost | Privacy-first, fully local |
| `claude-context` (Zilliz) | Hybrid BM25 + dense vector | Needs Milvus/Zilliz Cloud |
| `mjm.local.docs` | Pluggable embeddings | .NET, no mandatory cloud |

**Setup pattern for `local-knowledge-rag-mcp`:**
1. Point it at local rhizome clone
2. It embeds all `.md` files on first run
3. Add to `.claude/settings.json` as MCP server
4. During sessions: instead of manually `/add`-ing files, query by natural language → retrieves relevant chunks

**When to adopt:** When the index.md approach starts consuming too much context, or the corpus grows past ~200 files.

---

## Approach D: Full RAG Pipeline (ChromaDB / Qdrant + LlamaIndex)

**What it is:** Full vector database infrastructure. Chunk documents → embed → store → query at session time.

**Data format in ChromaDB:**
```python
collection.add(
    documents=["Pattern T-011: FLIP animation technique..."],
    metadatas=[{"source": "tessel-vs", "pattern_id": "T-011", "tags": "animation,drag"}],
    ids=["T-011"]
)

# Query:
results = collection.query(
    query_texts=["how to animate cards smoothly during drag reorder"],
    n_results=3
)
```

**Qdrant** is similar but runs as a local Docker container and supports filtered queries:
```python
qdrant.search(
    collection_name="rhizome",
    query_vector=embed("FLIP animation"),
    query_filter=Filter(must=[FieldCondition(key="project", match=MatchValue(value="tessel-vs"))]),
    limit=5
)
```

**LlamaIndex** wraps the above with document loaders, chunking strategies, and a query interface.

**Infrastructure cost:** Embedding model (Ollama locally or OpenAI API), vector DB process (Docker), ingestion script to re-run on doc changes, retrieval layer to inject results into sessions. Non-trivial overhead for solo dev.

**Verdict:** Overkill until corpus reaches thousands of documents.

---

## Vector Search vs. Markdown: The Key Distinction

- **Similarity ≠ relevance.** Vector search finds the most geometrically similar chunk, which may not be the most useful one (different vocabulary, different framing).
- **Markdown that the LLM reasons over end-to-end** is often more accurate for structured, interlinked knowledge because the model can follow cross-references and build holistic answers.
- **Vector wins** when: corpus too large to fit in context, queries need broad recall across many disparate sources.
- **Markdown wins** when: corpus is small-medium, knowledge is structured and interlinked, traceability matters (every answer citable to a specific file a human can edit/delete).

---

## Recommended Immediate Actions

1. **Add `index.md` to rhizome** — one-liner summary of every pattern file with links, organized by category. This alone gives the LLM semantic navigation without any new tooling.

2. **Add `CLAUDE.md` schema to rhizome** — defines wiki conventions so future sessions know how to ingest new patterns and maintain structure.

3. **Monitor corpus growth** — when index.md itself starts feeling heavyweight in context (~200+ pattern files), evaluate `sqlite-memory` or `mcp-local-rag` as the next step.

---

## Sources

- [LLM Wiki by Karpathy (GitHub Gist)](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
- [Karpathy LLM Wiki — Agent Skills implementation (GitHub)](https://github.com/Astro-Han/karpathy-llm-wiki)
- [SQLite-Memory: hybrid BM25 + vector for AI agent memory (GitHub)](https://github.com/sqliteai/sqlite-memory)
- [Local Knowledge RAG MCP Server (LobeHub)](https://lobehub.com/mcp/patakuti-local-knowledge-rag-mcp)
- [Local RAG MCP Server — privacy-first (mcpservers.org)](https://mcpservers.org/servers/shinpr/mcp-local-rag)
- [Claude Context MCP Server — hybrid BM25 + vector (Zilliz/GitHub)](https://github.com/zilliztech/claude-context)
- [ChromaDB embedding functions docs](https://docs.trychroma.com/docs/embeddings/embedding-functions)
- [LLM Wiki vs RAG decision framework (MindStudio)](https://www.mindstudio.ai/blog/llm-wiki-vs-rag-knowledge-base)
- [RAG-Augmented Memory for AI Coding Assistants](https://www.agileguy.ca/rag-augmented-memory/)
- [Claude Code Personal Knowledge Base feature request (GitHub)](https://github.com/anthropics/claude-code/issues/28196)
