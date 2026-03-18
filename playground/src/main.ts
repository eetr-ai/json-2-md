import "./style.css";
import { objectToMd } from "@eetr/json-2-md";

const defaultSchema = `{
  "type": "object",
  "description": "User profile",
  "properties": {
    "name": { "type": "string", "description": "User name" }
  },
  "required": ["name"],
  "additionalProperties": false
}`;

const defaultJson = `{
  "name": "Alice"
}`;

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <div class="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
    <header class="mb-10 text-center sm:text-left">
      <div class="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
        <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_theme(colors.emerald.400)]"></span>
        Playground
      </div>
      <h1 class="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
        json-2-md
      </h1>
      <p class="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
        Edit JSON and schema, then convert. Default dev uses
        <code class="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-xs text-emerald-300/90">src/</code>
        via Vite. Run
        <code class="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-xs text-slate-300">npm run dev:pkg</code>
        after a root
        <code class="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-xs text-slate-300">build</code>
        to test the published bundle.
      </p>
    </header>

    <div class="grid gap-6 lg:grid-cols-2">
      <section class="group rounded-2xl border border-white/10 bg-slate-900/40 p-5 shadow-xl shadow-black/20 ring-1 ring-white/5 backdrop-blur-sm transition hover:border-emerald-500/20 hover:ring-emerald-500/10">
        <label for="json-input" class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span class="h-2 w-2 rounded-sm bg-sky-500/80"></span>
          JSON data
        </label>
        <textarea
          id="json-input"
          spellcheck="false"
          class="min-h-[200px] w-full resize-y rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-[13px] leading-relaxed text-slate-200 shadow-inner outline-none transition placeholder:text-slate-600 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20"
        ></textarea>
      </section>
      <section class="group rounded-2xl border border-white/10 bg-slate-900/40 p-5 shadow-xl shadow-black/20 ring-1 ring-white/5 backdrop-blur-sm transition hover:border-amber-500/20 hover:ring-amber-500/10">
        <label for="schema-input" class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span class="h-2 w-2 rounded-sm bg-amber-500/80"></span>
          JSON Schema
        </label>
        <textarea
          id="schema-input"
          spellcheck="false"
          class="min-h-[200px] w-full resize-y rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-[13px] leading-relaxed text-slate-200 shadow-inner outline-none transition placeholder:text-slate-600 focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/20"
        ></textarea>
      </section>
    </div>

    <div class="mt-8 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
      <button
        type="button"
        id="convert"
        class="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 px-8 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-900/40 ring-1 ring-white/20 transition hover:from-emerald-300 hover:to-emerald-500 hover:shadow-emerald-500/25 active:scale-[0.98]"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Convert to Markdown
      </button>
    </div>

    <section class="mt-10">
      <label for="md-output" class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span class="h-2 w-2 rounded-sm bg-violet-500/80"></span>
        Markdown output
      </label>
      <pre
        id="md-output"
        class="min-h-[140px] whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-black/35 p-5 font-mono text-[13px] leading-relaxed text-slate-300 shadow-inner ring-1 ring-white/5"
      ></pre>
    </section>

    <div
      id="error"
      class="mt-6 hidden rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-sm leading-relaxed text-red-200 shadow-lg shadow-red-950/30 backdrop-blur-sm"
      role="alert"
    ></div>
  </div>
`;

const jsonInput = document.querySelector<HTMLTextAreaElement>("#json-input")!;
const schemaInput = document.querySelector<HTMLTextAreaElement>("#schema-input")!;
const mdOutput = document.querySelector<HTMLPreElement>("#md-output")!;
const errorEl = document.querySelector<HTMLDivElement>("#error")!;
const convertBtn = document.querySelector<HTMLButtonElement>("#convert")!;

jsonInput.value = defaultJson;
schemaInput.value = defaultSchema;

function showError(msg: string): void {
  errorEl.textContent = msg;
  errorEl.classList.remove("hidden");
  mdOutput.textContent = "";
}

function clearError(): void {
  errorEl.classList.add("hidden");
  errorEl.textContent = "";
}

convertBtn.addEventListener("click", () => {
  clearError();
  let data: unknown;
  try {
    data = JSON.parse(jsonInput.value);
  } catch (e) {
    showError(`Invalid JSON (data): ${e instanceof Error ? e.message : String(e)}`);
    return;
  }
  try {
    const md = objectToMd(data, schemaInput.value);
    mdOutput.textContent = md;
  } catch (e) {
    showError(e instanceof Error ? e.message : String(e));
  }
});
