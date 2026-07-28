# Cyber Terminal GitHub Profile README Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain GitHub profile README with a responsive, strongly styled cyber-terminal profile using only facts already present in the repository.

**Architecture:** Keep the published artifact as a single GitHub-compatible `README.md`. During implementation, use one temporary, untracked HTML preview page that repeatedly fetches the README, renders it with Marked, and applies GitHub Markdown CSS; serve it locally with Python's built-in HTTP server and remove it before the final commit.

**Tech Stack:** GitHub Flavored Markdown, conservative inline HTML, Shields.io, Skill Icons, Marked browser build, GitHub Markdown CSS, Python `http.server`

---

### Task 1: Start the Live README Preview

**Files:**
- Create temporarily: `.codex-readme-preview.html`
- Read: `README.md`

- [ ] **Step 1: Create the temporary preview page**

Create `.codex-readme-preview.html` with exactly:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>edomod README preview</title>
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.9.0/github-markdown-dark.min.css"
    >
    <style>
      html {
        background: #0d1117;
      }

      body {
        margin: 0;
      }

      .markdown-body {
        box-sizing: border-box;
        min-width: 200px;
        max-width: 980px;
        margin: 0 auto;
        padding: 45px;
      }

      @media (max-width: 767px) {
        .markdown-body {
          padding: 15px;
        }
      }
    </style>
  </head>
  <body>
    <article id="preview" class="markdown-body" aria-live="polite"></article>
    <script src="https://cdn.jsdelivr.net/npm/marked@18.0.7/lib/marked.umd.js"></script>
    <script>
      const preview = document.querySelector("#preview");
      let previousSource = "";

      async function refreshPreview() {
        const response = await fetch(`README.md?timestamp=${Date.now()}`, {
          cache: "no-store",
        });
        const source = await response.text();

        if (source !== previousSource) {
          preview.innerHTML = marked.parse(source, { gfm: true });
          previousSource = source;
        }
      }

      refreshPreview();
      setInterval(refreshPreview, 750);
    </script>
  </body>
</html>
```

- [ ] **Step 2: Start the local server**

Run:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Expected: the process stays active and reports `Serving HTTP on 127.0.0.1 port 4173`.

- [ ] **Step 3: Open the live preview**

Open:

```text
http://127.0.0.1:4173/.codex-readme-preview.html
```

Expected: the current README is visible with GitHub's dark Markdown styling. Editing and saving `README.md` updates the page within one second without a manual reload.

### Task 2: Establish the Cyber-Terminal Acceptance Check

**Files:**
- Test: `README.md`

- [ ] **Step 1: Run the structural check before implementation**

Run:

```bash
rg -q '^<h1 align="center">' README.md &&
rg -q '^```console$' README.md &&
test "$(rg -c '^## `0[1-6] // [A-Z_]+`$' README.md)" -eq 6 &&
rg -q 'edomod@github' README.md
```

Expected: exit status `1`, because the current plain README does not yet contain the approved header, terminal block, or six numbered sections.

### Task 3: Build the Cyber-Terminal README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace the current README**

Replace `README.md` with exactly:

````markdown
<h1 align="center">
  <samp>&gt;_ EDMONDO DE SIMONE</samp>
</h1>

<p align="center">
  <samp>FULL STACK DEVELOPER // COMPUTER SCIENCE M.SC. // CYBERSECURITY</samp>
</p>

<p align="center">
  <img
    src="https://img.shields.io/badge/SYSTEM-ONLINE-00FF41?style=for-the-badge&labelColor=0D1117"
    alt="System status: online"
  />
  <img
    src="https://img.shields.io/badge/LOCATION-SALERNO%2C_ITALY-00FF41?style=for-the-badge&labelColor=0D1117"
    alt="Location: Salerno, Italy"
  />
</p>

```console
┌──[edomod@github]─[~/profile]
└─$ whoami

name        : Edmondo De Simone
role        : Full Stack Developer
education   : Master's Student in Computer Science
curriculum  : Cybersecurity
location    : Salerno, Italy
```

## `01 // ABOUT_ME`

I'm a Full Stack Developer and Master's student in Computer Science, specialising
in Cybersecurity.

I build modern web applications and turn ideas into clean, functional and
maintainable solutions. Alongside development, I'm expanding my knowledge of
cybersecurity and exploring how software can be designed and developed more
securely.

## `02 // CURRENT_STATUS`

| `PROCESS` | `STATUS` |
| :--- | :--- |
| `work.exe` | Full Stack Developer |
| `learning.sh` | Cybersecurity and secure coding |
| `focus.cfg` | Web development, application security and software architecture |
| `mindset.log` | Continuous learning |

## `03 // SECURITY_SCAN`

```text
[01] Web and application security       [05] Data protection
[02] Secure software development        [06] Software architecture
[03] Common web vulnerabilities         [07] Code quality and maintainability
[04] Authentication and authorization   [08] Modern web development
```

## `04 // TECH_STACK`

<p align="center">
  <img
    src="https://skillicons.dev/icons?i=js,ts,vue,nuxtjs,tailwind&theme=dark"
    alt="JavaScript, TypeScript, Vue.js, Nuxt and Tailwind CSS"
  />
</p>

## `05 // OFF_DUTY`

<p align="center">
  <img
    src="https://img.shields.io/badge/CODING-0D1117?style=for-the-badge&logoColor=00FF41"
    alt="Coding"
  />
  <img
    src="https://img.shields.io/badge/CYBERSECURITY-0D1117?style=for-the-badge&logoColor=00FF41"
    alt="Cybersecurity"
  />
  <img
    src="https://img.shields.io/badge/VIDEO_GAMES-0D1117?style=for-the-badge&logoColor=00FF41"
    alt="Video games"
  />
  <img
    src="https://img.shields.io/badge/MOTORCYCLES-0D1117?style=for-the-badge&logoColor=00FF41"
    alt="Motorcycles"
  />
</p>

## `06 // ESTABLISH_CONNECTION`

<p align="center">
  <a href="https://edomod.tech">
    <img
      src="https://img.shields.io/badge/WEBSITE-EDOMOD.TECH-00FF41?style=for-the-badge&labelColor=0D1117"
      alt="Personal website: edomod.tech"
    />
  </a>
  <a href="https://www.linkedin.com/in/edmondo-de-simone">
    <img
      src="https://img.shields.io/badge/LINKEDIN-EDMONDO_DE_SIMONE-00FF41?style=for-the-badge&labelColor=0D1117"
      alt="LinkedIn profile: Edmondo De Simone"
    />
  </a>
</p>

<p align="center">
  <img
    src="https://komarev.com/ghpvc/?username=edomod&label=CONNECTIONS&color=00FF41&style=for-the-badge"
    alt="GitHub profile visitors"
  />
</p>

```console
edomod@github:~$ exit
Connection closed. Build, learn, improve, repeat.
```
````

- [ ] **Step 2: Observe the live update**

Expected: the open preview updates automatically. Confirm that the identity header, status badges, terminal block, six numbered sections, stack icons, contact badges, visitor counter, and closing terminal block all appear.

### Task 4: Verify Content, Rendering, and Responsiveness

**Files:**
- Test: `README.md`
- Inspect: `.codex-readme-preview.html`

- [ ] **Step 1: Run the structural acceptance check**

Run:

```bash
rg -q '^<h1 align="center">' README.md &&
rg -q '^```console$' README.md &&
test "$(rg -c '^## `0[1-6] // [A-Z_]+`$' README.md)" -eq 6 &&
rg -q 'edomod@github' README.md
```

Expected: exit status `0`.

- [ ] **Step 2: Check every retained fact and contact**

Run:

```bash
for expected_text in \
  'Edmondo De Simone' \
  'Full Stack Developer' \
  "Master's Student in Computer Science" \
  'Cybersecurity' \
  'Salerno, Italy' \
  'Web and application security' \
  'Secure software development' \
  'Common web vulnerabilities' \
  'Authentication and authorization' \
  'Data protection' \
  'Software architecture' \
  'Code quality and maintainability' \
  'Modern web development' \
  'js,ts,vue,nuxtjs,tailwind' \
  'Coding' \
  'Video games' \
  'Motorcycles' \
  'https://edomod.tech' \
  'https://www.linkedin.com/in/edmondo-de-simone' \
  'username=edomod'
do
  rg -Fq "$expected_text" README.md || exit 1
done
```

Expected: exit status `0`.

- [ ] **Step 3: Confirm that only approved external hosts remain**

Run:

```bash
rg -o 'https://[^") ]+' README.md |
  sed -E 's#https://([^/]+).*#\1#' |
  sort -u
```

Expected:

```text
edomod.tech
img.shields.io
komarev.com
skillicons.dev
www.linkedin.com
```

- [ ] **Step 4: Check Markdown whitespace**

Run:

```bash
git diff --check
```

Expected: no output and exit status `0`.

- [ ] **Step 5: Inspect desktop rendering**

Set the browser viewport to approximately `1440 × 1000`.

Expected: the main content is centered, all six sections are visually distinct, badges do not overlap, the security scan remains aligned, and no horizontal page overflow appears.

- [ ] **Step 6: Inspect mobile rendering**

Set the browser viewport to approximately `390 × 844`.

Expected: headings and prose remain readable, badge rows wrap, images scale within the content width, and long terminal content scrolls inside its code block rather than breaking the page.

### Task 5: Remove Preview Scaffolding and Commit

**Files:**
- Delete: `.codex-readme-preview.html`
- Commit: `README.md`

- [ ] **Step 1: Stop the local preview server**

Send an interrupt to the running `python3 -m http.server` process.

Expected: the local server exits cleanly.

- [ ] **Step 2: Delete the temporary preview page**

Delete:

```text
.codex-readme-preview.html
```

- [ ] **Step 3: Confirm the final repository contains no preview scaffolding**

Run:

```bash
test ! -e .codex-readme-preview.html &&
git status --short
```

Expected: only `README.md` is listed as changed.

- [ ] **Step 4: Commit the completed README**

Run:

```bash
git add README.md
git commit -m "docs: restyle profile as cyber terminal"
```

Expected: one commit containing only the `README.md` redesign.
