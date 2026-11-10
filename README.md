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
Codex uses MCP tools and a companion terminal pane.

Every entry points at a release tag of its plugin repository through `source.ref`. A plugin
release opens a pull request here that moves `ref` to the new tag in both catalogs, so the
catalog lists only released versions.

`window-todo` keeps its shared core and client adapters in one source repository. Its MR
pipeline builds and tests an installable package; after merge, semantic-release updates
the version, rebuilds and validates the package, and publishes the tagged runtime. The
release bot then proposes the new tag here. Source refactoring and generated JS therefore
do not require copied implementations in this catalog.

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
    "url": "https://github.com/mrtaler/<repo>.git",
    "ref": "v<version>"
  }
}
```

OpenAI Codex, `.agents/plugins/marketplace.json`:

```json
{
  "name": "<plugin>",
  "source": {
    "source": "url",
    "url": "https://github.com/mrtaler/<repo>.git",
    "ref": "v<version>"
  },
  "policy": {
    "installation": "AVAILABLE",
    "authentication": "ON_INSTALL"
  },
  "category": "Productivity"
}
```

Set `ref` to the plugin's release tag (`"ref": "v1.2.3"`) in both formats. Both client catalogs
must select the same tag for a plugin they share.

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
