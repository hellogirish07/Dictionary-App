const input = document.getElementById("wordInput");
const btn = document.getElementById("searchBtn");
const result = document.getElementById("result");
const status = document.getElementById("status");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("sidebarOverlay");
const quickHistoryList = document.getElementById("quickHistoryList");
const quickHistoryContainer = document.getElementById("quickHistoryContainer");
const fullHistoryList = document.getElementById("fullHistoryList");
const emptyHistoryState = document.getElementById("emptyHistoryState");

// --- HISTORY ENGINE ---
let searchHistory = JSON.parse(localStorage.getItem("gk_history")) || [];

function updateHistory(word) {
  if (!word) return;
  const timestamp = new Date().toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Remove if exists to re-insert at top
  searchHistory = searchHistory.filter(
    (item) => item.word.toLowerCase() !== word.toLowerCase(),
  );

  // Add to start with metadata
  searchHistory.unshift({ word: word, time: timestamp });

  // Limit to 20 items
  if (searchHistory.length > 20) searchHistory.pop();

  localStorage.setItem("gk_history", JSON.stringify(searchHistory));
  renderHistory();
}

function renderHistory() {
  // Quick Tags (limit 5)
  if (searchHistory.length === 0) {
    quickHistoryContainer.classList.add("hidden");
    emptyHistoryState.classList.remove("hidden");
    fullHistoryList.innerHTML = "";
  } else {
    quickHistoryContainer.classList.remove("hidden");
    emptyHistoryState.classList.add("hidden");

    // Render Quick Tags
    quickHistoryList.innerHTML = searchHistory
      .slice(0, 5)
      .map(
        (item) => `
                    <div onclick="reSearch('${item.word}')" class="history-tag px-4 py-2 rounded-xl muted-box text-xs font-semibold capitalize">
                        ${item.word}
                    </div>
                `,
      )
      .join("");

    // Render Full Page History
    fullHistoryList.innerHTML = searchHistory
      .map(
        (item, index) => `
                    <div class="history-item flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5">
                        <div onclick="reSearch('${item.word}')" class="flex-1 cursor-pointer">
                            <h5 class="font-bold capitalize text-lg">${item.word}</h5>
                            <p class="text-[10px] opacity-40">${item.time}</p>
                        </div>
                        <div class="flex items-center gap-2">
                             <button onclick="reSearch('${item.word}')" class="p-2 opacity-40 hover:opacity-100 hover:text-[var(--primary)] transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                                </svg>
                            </button>
                            <button onclick="removeFromHistory(${index})" class="p-2 opacity-20 hover:opacity-100 hover:text-red-400 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                `,
      )
      .join("");
  }
}

function removeFromHistory(index) {
  searchHistory.splice(index, 1);
  localStorage.setItem("gk_history", JSON.stringify(searchHistory));
  renderHistory();
}

function reSearch(word) {
  input.value = word;
  navigateTo("dictionary");
  fetchContent();
}

function clearHistory() {
  searchHistory = [];
  localStorage.removeItem("gk_history");
  renderHistory();
}

// --- NAVIGATION & UI ---
function navigateTo(pageId) {
  document.querySelectorAll(".page-container").forEach((p) => {
    p.classList.add("hidden-page");
    p.classList.remove("page-active");
  });
  const activePage = document.getElementById(`page-${pageId}`);
  activePage.classList.remove("hidden-page");
  setTimeout(() => activePage.classList.add("page-active"), 10);

  document
    .querySelectorAll(".nav-link")
    .forEach((l) => l.classList.remove("active"));
  document.getElementById(`link-${pageId}`).classList.add("active");

  if (window.innerWidth < 1024) {
    sidebar.style.transform = "translateX(-110%)";
    overlay.classList.add("opacity-0", "pointer-events-none");
  }
}

function toggleSidebar() {
  const isClosed =
    sidebar.style.transform === "translateX(-110%)" || !sidebar.style.transform;
  if (isClosed) {
    sidebar.style.transform = "translateX(0)";
    overlay.classList.remove("opacity-0", "pointer-events-none");
  } else {
    sidebar.style.transform = "translateX(-110%)";
    overlay.classList.add("opacity-0", "pointer-events-none");
  }
}

function setTheme(theme) {
  document.body.removeAttribute("data-theme");
  if (theme !== "default") document.body.setAttribute("data-theme", theme);
}

// --- DICTIONARY LOGIC ---
btn.addEventListener("click", fetchContent);
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") fetchContent();
});

async function fetchContent() {
  const query = input.value.trim();
  if (!query) return;

  showStatus(`<div class="flex items-center gap-3 justify-center text-sm opacity-60">
                <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                Querying Lexicon...
            </div>`);

  result.innerHTML = "";

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query)}`,
    );
    if (res.ok) {
      const data = await res.json();
      updateHistory(query);
      await displayWordData(data[0]);
    } else {
      const translation = await translateToHindi(query);
      updateHistory(query);
      displayPhraseData(query, translation);
    }
    status.classList.add("hidden");
  } catch (error) {
    showStatus(
      `<div class="glass-card p-6 text-center text-red-500">Service unreachable.</div>`,
    );
  }
}

async function displayWordData(data) {
  const phonetic = data.phonetics?.find((p) => p.text)?.text || "";
  const primaryDef = data.meanings[0].definitions[0].definition;
  const hindiMeaning = await translateToHindi(primaryDef);

  result.innerHTML = `
                <section class="glass-card rounded-3xl p-8 page-active">
                    <div class="flex justify-between items-start mb-8">
                        <div>
                            <h3 class="header-font text-5xl font-bold mb-1">${data.word}</h3>
                            <p style="color: var(--primary)" class="uppercase tracking-widest text-xs font-bold">${phonetic}</p>
                        </div>
                        <button onclick="speak('en', '${data.word}')" class="w-14 h-14 rounded-2xl muted-box flex items-center justify-center hover:bg-[var(--primary)] hover:text-[var(--bg)] transition-all text-xl shadow-lg">🔊</button>
                    </div>

                    <div class="space-y-6">
                        <div class="p-6 rounded-2xl muted-box">
                            <span class="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-2">Definition</span>
                            <p class="text-xl leading-relaxed">${primaryDef}</p>
                        </div>

                        <div class="p-8 rounded-3xl shadow-2xl highlight-box">
                            <div class="flex justify-between items-center mb-4">
                                <span class="text-[10px] font-bold uppercase tracking-widest opacity-60">Hindi Translation</span>
                                <button onclick="speak('hi', '${hindiMeaning}')" class="opacity-60 hover:opacity-100 text-lg">🔊</button>
                            </div>
                            <p class="text-3xl font-bold">${hindiMeaning}</p>
                        </div>
                    </div>
                </section>

                <div class="space-y-4 pt-6">
                    <p class="text-[10px] uppercase font-bold tracking-widest opacity-40 px-4">Categories</p>
                    ${data.meanings
                      .map(
                        (m) => `
                        <div class="glass-card p-6 rounded-2xl">
                            <span class="inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase mb-4 highlight-box">${m.partOfSpeech}</span>
                            <ul class="space-y-4 opacity-80 text-sm">
                                ${m.definitions
                                  .slice(0, 2)
                                  .map(
                                    (d) =>
                                      `<li class="flex gap-3"><span style="color: var(--primary)">•</span> ${d.definition}</li>`,
                                  )
                                  .join("")}
                            </ul>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            `;
}

function displayPhraseData(phrase, translation) {
  result.innerHTML = `
                <section class="glass-card rounded-3xl p-8 page-active">
                    <h3 class="header-font text-3xl font-bold mb-6 capitalize">${phrase}</h3>
                    <div class="p-8 rounded-3xl shadow-2xl highlight-box">
                        <div class="flex justify-between items-center mb-4">
                            <span class="text-[10px] font-bold uppercase tracking-widest opacity-60">Translation</span>
                            <button onclick="speak('hi', '${translation}')" class="opacity-60 text-lg">🔊</button>
                        </div>
                        <p class="text-3xl font-bold">${translation}</p>
                    </div>
                </section>
            `;
}

async function translateToHindi(text) {
  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(text)}`,
    );
    const data = await res.json();
    return data[0].map((item) => item[0]).join("");
  } catch (e) {
    return "अनुवाद उपलब्ध नहीं है";
  }
}

function speak(lang, text) {
  window.speechSynthesis.cancel();
  const s = new SpeechSynthesisUtterance(text);
  s.lang = lang === "en" ? "en-US" : "hi-IN";
  s.rate = 0.85;
  window.speechSynthesis.speak(s);
}

function showStatus(html) {
  status.innerHTML = html;
  status.classList.remove("hidden");
}

// Initialize on load
renderHistory();
