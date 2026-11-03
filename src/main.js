import './style.css'

document.querySelector('#app').innerHTML = `
  <main class="start-page">
    <section class="hero">
      <p class="eyebrow">CASE FILE · 001</p>
      <h1>Detective<br /><span>Case</span></h1>
      <p class="intro">
        흩어진 진술과 증거 속에서<br />
        사건의 진실을 밝혀내세요.
      </p>

      <div class="actions">
        <button class="primary-button" type="button" data-action="start">
          새 사건 시작하기
        </button>

        <button class="secondary-button" type="button" data-action="continue">
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
`

const notice = document.querySelector('#notice')

document.querySelector('[data-action="start"]').addEventListener('click', () => {
  notice.textContent = '다음 단계에서 CASE 01 선택 화면으로 연결합니다.'
})

document.querySelector('[data-action="continue"]').addEventListener('click', () => {
  notice.textContent = '저장된 게임 세션을 확인하는 기능을 다음 단계에서 연결합니다.'
})
