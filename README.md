# agent-plugins

A plugin catalog for Claude Code and OpenAI Codex. The repository holds no plugin code:
it only lists plugins, and each plugin lives in its own repository under its own licence.

The catalog is named `mrtaler` and is published in two files:

| File                               | Read by      |
|------------------------------------|--------------|
| `.claude-plugin/marketplace.json`  | Claude Code  |
| `.agents/plugins/marketplace.json` | OpenAI Codex |

There are two files because the formats differ: Claude Code warns about the Codex-only
fields, and `claude plugin validate --strict` rejects them.

## Install

### Claude Code

```sh
claude plugin marketplace add mrtaler/agent-plugins
claude plugin install <plugin>@mrtaler
```

### OpenAI Codex

```sh
codex plugin marketplace add mrtaler/agent-plugins
```

Then open `/plugins` in Codex and pick a plugin.

Or install the first shared plugin directly:

```sh
codex plugin add window-todo@mrtaler
```

`window-todo` ships both client manifests in one repository. Claude uses its native pane;
Codex uses MCP tools and a companion terminal pane. Both catalogs use the plugin repository's
default branch, so plugin releases update independently of catalog releases. The catalog
contains no duplicated plugin implementation.

## Adding a plugin

Add an entry to the `plugins` array of the catalog file for each agent the plugin supports.
A plugin that only works in Claude Code (hooks, panes, a status line) goes only into the
Claude Code file.

Claude Code, `.claude-plugin/marketplace.json`:

```json
{
  "name": "<plugin>",
  "source": {
    "source": "url",
    "url": "https://github.com/mrtaler/<repo>.git"
  }
}
```

OpenAI Codex, `.agents/plugins/marketplace.json`:

```json
{
  "name": "<plugin>",
  "source": {
    "source": "url",
    "url": "https://github.com/mrtaler/<repo>.git"
  },
  "policy": {
    "installation": "AVAILABLE",
    "authentication": "ON_INSTALL"
  },
  "category": "Productivity"
}
```

Both formats accept an optional `ref` (branch or tag) or `sha` in `source` to pin the plugin.
Leave those fields unset for plugins that should follow their repository's default branch.
For a plugin deliberately pinned to a revision, keep both client catalogs in sync.

Check both catalogs and the Claude Code format before committing:

```sh
node scripts/validate-catalogs.cjs
claude plugin validate --strict .
```

## Releases

Releases are cut by [semantic-release](https://semantic-release.gitbook.io/) on every push
to `master`. The version and `CHANGELOG.md` are derived from
[Conventional Commits](https://www.conventionalcommits.org/): `fix:` makes a patch release,
`feat:` a minor release, and a `!` or a `BREAKING CHANGE:` footer a major release.

## Licence

The catalog is MIT-licensed, see [LICENSE](LICENSE). Each listed plugin carries its own licence.
