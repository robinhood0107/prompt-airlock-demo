(function (root) {
  "use strict";

  const scenarios = [
    {
      id: "normal",
      title: "정상 보호",
      inputLabel: "합성 입력",
      inputText: "합성 대상 A의 일정을 요약해 주세요.",
      mockCalls: 1,
      sentMessages: 1,
      providerCalls: 0,
      events: [
        { kind: "outgoing", title: "가명 처리 후 전송", body: "대상 [PERSON_01]의 일정을 요약해 주세요.", note: "모의 전송 1회" },
        { kind: "reply", title: "응답 복원", body: "합성 대상 A의 일정 요약을 준비했습니다." }
      ]
    },
    {
      id: "confirmation",
      title: "확인 대기",
      inputLabel: "합성 입력",
      inputText: "확인 대기 합성 사례입니다.",
      mockCalls: 0,
      sentMessages: 0,
      providerCalls: 0,
      events: [
        { kind: "inspection", title: "검사", body: "고정된 합성 요청을 검사합니다." },
        { kind: "decision", title: "확인 필요", body: "검사 뒤 확인 판정에서 멈춥니다. 실제 가명화나 본문 반환은 없습니다." },
        { kind: "note", title: "전송", note: "전송 0회" }
      ]
    },
    {
      id: "blocked",
      title: "정책 차단",
      inputLabel: "합성 입력",
      inputText: "정책 차단 합성 사례입니다.",
      mockCalls: 0,
      sentMessages: 0,
      providerCalls: 0,
      events: [
        { kind: "decision", title: "정책 차단", body: "검사 중 차단되어 가명화 전송 단계에 도달하지 않습니다." },
        { kind: "note", title: "전송", note: "전송 0회" }
      ]
    }
  ];

  const frozen = Object.freeze(scenarios.map(function (scenario) {
    return Object.freeze(Object.assign({}, scenario, {
      events: Object.freeze(scenario.events.map(function (event) { return Object.freeze(event); }))
    }));
  }));

  if (typeof module === "object" && module.exports) module.exports = frozen;
  root.PA_DEMO_SCENARIOS = frozen;
})(globalThis);
