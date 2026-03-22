const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const templatePath = path.join(
  __dirname,
  '..',
  'templates',
  '.claude',
  'agents',
  'ui-ux-review-agent.md'
);

const template = fs.readFileSync(templatePath, 'utf8');

test('uses the supported PinchTab instance start endpoint', () => {
  assert.match(template, /POST http:\/\/localhost:9867\/instances\/start/);
  assert.doesNotMatch(template, /POST http:\/\/localhost:9867\/instances\/launch/);
});
