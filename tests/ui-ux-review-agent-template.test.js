const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const templatePath = path.join(
  __dirname,
  '..',
  'templates',
  'agents-shared',
  'ui-ux-review-agent.md'
);

const template = fs.readFileSync(templatePath, 'utf8');

test('uses the supported PinchTab instance start endpoint', () => {
  assert.match(template, /POST http:\/\/localhost:9867\/instances\/start/);
  assert.doesNotMatch(template, /POST http:\/\/localhost:9867\/instances\/launch/);
});

test('parses snapshot data from PinchTab nodes using documented fields', () => {
  assert.match(
    template,
    /The `nodes` array contains fields such as `ref`, `role`,\s+and `name`/
  );
  assert.doesNotMatch(template, /The `refs` array contains:/);
  assert.match(template, /Scan nodes: `role == X` AND `name` contains Y/);
  assert.match(template, /click it using its `ref`/);
});

test('preflights the first asserted route instead of the bare dev server root', () => {
  assert.match(template, /Extract the `dev_server` URL and the first asserted `route`/);
  assert.match(template, /curl -s -o \/dev\/null -w "%\{http_code\}" "\{dev_server\}\{route\}"/);
  assert.doesNotMatch(
    template,
    /curl -s -o \/dev\/null -w "%\{http_code\}" http:\/\/localhost:3000/
  );
});
