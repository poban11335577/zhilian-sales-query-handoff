const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

const source = fs.readFileSync(path.join(__dirname, '../src/parse-query.js'), 'utf8');
const context = vm.createContext({});
vm.runInContext(source, context);

const base = {
  startDate: '2026-10-01', endDate: '2026-10-20', productScope: 'all',
  productName: '', queryContent: '销售汇总', needClarification: false, clarification: ''
};
function run(data) {
  return context.main({jsonText: typeof data === 'string' ? data : JSON.stringify(data)});
}
function expectState(output, ready) {
  assert.equal(output.queryStatus, ready ? 'ready' : 'clarify');
  assert.equal(output.needClarification, !ready);
  assert.equal(typeof output.clarification, 'string');
  if (!ready) assert.notEqual(output.clarification, '');
}

test('valid absolute period and explicit all-products scope', () => {
  const output = run(base);
  expectState(output, true);
  assert.equal(output.startDate, base.startDate);
  assert.equal(output.endDate, base.endDate);
});
test('accepts a JSON markdown fence without changing valid values', () => {
  expectState(run('```json\n' + JSON.stringify(base) + '\n```'), true);
});
test('requires missing dates and rejects impossible calendar dates', () => {
  for (const startDate of ['', '2026-02-30', '2025-02-29', '2026-13-01', '2026-1-01']) {
    expectState(run({...base, startDate}), false);
  }
});
test('accepts a real leap-day period', () => {
  expectState(run({...base, startDate:'2024-02-29', endDate:'2024-02-29'}), true);
});
test('rejects a reversed period', () => {
  expectState(run({...base, startDate:'2026-10-21'}), false);
});
test('requires an explicit supported product scope', () => {
  for (const productScope of ['', 'unknown', 'everything']) {
    expectState(run({...base, productScope}), false);
  }
});
test('requires a name for a specific product and preserves a valid name', () => {
  expectState(run({...base, productScope:'specific'}), false);
  const output = run({...base, productScope:'specific', productName:' 测试商品 '});
  expectState(output, true);
  assert.equal(output.productName, '测试商品');
});
test('explicit all-products scope clears an irrelevant product name', () => {
  const output = run({...base, productName:'stale value'});
  expectState(output, true);
  assert.equal(output.productName, '');
});
test('preserves a model request for clarification', () => {
  const output = run({...base, needClarification:true, clarification:'请补充信息'});
  expectState(output, false);
  assert.equal(output.clarification, '请补充信息');
});
test('does not interpret the string false as boolean false', () => {
  expectState(run({...base, needClarification:'false'}), false);
});
test('missing boolean does not permit an API call', () => {
  const data = {...base}; delete data.needClarification;
  expectState(run(data), false);
});
test('invalid JSON, null and arrays fail closed', () => {
  for (const raw of ['not json', '{', 'null', '[]']) expectState(run(raw), false);
});
test('missing node input returns a clarification instead of throwing', () => {
  expectState(context.main({}), false);
  expectState(context.main(undefined), false);
});
