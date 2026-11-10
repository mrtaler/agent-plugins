const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const REGISTRY = 'https://raw.githubusercontent.com/mrtaler/agent-plugins/master/registry'
const GIT_SOURCES = new Set(['url', 'github', 'git-subdir'])
const STABLE = /^\d+\.\d+\.\d+$/

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'))

function validatePackument(root, name, label = `registry/${name}`) {
  const file = path.join(root, 'registry', name)
  assert.ok(fs.existsSync(file), `${label}: registry/${name} is missing`)
  let doc
  try { doc = readJson(file) } catch (error) { assert.fail(`${label}: registry/${name} is not valid JSON (${error.message})`) }
  assert.equal(doc.name, name, `${label}: packument name must be ${name}`)
  assert.ok(doc.versions && typeof doc.versions === 'object', `${label}: packument versions must be an object`)
  for (const [version, meta] of Object.entries(doc.versions)) {
    assert.match(version, STABLE, `${label}@${version}: version must be X.Y.Z`)
    assert.equal(meta.name, name, `${label}@${version}: name must be ${name}`)
    assert.equal(meta.version, version, `${label}@${version}: version field must be ${version}`)
    assert.match(String(meta.dist?.tarball ?? ''), /^https:\/\/\S+$/, `${label}@${version}: dist.tarball must be an https URL`)
    assert.match(String(meta.dist?.integrity ?? ''), /^sha512-[A-Za-z0-9+/]+=*$/, `${label}@${version}: dist.integrity must be sha512-<base64>`)
  }
  assert.ok(Object.hasOwn(doc.versions, String(doc['dist-tags']?.latest)), `${label}: dist-tags.latest must name a listed version`)
  return doc
}

function validate(root) {
  const claude = readJson(path.join(root, '.claude-plugin/marketplace.json'))
  const codex = readJson(path.join(root, '.agents/plugins/marketplace.json'))
  assert.equal(claude.name, codex.name, 'Both clients must use the same marketplace name')

  for (const [client, catalog] of [['Claude', claude], ['Codex', codex]]) {
    assert.ok(Array.isArray(catalog.plugins), `${client}: plugins must be an array`)
    const names = new Set()
    for (const entry of catalog.plugins) {
      assert.ok(typeof entry.name === 'string' && entry.name, `${client}: missing plugin name`)
      assert.ok(!names.has(entry.name), `${client}: duplicate plugin ${entry.name}`)
      names.add(entry.name)
      const source = entry.source
      assert.ok(source && typeof source === 'object', `${client}/${entry.name}: missing source`)
      if (GIT_SOURCES.has(source.source)) {
        if (source.source === 'url') assert.match(source.url, /^https:\/\/[^\s]+\.git$/, `${client}/${entry.name}: expected a Git URL`)
        assert.match(String(source.ref ?? ''), /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/, `${client}/${entry.name}: ref must be a release tag such as v1.2.3`)
        assert.equal(source.sha, undefined, `${client}/${entry.name}: pin by ref (release tag), not sha`)
      } else if (source.source === 'npm') {
        assert.equal(client, 'Codex', `${client}/${entry.name}: npm sources are allowed only in the Codex catalog`)
        assert.equal(source.package, entry.name, `${client}/${entry.name}: package must equal the plugin name`)
        assert.match(String(source.version ?? ''), STABLE, `${client}/${entry.name}: version must be a stable X.Y.Z`)
        assert.equal(source.registry, REGISTRY, `${client}/${entry.name}: registry must be ${REGISTRY}`)
        const doc = validatePackument(root, source.package, `${client}/${entry.name}`)
        assert.ok(Object.hasOwn(doc.versions, source.version), `${client}/${entry.name}: registry/${source.package} has no version ${source.version}`)
      } else {
        assert.fail(`${client}/${entry.name}: unsupported source type ${JSON.stringify(source.source)} (expected url, github, git-subdir or npm)`)
      }
      if (client === 'Codex') {
        assert.equal(entry.policy?.installation, 'AVAILABLE', `${entry.name}: explicit installation policy required`)
        assert.ok(typeof entry.category === 'string', `${entry.name}: category required`)
      }
    }
  }

  for (const entry of codex.plugins) {
    const equivalent = claude.plugins.find(plugin => plugin.name === entry.name)
    if (!equivalent) continue
    if (entry.source.source === 'npm') {
      assert.equal(equivalent.source.ref, `v${entry.source.version}`, `${entry.name}: Claude ref must be v${entry.source.version}, the release the Codex npm version names`)
    } else {
      assert.deepEqual(entry.source, equivalent.source, `${entry.name}: client catalogs must select the same source revision`)
    }
  }

  const registryDir = path.join(root, 'registry')
  const packuments = fs.existsSync(registryDir) ? fs.readdirSync(registryDir).filter(name => !name.startsWith('.')) : []
  for (const name of packuments) validatePackument(root, name)
  return `Catalogs valid: ${claude.plugins.length} Claude plugins, ${codex.plugins.length} Codex plugins, ${packuments.length} registry packages`
}

module.exports = { validate, REGISTRY }

if (require.main === module) console.log(validate(path.resolve(process.argv[2] ?? path.join(__dirname, '..'))))
