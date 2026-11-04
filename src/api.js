const API_BASE_URL = "http://localhost:8080";

export async function createPlayer() {
  const response = await fetch(`${API_BASE_URL}/api/players`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("플레이어를 생성하지 못했습니다.");
  }

  const result = await response.json();

  return result.resultData.playerId;
}

export async function getCases(playerId) {
  const response = await fetch(
    `${API_BASE_URL}/api/cases?playerId=${playerId}`,
  );

  if (!response.ok) {
    throw new Error("CASE 목록을 불러오지 못했습니다.");
  }

  const result = await response.json();

  return result.resultData;
}

export async function createGameSession(playerId, caseId) {
  const response = await fetch(`${API_BASE_URL}/api/game-sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      playerId,
      caseId,
    }),
  });

  if (!response.ok) {
    throw new Error("게임 세션을 생성하지 못했습니다.");
  }

  const result = await response.json();

  return result.resultData.sessionId;
}

export async function getBriefing(sessionId) {
  const response = await fetch(
    `${API_BASE_URL}/api/game-sessions/${sessionId}/briefing`,
  );

  if (!response.ok) {
    throw new Error("사건 브리핑을 불러오지 못했습니다.");
  }

  const result = await response.json();

  return result.resultData;
}

export async function getScene(sessionId) {
  const response = await fetch(
    `${API_BASE_URL}/api/game-sessions/${sessionId}/scene`,
  );

  if (!response.ok) {
    throw new Error("사건 현장 이미지를 불러오지 못했습니다.");
  }

  const result = await response.json();

  return result.resultData;
}

export async function getSuspects(sessionId) {
  const response = await fetch(
    `${API_BASE_URL}/api/game-sessions/${sessionId}/suspects`,
  );

  if (!response.ok) {
    throw new Error("용의자 목록을 불러오지 못했습니다.");
  }

  const result = await response.json();

  return result.resultData;
}

export async function getSuspectDetail(sessionId, suspectId) {
  const response = await fetch(
    `${API_BASE_URL}/api/game-sessions/${sessionId}/suspects/${suspectId}`,
  );

  if (!response.ok) {
    throw new Error("용의자 정보를 불러오지 못했습니다.");
  }

  const result = await response.json();
  return result.resultData;
}

export async function askQuestion(sessionId, questionId) {
  const response = await fetch(
    `${API_BASE_URL}/api/game-sessions/${sessionId}/questions/${questionId}`,
    {
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error("질문과 답변을 불러오지 못했습니다.");
  }

  const result = await response.json();
  return result.resultData;
}

export async function getEvidences(sessionId) {
  const response = await fetch(
    `${API_BASE_URL}/api/game-sessions/${sessionId}/evidences`,
  );

  if (!response.ok) {
    throw new Error("증거 목록을 불러오지 못했습니다.");
  }

  const result = await response.json();
  return result.resultData;
}
