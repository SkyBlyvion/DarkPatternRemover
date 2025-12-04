// content-script.js
// Anti Dark Pattern Remover - with per-site exclusions

const ADR_DEBUG = false;
const ADR_PROCESSED_ATTR = "data-adr-processed";
const ADR_STORAGE_KEY_EXCLUDED_HOSTS = "adrExcludedHosts";

function adrLog(...args) {
  if (ADR_DEBUG) {
    console.log("[ADR]", ...args);
  }
}

// Text patterns to detect dark patterns (multi-language)
const ADR_TEXT_PATTERNS = [
  "we use cookies",
  "this website uses cookies",
  "this site uses cookies",
  "use cookies to",
  "cookie settings",
  "cookie policy",
  "cookie preferences",
  "accept cookies",
  "accept all cookies",
  "manage cookies",
  "gdpr",
  "consent",
  "privacy policy",
  "data processing",
  "data protection",
  "personal data",

  "nous utilisons des cookies",
  "ce site utilise des cookies",
  "politique de confidentialité",
  "paramètres des cookies",
  "politique de cookies",
  "gérer les cookies",
  "accepter les cookies",
  "accepter tous les cookies",
  "gestion des cookies",
  "donnees personnelles",
  "données personnelles",

  "newsletter",
  "subscribe to our newsletter",
  "sign up for our newsletter",
  "subscribe now",
  "inscrivez-vous",
  "abonnez-vous",
  "s'abonner",

  "we value your privacy",
  "your privacy is important",
  "before you continue",
  "by using this site you agree",
  "by clicking accept",
  "continue to use our site"
];

// Class / ID patterns frequently used by CMP / cookie banners / overlays
const ADR_CLASS_ID_PATTERNS = [
  "cookie",
  "cookies",
  "gdpr",
  "consent",
  "cmp",
  "eu-consent",
  "ccpa",
  "privacy",
  "banner",
  "cookie-banner",
  "cookiebar",
  "cookie_bar",
  "cookie-popup",
  "cookiepopup",
  "cookie-notice",
  "cookienotice",
  "consent-popup",
  "consent-banner",
  "modal",
  "popup",
  "pop-up",
  "overlay",
  "backdrop",
  "lightbox",
  "newsletter",
  "subscribe",
  "subscription"
];

function adrStringContainsAny(haystack, patterns) {
  if (!haystack) return false;
  const lower = haystack.toLowerCase();
  for (const p of patterns) {
    if (!p) continue;
    if (lower.includes(p.toLowerCase())) return true;
  }
  return false;
}

function adrLooksLikeOverlay(element) {
  if (!(element instanceof HTMLElement)) return false;

  const style = window.getComputedStyle(element);

  if (style.display === "none" || style.visibility === "hidden") return false;

  const position = style.position;
  const zIndex = parseInt(style.zIndex || "0", 10) || 0;

  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const rect = element.getBoundingClientRect();

  const coversWidth = rect.width >= viewportWidth * 0.7;
  const coversHeight = rect.height >= viewportHeight * 0.4;

  const isFixedOrSticky = position === "fixed" || position === "sticky";
  const isDialogRole =
    element.getAttribute("role") === "dialog" ||
    element.getAttribute("aria-modal") === "true";

  if ((isFixedOrSticky || isDialogRole) && coversWidth && coversHeight && zIndex >= 1000) {
    return true;
  }

  return false;
}

function adrLooksLikeDarkPattern(element) {
  if (!(element instanceof HTMLElement)) return false;

  if (element.hasAttribute(ADR_PROCESSED_ATTR)) return false;

  const id = element.id || "";
  const className = element.className || "";
  const text = (element.innerText || element.textContent || "").trim();

  if (adrStringContainsAny(text, ADR_TEXT_PATTERNS)) {
    return true;
  }

  if (adrStringContainsAny(id, ADR_CLASS_ID_PATTERNS)) {
    return true;
  }
  if (adrStringContainsAny(className, ADR_CLASS_ID_PATTERNS)) {
    return true;
  }

  if (
    adrLooksLikeOverlay(element) &&
    adrStringContainsAny(text, [
      "cookie",
      "gdpr",
      "consent",
      "privacy",
      "newsletter",
      "subscribe",
      "inscrivez"
    ])
  ) {
    return true;
  }

  return false;
}

function adrRemoveElement(element) {
  if (!(element instanceof HTMLElement)) return;

  element.setAttribute(ADR_PROCESSED_ATTR, "true");

  try {
    adrLog("Removing dark pattern element:", element.tagName, element.id, element.className);
    element.remove();
  } catch (e) {
    element.style.setProperty("display", "none", "important");
    element.style.setProperty("visibility", "hidden", "important");
  }
}

function adrRestoreScroll() {
  try {
    const candidates = [document.documentElement, document.body];
    for (const el of candidates) {
      if (!el) continue;
      const style = window.getComputedStyle(el);
      if (style.overflow === "hidden" || style.overflowY === "hidden") {
        adrLog("Restoring scroll on", el.tagName);
        el.style.setProperty("overflow", "auto", "important");
        el.style.setProperty("overflow-y", "auto", "important");
      }
    }
  } catch (e) {
    // ignore
  }
}

function adrProcessElement(root) {
  if (!(root instanceof HTMLElement)) return;

  const stack = [root];

  while (stack.length > 0) {
    const el = stack.pop();
    if (!(el instanceof HTMLElement)) continue;

    if (adrLooksLikeDarkPattern(el)) {
      adrRemoveElement(el);
      adrRestoreScroll();
      continue;
    }

    const children = el.children;
    for (let i = 0; i < children.length; i++) {
      stack.push(children[i]);
    }
  }
}

function adrInitialScan() {
  try {
    adrLog("Initial ADR scan started");
    adrProcessElement(document.documentElement);
    adrRestoreScroll();
    adrLog("Initial ADR scan finished");
  } catch (e) {
    adrLog("Error during initial ADR scan:", e);
  }
}

function adrSetupObserver() {
  try {
    const target = document.documentElement || document.body;
    if (!target) return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              adrProcessElement(node);
            }
          });
        }
      }
    });

    observer.observe(target, {
      childList: true,
      subtree: true
    });

    adrLog("ADR MutationObserver set up");
  } catch (e) {
    adrLog("Error setting up ADR MutationObserver:", e);
  }
}

/**
 * Check if current host is excluded, based on user config.
 * Users can enter:
 *   chatgpt.com
 *   .openai.com
 *   www.example.com
 */
function adrIsHostExcluded(hostname, excludedList) {
  if (!hostname) return false;
  const host = hostname.toLowerCase();

  if (!Array.isArray(excludedList)) return false;

  for (let raw of excludedList) {
    if (!raw) continue;
    let pattern = String(raw).trim().toLowerCase();
    if (!pattern) continue;

    // Remove protocol or slashes if user pasted full URL
    pattern = pattern.replace(/^https?:\/\//, "");
    pattern = pattern.split("/")[0];

    // If pattern starts with ".", treat as suffix match
    if (pattern.startsWith(".")) {
      if (host.endsWith(pattern)) {
        return true;
      }
      continue;
    }

    // Exact match or subdomain match
    if (host === pattern || host.endsWith("." + pattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Start logic (scan + observer) if site is not excluded.
 */
function adrMaybeStart() {
  const hostname = window.location.hostname || "";
  chrome.storage.local.get(ADR_STORAGE_KEY_EXCLUDED_HOSTS, (result) => {
    const excludedHosts = result[ADR_STORAGE_KEY_EXCLUDED_HOSTS] || [];
    if (adrIsHostExcluded(hostname, excludedHosts)) {
      adrLog("ADR disabled on excluded host:", hostname);
      return;
    }

    // Normal flow
    if (
      document.readyState === "complete" ||
      document.readyState === "interactive"
    ) {
      adrInitialScan();
    } else {
      window.addEventListener("DOMContentLoaded", adrInitialScan, { once: true });
    }
    adrSetupObserver();
  });
}

// Entry point
try {
  adrMaybeStart();
} catch (e) {
  adrLog("ADR failed to start:", e);
}
