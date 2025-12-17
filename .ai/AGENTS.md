# Agent Routing Policy (zcakar/odoo)

## Default
- Use OpenAI (Daily Driver) for: small code edits, bugfixes, unit tests, short scripts.

## Claude (Use sparingly)
- Use Claude only for: architecture decisions, multi-file refactors, performance bottlenecks, security reviews, Odoo framework edge cases.

## Gemini
- Use Gemini for: repo scanning, summarizing modules, documentation drafts, comparing approaches, generating checklists.

## Copilot
- Use Copilot for: inline autocomplete, small refactors, boilerplate, quick suggestions.

## Token rules
- Always start with minimal context: only relevant files.
- Ask for plan first, then implement.
- Avoid re-summarizing the entire repo repeatedly.
