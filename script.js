const input = document.getElementById("wordInput");
const btn = document.getElementById("searchBtn");
const result = document.getElementById("result");
const status = document.getElementById("status");

// UI Event Listeners
btn.addEventListener("click", fetchWord);
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") fetchWord();
});

async function fetchWord() {
  // const word = input.value.trim().split(" ")[0];
  const word = input.value.trim();

  if (!word) {
    showStatus(
      "<span class='text-orange-400'>Please enter a word to search</span>",
    );
    return;
  }

  try {
    showStatus(`<div class="flex justify-center items-center gap-2 text-blue-400">
                    <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Fetching vocabulary...</span>
                </div>`);

    result.classList.add("hidden");

    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
    );

    if (!res.ok) throw new Error("Word not found");

    const data = await res.json();
    await displayData(data[0]);

    status.classList.add("hidden");
    result.classList.remove("hidden");
  } catch (error) {
    showStatus(`<div class="glass-card p-6 rounded-2xl border-red-500/30">
                    <p class="text-red-400 font-medium">❌ We couldn't find "${word}"</p>
                    <p class="text-slate-500 text-sm mt-1">Try checking the spelling or search another word.</p>
                </div>`);
  }
}

function showStatus(html) {
  status.innerHTML = html;
  status.classList.remove("hidden");
  result.classList.add("hidden");
}

async function displayData(data) {
  // Find phonetic and primary definition
  const phonetic = data.phonetics.find((p) => p.text)?.text || "";

  let primaryDef = "";
  let exampleText = "";

  // Extract the first meaningful definition and example
  for (let m of data.meanings) {
    for (let d of m.definitions) {
      if (!primaryDef) primaryDef = d.definition;
      if (d.example) {
        exampleText = d.example;
        break;
      }
    }
    if (primaryDef && exampleText) break;
  }

  // Translate
  const hindiMeaning = await translateToHindi(primaryDef);

  // Create HTML structure
  result.innerHTML = `
                <!-- Main Word Heading -->
                <section class="glass-card rounded-3xl p-6 md:p-8 animate-fade-in">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h2 class="text-4xl font-bold text-white mb-1 capitalize">${data.word}</h2>
                            <p class="text-blue-400 font-mono tracking-wider">${phonetic}</p>
                        </div>
                        <button onclick="speakEnglish('${data.word}')" class="audio-btn bg-blue-500/20 p-4 rounded-full text-blue-400 hover:bg-blue-500 hover:text-white transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                        </button>
                    </div>

                    <div class="space-y-4 mt-6">
                        <div class="meaning-pill p-4 rounded-xl">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-xs font-bold uppercase tracking-widest text-blue-400">English Meaning</span>
                                <button onclick='speakEnglish(${JSON.stringify(primaryDef)})' class="text-blue-500 hover:text-blue-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                </button>
                            </div>
                            <p class="text-slate-200 leading-relaxed">${primaryDef}</p>
                        </div>

                        <div class="bg-emerald-500/10 border-l-4 border-emerald-500 p-4 rounded-xl">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-xs font-bold uppercase tracking-widest text-emerald-400">Hindi Translation</span>
                                <button onclick='speakHindi(${JSON.stringify(hindiMeaning)})' class="text-emerald-500 hover:text-emerald-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                </button>
                            </div>
                            <p class="text-emerald-50 text-xl font-medium">${hindiMeaning}</p>
                        </div>
                    </div>

                    ${
                      exampleText
                        ? `
                    <div class="mt-6 pt-6 border-t border-white/5">
                        <p class="text-slate-500 italic flex gap-2">
                            <span class="text-blue-500">"</span>
                            ${exampleText}
                            <span class="text-blue-500">"</span>
                        </p>
                    </div>
                    `
                        : ""
                    }
                </section>

                <!-- Part of Speech Tabs / All Meanings -->
                <div class="space-y-4 animate-fade-in" style="animation-delay: 0.1s">
                    <h3 class="text-lg font-bold px-2 text-slate-300">Detailed Meanings</h3>
                    ${data.meanings
                      .map(
                        (m) => `
                        <div class="glass-card p-5 rounded-2xl">
                            <span class="inline-block px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                                ${m.partOfSpeech}
                            </span>
                            <ul class="space-y-3">
                                ${m.definitions
                                  .slice(0, 3)
                                  .map(
                                    (def) => `
                                    <li class="text-slate-300 text-sm flex gap-3">
                                        <span class="text-blue-500">•</span>
                                        ${def.definition}
                                    </li>
                                `,
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

async function translateToHindi(text) {
  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(text)}`,
    );
    const data = await res.json();
    return data[0].map((item) => item[0]).join("");
  } catch (error) {
    return "अनुवाद उपलब्ध नहीं है";
  }
}

function speakEnglish(text) {
  window.speechSynthesis.cancel();
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "en-US";
  speech.rate = 0.9;
  speech.pitch = 1;
  window.speechSynthesis.speak(speech);
}

function speakHindi(text) {
  window.speechSynthesis.cancel();
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "hi-IN";
  speech.rate = 0.9;
  speech.pitch = 1;
  window.speechSynthesis.speak(speech);
}
