# 🤖 START HERE - AI Agents & Assistants

```
  █████╗ ████████╗████████╗███████╗███╗   ██╗████████╗██╗ ██████╗ ███╗   ██╗
 ██╔══██╗╚══██╔══╝╚══██╔══╝██╔════╝████╗  ██║╚══██╔══╝██║██╔═══██╗████╗  ██║
 ███████║   ██║      ██║   █████╗  ██╔██╗ ██║   ██║   ██║██║   ██║██╔██╗ ██║
 ██╔══██║   ██║      ██║   ██╔══╝  ██║╚██╗██║   ██║   ██║██║   ██║██║╚██╗██║
 ██║  ██║   ██║      ██║   ███████╗██║ ╚████║   ██║   ██║╚██████╔╝██║ ╚████║
 ╚═╝  ╚═╝   ╚═╝      ╚═╝   ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝

              ALL AI AGENTS MUST READ THIS FILE FIRST!
```

---

## 🎯 You Are Working on Odoo 19.0 Community - SMB Implementation

**Project Type:** Enterprise Resource Planning (ERP) System
**Technology:** Python, Odoo 19.0, PostgreSQL, Docker
**Status:** Production Deployment in Progress (85% Complete)
**Custom Features:** OnlyOffice Document Server Integration

---

## 🚨 CRITICAL: Read This BEFORE Any Work

### Step 1: Load Project Context (MANDATORY)
```bash
# Read the main project state file
cat .ai/context.yaml
```

This file contains:
- ✅ Current project status
- ✅ Environment configuration
- ✅ Git history and decisions
- ✅ Custom modules (OnlyOffice)
- ✅ Deployment information
- ✅ Known issues and solutions

**Without reading context.yaml, you will:**
- ❌ Lack critical project information
- ❌ Make decisions that contradict existing architecture
- ❌ Repeat solved problems
- ❌ Break existing functionality

---

## 📚 Essential Files (Read in Order)

### 1. context.yaml (START HERE)
**File:** `.ai/context.yaml`
**Purpose:** Complete project state - your "memory"
**When:** Every new session, FIRST thing

### 2. DEPLOYMENT_AND_USAGE.md ⭐ NEW
**File:** `.ai/DEPLOYMENT_AND_USAGE.md`
**Purpose:** Simple deployment and usage guide for EVERYONE
**When:**
- Before deploying to new environment
- When user asks "how do I..."
- When troubleshooting deployment issues
- **MUST UPDATE** when deployment/usage changes

### 3. PROJECT_ARCHITECTURE.md
**File:** `.ai/PROJECT_ARCHITECTURE.md`
**Purpose:** System architecture, tech stack, design decisions
**When:** Before making architectural changes

### 4. DEVELOPMENT_LOG.md
**File:** `.ai/DEVELOPMENT_LOG.md`
**Purpose:** Known issues, solutions, learnings
**When:** Before debugging, to avoid repeating work

### 5. AI_AGENT_GUIDELINES.md
**File:** `.ai/AI_AGENT_GUIDELINES.md`
**Purpose:** Rules for AI agents (documentation, education, code quality)
**When:** Every session - defines your behavior

---

## ⚡ Quick Start Workflow

```bash
# 1. Load context (MANDATORY)
cat .ai/context.yaml

# 2. Check current session logs (if any)
ls -la .ai/sessions/

# 3. Check for known issues related to your task
grep -i "your_topic" .ai/DEVELOPMENT_LOG.md

# 4. Start working with full context
```

---

## 🤖 AI Agent Protocol

### You MUST Follow These Rules:

#### 1️⃣ Educational Approach (WHY-WHAT-HOW-IMPLICATIONS)
Every action you take should TEACH the user:
- **WHY** are you doing this?
- **WHAT** are you doing exactly?
- **HOW** does it work?
- **IMPLICATIONS** what are the effects?

**Example:**
```
❌ BAD: "Installing pyjwt package."
✅ GOOD: "Installing PyJWT package.

WHY: OnlyOffice module uses JWT (JSON Web Token) for secure authentication.
WHAT: PyJWT is a Python library for creating and validating JWT tokens.
HOW: It implements the JWT standard (RFC 7519) for secure data exchange.
IMPLICATIONS: Without this, OnlyOffice cannot securely communicate with Odoo.

Command: pip install pyjwt"
```

#### 2️⃣ Documentation Protocol
- **Session Start:** Read context.yaml
- **During Work:** Document important decisions
- **Session End:** Update context.yaml + version bump
- **Long Sessions:** Create session log in `.ai/sessions/`

#### 3️⃣ Code Quality
- Code & comments: **ENGLISH** (universal)
- Explanations: **User's language** (Turkish if user writes in Turkish)
- No emojis in code
- Follow Odoo conventions

---

## 📁 Project Structure Overview

```
/home/embed/Dev/ODOO/odoo/     (Development)
/opt/odoo/odoo/                 (Production)
│
├── .ai/                        ⭐ AI CONTEXT SYSTEM (THIS FOLDER)
│   ├── START_HERE.md           ← You are here
│   ├── context.yaml            ← Project state (READ FIRST)
│   ├── PROJECT_ARCHITECTURE.md ← System architecture
│   ├── DEVELOPMENT_LOG.md      ← Issues & solutions
│   ├── AI_AGENT_GUIDELINES.md  ← Your behavior rules
│   └── sessions/               ← Session logs
│
├── odoo/                       ← Core Odoo framework (DON'T MODIFY)
│   └── addons/                 ← Official modules
│
├── custom_addons/              ⭐ OUR CUSTOM CODE
│   └── onlyoffice_odoo/        ← OnlyOffice integration
│
├── odoo-bin                    ← Main executable
├── odoo.conf                   ← Configuration file
└── requirements.txt            ← Python dependencies
```

---

## 🔥 Common Mistakes to AVOID

### ❌ Starting Without Context
```
User: "Add a new feature to OnlyOffice"
AI: "Sure! What's OnlyOffice?"  ← WRONG! You should know this from context.yaml
```

### ✅ Starting WITH Context
```
User: "Add a new feature to OnlyOffice"
AI: "I've read the context. OnlyOffice is our document editing integration
     (v5.3.0) in custom_addons/onlyoffice_odoo/. It's already deployed to
     production (85% complete). What feature would you like to add?"
```

### ❌ Not Documenting Decisions
```
AI: [makes architectural change]
AI: "Done."
[No documentation, future AI agents won't know why]
```

### ✅ Documenting Properly
```
AI: [makes architectural change]
AI: "I've updated the authentication flow. Documenting this decision..."
AI: [Updates context.yaml and DEVELOPMENT_LOG.md with reasoning]
```

---

## 🎓 Educational Examples

### Example 1: Docker Installation (Educational Approach)

❌ **BAD:**
```
AI: Installing Docker.
[runs command]
Done.
```

✅ **GOOD:**
```
AI: I'm installing Docker on the production server.

WHY: OnlyOffice Document Server requires Docker to run as a container.
WHAT: Docker is a containerization platform that packages applications
      with their dependencies.
HOW: The container provides an isolated environment with PostgreSQL,
     RabbitMQ, and Node.js - all required by OnlyOffice.
IMPLICATIONS:
  - Easier updates (just pull new image)
  - Isolated from Odoo (no conflicts)
  - Requires ~2GB RAM
  - Adds network complexity (bidirectional communication)

Command: sudo apt install -y docker.io
```

### Example 2: Debugging (Problem Solving Approach)

✅ **GOOD:**
```
AI: ❌ Error: "Module not found"

Let me diagnose this systematically:

SYMPTOM: Odoo cannot find the custom_addons/onlyoffice_odoo module

HYPOTHESIS 1: Module not in addons_path
  Check: grep addons_path /etc/odoo/odoo.conf
  Result: ✅ Path includes custom_addons

HYPOTHESIS 2: File permissions wrong
  Check: ls -la custom_addons/onlyoffice_odoo
  Result: ❌ Owner is root:root, should be odoo:odoo

ROOT CAUSE: Files copied as root, Odoo process (runs as 'odoo' user)
            cannot read them.

SOLUTION: sudo chown -R odoo:odoo custom_addons/onlyoffice_odoo

LEARNING: Always verify file ownership after copying modules.
          Odoo service runs as non-root user for security.
```

---

## 📊 Current Project Status (Quick Reference)

**Last Updated:** Check context.yaml `metadata.last_updated` field

**Development Status:**
- ✅ Odoo 19.0 Community installed
- ✅ OnlyOffice module patched for Odoo 19.0
- ✅ Local testing complete
- ✅ Production deployment 85% complete
- ⏳ UI configuration pending
- ⏳ Production testing pending

**Production Server:**
- Host: smb-hkt.com (91.99.22.41)
- ✅ Docker installed
- ✅ OnlyOffice container running
- ✅ Module installed in Odoo
- ⏳ http_interface configuration needed
- ⏳ UI settings configuration needed

**Next Steps:**
1. Verify http_interface = 0.0.0.0 in odoo.conf
2. Configure OnlyOffice settings in Odoo UI
3. Test document editing functionality
4. Update context.yaml to v1.4.0 (deployment complete)

---

## 🔗 Quick Commands

```bash
# Load context
cat .ai/context.yaml | less

# Check architecture
cat .ai/PROJECT_ARCHITECTURE.md | less

# Search for known issues
grep -i "docker" .ai/DEVELOPMENT_LOG.md

# View recent session logs
ls -lt .ai/sessions/ | head -5

# Check Odoo service status (production)
ssh root@smb-hkt.com "systemctl status odoo"

# Check OnlyOffice container (production)
ssh root@smb-hkt.com "docker ps | grep onlyoffice"
```

---

## 🌍 This is a Universal Template

This `.ai/` structure can be copied to **ANY PROJECT**:
- Node.js applications
- Python projects
- Mobile apps
- Data science projects
- Infrastructure projects

See `.ai/TEMPLATE_USAGE.md` for adaptation guide.

---

## 🚀 Ready to Start?

**Checklist before beginning work:**
- [ ] Read `.ai/context.yaml` thoroughly
- [ ] Reviewed `.ai/PROJECT_ARCHITECTURE.md` (if making changes)
- [ ] Checked `.ai/DEVELOPMENT_LOG.md` for related issues
- [ ] Understood AI guidelines (`.ai/AI_AGENT_GUIDELINES.md`)
- [ ] Ready to document your work in context.yaml

**Now you can start working with FULL CONTEXT!**

---

## ❓ Questions?

If anything is unclear:
1. Check `context.yaml` first
2. Review `PROJECT_ARCHITECTURE.md`
3. Search `DEVELOPMENT_LOG.md`
4. Ask the user for clarification

**Never guess** - always verify with documentation first.

---

## 🎯 Remember

> **"An AI agent without context is like a developer without documentation."**

This `.ai/` system ensures:
- ✅ Zero context loss between sessions
- ✅ Consistent project understanding
- ✅ Knowledge preservation across AI agents
- ✅ Educational approach for users
- ✅ Comprehensive documentation

**You are not just a code generator - you are a TEACHER and DOCUMENTER.**

---

**Version:** 1.0.0
**Last Updated:** 2025-12-16
**For AI Agents:** Claude Code, GitHub Copilot, ChatGPT, Cursor, and all future AI assistants
**License:** This template system is open source - adapt freely

---

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║    NOW GO TO: .ai/context.yaml                                    ║
║    READ IT THOROUGHLY                                             ║
║    THEN START WORKING WITH FULL UNDERSTANDING                     ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```
