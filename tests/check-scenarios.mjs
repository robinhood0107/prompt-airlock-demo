import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const scenarios = require(path.join(root, "scenarios.js"));
const expected = [
  { id: "normal", title: "정상 보호", mockCalls: 1, sentMessages: 1, eventTitles: ["가명 처리 후 전송", "응답 복원"] },
  { id: "confirmation", title: "확인 대기", mockCalls: 0, sentMessages: 0, eventTitles: ["검사", "확인 필요", "전송"] },
  { id: "blocked", title: "정책 차단", mockCalls: 0, sentMessages: 0, eventTitles: ["정책 차단", "전송"] }
];

assert.deepEqual(scenarios.map(item => item.id), expected.map(item => item.id));
for (const contract of expected) {
  const actual = scenarios.find(item => item.id === contract.id);
  assert.equal(actual.title, contract.title);
  assert.equal(actual.mockCalls, contract.mockCalls);
  assert.equal(actual.sentMessages, contract.sentMessages);
  assert.equal(actual.providerCalls, 0);
  assert.ok(actual.inputLabel && actual.inputText);
  assert.deepEqual(actual.events.map(event => event.title), contract.eventTitles);
  const allText = JSON.stringify(actual);
  assert.doesNotMatch(allText, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
  assert.doesNotMatch(allText, /\bBearer\s+[A-Za-z0-9._~-]{12,}/);
  console.log("PASS " + actual.id + ": mock=" + actual.mockCalls + ", sent=" + actual.sentMessages + ", provider=" + actual.providerCalls);
}

const normal = scenarios.find(item => item.id === "normal");
assert.equal(normal.events[0].kind, "outgoing");
assert.match(normal.events[0].body, /\[PERSON_01\]/);
assert.match(normal.events[0].note, /모의 전송 1회/);
assert.equal(normal.events[1].kind, "reply");

const confirmation = scenarios.find(item => item.id === "confirmation");
assert.equal(confirmation.events[0].kind, "inspection");
assert.equal(confirmation.events[1].kind, "decision");
assert.match(confirmation.events[1].body, /실제 가명화나 본문 반환은 없습니다/);
assert.doesNotMatch(JSON.stringify(confirmation), /\[PERSON_|대상 \[/);

const blocked = scenarios.find(item => item.id === "blocked");
assert.equal(blocked.events[0].kind, "decision");
assert.equal(blocked.events[1].note, "전송 0회");
assert.doesNotMatch(JSON.stringify(blocked), /\[PERSON_|가명 처리 후 전송|응답 복원/);
console.log("PASS 판정 순서와 확인 대기 본문 경계");
