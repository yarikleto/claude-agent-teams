#!/usr/bin/env node
import { existsSync, promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkbox, confirm, select } from '@inquirer/prompts';
import pc from 'picocolors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const TEAMS_DIR = path.join(REPO_ROOT, 'teams');

const SCOPES = {
  user: {
    key: 'user',
    label: 'User',
    root: path.join(homedir(), '.claude'),
    display: '~/.claude',
    hint: 'available across all projects',
    pluginRootEnv: '$HOME/.claude',
  },
  project: {
    key: 'project',
    label: 'Project',
    root: path.join(process.cwd(), '.claude'),
    display: './.claude',
    hint: 'only the current working directory',
    pluginRootEnv: '${CLAUDE_PROJECT_DIR}/.claude',
  },
};

function projectRoot(scopeKey) {
  return scopeKey === 'user' ? homedir() : process.cwd();
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const out = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

async function readJsonIfExists(p) {
  if (!existsSync(p)) return null;
  const raw = await fs.readFile(p, 'utf8');
  if (!raw.trim()) return null;
  return JSON.parse(raw);
}

async function writeJson(p, data) {
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(data, null, 2) + '\n');
}

async function discoverTeams() {
  let entries;
  try {
    entries = await fs.readdir(TEAMS_DIR, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  const teams = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(TEAMS_DIR, entry.name);
    const manifestPath = path.join(dir, 'team.json');
    let manifest = {};
    if (existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
      } catch {
        /* ignore */
      }
    }
    teams.push({
      slug: entry.name,
      name: manifest.name || entry.name,
      description: (manifest.description || '').replace(/\s+/g, ' ').trim(),
      version: manifest.version || '0.0.0',
      dir,
    });
  }
  teams.sort((a, b) => a.slug.localeCompare(b.slug));
  return teams;
}

function manifestPath(teamSlug, scopeKey) {
  return path.join(SCOPES[scopeKey].root, 'agent-teams', teamSlug, 'install.json');
}

function isInstalled(teamSlug, scopeKey) {
  return existsSync(manifestPath(teamSlug, scopeKey));
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  for (const entry of await fs.readdir(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) await copyDir(s, d);
    else if (entry.isSymbolicLink()) await fs.symlink(await fs.readlink(s), d);
    else await fs.copyFile(s, d);
  }
}

async function listFilesRecursive(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listFilesRecursive(p)));
    else out.push(p);
  }
  return out;
}

function rewriteHookCommand(cmd, scopeKey, teamSlug) {
  const scope = SCOPES[scopeKey];
  const replacement = `${scope.pluginRootEnv}/agent-teams/${teamSlug}`;
  return cmd.replaceAll('${CLAUDE_PLUGIN_ROOT}', replacement);
}

function rewriteHookEntries(hooksObj, scopeKey, teamSlug) {
  if (!hooksObj || typeof hooksObj !== 'object') return {};
  const out = {};
  for (const [event, groups] of Object.entries(hooksObj)) {
    if (!Array.isArray(groups)) continue;
    out[event] = groups.map((group) => {
      const next = { ...group };
      if (Array.isArray(group.hooks)) {
        next.hooks = group.hooks.map((h) => {
          if (h && typeof h === 'object' && typeof h.command === 'string') {
            return { ...h, command: rewriteHookCommand(h.command, scopeKey, teamSlug) };
          }
          return h;
        });
      }
      return next;
    });
  }
  return out;
}

async function installTeam(team, scopeKey) {
  const scope = SCOPES[scopeKey];
  const teamSlug = team.slug;
  const installed = {
    team: teamSlug,
    version: team.version,
    scope: scopeKey,
    installedAt: new Date().toISOString(),
    files: [],
    settingsPath: null,
    hookCommands: [],
    mcpPath: null,
    mcpServers: [],
  };

  // 1. skills → <root>/skills/<skill>/
  const teamSkillsDir = path.join(team.dir, 'skills');
  if (existsSync(teamSkillsDir)) {
    for (const entry of await fs.readdir(teamSkillsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const src = path.join(teamSkillsDir, entry.name);
      const dest = path.join(scope.root, 'skills', entry.name);
      if (existsSync(dest)) await fs.rm(dest, { recursive: true, force: true });
      await copyDir(src, dest);
      installed.files.push({ path: dest, type: 'dir' });
    }
  }

  // 2. agents → <root>/agents/<team>-<agent>.md
  const teamAgentsDir = path.join(team.dir, 'agents');
  if (existsSync(teamAgentsDir)) {
    for (const entry of await fs.readdir(teamAgentsDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      const src = path.join(teamAgentsDir, entry.name);
      const dest = path.join(scope.root, 'agents', `${teamSlug}-${entry.name}`);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.copyFile(src, dest);
      installed.files.push({ path: dest, type: 'file' });
    }
  }

  // 3. commands → <root>/commands/<team>-<cmd>.md
  const teamCommandsDir = path.join(team.dir, 'commands');
  if (existsSync(teamCommandsDir)) {
    for (const entry of await fs.readdir(teamCommandsDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      const src = path.join(teamCommandsDir, entry.name);
      const dest = path.join(scope.root, 'commands', `${teamSlug}-${entry.name}`);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.copyFile(src, dest);
      installed.files.push({ path: dest, type: 'file' });
    }
  }

  // 4. scripts → <root>/agent-teams/<team>/scripts/
  const teamScriptsDir = path.join(team.dir, 'scripts');
  if (existsSync(teamScriptsDir)) {
    const dest = path.join(scope.root, 'agent-teams', teamSlug, 'scripts');
    if (existsSync(dest)) await fs.rm(dest, { recursive: true, force: true });
    await copyDir(teamScriptsDir, dest);
    installed.files.push({ path: dest, type: 'dir' });
  }

  // 5. hooks → merge into <root>/settings.json
  const teamHooksFile = path.join(team.dir, 'hooks', 'hooks.json');
  if (existsSync(teamHooksFile)) {
    const teamHooks = JSON.parse(await fs.readFile(teamHooksFile, 'utf8'));
    const rewritten = rewriteHookEntries(teamHooks.hooks || {}, scopeKey, teamSlug);
    const settingsPath = path.join(scope.root, 'settings.json');
    const settings = (await readJsonIfExists(settingsPath)) || {};
    settings.hooks = settings.hooks || {};
    for (const [event, groups] of Object.entries(rewritten)) {
      settings.hooks[event] = settings.hooks[event] || [];
      for (const group of groups) {
        settings.hooks[event].push(group);
        for (const h of group.hooks || []) {
          if (h && typeof h.command === 'string') installed.hookCommands.push(h.command);
        }
      }
    }
    await writeJson(settingsPath, settings);
    installed.settingsPath = settingsPath;
  }

  // 6. mcp servers → merge into <project-root>/.mcp.json (project scope only)
  const teamMcpFile = path.join(team.dir, '.mcp.json');
  if (existsSync(teamMcpFile) && scopeKey === 'project') {
    const teamMcp = JSON.parse(await fs.readFile(teamMcpFile, 'utf8'));
    const mcpPath = path.join(projectRoot(scopeKey), '.mcp.json');
    const existing = (await readJsonIfExists(mcpPath)) || {};
    existing.mcpServers = existing.mcpServers || {};
    const skipped = [];
    for (const [name, def] of Object.entries(teamMcp.mcpServers || {})) {
      if (existing.mcpServers[name]) {
        skipped.push(name);
        continue;
      }
      existing.mcpServers[name] = def;
      installed.mcpServers.push(name);
    }
    if (installed.mcpServers.length) {
      await writeJson(mcpPath, existing);
      installed.mcpPath = mcpPath;
    }
    if (skipped.length) {
      console.log(
        pc.yellow('  ! ') +
          `mcp server${skipped.length > 1 ? 's' : ''} already present, skipped: ${skipped.join(', ')}`,
      );
    }
  } else if (existsSync(teamMcpFile) && scopeKey === 'user') {
    console.log(
      pc.yellow('  ! ') +
        'team ships .mcp.json but user scope does not install MCP servers (project-only). Re-run with --scope project for MCP.',
    );
  }

  // 7. write install manifest
  await writeJson(manifestPath(teamSlug, scopeKey), installed);

  return installed;
}

async function uninstallTeam(teamSlug, scopeKey) {
  const mp = manifestPath(teamSlug, scopeKey);
  if (!existsSync(mp)) return { removed: false, teamSlug };
  const installed = JSON.parse(await fs.readFile(mp, 'utf8'));

  // 1. files & dirs
  for (const f of installed.files || []) {
    if (existsSync(f.path)) await fs.rm(f.path, { recursive: true, force: true });
  }

  // 2. settings.json hooks
  if (installed.settingsPath && existsSync(installed.settingsPath) && installed.hookCommands?.length) {
    const settings = await readJsonIfExists(installed.settingsPath);
    if (settings?.hooks) {
      const cmdSet = new Set(installed.hookCommands);
      for (const event of Object.keys(settings.hooks)) {
        const groups = settings.hooks[event];
        if (!Array.isArray(groups)) continue;
        const filtered = groups.filter((group) => {
          if (!Array.isArray(group.hooks)) return true;
          return !group.hooks.some((h) => h && typeof h.command === 'string' && cmdSet.has(h.command));
        });
        if (filtered.length) settings.hooks[event] = filtered;
        else delete settings.hooks[event];
      }
      if (Object.keys(settings.hooks).length === 0) delete settings.hooks;
      await writeJson(installed.settingsPath, settings);
    }
  }

  // 3. .mcp.json servers
  if (installed.mcpPath && existsSync(installed.mcpPath) && installed.mcpServers?.length) {
    const mcp = await readJsonIfExists(installed.mcpPath);
    if (mcp?.mcpServers) {
      for (const name of installed.mcpServers) delete mcp.mcpServers[name];
      if (Object.keys(mcp.mcpServers).length === 0) delete mcp.mcpServers;
      if (Object.keys(mcp).length === 0) await fs.rm(installed.mcpPath);
      else await writeJson(installed.mcpPath, mcp);
    }
  }

  // 4. manifest itself + empty parent dirs
  await fs.rm(mp);
  const teamDir = path.dirname(mp);
  try {
    const remaining = await fs.readdir(teamDir);
    if (!remaining.length) await fs.rm(teamDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
  const agentTeamsDir = path.join(SCOPES[scopeKey].root, 'agent-teams');
  try {
    const remaining = await fs.readdir(agentTeamsDir);
    if (!remaining.length) await fs.rm(agentTeamsDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }

  return { removed: true, teamSlug, installed };
}

function truncate(str, max) {
  if (!str) return '';
  if (str.length <= max) return str;
  return str.slice(0, Math.max(0, max - 1)) + '…';
}

function tildify(p) {
  const home = homedir();
  return p.startsWith(home) ? '~' + p.slice(home.length) : p;
}

function header(text) {
  return pc.bold(pc.cyan(text));
}

function tag(scopeKey) {
  return scopeKey === 'user' ? pc.magenta('user') : pc.yellow('project');
}

function printBanner() {
  console.log();
  console.log(`${header('claude-agent-teams')} ${pc.dim('· @yarikleto/claude-agent-teams')}`);
  console.log();
}

function parseArgs(argv) {
  const args = {
    command: null,
    names: [],
    scope: null,
    yes: false,
    help: false,
    version: false,
  };
  const tokens = argv.slice(2);
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === '-h' || t === '--help') args.help = true;
    else if (t === '-v' || t === '--version') args.version = true;
    else if (t === '-y' || t === '--yes') args.yes = true;
    else if (t === '--scope') args.scope = tokens[++i];
    else if (t.startsWith('--scope=')) args.scope = t.slice('--scope='.length);
    else if (!args.command) args.command = t;
    else args.names.push(t);
  }
  return args;
}

const HELP_TEXT = `${pc.bold('claude-agent-teams')} ${pc.dim('— install Claude Code agent teams (agents + skills + hooks + scripts + commands)')}

${pc.bold('Usage')}
  ${pc.cyan('claude-agent-teams')}                       interactive menu
  ${pc.cyan('claude-agent-teams list')}                  show all teams + installed state
  ${pc.cyan('claude-agent-teams add')} ${pc.dim('[names...]')}        install one or more teams
  ${pc.cyan('claude-agent-teams remove')} ${pc.dim('[names...]')}     uninstall one or more teams

${pc.bold('Options')}
  ${pc.cyan('--scope <user|project>')}   target install location (default: prompt)
  ${pc.cyan('-y, --yes')}                skip confirmation prompts
  ${pc.cyan('-h, --help')}               show this help
  ${pc.cyan('-v, --version')}            print version

${pc.bold('Scopes')}
  ${pc.magenta('user')}     ${pc.dim('~/.claude/')}      ${pc.dim('available across all projects')}
  ${pc.yellow('project')}  ${pc.dim('./.claude/')}      ${pc.dim('only the current working dir')}

${pc.bold('What gets installed per component')}
  ${pc.dim('skills/')}     → ${pc.dim('<root>/skills/<skill>/')}
  ${pc.dim('agents/')}     → ${pc.dim('<root>/agents/<team>-<agent>.md')}
  ${pc.dim('commands/')}   → ${pc.dim('<root>/commands/<team>-<command>.md')}
  ${pc.dim('scripts/')}    → ${pc.dim('<root>/agent-teams/<team>/scripts/')}
  ${pc.dim('hooks/')}      → ${pc.dim('merged into <root>/settings.json')}
  ${pc.dim('.mcp.json')}   → ${pc.dim('merged into <cwd>/.mcp.json (project scope only)')}
`;

async function readVersion() {
  try {
    const pkg = JSON.parse(await fs.readFile(path.join(REPO_ROOT, 'package.json'), 'utf8'));
    return pkg.version;
  } catch {
    return 'unknown';
  }
}

function ensureTTY() {
  if (!process.stdout.isTTY || !process.stdin.isTTY) {
    console.error(
      pc.red('error: ') +
        'interactive prompt is unavailable in this environment. Pass --scope and team names explicitly.',
    );
    process.exit(2);
  }
}

async function pickScope({ message = 'Pick a scope' } = {}) {
  return select({
    message,
    choices: [
      {
        name: `${pc.bold('User')} ${pc.dim('— ' + SCOPES.user.display + ' · ' + SCOPES.user.hint)}`,
        value: 'user',
        short: 'user',
      },
      {
        name: `${pc.bold('Project')} ${pc.dim('— ' + SCOPES.project.display + ' · ' + SCOPES.project.hint)}`,
        value: 'project',
        short: 'project',
      },
    ],
  });
}

function teamCheckboxItem(team, scopeKey, { onlyInstalled = false } = {}) {
  const installed = isInstalled(team.slug, scopeKey);
  if (onlyInstalled && !installed) return null;
  const desc = truncate(team.description, 90);
  const marker = installed ? pc.green('✓ ') : '  ';
  const trailing = !onlyInstalled && installed ? ' ' + pc.dim('(installed)') : '';
  return {
    name: `${marker}${pc.bold(team.slug)}${trailing}\n   ${pc.dim(desc)}`,
    value: team.slug,
    short: team.slug,
    checked: false,
    disabled: onlyInstalled && !installed ? pc.dim('(not installed)') : false,
  };
}

function findTeamsByNames(teams, names) {
  const found = [];
  const missing = [];
  for (const requested of names) {
    const team = teams.find((t) => t.slug === requested || t.name === requested);
    if (team) found.push(team);
    else missing.push(requested);
  }
  return { found, missing };
}

async function commandList() {
  const teams = await discoverTeams();
  printBanner();
  if (!teams.length) {
    console.log(pc.dim('No teams found in this repo.'));
    return 0;
  }

  const widths = {
    slug: Math.max(4, ...teams.map((t) => t.slug.length)),
  };
  const userPath = tildify(SCOPES.user.root);
  const projPath = tildify(SCOPES.project.root);
  const headerLine = pc.dim(`${'TEAM'.padEnd(widths.slug)}   USER  PROJ   DESCRIPTION`);
  console.log(headerLine);
  console.log(pc.dim('─'.repeat(Math.min(process.stdout.columns || 80, 100))));
  for (const team of teams) {
    const u = isInstalled(team.slug, 'user') ? pc.green(' ✓ ') : pc.dim(' · ');
    const p = isInstalled(team.slug, 'project') ? pc.green(' ✓ ') : pc.dim(' · ');
    const cols = process.stdout.columns || 80;
    const descRoom = Math.max(20, cols - widths.slug - 14);
    console.log(
      `${pc.bold(team.slug.padEnd(widths.slug))}    ${u}   ${p}  ${pc.dim(truncate(team.description, descRoom))}`,
    );
  }
  console.log();
  console.log(`${pc.magenta('user')}    ${pc.dim(userPath)}`);
  console.log(`${pc.yellow('project')} ${pc.dim(projPath)}`);
  return 0;
}

function summarizeInstall(installed) {
  const counts = {
    skills: 0,
    agents: 0,
    commands: 0,
    scripts: 0,
  };
  for (const f of installed.files || []) {
    if (f.path.includes('/skills/') && f.type === 'dir') counts.skills++;
    else if (f.path.includes('/agents/')) counts.agents++;
    else if (f.path.includes('/commands/')) counts.commands++;
    else if (f.path.includes('/scripts')) counts.scripts++;
  }
  const parts = [];
  if (counts.skills) parts.push(`${counts.skills} skill${counts.skills > 1 ? 's' : ''}`);
  if (counts.agents) parts.push(`${counts.agents} agent${counts.agents > 1 ? 's' : ''}`);
  if (counts.commands) parts.push(`${counts.commands} command${counts.commands > 1 ? 's' : ''}`);
  if (counts.scripts) parts.push('scripts');
  if (installed.hookCommands?.length) parts.push(`${installed.hookCommands.length} hook${installed.hookCommands.length > 1 ? 's' : ''}`);
  if (installed.mcpServers?.length) parts.push(`${installed.mcpServers.length} mcp server${installed.mcpServers.length > 1 ? 's' : ''}`);
  return parts.join(', ');
}

async function performInstall(teams, scopeKey) {
  const results = [];
  for (const team of teams) {
    const wasInstalled = isInstalled(team.slug, scopeKey);
    if (wasInstalled) await uninstallTeam(team.slug, scopeKey);
    const installed = await installTeam(team, scopeKey);
    results.push({ team, installed, replaced: wasInstalled });
  }
  console.log();
  for (const r of results) {
    const verb = r.replaced ? pc.yellow('reinstalled') : pc.green('installed');
    const summary = summarizeInstall(r.installed);
    console.log(
      `  ${verb} ${pc.bold(r.team.slug)} ${pc.dim('(' + summary + ')')} ${pc.dim('→ ' + tildify(SCOPES[scopeKey].root))}`,
    );
  }
  console.log();
  return results;
}

async function performRemove(slugs, scopeKey) {
  const results = [];
  for (const slug of slugs) {
    const r = await uninstallTeam(slug, scopeKey);
    results.push(r);
  }
  console.log();
  for (const r of results) {
    if (r.removed)
      console.log(
        `  ${pc.red('removed')}     ${pc.bold(r.teamSlug)} ${pc.dim('← ' + tildify(SCOPES[scopeKey].root))}`,
      );
    else
      console.log(
        `  ${pc.dim('skipped')}     ${pc.bold(r.teamSlug)} ${pc.dim('(not installed in ' + tildify(SCOPES[scopeKey].root) + ')')}`,
      );
  }
  console.log();
  return results;
}

async function commandAdd({ names, scope, yes }) {
  const teams = await discoverTeams();
  if (!teams.length) {
    console.error(pc.red('error: ') + 'no teams found in this repo.');
    return 1;
  }

  let chosen;
  let scopeKey = scope;

  if (names.length) {
    const { found, missing } = findTeamsByNames(teams, names);
    if (missing.length) {
      console.error(
        pc.red('error: ') + `unknown team${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`,
      );
      console.error(pc.dim('available: ') + teams.map((t) => t.slug).join(', '));
      return 1;
    }
    chosen = found;
  }

  if (!scopeKey) {
    ensureTTY();
    printBanner();
    scopeKey = await pickScope({ message: 'Install where?' });
  }
  if (!SCOPES[scopeKey]) {
    console.error(pc.red('error: ') + `invalid scope "${scopeKey}". Use "user" or "project".`);
    return 1;
  }

  if (!chosen) {
    ensureTTY();
    const items = teams.map((t) => teamCheckboxItem(t, scopeKey)).filter(Boolean);
    const picked = await checkbox({
      message: `Teams to install into ${tag(scopeKey)} ${pc.dim('(' + tildify(SCOPES[scopeKey].root) + ')')}`,
      choices: items,
      pageSize: Math.min(20, items.length + 1),
      required: true,
      instructions: pc.dim(' ↑/↓ navigate · space toggle · a all · i invert · enter confirm'),
    });
    chosen = teams.filter((t) => picked.includes(t.slug));
  }

  if (!chosen.length) return 0;

  const willOverwrite = chosen.filter((t) => isInstalled(t.slug, scopeKey));
  if (willOverwrite.length && !yes && process.stdout.isTTY) {
    const ok = await confirm({
      message: `${willOverwrite.length} team${willOverwrite.length > 1 ? 's are' : ' is'} already installed (${willOverwrite
        .map((t) => t.slug)
        .join(', ')}). Reinstall?`,
      default: true,
    });
    if (!ok) {
      chosen = chosen.filter((t) => !isInstalled(t.slug, scopeKey));
      if (!chosen.length) {
        console.log(pc.dim('Nothing to do.'));
        return 0;
      }
    }
  }

  await performInstall(chosen, scopeKey);
  return 0;
}

async function commandRemove({ names, scope, yes }) {
  const teams = await discoverTeams();
  let scopeKey = scope;
  let chosen;

  if (names.length) {
    chosen = names;
  }

  if (!scopeKey) {
    ensureTTY();
    printBanner();
    scopeKey = await pickScope({ message: 'Remove from where?' });
  }
  if (!SCOPES[scopeKey]) {
    console.error(pc.red('error: ') + `invalid scope "${scopeKey}". Use "user" or "project".`);
    return 1;
  }

  if (!chosen) {
    ensureTTY();
    const items = teams.map((t) => teamCheckboxItem(t, scopeKey, { onlyInstalled: true })).filter(Boolean);
    const installed = items.filter((it) => !it.disabled);
    if (!installed.length) {
      console.log(
        pc.dim(`No teams installed in ${tag(scopeKey)} (${tildify(SCOPES[scopeKey].root)}).`),
      );
      return 0;
    }
    const picked = await checkbox({
      message: `Teams to remove from ${tag(scopeKey)} ${pc.dim('(' + tildify(SCOPES[scopeKey].root) + ')')}`,
      choices: installed,
      pageSize: Math.min(20, installed.length + 1),
      required: true,
      instructions: pc.dim(' ↑/↓ navigate · space toggle · a all · i invert · enter confirm'),
    });
    chosen = picked;
  }

  if (!chosen.length) return 0;

  const present = chosen.filter((slug) => isInstalled(slug, scopeKey));
  if (!present.length) {
    console.log(pc.dim(`Nothing to remove — none of those are installed in ${tag(scopeKey)}.`));
    return 0;
  }

  if (!yes && process.stdout.isTTY) {
    const ok = await confirm({
      message: `Remove ${present.length} team${present.length > 1 ? 's' : ''} from ${SCOPES[scopeKey].label.toLowerCase()} scope?`,
      default: true,
    });
    if (!ok) return 0;
  }

  await performRemove(chosen, scopeKey);
  return 0;
}

async function interactiveMenu() {
  printBanner();
  while (true) {
    const action = await select({
      message: 'What do you want to do?',
      choices: [
        { name: `${pc.green('Add')} teams`, value: 'add' },
        { name: `${pc.red('Remove')} teams`, value: 'remove' },
        { name: `${pc.cyan('List')} teams`, value: 'list' },
        { name: pc.dim('Quit'), value: 'quit' },
      ],
    });
    if (action === 'quit') return 0;
    if (action === 'list') {
      await commandList();
    } else if (action === 'add') {
      await commandAdd({ names: [], scope: null, yes: false });
    } else if (action === 'remove') {
      await commandRemove({ names: [], scope: null, yes: false });
    }

    const again = await confirm({
      message: 'Anything else?',
      default: false,
    });
    if (!again) return 0;
  }
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    process.stdout.write(HELP_TEXT);
    return 0;
  }
  if (args.version) {
    console.log(await readVersion());
    return 0;
  }
  if (args.scope && !SCOPES[args.scope]) {
    console.error(pc.red('error: ') + `invalid --scope "${args.scope}". Use "user" or "project".`);
    return 1;
  }

  switch (args.command) {
    case null:
    case undefined:
      ensureTTY();
      return interactiveMenu();
    case 'list':
    case 'ls':
      return commandList();
    case 'add':
    case 'install':
      return commandAdd(args);
    case 'remove':
    case 'rm':
    case 'uninstall':
      return commandRemove(args);
    default:
      console.error(pc.red('error: ') + `unknown command "${args.command}"`);
      process.stdout.write('\n' + HELP_TEXT);
      return 1;
  }
}

main()
  .then((code) => process.exit(code ?? 0))
  .catch((err) => {
    if (err && err.name === 'ExitPromptError') {
      console.log();
      console.log(pc.dim('Cancelled.'));
      process.exit(130);
    }
    console.error(pc.red('error: ') + (err?.message || err));
    process.exit(1);
  });
