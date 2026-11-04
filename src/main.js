import "./style.css";
import {
  createPlayer,
  getCases,
  createGameSession,
  getBriefing,
  getScene,
  getSuspects,
  getSuspectDetail,
  askQuestion,
  getEvidences,
} from "./api.js";

const app = document.querySelector("#app");
const PAGE_STATE_KEY = "detectiveCasePageState";

function getSavedPageState() {
  try {
    const savedState = JSON.parse(sessionStorage.getItem(PAGE_STATE_KEY));

    if (savedState?.page) {
      return savedState;
    }
  } catch {
    sessionStorage.removeItem(PAGE_STATE_KEY);
  }

  return { page: "start" };
}

function savePageState(pageState) {
  sessionStorage.setItem(PAGE_STATE_KEY, JSON.stringify(pageState));
}

function resetToStartPage() {
  const startState = { page: "start" };

  savePageState(startState);
  history.replaceState(startState, "", window.location.href);
  renderStartPage();
}

async function moveToPage(page, data = {}, replace = false) {
  const pageState = { page, ...data };

  savePageState(pageState);

  if (replace) {
    history.replaceState(pageState, "", window.location.href);
  } else {
    history.pushState(pageState, "", window.location.href);
  }

  try {
    await renderPage(pageState);
  } catch (error) {
    alert(error.message);
  }
}

async function renderPage(pageState) {
  const playerId = localStorage.getItem("playerId");
  const sessionId = localStorage.getItem("sessionId");

  switch (pageState.page) {
    case "start":
      renderStartPage();
      return;

    case "case-select": {
      if (!playerId) {
        resetToStartPage();
        return;
      }

      const cases = await getCases(playerId);
      renderCaseSelectPage(cases);
      return;
    }

    case "briefing": {
      if (!sessionId) {
        resetToStartPage();
        return;
      }

      const briefing = await getBriefing(sessionId);
      renderBriefingPage(briefing);
      return;
    }

    case "scene": {
      if (!sessionId) {
        resetToStartPage();
        return;
      }

      const scene = await getScene(sessionId);
      renderScenePage(scene);
      return;
    }

    case "suspects": {
      if (!sessionId) {
        resetToStartPage();
        return;
      }

      const suspects = await getSuspects(sessionId);
      renderSuspectListPage(suspects);
      return;
    }

    case "evidences": {
      if (!sessionId) {
        resetToStartPage();
        return;
      }

      const evidences = await getEvidences(sessionId);
      renderEvidenceNotePage(evidences);
      return;
    }

    case "interrogation": {
      if (!sessionId || !pageState.suspectId) {
        resetToStartPage();
        return;
      }

      const suspect = await getSuspectDetail(sessionId, pageState.suspectId);
      renderInterrogationPage(suspect);
      return;
    }

    case "questions": {
      if (!sessionId || !pageState.suspectId) {
        resetToStartPage();
        return;
      }

      const suspect = await getSuspectDetail(sessionId, pageState.suspectId);
      renderQuestionPage(suspect);
      return;
    }

    default:
      resetToStartPage();
  }
}

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
      localStorage.removeItem("sessionId");

      const playerId = await createPlayer();
      localStorage.setItem("playerId", playerId);

      await moveToPage("case-select");
    } catch (error) {
      notice.textContent = error.message;
      startButton.disabled = false;
    }
  });

  continueButton.addEventListener("click", async () => {
    const sessionId = localStorage.getItem("sessionId");

    if (!sessionId) {
      notice.textContent =
        "이어서 할 게임이 없습니다. 새 사건을 시작해 주세요.";
      return;
    }

    await moveToPage("scene");
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
            ${
              caseItem.isUnlocked
                ? "사건을 시작할 수 있습니다."
                : "이전 사건을 해결하면 해금됩니다."
            }
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
    moveToPage("start");
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

        await moveToPage("briefing");
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
    .addEventListener("click", () => {
      moveToPage("scene");
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

      if (button.dataset.menu === "suspect") {
        moveToPage("suspects");
        return;
      }

      if (button.dataset.menu === "evidence") {
        moveToPage("evidences");
        return;
      }

      notice.textContent = `${button.textContent.trim()} 기능은 다음 단계에서 연결합니다.`;
    });
  });
}

function renderSuspectListPage(suspects) {
  const suspectCards = suspects
    .map((suspect) => {
      const statusText = suspect.isInterrogationCompleted
        ? "심문 완료"
        : "심문 진행";

      return `
        <button
          class="suspect-card"
          type="button"
          data-suspect-id="${suspect.suspectId}"
        >
          <p class="suspect-number">
            SUSPECT ${String(suspect.suspectId).padStart(2, "0")}
          </p>

          <h2>${suspect.name}</h2>
          <p class="suspect-role">${suspect.roleName}</p>

          <span class="suspect-status ${
            suspect.isInterrogationCompleted ? "completed" : ""
          }">
            ${statusText}
          </span>
        </button>
      `;
    })
    .join("");

  app.innerHTML = `
    <main class="suspect-list-page">
      <header class="suspect-list-header">
        <div>
          <p class="eyebrow">SUSPECT RECORD</p>
          <h1>용의자 진술</h1>
          <p class="intro">
            용의자를 선택해 기본 진술과 질문을 확인하세요.
          </p>
        </div>

        <button id="scene-back-button" class="secondary-button" type="button">
          현장으로 돌아가기
        </button>
      </header>

      <section class="suspect-grid">
        ${suspectCards}
      </section>
    </main>
  `;

  document.querySelector("#scene-back-button").addEventListener("click", () => {
    moveToPage("scene");
  });

  document.querySelectorAll(".suspect-card").forEach((card) => {
    card.addEventListener("click", () => {
      moveToPage("interrogation", {
        suspectId: Number(card.dataset.suspectId),
      });
    });
  });
}

function renderInterrogationPage(suspect) {
  app.innerHTML = `
    <main class="interrogation-page">
      <button type="button" class="back-button">← 용의자 목록</button>

      <section class="interrogation-layout">
        <div
          class="interrogation-portrait interrogation-portrait-${suspect.suspectId}"
        ></div>

        <div class="interrogation-content">
          <p class="eyebrow">SUSPECT RECORD</p>
          <p class="suspect-role">${suspect.roleName}</p>
          <h1 class="interrogation-name">${suspect.name}</h1>

          <div class="interrogation-panel">
            <p class="statement-label">최초 진술</p>
            <p class="statement-text">${suspect.initialStatement}</p>
          </div>
        </div>
      </section>

      <div class="interrogation-action-area">
        <button type="button" class="primary-button interrogation-start-button">
          심문 시작하기
        </button>
      </div>
    </main>
  `;

  document.querySelector(".back-button").addEventListener("click", () => {
    moveToPage("suspects");
  });

  document
    .querySelector(".interrogation-start-button")
    .addEventListener("click", () => {
      moveToPage("questions", {
        suspectId: suspect.suspectId,
      });
    });
}

function renderQuestionPage(suspect, answer = null) {
  const questionButtons = suspect.questions
    .map(
      (question) => `
        <button
          type="button"
          class="question-button ${question.isAsked ? "asked" : ""}"
          data-question-id="${question.questionId}"
        >
          <span>${question.questionText}</span>
          <small>${question.isAsked ? "다시 확인하기" : "질문하기"}</small>
        </button>
      `,
    )
    .join("");

  const panelContent = answer
    ? `
      <p class="statement-label">
        ${answer.isNewQuestion ? "새로 확보한 진술" : "진술 다시 확인"}
      </p>

      <p class="answer-question">Q. ${answer.questionText}</p>
      <p class="statement-text">${answer.answerText}</p>

      <button
        type="button"
        class="secondary-button question-list-button"
      >
        질문 목록으로
      </button>
    `
    : `
      <p class="statement-label">질문 선택</p>

      <div class="question-list">
        ${questionButtons}
      </div>
    `;

  app.innerHTML = `
    <main class="interrogation-page question-page">
      <button type="button" class="back-button">← 용의자 상세</button>

      <section class="interrogation-layout">
        <div
          class="interrogation-portrait interrogation-portrait-${suspect.suspectId}"
        ></div>

        <div class="interrogation-content">
          <p class="eyebrow">INTERROGATION IN PROGRESS</p>
          <p class="suspect-role">${suspect.roleName}</p>
          <h1 class="interrogation-name">${suspect.name}</h1>

          <div class="interrogation-panel question-panel">
            ${panelContent}
          </div>
        </div>
      </section>

      <div class="interrogation-action-area" aria-hidden="true"></div>
    </main>
  `;

  document.querySelector(".back-button").addEventListener("click", () => {
    moveToPage("interrogation", {
      suspectId: suspect.suspectId,
    });
  });

  document
    .querySelector(".question-list-button")
    ?.addEventListener("click", () => {
      renderQuestionPage(suspect);
    });

  document.querySelectorAll(".question-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const sessionId = localStorage.getItem("sessionId");
      const questionId = Number(button.dataset.questionId);

      button.disabled = true;
      button.querySelector("small").textContent = "확인 중...";

      try {
        const answerResult = await askQuestion(sessionId, questionId);

        const updatedQuestions = suspect.questions.map((question) => ({
          ...question,
          isAsked:
            question.questionId === answerResult.questionId
              ? true
              : question.isAsked,
        }));

        renderQuestionPage(
          {
            ...suspect,
            questions: updatedQuestions,
          },
          answerResult,
        );
      } catch (error) {
        alert(error.message);
        button.disabled = false;
        button.querySelector("small").textContent = "질문하기";
      }
    });
  });
}

function renderEvidenceNotePage(evidences) {
  if (evidences.length === 0) {
    app.innerHTML = `
      <main class="evidence-page">
        <p class="notice">등록된 증거가 없습니다.</p>
      </main>
    `;
    return;
  }

  let currentIndex = 0;

  function renderCurrentEvidence() {
    const evidence = evidences[currentIndex];
    const isFirstEvidence = currentIndex === 0;
    const isLastEvidence = currentIndex === evidences.length - 1;

    app.innerHTML = `
      <main class="evidence-page">
        <header class="evidence-header">
          <div>
            <p class="eyebrow">EVIDENCE NOTE</p>
            <h1>증거 노트</h1>
            <p class="intro">
              현장에서 발견된 물건과 기록입니다. 의미는 직접 판단하세요.
            </p>
          </div>

          <button id="scene-back-button" class="secondary-button" type="button">
            현장으로 돌아가기
          </button>
        </header>

        <section class="evidence-viewer">
          <button
            class="evidence-nav-button"
            id="previous-evidence-button"
            type="button"
            aria-label="이전 증거"
            ${isFirstEvidence ? "disabled" : ""}
          >
            ←
          </button>

          <article class="evidence-single-card">
            ${
              evidence.imageUrl
                ? `
                  <img
                    class="evidence-single-image"
                    src="${evidence.imageUrl}"
                    alt="${evidence.name}"
                  />
                `
                : ""
            }

            <div class="evidence-single-content">
              <p class="evidence-number">
                EVIDENCE ${String(evidence.evidenceId).padStart(2, "0")}
              </p>

              <h2>${evidence.name}</h2>
              <p>${evidence.description}</p>
            </div>
          </article>

          <button
            class="evidence-nav-button"
            id="next-evidence-button"
            type="button"
            aria-label="다음 증거"
            ${isLastEvidence ? "disabled" : ""}
          >
            →
          </button>
        </section>

        <p class="evidence-progress">
          ${currentIndex + 1} / ${evidences.length}
        </p>
      </main>
    `;

    document
      .querySelector("#scene-back-button")
      .addEventListener("click", () => {
        moveToPage("scene");
      });

    document
      .querySelector("#previous-evidence-button")
      .addEventListener("click", () => {
        currentIndex -= 1;
        renderCurrentEvidence();
      });

    document
      .querySelector("#next-evidence-button")
      .addEventListener("click", () => {
        currentIndex += 1;
        renderCurrentEvidence();
      });
  }

  renderCurrentEvidence();
}

window.addEventListener("popstate", async (event) => {
  const pageState = event.state?.page ? event.state : getSavedPageState();

  try {
    await renderPage(pageState);
  } catch (error) {
    alert(error.message);
  }
});

async function initializeApp() {
  const pageState = history.state?.page ? history.state : getSavedPageState();

  savePageState(pageState);
  history.replaceState(pageState, "", window.location.href);

  try {
    await renderPage(pageState);
  } catch {
    resetToStartPage();
  }
}

initializeApp();
