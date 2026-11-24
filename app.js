"use strict";

(function () {
  const scenarios = window.PA_DEMO_SCENARIOS;
  const caseButtons = Array.from(document.querySelectorAll("[data-case]"));
  const sidebar = document.getElementById("case-sidebar");
  const chatMain = document.getElementById("chat-main");
  const menuToggle = document.getElementById("menu-toggle");
  const sidebarScrim = document.getElementById("sidebar-scrim");
  const caseTitle = document.getElementById("case-title");
  const inputLabel = document.getElementById("input-label");
  const userMessage = document.getElementById("user-message");
  const eventList = document.getElementById("event-list");
  const playButton = document.getElementById("play-button");
  const resetButton = document.getElementById("reset-button");
  const liveStatus = document.getElementById("live-status");
  const mobileViewport = window.matchMedia("(max-width: 760px)");

  let selectedCase = scenarios.find(function (item) { return item.id === "normal"; });
  let visibleEvents = selectedCase.events.length;
  let replayTimer = 0;
  let isReplaying = false;
  let menuIsOpen = false;

  function stopReplay() {
    if (replayTimer) window.clearInterval(replayTimer);
    replayTimer = 0;
    isReplaying = false;
    playButton.textContent = "재생";
    playButton.removeAttribute("aria-busy");
  }

  function createEvent(eventData) {
    const row = document.createElement("li");
    row.className = "event-row event-row--" + eventData.kind;
    const marker = document.createElement("span");
    marker.className = "event-marker";
    marker.setAttribute("aria-hidden", "true");

    const content = document.createElement("div");
    content.className = "event-content";
    const heading = document.createElement("h2");
    heading.className = "event-heading";
    heading.textContent = eventData.title;
    content.append(heading);

    if (eventData.body) {
      const body = document.createElement("p");
      body.className = "event-body";
      body.textContent = eventData.body;
      content.append(body);
    }
    if (eventData.note) {
      const note = document.createElement("p");
      note.className = "event-note";
      note.textContent = eventData.note;
      content.append(note);
    }

    row.append(marker, content);
    return row;
  }

  function renderConversation() {
    caseTitle.textContent = selectedCase.title;
    inputLabel.textContent = selectedCase.inputLabel;
    userMessage.textContent = selectedCase.inputText;
    caseButtons.forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.case === selectedCase.id));
    });
    eventList.replaceChildren();
    selectedCase.events.slice(0, visibleEvents).forEach(function (eventData) {
      eventList.append(createEvent(eventData));
    });
  }

  function closeSidebar(restoreFocus) {
    menuIsOpen = false;
    sidebar.classList.remove("is-open");
    sidebarScrim.hidden = true;
    chatMain.inert = false;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "사례 메뉴 열기");
    if (mobileViewport.matches) {
      sidebar.inert = true;
      sidebar.setAttribute("aria-hidden", "true");
      if (restoreFocus) menuToggle.focus();
    } else {
      sidebar.inert = false;
      sidebar.removeAttribute("aria-hidden");
    }
  }

  function openSidebar() {
    menuIsOpen = true;
    chatMain.inert = true;
    sidebar.inert = false;
    sidebar.removeAttribute("aria-hidden");
    sidebar.classList.add("is-open");
    sidebarScrim.hidden = false;
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "사례 메뉴 닫기");
    const currentButton = sidebar.querySelector('[data-case][aria-pressed="true"]');
    if (currentButton) currentButton.focus();
  }

  function syncNavigation() {
    if (mobileViewport.matches) {
      menuToggle.hidden = false;
      if (!menuIsOpen) {
        const focusInSidebar = sidebar.contains(document.activeElement);
        closeSidebar(false);
        if (focusInSidebar) menuToggle.focus();
      }
      return;
    }
    const focusWasMenuControl = document.activeElement === menuToggle || document.activeElement === sidebarScrim;
    menuIsOpen = false;
    menuToggle.hidden = true;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "사례 메뉴 열기");
    sidebar.classList.remove("is-open");
    sidebarScrim.hidden = true;
    sidebar.inert = false;
    sidebar.removeAttribute("aria-hidden");
    chatMain.inert = false;
    if (focusWasMenuControl) {
      const selectedButton = sidebar.querySelector('[data-case][aria-pressed="true"]');
      if (selectedButton) selectedButton.focus();
    }
  }

  function selectCase(id) {
    const nextCase = scenarios.find(function (item) { return item.id === id; });
    if (!nextCase) return;
    stopReplay();
    selectedCase = nextCase;
    visibleEvents = selectedCase.events.length;
    renderConversation();
    liveStatus.textContent = selectedCase.title + " 사례를 선택했습니다.";
    if (mobileViewport.matches && menuIsOpen) closeSidebar(true);
  }

  function replayConversation() {
    if (isReplaying) return;
    stopReplay();
    visibleEvents = 0;
    isReplaying = true;
    playButton.textContent = "재생 중";
    playButton.setAttribute("aria-busy", "true");
    liveStatus.textContent = "합성 입력부터 고정 처리 단계를 재생합니다.";
    renderConversation();

    replayTimer = window.setInterval(function () {
      visibleEvents += 1;
      renderConversation();
      if (visibleEvents >= selectedCase.events.length) {
        window.clearInterval(replayTimer);
        replayTimer = 0;
        isReplaying = false;
        playButton.textContent = "재생";
        playButton.removeAttribute("aria-busy");
        liveStatus.textContent = "정해진 사례 재생이 끝났습니다.";
      }
    }, 700);
  }

  function resetConversation() {
    stopReplay();
    visibleEvents = 0;
    renderConversation();
    liveStatus.textContent = "합성 입력으로 돌아왔습니다.";
  }

  caseButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      selectCase(button.dataset.case);
    });
  });
  menuToggle.addEventListener("click", function () {
    if (menuIsOpen) closeSidebar(true);
    else openSidebar();
  });
  sidebarScrim.addEventListener("click", function () { closeSidebar(true); });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && menuIsOpen) {
      event.preventDefault();
      closeSidebar(true);
    }
  });
  playButton.addEventListener("click", replayConversation);
  resetButton.addEventListener("click", resetConversation);
  mobileViewport.addEventListener("change", syncNavigation);
  window.addEventListener("resize", syncNavigation);

  syncNavigation();
  renderConversation();
})();
