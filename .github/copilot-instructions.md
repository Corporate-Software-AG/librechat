# LibreChat Fork — ASKIA Customizations

> **This is a soft fork of [danny-avila/LibreChat](https://github.com/danny-avila/LibreChat)** maintained by Corporate-Software-AG for the ASKIA project.

## Fork Philosophy

- **Minimal changes**: Only modify files when absolutely necessary
- **Well-documented**: Every change is documented here with rationale
- **Upstream-compatible**: Changes are isolated to avoid merge conflicts
- **`main` branch**: Tracks upstream `danny-avila/LibreChat` (do not commit here)
- **`askia` branch**: Contains all ASKIA customizations (this branch)

---

## Branch Strategy

```
main          ← Syncs with upstream danny-avila/LibreChat (keep clean!)
  │
  └── askia   ← ASKIA customizations (make changes here)
```

### Syncing with Upstream

```bash
# Add upstream remote (one time)
git remote add upstream https://github.com/danny-avila/LibreChat.git

# Sync main with upstream
git checkout main
git pull upstream main
git push origin main

# Rebase askia onto updated main
git checkout askia
git rebase main
# Resolve any conflicts in the ~11 customized files
git push origin askia --force-with-lease
```

---

## Customized Files (8 total)

> **Note:** As of Feb 2026, the **Cosmos DB compatibility patches have been removed**. Askia Light now uses containerized MongoDB 8.0 which supports native `$bitsAllSet` and `$bit` operators. The 3 files previously patched for Cosmos DB (`aclEntry.ts`, `PermissionService.js`, `accessControlService.ts`) have been reverted to upstream code.

### 1. Local Inference Routing (6 files)

Enables browser-to-localhost routing for Apple Intelligence via the askia-local-macos companion app.

| File | Change |
|------|--------|
| `packages/data-provider/src/config.ts` | Add `localInference`, `localBaseURL`, `temporaryChat` fields to `endpointSchema` |
| `packages/data-provider/src/types.ts` | Add TypeScript types for new endpoint fields |
| `packages/data-provider/src/custom/config.ts` | Wire new fields in custom endpoint config |
| `client/src/hooks/SSE/useLocalSSE.ts` | **NEW FILE**: Browser-to-localhost SSE hook |
| `client/src/hooks/SSE/useAdaptiveSSE.ts` | **NEW FILE**: Three-way routing: local → assistants → resumable |
| `client/src/routes/ChatRoute.tsx` | Auto-enable temporary chat for `temporaryChat: true` endpoints |

**Endpoint config example** (`librechat.yaml`):
```yaml
endpoints:
  custom:
    - name: "Apple Intelligence"
      localInference: true
      localBaseURL: "http://127.0.0.1:11434"
      temporaryChat: true  # Auto-enables temporary chat
      models:
        default: ["apple-on-device"]
```

### 2. Branding Customizations (2 files)

| File | Change |
|------|--------|
| `client/src/components/Chat/Input/Files/ApiKeyDialog.tsx` | Replace "code.librechat.ai" link text with custom service description |
| `client/src/components/Nav/AccountSettings.tsx` | Add Privacy Policy / Terms of Service links to user menu |

---

## Surrounding Architecture

This LibreChat fork is deployed as part of **askia-light**, a comprehensive AI chat platform:

```
┌─────────────────────────────────────────────────────────────────────┐
│  askia-light (parent repo)                                          │
│  ├── config/librechat.yaml     # Mounted to container               │
│  ├── config/branding/          # Assets, CSS, i18n overrides        │
│  ├── services/                 # Python microservices                │
│  │   ├── askia-agents/         # Foundry Agents bridge               │
│  │   ├── askia-web/            # Web scraper + reranker              │
│  │   ├── askia-code/           # Code interpreter                    │
│  │   ├── askia-rag/            # RAG API + MCP server                │
│  │   └── askia-wiki/           # Knowledge base MCP server           │
│  ├── infra/                    # Azure Bicep infrastructure          │
│  ├── scripts/                                                        │
│  │   └─ apply-branding.sh     # Injects assets at build time        │
│  └── librechat/                # ← THIS FORK (submodule)             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  askia-local-macos (companion app)                                   │
│  ├── SwiftUI native app                                              │
│  ├── Apple Intelligence (Foundation Models framework)               │
│  └── HTTP server at 127.0.0.1:11434                                  │
│      ↑                                                               │
│      └── useLocalSSE.ts routes requests here when localInference=true│
└─────────────────────────────────────────────────────────────────────┘
```

---

## Critical Implementation Notes

### React Rules of Hooks (ChatRoute.tsx)

The `setDefaultTemporary` hook and its `useEffect` must be called **unconditionally** at the component top level — before any conditional returns. React hooks cannot be called inside conditional blocks.

```tsx
// ✅ CORRECT: Hooks at top level
const ChatRoute = () => {
  const [conversation] = useRecoilState(store.conversation);
  const setDefaultTemporary = useSetRecoilState(store.defaultTemporaryChat);
  
  useEffect(() => {
    // Auto-enable temporary chat for endpoints with temporaryChat: true
    if (conversation?.endpoint && conversation?.endpointConfig?.temporaryChat) {
      setDefaultTemporary(true);
    }
  }, [conversation?.endpoint, conversation?.endpointConfig?.temporaryChat, setDefaultTemporary]);

  if (!conversation) return <Loading />; // Conditional return AFTER hooks
  // ...
};

// ❌ WRONG: Hook inside conditional
const ChatRoute = () => {
  const [conversation] = useRecoilState(store.conversation);
  if (!conversation) return <Loading />;
  
  const setDefaultTemporary = useSetRecoilState(store.defaultTemporaryChat); // CRASH!
};
```

### Cosmos DB Bitwise Replacement

The `$in` replacement is mathematically equivalent to `$bitsAllSet`:

```typescript
// MongoDB: { permission: { $bitsAllSet: 5 } }  // Finds docs where bits 0 and 2 are set
// Cosmos:  { permission: { $in: [5, 7, 13, 15] } }  // All values with bits 0+2 set
```

### useLocalSSE vs useSSE

| Hook | Use Case |
|------|----------|
| `useLocalSSE` | Browser → `localhost:11434` (Apple Intelligence) |
| `useSSE` | Browser → Backend → Azure Assistants |
| `useResumableSSE` | Browser → Backend → Custom endpoints |

`useAdaptiveSSE` automatically routes based on:
1. `localInference: true` in endpoint config → `useLocalSSE`
2. `assistants`/`azureAssistants` endpoint → `useSSE`
3. Default → `useResumableSSE`

---

## Testing After Changes

```bash
# Build and test locally
cd librechat
npm install
npm run frontend:dev  # Test client changes
npm run backend:dev   # Test API changes

# Build Docker image
docker build -t librechat-local:test .

# Run with askia-light (from parent directory)
cd ..
docker compose -f librechat/docker-compose.yml -f librechat/docker-compose.override.yml up -d
```

---

## Commit Convention

Use conventional commits with scope:

```
feat(cosmos): add Azure Cosmos DB compatibility helpers
feat(local-inference): add browser-to-localhost SSE routing
feat(branding): add Privacy/Terms links to user menu
docs: add copilot-instructions.md
```

---

## When Updating This Fork

1. **Check upstream changes** to the 11 customized files before rebasing
2. **Resolve conflicts carefully** — our changes are intentional
3. **Test locally** after rebase before pushing
4. **Update this file** if file paths or change patterns evolve
