# Agent Skills for Runtime Context

This module implements an agent skills system for progressive disclosure of runtime context information to AI agents, following the LangChain skills pattern.

## Overview

The skills system provides AI agents with access to runtime context information (APIs and environment variables) through a progressive disclosure pattern. Instead of loading all context data at once, agents can discover and load specific information as needed.

## Architecture

### Components

1. **SkillManager** (`skill-manager.ts`)
   - Manages skill registration and execution
   - Stores runtime context data from `ctx.getInfos()`
   - Provides skill discovery and invocation

2. **Context Skills** (`context-skills.ts`)
   - `contextEnvs` - Returns all environment variables (small dataset, returned at once)
   - `contextApisList` - Lists all available APIs with brief descriptions (top-level only)
   - `contextApiDetails` - Returns detailed information about a specific API by path (supports nested access)

3. **Load Skill Tool** (`load-skill-tool.ts`)
   - `listSkills` - Lists all available skills
   - `loadSkill` - Loads and executes a specific skill with optional arguments

## Usage

### Setting Runtime Context (Frontend)

Before AI agents can access runtime context, the frontend must send the context data:

```typescript
// In your frontend code, before sending message to AI
const contextData = await ctx.getInfos(); // Get runtime context

// Send context to backend
await api.request({
  url: 'ai:setRuntimeContext',
  method: 'post',
  data: {
    apis: contextData.apis,
    envs: contextData.envs,
  },
});
```

### Using Skills (AI Agent)

AI agents can use the skills through the tool system:

#### 1. List Available Skills

```typescript
// Tool call: listSkills
// Returns: { skills: [{ name: 'contextEnvs', description: '...' }, ...] }
```

#### 2. Get Environment Variables

```typescript
// Tool call: loadSkill
// Arguments: { skillName: 'contextEnvs' }
// Returns: All envs data including flowModel, block, currentViewBlocks
```

#### 3. List Available APIs

```typescript
// Tool call: loadSkill
// Arguments: { skillName: 'contextApisList' }
// Returns: Top-level API names with brief descriptions
// Example: { apis: { message: { hasProperties: true, propertyCount: 7 }, ... } }
```

#### 4. Get API Details (Progressive Disclosure)

```typescript
// Get top-level API details
// Tool call: loadSkill
// Arguments: { skillName: 'contextApiDetails', args: { apiPath: 'message' } }
// Returns: Detailed info about 'message' API including nested properties

// Get nested property details
// Tool call: loadSkill
// Arguments: { skillName: 'contextApiDetails', args: { apiPath: 'message.info' } }
// Returns: Detailed info about 'message.info' method

// Get deeply nested property
// Tool call: loadSkill
// Arguments: { skillName: 'contextApiDetails', args: { apiPath: 'user.roles' } }
// Returns: Detailed info about 'user.roles' relationship
```

## Data Structure

### Runtime Context (from ctx.getInfos())

```typescript
interface RuntimeContextInfo {
  apis: {
    [key: string]: {
      description?: string;
      type?: 'function' | 'object' | 'string' | ...;
      examples?: string[];
      completion?: { insertText: string };
      properties?: { [key: string]: any }; // Nested properties
    };
  };
  envs: {
    [key: string]: {
      description: string;
      value?: any;
      getVar?: string;
      properties?: { [key: string]: any };
    };
  };
}
```

## Progressive Disclosure Pattern

The system implements progressive disclosure to avoid overwhelming AI agents:

1. **Envs** - Small dataset, returned entirely (flowModel, block, currentViewBlocks)
2. **APIs** - Large dataset, disclosed progressively:
   - Level 1: List all API names with summaries (`contextApisList`)
   - Level 2+: Get detailed info for specific APIs by path (`contextApiDetails`)

### Example Flow

```
AI Agent: "What APIs are available?"
→ loadSkill(contextApisList)
→ Returns: { message, notification, modal, resource, user, ... }

AI Agent: "How do I show a message?"
→ loadSkill(contextApiDetails, { apiPath: 'message' })
→ Returns: message API with properties: info, success, error, warning, loading, ...

AI Agent: "What are the parameters for message.info?"
→ loadSkill(contextApiDetails, { apiPath: 'message.info' })
→ Returns: Function details with description and completion hint
```

## Benefits

1. **Reduced Token Usage** - Only load what's needed, when it's needed
2. **Better Context Management** - Avoid overwhelming AI with unnecessary information
3. **Scalability** - System can handle large API surfaces efficiently
4. **Discoverability** - AI can explore available APIs naturally through conversation
5. **Extensibility** - Easy to add new skills for different context types

## Extending the System

### Adding New Skills

```typescript
// Define a new skill
export const myCustomSkill: Skill = {
  name: 'myCustomSkill',
  description: 'Description of what this skill does',
  execute: async (ctx: Context, args: Record<string, any>) => {
    // Skill logic here
    return JSON.stringify(result);
  },
};

// Register it
export function registerMySkills(skillManager: SkillManager) {
  skillManager.registerSkill(myCustomSkill);
}

// In plugin.ts
import { registerMySkills } from './skills/my-skills';

registerSkills() {
  registerContextSkills(this.skillManager);
  registerMySkills(this.skillManager); // Add your skills
}
```

## Testing

```bash
# Run skill manager tests
yarn test packages/plugins/@nocobase/plugin-ai/src/server/__tests__/skill-manager.test.ts
```

## Future Enhancements

1. **Skill Caching** - Cache skill results to reduce repeated computation
2. **Skill Dependencies** - Support skills that depend on other skills
3. **Dynamic Skill Loading** - Load skills from plugins at runtime
4. **Skill Permissions** - Control which skills are available to which users/roles
5. **Skill Composition** - Combine multiple skills into higher-level operations
