// options.js

const TEXTAREA_ID = "excludedHosts";
const SAVE_BUTTON_ID = "saveBtn";
const STATUS_ID = "status";
const ADR_STORAGE_KEY_EXCLUDED_HOSTS = "adrExcludedHosts";

const textarea = document.getElementById(TEXTAREA_ID);
const saveBtn = document.getElementById(SAVE_BUTTON_ID);
const statusSpan = document.getElementById(STATUS_ID);

function setStatus(message, timeout = 1500) {
  statusSpan.textContent = message;
  if (timeout > 0) {
    setTimeout(() => {
      statusSpan.textContent = "";
    }, timeout);
  }
}

function loadSettings() {
  chrome.storage.local.get(ADR_STORAGE_KEY_EXCLUDED_HOSTS, (result) => {
    const list = result[ADR_STORAGE_KEY_EXCLUDED_HOSTS] || [];
    textarea.value = list.join("\n");
  });
}

function saveSettings() {
  const raw = textarea.value || "";
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  chrome.storage.local.set(
    {
      [ADR_STORAGE_KEY_EXCLUDED_HOSTS]: lines
    },
    () => {
      if (chrome.runtime.lastError) {
        setStatus("Error saving settings");
        return;
      }
      setStatus("Saved");
    }
  );
}

document.addEventListener("DOMContentLoaded", loadSettings);
saveBtn.addEventListener("click", saveSettings);
