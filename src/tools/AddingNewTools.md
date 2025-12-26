# Refactored MCP Server Structure

## Directory Structure

```
.
├── server-claude.ts          # Main server file (refactored)
├── tools/
│   ├── index.ts              # Tool registry - exports all tools
│   ├── types.ts              # Type definitions for tools
│   ├── fetchByDoiTool.ts     # DOI fetching tool
│   └── simpleQueryTool.ts    # Article query tool
└── api/
    ├── fetchByDoi.js
    └── simplequery.js
```

## Key Changes

1. **Separated Tools**: Each tool is now in its own file in `./tools/`
2. **Type Safety**: Shared `ToolDefinition` interface ensures consistency
3. **Easy to Extend**: Add new tools by creating a new file and adding to `tools/index.ts`
4. **Clean Server**: The server file is now just setup and registration logic

## Adding a New Tool

1. Create a new file in `./tools/` (e.g., `myNewTool.ts`)
2. Define your tool following the `ToolDefinition` interface:

```typescript
import { z } from "zod";
import { ToolDefinition } from "./types.js";

const MySchema = z.object({
  param: z.string().describe("Parameter description")
});

export const myNewTool: ToolDefinition = {
  name: "my_new_tool",
  title: "My New Tool",
  description: "What this tool does",
  inputSchema: MySchema,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  },
  handler: async (params: any) => {
    try {
      // Your tool logic here
      return {
        content: [{ type: "text", text: "Result" }]
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }
};
```

3. Export it in `./tools/index.ts`:

```typescript
import { myNewTool } from "./myNewTool.js";

export const tools: ToolDefinition[] = [
  fetchByDoiTool,
  simpleQueryTool,
  myNewTool  // Add here
];
```

That's it! The server will automatically register it on startup.
