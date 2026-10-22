#!/usr/bin/env node

/**
 * LINKR AI Session Handoff Generator
 * Collects Git state, recent commits, and outputs a clean handoff template
 * ready to paste into any new AI session (Gemini, Claude, Copilot, ChatGPT/Codex).
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (err) {
    return `[Command failed: ${err.message}]`;
  }
}

const branch = run('git branch --show-current') || 'unknown';
const gitStatus = run('git status --short') || '(clean working tree)';
const recentCommits = run('git log -3 --oneline') || '(no commits found)';

let projectStateSummary = 'Inspect Docs/PROJECT_STATE.md for details.';
const statePath = resolve(process.cwd(), 'Docs', 'PROJECT_STATE.md');
if (existsSync(statePath)) {
  const content = readFileSync(statePath, 'utf-8');
  const nextTaskMatch = content.match(/## 3\.\s*Immediate Next Recommended Task[\s\S]*?(?=\n##|$)/i);
  if (nextTaskMatch) {
    projectStateSummary = nextTaskMatch[0].replace('## 3. Immediate Next Recommended Task', '').trim();
  }
}

console.log(`
================================================================================
                    LINKR AI SESSION HANDOFF TEMPLATE
================================================================================
Copy and paste the text block below into your next AI chat session:
--------------------------------------------------------------------------------

Continue working on this existing repository.

First read:
- AGENTS.md
- Docs/PROJECT_STATE.md
- The latest entry in Docs/WORKLOG.md

Current Git Context:
- Branch: ${branch}
- Working Tree Status:
${gitStatus.split('\n').map(line => '  ' + line).join('\n')}
- Recent Commits:
${recentCommits.split('\n').map(line => '  ' + line).join('\n')}

Immediate Recommended Task:
${projectStateSummary}

Constraints:
- Preserve the existing architecture (Cloudflare Pages Functions + D1 + Vanilla ES Modules).
- Do not repeat a full repository audit.
- Inspect only the relevant files and their direct dependencies first.
- Treat documentation as a guide, verify facts against active code.
- Run validation checks (e.g., npm run typecheck) before completing.
- Report changed files and update Docs/PROJECT_STATE.md and Docs/WORKLOG.md when finished.

================================================================================
`);
