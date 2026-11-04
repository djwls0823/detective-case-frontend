import "./style.css";
import {
  createPlayer,
  getCases,
  createGameSession,
  getBriefing,
  getScene,
} from "./api.js";

const app = document.querySelector("#app");

function renderStartPage() {
  app.innerHTML = `
    <main class="start-page">
      <section class="hero">
        <p class="eyebrow">CASE FILE · 001</p>
        <h1>Detective<br /><span>Case</span></h1>

        <p class="intro">
          흩어진 진술과 증거 속에서<br />
          사건의 진실을 밝혀내세요.
        </p>

        <div class="actions">
          <button id="start-button" class="primary-button" type="button">
            새 사건 시작하기
          </button>

          <button id="continue-button" class="secondary-button" type="button">
            이어서 하기
          </button>
        </div>

        <p id="notice" class="notice" aria-live="polite">
          탐정님, 첫 사건이 당신을 기다리고 있습니다.
        </p>
      </section>

      <aside class="case-card">
        <p class="card-label">NEXT CASE</p>
        <div class="card-line"></div>
        <p class="case-number">CASE 01</p>
        <h2>식탁 위의 거짓말</h2>
        <p class="case-description">
          산속 별장에서 발견된 요리 연구가의 시신.<br />
          식탁 위에 남겨진 음식이 사건의 시간을 말하고 있다.
        </p>
      </aside>
    </main>
  `;

  const startButton = document.querySelector("#start-button");
  const continueButton = document.querySelector("#continue-button");
  const notice = document.querySelector("#notice");

  startButton.addEventListener("click", async () => {
    startButton.disabled = true;
    notice.textContent = "새 사건을 준비하고 있습니다...";

    try {
      const playerId = await createPlayer();

      localStorage.setItem("playerId", playerId);

      const cases = await getCases(playerId);

      renderCaseSelectPage(cases);
    } catch (error) {
      notice.textContent = error.message;
      startButton.disabled = false;
    }
  });

  continueButton.addEventListener("click", () => {
    notice.textContent = "이어서 하기 기능은 게임 세션 구현 후 연결합니다.";
  });
}

function renderCaseSelectPage(cases) {
  const caseCards = cases
    .map((caseItem) => {
      const caseNumber = String(caseItem.caseId).padStart(2, "0");

      return `
        <button
          class="case-select-card"
          type="button"
          data-case-id="${caseItem.caseId}"
          ${caseItem.isUnlocked ? "" : "disabled"}
        >
          <p class="card-label">CASE ${caseNumber}</p>
          <h2>${caseItem.title}</h2>
          <p class="case-description">
            ${caseItem.isUnlocked ? "사건을 시작할 수 있습니다." : "이전 사건을 해결하면 해금됩니다."}
          </p>
        </button>
      `;
    })
    .join("");

  app.innerHTML = `
    <main class="case-select-page">
      <section class="case-select-header">
        <p class="eyebrow">CASE ARCHIVE</p>
        <h1>사건 선택</h1>
        <p class="intro">해금된 사건을 선택해 조사를 시작하세요.</p>
      </section>

      <section class="case-select-list">
        ${caseCards}
      </section>

      <button id="back-button" class="secondary-button" type="button">
        처음으로 돌아가기
      </button>

      <p id="case-notice" class="notice" aria-live="polite"></p>
    </main>
  `;

  document.querySelector("#back-button").addEventListener("click", () => {
    renderStartPage();
  });

  document.querySelectorAll(".case-select-card").forEach((caseCard) => {
    caseCard.addEventListener("click", async () => {
      const caseNotice = document.querySelector("#case-notice");
      const playerId = localStorage.getItem("playerId");
      const caseId = Number(caseCard.dataset.caseId);

      if (!playerId) {
        caseNotice.textContent =
          "플레이어 정보가 없습니다. 처음 화면으로 돌아갑니다.";
        return;
      }

      caseCard.disabled = true;
      caseNotice.textContent = "사건을 준비하고 있습니다...";

      try {
        const sessionId = await createGameSession(playerId, caseId);

        localStorage.setItem("sessionId", sessionId);

        const briefing = await getBriefing(sessionId);

        renderBriefingPage(briefing);
      } catch (error) {
        caseNotice.textContent = error.message;
        caseCard.disabled = false;
      }
    });
  });
}

function renderBriefingPage(briefing) {
  app.innerHTML = `
    <main class="briefing-page">
      <section class="briefing-note">
        <p class="eyebrow">CONFIDENTIAL CASE BRIEFING</p>

        <h1 id="briefing-title"></h1>

        <div class="briefing-line"></div>

        <dl class="briefing-meta">
          <div>
            <dt>피해자</dt>
            <dd id="victim-name"></dd>
          </div>

          <div>
            <dt>발생 장소</dt>
            <dd id="location"></dd>
          </div>

          <div>
            <dt>사망 추정 시각</dt>
            <dd id="estimated-death-time"></dd>
          </div>

          <div>
            <dt>사인</dt>
            <dd id="cause-of-death"></dd>
          </div>
        </dl>

        <p id="briefing-content" class="briefing-content"></p>

        <button id="briefing-next-button" class="primary-button" type="button">
          사건 현장으로
        </button>

        <p id="briefing-notice" class="notice" aria-live="polite"></p>
      </section>
    </main>
  `;

  document.querySelector("#briefing-title").textContent = briefing.title;
  document.querySelector("#victim-name").textContent = briefing.victimName;
  document.querySelector("#location").textContent = briefing.location;
  document.querySelector("#estimated-death-time").textContent =
    briefing.estimatedDeathTime;
  document.querySelector("#cause-of-death").textContent = briefing.causeOfDeath;
  document.querySelector("#briefing-content").textContent = briefing.briefing;

  document
    .querySelector("#briefing-next-button")
    .addEventListener("click", async () => {
      const notice = document.querySelector("#briefing-notice");
      const sessionId = localStorage.getItem("sessionId");

      if (!sessionId) {
        notice.textContent = "게임 세션 정보가 없습니다.";
        return;
      }

      notice.textContent = "사건 현장으로 이동하고 있습니다...";

      try {
        const scene = await getScene(sessionId);

        renderScenePage(scene);
      } catch (error) {
        notice.textContent = error.message;
      }
    });
}

function renderScenePage(scene) {
  app.innerHTML = `
    <main class="scene-page">
      <header class="scene-header">
        <div>
          <p class="eyebrow">CRIME SCENE</p>
          <h1 id="scene-title"></h1>
        </div>

        <p class="scene-status">현장 조사 중</p>
      </header>

      <section class="scene-stage">
        <div class="scene-photo-frame">
          <img id="scene-image" class="scene-image" alt="사건 현장 사진" />

          <div id="scene-placeholder" class="scene-placeholder">
            <p>현장 이미지 준비 중</p>
            <span>등록된 사진이 있으면 이 영역에 표시됩니다.</span>
          </div>
        </div>
      </section>

      <section class="scene-menu">
        <button class="scene-menu-button" type="button" data-menu="suspect">
          용의자 진술
        </button>

        <button class="scene-menu-button" type="button" data-menu="evidence">
          증거 노트
        </button>

        <button class="scene-menu-button" type="button" data-menu="hint">
          힌트
        </button>

        <button
          class="scene-menu-button scene-solution-button"
          type="button"
          data-menu="solution"
        >
          최종 답안 제출
        </button>
      </section>

      <p id="scene-notice" class="notice" aria-live="polite"></p>
    </main>
  `;

  const sceneTitle = document.querySelector("#scene-title");
  const sceneImage = document.querySelector("#scene-image");
  const scenePlaceholder = document.querySelector("#scene-placeholder");

  sceneTitle.textContent = scene.caseTitle;

  if (scene.sceneImageUrl) {
    sceneImage.src = scene.sceneImageUrl;
    sceneImage.hidden = false;
    scenePlaceholder.hidden = true;
  } else {
    sceneImage.hidden = true;
    scenePlaceholder.hidden = false;
  }

  document.querySelectorAll(".scene-menu-button").forEach((button) => {
    button.addEventListener("click", () => {
      const notice = document.querySelector("#scene-notice");

      notice.textContent = `${button.textContent.trim()} 기능은 다음 단계에서 연결합니다.`;
    });
  });
}

renderStartPage();
