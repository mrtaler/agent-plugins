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

Every Claude Code entry points at a release tag of its plugin repository through `source.ref`.
A Codex entry is either the same Git source pinned by the same tag, or an npm source served
by the static npm registry in `registry/`: `registry/<package>` lists the released
versions, and each version's tarball is the npm-format archive attached to the plugin's
GitHub release. Either way the catalog lists only released versions.

`window-todo` keeps its shared core and client adapters in one source repository and cuts
one release tag per version. Claude Code installs that tag from sources; Codex installs the
npm-format archive of the same release through `registry/window-todo`. The plugin's release
bot opens a pull request here that moves the Claude `ref`, sets the Codex `version` and adds
the version to `registry/window-todo`, so the three stay in step.

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

A Codex entry may instead install the release archive through the registry in this repository:

```json
"source": {
  "source": "npm",
  "package": "<plugin>",
  "version": "<version>",
  "registry": "https://raw.githubusercontent.com/mrtaler/agent-plugins/master/registry"
}
```

`package` is the plugin name, `version` a stable `X.Y.Z` listed in `registry/<plugin>`, and the
Claude Code entry's `ref` must be `v<version>`. Codex accepts only `https` registries.

Check both catalogs and the Claude Code format before committing:

```sh
node scripts/validate-catalogs.cjs
node --test scripts/*.spec.cjs
claude plugin validate --strict .
```

## Releases

Releases are cut by [semantic-release](https://semantic-release.gitbook.io/) on every push
to `master`. The version and `CHANGELOG.md` are derived from
[Conventional Commits](https://www.conventionalcommits.org/): `fix:` makes a patch release,
`feat:` a minor release, and a `!` or a `BREAKING CHANGE:` footer a major release.

## Licence

The catalog is MIT-licensed, see [LICENSE](LICENSE). Each listed plugin carries its own licence.
