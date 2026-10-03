import { establishPrimitive } from "./webkit.js";
import { installWindowP } from "./utils/mem.js";

const output = document.getElementById("console");
const msgEl = document.getElementById("msg");
const SHOW_LOG = new URLSearchParams(location.search).get("log") === "1";
if (SHOW_LOG && document.body) document.body.className = "log";

function setUI(mode, text) {
  if (SHOW_LOG || !document.body) return;
  if (msgEl && text != null) msgEl.textContent = text;
  document.body.className = mode || "";
}

function writeLog(message, type = "log", replace = false) {
  if (!output) return;
  let line = replace ? output.lastElementChild : null;
  if (!line) {
    line = document.createElement("div");
    output.appendChild(line);
  }
  let marker = "*";
  if (type === "error") marker = "-";
  if (type === "info" || type === "success") marker = "+";
  line.textContent = `[${marker}] ${message}`;
  output.scrollTop = output.scrollHeight;

  if (!SHOW_LOG && type === "error") setUI("fail", message);
}

function writeEvent(name, detail, type) {
  writeLog(
    detail == null || detail === "" ? name : `${name}: ${detail}`,
    type || (name === "Failed" ? "error" : "log"),
  );
}

window.writeLog = writeLog;
window.jb = { mark: writeEvent };
window.matronicsUI = {
  waitR2() {
    setUI("wait-r2", "Press R2 to load HEN");
  },
  loadingHen() {
    setUI("", "Loading HEN...");
  },
  done() {
    setUI("done", "DONE");
  },
  fail(text) {
    setUI("fail", text || "Failed");
  },
};

async function getPrimitive() {
  writeLog("Starting WebKit exploit");
  const primitive = installWindowP(await establishPrimitive(writeEvent));
  if (!primitive || typeof primitive.read8 !== "function")
    throw new Error("Memory primitive unavailable");

  writeLog("ARW ready", "success");
  return primitive;
}

function getWebKitBase() {
  const ctor = globalThis.__ps5NativeCtor;
  if (
    typeof ctor !== "number" ||
    typeof OFFSET_wk_host_constructor_candidates === "undefined"
  )
    throw new Error("WebKit base inputs are unavailable");

  for (const offset of OFFSET_wk_host_constructor_candidates) {
    const base = ctor - offset;
    if (base >= 0x800000000 && base < 0x900000000 && base % 0x4000 === 0)
      return base;
  }

  throw new Error("WebKit base not found");
}

async function run() {
  const rejection = window.firmware.rejection();
  if (rejection) throw new Error(rejection);
  writeLog(
    "Credits: ntfargo, ufm42, Sonic_Iso, Jordy, Dr. Yenyen, TheFlow, SlidyBat, Flatz, cow, nhk, bollarz, Sleirsgoevy, EchoStretch, EarthOnion",
    "info",
  );
  writeLog(`Agent: ${navigator.userAgent}`, "info");
  writeLog(`Firmware: ${window.fw_str}`, "info");
  const primitive = await getPrimitive();
  writeLog(`WebKit base: 0x${getWebKitBase().toString(16)}`, "info");

  await import("./relapse_exploit.js");
  await main(primitive);
}

run().catch((error) => {
  const text = error instanceof Error ? error.message : String(error);
  writeLog(text, "error");
  if (window.matronicsUI) window.matronicsUI.fail(text);
});
