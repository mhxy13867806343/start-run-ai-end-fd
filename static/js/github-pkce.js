const TOKEN_STORAGE_KEY = "github_oauth_token";
const USER_STORAGE_KEY = "github_oauth_user";
const STATE_STORAGE_KEY = "github_oauth_state";
const VERIFIER_STORAGE_KEY = "github_code_verifier";
const MESSAGE_STORAGE_KEY = "guestbook_local_messages";

function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  bytes.forEach(function (value) {
    binary += String.fromCharCode(value);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomString(length = 64) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);

  return Array.from(array)
    .map(function (num) {
      return chars[num % chars.length];
    })
    .join("");
}

async function sha256(text) {
  const encoder = new TextEncoder();
  return window.crypto.subtle.digest("SHA-256", encoder.encode(text));
}

function getConfig() {
  const config = window.GITHUB_OAUTH_CONFIG || {};

  return {
    clientId: config.clientId || "",
    redirectUri: config.redirectUri || "",
    scope: config.scope || "read:user user:email"
  };
}

function hasConfig() {
  const config = getConfig();
  return Boolean(config.clientId && config.redirectUri);
}

async function startGitHubLogin() {
  const config = getConfig();

  if (!config.clientId || !config.redirectUri) {
    throw new Error("请先填写 GitHub OAuth 的 clientId 和 redirectUri。");
  }

  const state = randomString(32);
  const codeVerifier = randomString(64);
  const codeChallenge = base64UrlEncode(await sha256(codeVerifier));

  sessionStorage.setItem(STATE_STORAGE_KEY, state);
  sessionStorage.setItem(VERIFIER_STORAGE_KEY, codeVerifier);

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope,
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256"
  });

  window.location.href = "https://github.com/login/oauth/authorize?" + params.toString();
}

function getStoredState() {
  return sessionStorage.getItem(STATE_STORAGE_KEY) || "";
}

function getStoredVerifier() {
  return sessionStorage.getItem(VERIFIER_STORAGE_KEY) || "";
}

function clearPkceState() {
  sessionStorage.removeItem(STATE_STORAGE_KEY);
  sessionStorage.removeItem(VERIFIER_STORAGE_KEY);
}

async function exchangeCodeForToken(code) {
  const config = getConfig();
  const codeVerifier = getStoredVerifier();

  if (!codeVerifier) {
    throw new Error("缺少 code_verifier，请重新发起 GitHub 登录。");
  }

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      client_id: config.clientId,
      code: code,
      redirect_uri: config.redirectUri,
      code_verifier: codeVerifier
    })
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error_description || data.error || "GitHub token 交换失败");
  }

  sessionStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
  clearPkceState();
  return data.access_token;
}

async function fetchGitHubUser(token) {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json"
    }
  });

  if (!response.ok) {
    throw new Error("读取 GitHub 用户信息失败");
  }

  const user = await response.json();
  sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  return user;
}

function getStoredToken() {
  return sessionStorage.getItem(TOKEN_STORAGE_KEY) || "";
}

function getStoredUser() {
  try {
    const raw = sessionStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_error) {
    return null;
  }
}

function clearAuthSession() {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(USER_STORAGE_KEY);
  clearPkceState();
}

function loadLocalMessages() {
  try {
    const raw = localStorage.getItem(MESSAGE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_error) {
    return [];
  }
}

function saveLocalMessages(items) {
  localStorage.setItem(MESSAGE_STORAGE_KEY, JSON.stringify(items || []));
}

function appendLocalMessage(item) {
  const current = loadLocalMessages();
  current.unshift(item);
  saveLocalMessages(current.slice(0, 40));
}

export {
  appendLocalMessage,
  clearAuthSession,
  exchangeCodeForToken,
  fetchGitHubUser,
  getConfig,
  getStoredState,
  getStoredToken,
  getStoredUser,
  hasConfig,
  loadLocalMessages,
  startGitHubLogin
};
