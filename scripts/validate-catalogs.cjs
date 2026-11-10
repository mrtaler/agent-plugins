const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const claude = JSON.parse(fs.readFileSync(path.join(root, '.claude-plugin/marketplace.json'), 'utf8'))
const codex = JSON.parse(fs.readFileSync(path.join(root, '.agents/plugins/marketplace.json'), 'utf8'))
assert.equal(claude.name, codex.name, 'Both clients must use the same marketplace name')

for (const [client, catalog] of [['Claude', claude], ['Codex', codex]]) {
  assert.ok(Array.isArray(catalog.plugins), `${client}: plugins must be an array`)
  const names = new Set()
  for (const entry of catalog.plugins) {
    assert.ok(typeof entry.name === 'string' && entry.name, `${client}: missing plugin name`)
    assert.ok(!names.has(entry.name), `${client}: duplicate plugin ${entry.name}`)
    names.add(entry.name)
    assert.ok(entry.source && typeof entry.source === 'object', `${client}/${entry.name}: missing source`)
    if (entry.source.source === 'url') assert.match(entry.source.url, /^https:\/\/[^\s]+\.git$/, `${client}/${entry.name}: expected a Git URL`)
    assert.match(String(entry.source.ref ?? ''), /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/, `${client}/${entry.name}: ref must be a release tag such as v1.2.3`)
    assert.equal(entry.source.sha, undefined, `${client}/${entry.name}: pin by ref (release tag), not sha`)
    if (client === 'Codex') {
      assert.equal(entry.policy?.installation, 'AVAILABLE', `${entry.name}: explicit installation policy required`)
      assert.ok(typeof entry.category === 'string', `${entry.name}: category required`)
    }
  }
}

for (const entry of codex.plugins) {
  const equivalent = claude.plugins.find(plugin => plugin.name === entry.name)
  if (equivalent) assert.deepEqual(entry.source, equivalent.source, `${entry.name}: client catalogs must select the same source revision`)
}
console.log(`Catalogs valid: ${claude.plugins.length} Claude plugins, ${codex.plugins.length} Codex plugins`)
