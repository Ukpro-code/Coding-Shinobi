# Claude Code Training Guide

## 1. The Basics — Starting & Stopping

```bash
claude                  # Start Claude Code
exit                    # Exit Claude Code (or type /exit)
```

Once inside, you just type in plain English. No special syntax needed.

---

## 2. Essential Slash Commands

These are shortcuts you type inside Claude Code:

| Command | What it does |
|---|---|
| `/help` | Show all available commands |
| `/clear` | Clear conversation history (fresh start) |
| `/compact` | Summarize conversation to free up memory |
| `/exit` | Exit Claude Code |
| `/init` | Create a `CLAUDE.md` file for your project (more on this below) |

---

## 3. CLAUDE.md — Your Project's Brain

This is the most powerful feature for beginners. Run:

```bash
/init
```

This creates a `CLAUDE.md` file in your project folder. It tells Claude about your project — like a cheat sheet. You can put things like:

```markdown
# My Project
- This is a portfolio website built with HTML, CSS, and JavaScript
- Use simple, beginner-friendly code with comments
- Always explain changes before making them
```

Claude reads this file every time you start a session, so it already knows your project context.

---

## 4. How to Talk to Claude Code — Real Examples

### Ask questions about your code:
```
What does this project do?
Explain the index.html file
What does this function do in app.py?
```

### Create new files:
```
Create a simple HTML page with a navigation bar and hero section
Write a Python script that reads a CSV file and prints the top 5 rows
```

### Fix errors:
```
I'm getting this error: [paste error]. Fix it.
My website isn't showing the background image. Help me debug.
```

### Modify existing code:
```
Add a dark mode toggle to my website
Change the button color to blue in styles.css
Add form validation to the contact page
```

### Learn while coding:
```
Create a login page and explain each part of the code
What is flexbox? Show me an example in my project
Teach me how API calls work by adding one to my project
```

---

## 5. Working with Files

Claude Code can **read, create, edit, and search** files in your project. Some examples:

```
Read my index.html file
Find all Python files in this project
Search for where "username" is used in my code
Show me all TODO comments in the project
```

---

## 6. Using Git with Claude Code

Git tracks changes to your code. Claude Code can help:

```
Initialize a git repo for this project
What files have I changed?
Commit my changes with a good message
Create a new branch called "feature-navbar"
```

**Important**: Claude will always ask before pushing code to GitHub or doing anything irreversible.

---

## 7. Running Commands

You can ask Claude to run terminal commands:

```
Run my Python script
Install the requests library
Start a local development server
Run my tests
```

---

## 8. Modes & Keyboard Shortcuts

### Mode Toggle — `Shift+Tab`

This cycles through three modes:

```
Normal Mode → Plan Mode → Auto-Accept Mode → back to Normal
```

| Mode | What it does | When to use |
|---|---|---|
| **Normal Mode** | Claude asks your permission before making changes | Default — use this while learning |
| **Plan Mode** | Claude only analyzes and plans — no code changes | When you want to understand before doing |
| **Auto-Accept Mode** | Claude makes changes without asking permission | Use carefully! Skip for now as a beginner |

### Other Useful Shortcuts

| Shortcut (Windows) | What it does |
|---|---|
| `Shift+Tab` | Cycle through modes |
| `Alt+T` | Toggle extended thinking (Claude thinks deeper) |
| `Alt+P` | Switch between models |

### Mode Commands

| Command | What it does |
|---|---|
| `/plan` | Enter plan mode directly |
| `/permissions` | View or change permission settings |

### Start in a Specific Mode from Terminal

```bash
claude --permission-mode plan       # Start in plan mode
claude --permission-mode auto       # Start in auto-accept mode
```

### Beginner Recommendation
- **Start in Normal Mode** (default) — so you see and approve every change
- **Use Plan Mode** when you want Claude to explain an approach before touching any code
- **Avoid Auto-Accept Mode** for now — it's better to review changes while you're learning

---

## 9. Skills (Slash Commands)

**Skills = reusable instructions you trigger with `/command`**

Think of them like saved recipes. Instead of explaining the same thing every time, you save it once and reuse it.

### How to use them:
Just type `/` and the skill name:
```
/commit          → Creates a thoughtful git commit
/init            → Sets up CLAUDE.md for your project
/review-pr 123   → Reviews a pull request
```

### Create your own skill:

1. Create a folder: `~/.claude/skills/explain-code/`
2. Create a file inside called `SKILL.md`:

```yaml
---
name: explain-code
description: Explains code with simple analogies
---

When explaining code:
1. Compare it to something from everyday life
2. Walk through it step by step
3. Highlight common mistakes
```

3. Now just type `/explain-code` anytime!

### Where skills live:

| Location | Who can use it |
|---|---|
| `~/.claude/skills/` | You, in all projects |
| `.claude/skills/` (inside project) | Anyone working on that project |

### Passing arguments to skills:

Use `$ARGUMENTS` in your skill file:
```yaml
---
name: fix-issue
description: Fix a GitHub issue
---

Fix GitHub issue $ARGUMENTS following our coding standards.
```

Run it: `/fix-issue 123` → Claude sees "Fix GitHub issue 123..."

### Skill configuration options:

| Field | Purpose |
|---|---|
| `name` | The slash command name |
| `description` | When to use the skill |
| `disable-model-invocation` | Prevent Claude from using it automatically |
| `allowed-tools` | Restrict which tools Claude can use |
| `model` | Choose which AI model to use |
| `context: fork` | Run in isolated subagent |

---

## 10. Agents (Subagents)

**Agents = specialized AI helpers that work independently**

Think of them like hiring specialists. Claude can send a task to a specialist, let them work on it, and get back just the results.

### Built-in agents Claude uses automatically:

| Agent | What it does | Speed |
|---|---|---|
| **Explore** | Searches and reads your codebase (read-only) | Fast |
| **Plan** | Researches before making a plan | Medium |
| **Bash** | Runs terminal commands | Fast |
| **General-purpose** | Does complex multi-step tasks | Depends |

You don't need to call these manually — Claude decides when to use them behind the scenes.

### Create your own agent:

Run this command inside Claude Code:
```
/agents
```

This opens an interactive menu to create, view, and manage agents.

Or create manually at `~/.claude/agents/code-reviewer/SUBAGENT.md`:

```yaml
---
name: code-reviewer
description: Reviews code for quality and bugs
tools: Read, Grep, Glob
model: sonnet
---

You are a code reviewer. Check for:
- Bugs and errors
- Code readability
- Security issues
Give feedback organized by priority.
```

### Agent configuration options:

| Field | Purpose |
|---|---|
| `name` | Unique identifier |
| `description` | When Claude should use it |
| `tools` | Which tools are available |
| `model` | Which AI model to use (haiku, sonnet, opus) |
| `permissionMode` | How to handle permissions |
| `memory` | Enable cross-session learning |
| `maxTurns` | Max iterations before stopping |

### Where agents live:

| Location | Who can use it |
|---|---|
| `~/.claude/agents/` | You, in all projects |
| `.claude/agents/` (inside project) | Anyone working on that project |

---

## 11. Skills vs Agents — Quick Comparison

| | Skills | Agents |
|---|---|---|
| **What** | Saved instructions | Specialized AI helpers |
| **How to use** | `/skill-name` | Claude uses automatically, or you ask |
| **Example** | `/commit`, `/review-pr` | Explore agent searches your code |
| **Best for** | Repeatable tasks | Complex or parallel work |
| **Context** | Same conversation | Isolated, independent context |

### As a beginner, start with:
1. **`/init`** — Set up CLAUDE.md in every new project
2. **`/compact`** — Use when conversations get long
3. **Let agents work automatically** — You don't need to manage them yet
4. **Create skills later** — Once you find yourself repeating instructions, save them as a skill

---

## 12. Pro Tips for Beginners

### Be specific
```
Bad:  "Make it look better"
Good: "Add padding to the cards, make the font larger, and center the heading"
```

### Paste errors directly
```
I ran python app.py and got this error:
FileNotFoundError: [Errno 2] No such file or directory: 'data.csv'
```

### Ask "why" not just "fix"
```
"Why am I getting this error?" teaches you more than "Fix this error"
```

### Break big tasks into steps
```
Instead of: "Build me a full e-commerce website"
Try: "Let's start by creating the product listing page with HTML and CSS"
```

### Use /compact when conversations get long
Long conversations can slow things down. `/compact` summarizes and frees up space.

---

## 13. A Typical Workflow

Here's how a real session might look:

```
1. Open VS Code terminal
2. cd "D:\Ukesh\Coding Shinobi\my-project"
3. claude
4. "Read my project files and tell me what this project does"
5. "Add a responsive navbar to index.html"
6. "Explain what you just did"
7. "Now add a footer with social media links"
8. "Commit these changes"
9. exit
```

---

## 14. What Claude Code Can Help You With

| Your Goal | How Claude Code Helps |
|---|---|
| **Web Dev** | Build HTML/CSS/JS pages, debug layouts, create backends |
| **Mobile Dev** | Scaffold React Native / Flutter apps, fix errors |
| **Python / Data** | Write scripts, analyze data, build ML models |
| **Content / Scripts** | Generate copywriting drafts, organize content ideas |
