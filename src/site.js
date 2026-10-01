import { establishPrimitive } from "./webkit.js";
import { installWindowP } from "./utils/mem.js";

const output = document.getElementById("console");
const cacheEl = document.getElementById("cache");
const stateEl = document.getElementById("state");

function writeLog(message, type = "log", replace = false) {
  let line = replace ? output.lastElementChild : null;
  if (!line) {
    line = document.createElement("div");
    output.appendChild(line);
  }
  let marker = "*";
  let cls = "";
  if (type === "error") { marker = "-"; cls = "bad"; }
  else if (type === "success") { marker = "+"; cls = "ok"; }
  else if (type === "info") { marker = "+"; cls = "info"; }
  line.className = cls;
  line.textContent = `[${marker}] ${message}`;
  output.scrollTop = output.scrollHeight;
}

function setCache(text, ok) {
  if (!cacheEl) return;
  cacheEl.textContent = text || "";
  cacheEl.className = ok ? "cacheok" : "";
}

function writeEvent(name, detail, type) {
  writeLog(detail == null || detail === "" ? name : `${name}: ${detail}`,
    type || (name === "Failed" ? "error" : "log"));
}

window.writeLog = writeLog;
window.jb = { mark: writeEvent };

function waitForAppCache() {
  return new Promise((resolve) => {
    const ac = window.applicationCache;
    if (!ac || !document.documentElement.hasAttribute("manifest")) {
      setCache("cache unavailable");
      resolve("none");
      return;
    }

    if (!navigator.onLine) {
      setCache("offline -- from cache", true);
      resolve("offline");
      return;
    }

    if (ac.status === ac.IDLE) {
      setCache("cached -- offline ready", true);
      resolve("idle");
      return;
    }

    if (ac.status === ac.UPDATEREADY) {
      try { ac.swapCache(); } catch (e) {}
      setCache("update downloaded -- reload once", true);
      resolve("updateready");
      return;
    }

    setCache("checking cache...");
    let done = false;
    const finish = (msg, ok, reason) => {
      if (done) return;
      done = true;
      setCache(msg, ok);
      resolve(reason);
    };

    ac.addEventListener("downloading", () => setCache("caching for offline (first run)..."), false);
    ac.addEventListener("progress", (e) => {
      if (e && e.total)
        setCache("caching " + Math.round((e.loaded / e.total) * 100) + "%");
    }, false);
    ac.addEventListener("cached", () => finish("cached for offline use", true, "cached"), false);
    ac.addEventListener("noupdate", () => finish("cached -- offline ready", true, "noupdate"), false);
    ac.addEventListener("updateready", () => {
      try { ac.swapCache(); } catch (e) {}
      finish("update downloaded -- reload once", true, "updateready");
    }, false);
    ac.addEventListener("error", () => finish("cache unavailable -- running online", false, "error"), false);
    ac.addEventListener("obsolete", () => finish("cache obsolete -- running online", false, "obsolete"), false);

    // Safety timeout so exploit still runs if cache events never fire.
    setTimeout(() => finish(cacheEl.textContent || "cache timeout -- continuing", false, "timeout"), 45000);
  });
}

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
  if (typeof ctor !== "number" || typeof OFFSET_wk_host_constructor_candidates === "undefined")
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
  if (rejection)
    throw new Error(rejection);

  if (stateEl) stateEl.textContent = "preparing cache...";
  await waitForAppCache();
  if (stateEl) stateEl.textContent = "PS5 Relapse";

  writeLog("Matronics PS5 Relapse host", "info");
  writeLog(`Agent: ${navigator.userAgent}`, "info");
  writeLog(`Firmware: ${window.fw_str}`, "info");
  const primitive = await getPrimitive();
  writeLog(`WebKit base: 0x${getWebKitBase().toString(16)}`, "info");

  await import("./relapse_exploit.js");
  await main(primitive);
}

run().catch((error) => writeLog(error instanceof Error ? error.message : String(error), "error"));
