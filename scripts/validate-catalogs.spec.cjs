const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')
const { validate, REGISTRY } = require('./validate-catalogs.cjs')

const repo = path.resolve(__dirname, '..')
const roots = []
test.after(() => roots.forEach(root => fs.rmSync(root, { recursive: true, force: true })))
const read = file => JSON.parse(fs.readFileSync(path.join(repo, file), 'utf8'))
const windowTodo = catalog => catalog.plugins.find(plugin => plugin.name === 'window-todo')
const packument = () => ({
  name: 'window-todo',
  'dist-tags': { latest: '0.8.0' },
  versions: {
    '0.8.0': {
      name: 'window-todo',
      version: '0.8.0',
      dist: {
        tarball: 'https://github.com/mrtaler/window-todo/releases/download/v0.8.0/window-todo-0.8.0.tgz',
        integrity: `sha512-${Buffer.alloc(64, 1).toString('base64')}`,
      },
    },
  },
})

// Writes a temporary repository root: the current catalogs switched to an npm window-todo release,
// then lets the test break one thing.
function fixture(mutate = () => {}) {
  const claude = read('.claude-plugin/marketplace.json')
  const codex = read('.agents/plugins/marketplace.json')
  const doc = packument()
  windowTodo(claude).source.ref = 'v0.8.0'
  windowTodo(codex).source = { source: 'npm', package: 'window-todo', version: '0.8.0', registry: REGISTRY }
  mutate({ claude, codex, doc })
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ap-spec-'))
  roots.push(root)
  for (const [file, value] of [['.claude-plugin/marketplace.json', claude], ['.agents/plugins/marketplace.json', codex], ['registry/window-todo', doc]]) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), JSON.stringify(value))
  }
  return root
}

test('current catalogs pass', () => assert.match(validate(repo), /^Catalogs valid/))
test('npm entry with a matching packument and Claude ref passes', () => assert.match(validate(fixture()), /1 registry packages/))
test('wrong registry fails', () => assert.throws(() => validate(fixture(({ codex }) => { windowTodo(codex).source.registry = 'https://registry.npmjs.org' })), /registry must be/))
test('version missing from the packument fails', () => assert.throws(() => validate(fixture(({ codex }) => { windowTodo(codex).source.version = '0.9.0' })), /has no version 0\.9\.0/))
test('bad integrity fails', () => assert.throws(() => validate(fixture(({ doc }) => { doc.versions['0.8.0'].dist.integrity = 'sha1-abc' })), /dist\.integrity must be sha512/))
test('Claude ref mismatch fails', () => assert.throws(() => validate(fixture(({ claude }) => { windowTodo(claude).source.ref = 'v0.7.0' })), /Claude ref must be v0\.8\.0/))
test('npm entry in the Claude catalog fails', () => assert.throws(() => validate(fixture(({ claude, codex }) => { windowTodo(claude).source = { ...windowTodo(codex).source } })), /allowed only in the Codex catalog/))
