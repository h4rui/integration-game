const screens = [...document.querySelectorAll(".screen")];
const state = {
  playerCount: 0,
  names: [],
  order: [],
  totalYears: 0,
  currentYear: 1,
  history: [],
  lastRule: null
};

const rules = [
  "急行系カード使用禁止",
  "カード売り場の利用禁止",
  "物件駅では1件だけ購入可能",
  "独占禁止",
  "農林物件しか購入できない",
  "食品物件しか購入できない",
  "カード使用は1人1回まで",
  "目的地に近づくカード使用禁止",
  "同じ駅に2回連続で止まるの禁止",
  "物件購入禁止",
  "カード購入禁止",
  "最下位の人だけカード使用可能",
  "1位の人はカード使用禁止",
  "1位の人は物件購入禁止",
  "サイコロは1個だけ使用可能",
  "プラス駅に止まっても収入を受け取らない",
  "マイナス駅を避けるカード使用禁止",
  "誰かと同じ地方にいなければならない",
  "全員、目的地と逆方向へ1回進む",
  "カードを1枚捨てる",
  "持ち金が一番多い人は物件購入禁止",
  "今いる地方から出るまでカード使用禁止",
  "次の目的地到着まで特急系カード禁止",
  "次の目的地到着まで物件購入禁止",
  "この年は全員カード交換禁止"
];

function show(id){
  screens.forEach(s => s.classList.toggle("active", s.id === id));
  window.scrollTo({top:0,behavior:"smooth"});
}

function speak(text){
  if(!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ja-JP";
  u.rate = 0.95;
  u.pitch = 1;
  speechSynthesis.speak(u);
}

document.getElementById("startBtn").onclick = () => show("screen-players");

document.querySelectorAll("[data-back]").forEach(btn => {
  btn.onclick = () => show(btn.dataset.back);
});

document.querySelectorAll("#playerChoices button").forEach(btn => {
  btn.onclick = () => {
    state.playerCount = Number(btn.dataset.count);
    document.querySelectorAll("#playerChoices button").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    buildNameInputs();
    show("screen-names");
  };
});

function buildNameInputs(){
  const box = document.getElementById("nameInputs");
  box.innerHTML = "";
  for(let i=0;i<state.playerCount;i++){
    const row = document.createElement("label");
    row.className = "name-row";
    row.innerHTML = `<span>${i+1}人目</span><input maxlength="12" placeholder="名前を入力" value="${state.names[i] || ""}">`;
    box.appendChild(row);
  }
}

document.getElementById("toShuffleBtn").onclick = () => {
  const inputs = [...document.querySelectorAll("#nameInputs input")];
  const names = inputs.map((i,idx) => i.value.trim() || `プレイヤー${idx+1}`);
  state.names = names;
  state.order = [];
  document.getElementById("shuffleResult").className = "result-card muted";
  document.getElementById("shuffleResult").textContent = "シャッフルボタンを押してください";
  document.getElementById("toYearsBtn").disabled = true;
  show("screen-shuffle");
};

document.getElementById("shuffleBtn").onclick = () => {
  state.order = [...state.names];
  for(let i=state.order.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [state.order[i],state.order[j]] = [state.order[j],state.order[i]];
  }
  const result = document.getElementById("shuffleResult");
  result.className = "result-card";
  result.innerHTML = state.order.map((n,i)=>`${i+1}番　${escapeHtml(n)}`).join("<br>");
  document.getElementById("toYearsBtn").disabled = false;
  const speech = state.order.map((n,i)=>`${i+1}番、${n}`).join("。");
  speak(speech + "。");
};

document.getElementById("toYearsBtn").onclick = () => show("screen-years");

document.querySelectorAll("#yearChoices button").forEach(btn => {
  btn.onclick = () => startGame(Number(btn.dataset.years));
});

document.getElementById("customYears").addEventListener("change", e => {
  const y = Math.max(1, Math.min(999, Number(e.target.value || 0)));
  if(y) startGame(y);
});

function startGame(years){
  state.totalYears = years;
  state.currentYear = 1;
  state.history = [];
  state.lastRule = null;
  updateGameScreen();
  show("screen-game");
  speak(`${state.totalYears}年ゲームを開始します。1年目です。`);
}

function updateGameScreen(){
  document.getElementById("currentYear").textContent = state.currentYear;
  document.getElementById("ruleText").textContent = "回すボタンを押してください";
  document.getElementById("spinBtn").disabled = false;
  document.getElementById("nextYearBtn").disabled = true;
  document.getElementById("nextYearBtn").textContent =
    state.currentYear === state.totalYears ? "ゲーム終了" : "次の年へ";
  renderHistory();
}

document.getElementById("spinBtn").onclick = () => {
  const roulette = document.getElementById("roulette");
  roulette.classList.remove("spinning");
  void roulette.offsetWidth;
  roulette.classList.add("spinning");

  let candidates = rules.filter(r => r !== state.lastRule);
  const rule = candidates[Math.floor(Math.random()*candidates.length)];

  setTimeout(() => {
    state.lastRule = rule;
    state.history[state.currentYear-1] = rule;
    document.getElementById("ruleText").textContent = rule;
    document.getElementById("spinBtn").disabled = true;
    document.getElementById("nextYearBtn").disabled = false;
    renderHistory();
    speak(`${state.currentYear}年目、${rule}。`);
  }, 900);
};

document.getElementById("nextYearBtn").onclick = () => {
  if(state.currentYear >= state.totalYears){
    document.getElementById("finishText").textContent =
      `${state.totalYears}年間お疲れさまでした！`;
    show("screen-finish");
    speak(`${state.totalYears}年間、お疲れさまでした。`);
    return;
  }
  state.currentYear++;
  updateGameScreen();
  speak(`${state.currentYear}年目です。`);
};

document.getElementById("historyBtn").onclick = () => {
  document.getElementById("historyPanel").classList.toggle("hidden");
};

function renderHistory(){
  const list = document.getElementById("historyList");
  list.innerHTML = state.history.map((r,i)=>`<li>${i+1}年目：${escapeHtml(r)}</li>`).join("");
}

document.getElementById("restartBtn").onclick = () => {
  speechSynthesis?.cancel();
  show("screen-start");
};

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
  }[c]));
}
