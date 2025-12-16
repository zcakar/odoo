# .ai/ Template - Universal AI Context System

This `.ai/` directory serves as a **universal template** for AI-assisted project development. You can copy this structure to ANY project and adapt it to your needs.

---

## 🎯 Purpose

The `.ai/` directory provides:
- ✅ **Persistent Context** for AI agents across sessions
- ✅ **Zero Context Loss** between conversations
- ✅ **Educational Approach** - AI explains while working
- ✅ **IDE-Independent** - Works with Claude Code, GitHub Copilot, ChatGPT, etc.
- ✅ **Team Collaboration** - Shared knowledge base
- ✅ **Project Documentation** - Human-readable format

---

## 📦 How to Use This Template in a New Project

### Step 1: Copy the Template

```bash
# From this project (Odoo)
cp -r /path/to/odoo/.ai /path/to/new-project/.ai

# Or download from GitHub
git clone https://github.com/zcakar/odoo.git
cp -r odoo/.ai your-new-project/.ai
```

### Step 2: Adapt context.yaml to Your Project

Open `.ai/context.yaml` and modify:

```yaml
project:
  name: "Your Project Name"
  type: "Web App / API / Mobile / etc."
  version: "1.0.0"
  status: "Active Development"

environment:
  os:
    distribution: "Ubuntu / macOS / Windows"
    version: "24.04"

  runtime:
    # For Node.js project:
    nodejs:
      version: "20.x"
      package_manager: "npm / yarn / pnpm"

    # For Python project:
    python:
      version: "3.12"
      virtual_env: "venv"

    # For Java project:
    java:
      version: "17"
      build_tool: "Maven / Gradle"

  database:
    engine: "PostgreSQL / MySQL / MongoDB / etc."
    version: "16"
    connection:
      host: "localhost"
      port: 5432
      name: "your_db_name"

paths:
  root: "/absolute/path/to/project"

  # Adapt to your project structure
  source: "src/"
  tests: "tests/"
  config: "config/"
  docs: "docs/"

# Add your project-specific sections
```

### Step 3: Update AI Guidelines

Edit `.ai/AI_AGENT_GUIDELINES.md` if you have project-specific rules.

### Step 4: Test with AI Agent

Start a new AI session:

```
Hi! Please read .ai/context.yaml and use it as the project context.

Task: [Your first task]
```

---

## 🤖 Using This Template in Different AI Tools

### Claude Code (VS Code Extension)
```bash
# In chat:
Read .ai/context.yaml and work on [task]
```

### GitHub Copilot
```bash
# Keep .ai/context.yaml open in VS Code
# Copilot will use it as context
```

### ChatGPT / Claude Web
```bash
# Copy-paste the content:
"Here is my project context: [paste .ai/context.yaml]

Task: ..."
```

### Terminal AI Tools
```bash
# Pass as context:
cat .ai/context.yaml | ai-cli "Task: ..."
```

---

## 📁 Template File Structure

```
.ai/
├── README.md                           # Overview and usage instructions
├── TEMPLATE_USAGE.md                   # This file - how to use as template
├── AI_AGENT_GUIDELINES.md              # Rules for AI agents
├── NEW_CHAT_TEMPLATE.md                # Template for starting new sessions
├── context.yaml                        # Main project context (ADAPT THIS!)
└── [project_specific_docs].md          # Project-specific checklists/guides
```

---

## 🎓 Educational AI Agent Protocol

All AI agents using this template MUST follow the **Educational Approach**:

### Principle: "Explain While You Code"

> **AI agents are not just code generators - they are TEACHERS.**

### Educational Rules:

#### 1️⃣ Before Every Action
**Explain WHAT you're going to do and WHY**

❌ **Bad:**
```
AI: [runs command without explanation]
```

✅ **Good:**
```
AI: "I'm going to install the 'pyjwt' package because:
- OnlyOffice module requires JWT authentication
- This Python library handles token generation/verification
- It's listed in the module's dependencies

Command: pip install pyjwt"
```

#### 2️⃣ During Complex Operations
**Break down into steps with explanations**

❌ **Bad:**
```
AI: "Installing dependencies..."
[10 commands executed]
"Done."
```

✅ **Good:**
```
AI: "Installing dependencies - 3 steps:

Step 1: Update package manager (ensures latest versions)
Step 2: Install system dependencies (Docker, PostgreSQL client)
Step 3: Install Python packages (application requirements)

[Executes with explanations for each]"
```

#### 3️⃣ After Actions
**Explain the RESULT and what it means**

❌ **Bad:**
```
AI: "Command executed successfully."
```

✅ **Good:**
```
AI: "✅ OnlyOffice container started successfully.

What this means:
- Document Server is now running on port 8080
- It will automatically restart if the server reboots (--restart=always)
- JWT authentication is enabled by default
- Next step: We need to get the JWT secret to configure Odoo

Healthcheck: true (container is healthy and ready)"
```

#### 4️⃣ When Errors Occur
**Explain the error, WHY it happened, and HOW to fix**

❌ **Bad:**
```
AI: "Error occurred. Try again."
```

✅ **Good:**
```
AI: "❌ Error: Module not found

Why this happened:
- The module path is not in Odoo's addons_path
- Odoo can't see the custom_addons directory

How to fix:
1. Check odoo.conf: addons_path should include custom_addons
2. Verify file permissions: module must be readable by odoo user
3. Restart Odoo after changing config

Let me check the config file..."
```

#### 5️⃣ Technical Concepts
**Teach while implementing**

✅ **Example:**
```
AI: "Now we're setting http_interface to 0.0.0.0

Technical Explanation:
- 127.0.0.1 (localhost): Only accessible from the same machine
- 0.0.0.0 (all interfaces): Accessible from network
- Why we need this: OnlyOffice Docker container is on a separate network
- Without 0.0.0.0: Container can't callback to Odoo
- Security: Use Nginx reverse proxy to protect this in production"
```

---

## 📚 Language & Documentation Rules

### Code & Comments: ALWAYS ENGLISH
```python
# ✅ CORRECT
def calculate_total(items):
    """Calculate the total price of items."""
    return sum(item.price for item in items)

# ❌ WRONG
def toplamHesapla(items):
    """Ürünlerin toplam fiyatını hesapla."""
    return sum(item.fiyat for item in items)
```

### AI Explanations: User's Language
- If user writes in **Turkish** → Explain in **Turkish**
- If user writes in **English** → Explain in **English**
- Code/comments → **ALWAYS English**

### Documentation Files
- Technical docs (API, architecture): **English**
- User guides (if applicable): **Both languages**
- This `.ai/` directory: **English** (universal template)

---

## 🔄 Adaptation Examples

### Example 1: Node.js Web App

```yaml
# .ai/context.yaml
project:
  name: "E-Commerce Platform"
  type: "Node.js Web Application"
  version: "2.1.0"

environment:
  runtime:
    nodejs:
      version: "20.10.0"
      package_manager: "pnpm"

  database:
    engine: "MongoDB"
    version: "7.0"

  web_server:
    type: "Express.js"
    port: 3000

paths:
  root: "/home/user/projects/ecommerce"
  source: "src/"
  frontend: "src/frontend/"
  backend: "src/backend/"
  config: "config/"

custom_modules:
  payment_gateway:
    name: "Stripe Integration"
    version: "1.0.0"
```

### Example 2: Python Data Science Project

```yaml
project:
  name: "Customer Analytics Platform"
  type: "Python Data Science Project"
  version: "1.0.0"

environment:
  runtime:
    python:
      version: "3.11"
      virtual_env: ".venv"

  tools:
    jupyter: "enabled"
    mlflow: "enabled"

paths:
  root: "/home/user/analytics"
  notebooks: "notebooks/"
  data: "data/"
  models: "models/"
  scripts: "scripts/"

dependencies:
  python:
    - "pandas==2.1.0"
    - "scikit-learn==1.3.0"
    - "tensorflow==2.15.0"
```

### Example 3: Mobile App (React Native)

```yaml
project:
  name: "FitTracker Mobile App"
  type: "React Native Mobile Application"
  version: "1.5.0"

environment:
  runtime:
    nodejs:
      version: "20.x"
      package_manager: "yarn"

  mobile:
    platforms: ["iOS", "Android"]
    react_native_version: "0.73.0"

paths:
  root: "/home/user/fittracker"
  source: "src/"
  components: "src/components/"
  screens: "src/screens/"
  assets: "assets/"
```

---

## ✅ Validation Checklist

After copying this template to a new project:

- [ ] `context.yaml` updated with correct project details
- [ ] All paths are absolute and correct
- [ ] Environment section matches your tech stack
- [ ] Project-specific sections added
- [ ] Sensitive information removed (passwords, API keys)
- [ ] `.gitignore` includes `.ai/context.local.yaml` if needed
- [ ] Tested with AI agent (can read and understand context)
- [ ] README.md in root points to `.ai/` directory

---

## 🚀 Quick Start Script

Save this as `setup-ai-context.sh`:

```bash
#!/bin/bash
# Setup .ai/ context for a new project

echo "🤖 Setting up AI context directory..."

# Copy template
mkdir -p .ai
cd .ai

# Download template files (or copy from existing project)
curl -O https://raw.githubusercontent.com/zcakar/odoo/19.0/.ai/context.yaml
curl -O https://raw.githubusercontent.com/zcakar/odoo/19.0/.ai/README.md
curl -O https://raw.githubusercontent.com/zcakar/odoo/19.0/.ai/AI_AGENT_GUIDELINES.md
curl -O https://raw.githubusercontent.com/zcakar/odoo/19.0/.ai/NEW_CHAT_TEMPLATE.md

# Edit context.yaml
echo "✏️  Please edit .ai/context.yaml with your project details"
${EDITOR:-nano} context.yaml

echo "✅ AI context setup complete!"
echo "📝 Start a new AI session with: 'Read .ai/context.yaml'"
```

---

## 🌍 Community & Contributions

This template is open-source and can be adapted for any project.

**Share Your Adaptations:**
- Blog posts about your usage
- Modified templates for specific tech stacks
- Improvements to the documentation

**Original Project:** [github.com/zcakar/odoo](https://github.com/zcakar/odoo)

---

## 📖 Further Reading

- [AI_AGENT_GUIDELINES.md](AI_AGENT_GUIDELINES.md) - Detailed AI agent rules
- [NEW_CHAT_TEMPLATE.md](NEW_CHAT_TEMPLATE.md) - How to start new sessions
- [README.md](README.md) - Overview of this system

---

**Version:** 1.0.0
**Last Updated:** 2025-12-16
**Maintained By:** Project Team
**License:** MIT (adapt freely)
