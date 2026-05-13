import {
  appendLocalMessage,
  clearAuthSession,
  getConfig,
  getStoredToken,
  getStoredUser,
  hasConfig,
  loadLocalMessages,
  startGitHubLogin
} from "./github-pkce.js";

const DEMO_MESSAGES = [
  {
    name: "Demo Visitor",
    handle: "@guest",
    avatar: "",
    message: "这里是演示留言位。接通 GitHub PKCE 后，登录用户可以把留言保存到当前浏览器。",
    created_at: "演示数据"
  },
  {
    name: "PKCE Flow",
    handle: "@oauth",
    avatar: "",
    message: "当前页面已经准备好 GitHub 登录按钮、登录态显示、退出和本地留言持久化结构。",
    created_at: "演示数据"
  }
];

const nodes = {
  loginBtn: document.getElementById("guestbook-login-btn"),
  logoutBtn: document.getElementById("guestbook-logout-btn"),
  configStatus: document.getElementById("guestbook-config-status"),
  setupTitle: document.getElementById("guestbook-setup-title"),
  setupDesc: document.getElementById("guestbook-setup-desc"),
  setupList: document.getElementById("guestbook-setup-list"),
  messageHint: document.getElementById("guestbook-message-hint"),
  userName: document.getElementById("guestbook-user-name"),
  userMeta: document.getElementById("guestbook-user-meta"),
  avatar: document.querySelector(".guestbook-avatar"),
  form: document.getElementById("guestbook-form"),
  formStatus: document.getElementById("guestbook-form-status"),
  textarea: document.getElementById("guestbook-message"),
  submitBtn: document.getElementById("guestbook-submit-btn"),
  messages: document.getElementById("guestbook-messages")
};

let currentUser = null;

function getInitials(value) {
  return (value || "GH").slice(0, 2).toUpperCase();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatTime(value) {
  if (!value || value === "演示数据") {
    return value || "刚刚";
  }

  try {
    return new Date(value).toLocaleString("zh-CN");
  } catch (error) {
    return value;
  }
}

function setStatus(message, isError = false) {
  if (!nodes.formStatus) {
    return;
  }

  nodes.formStatus.textContent = message;
  nodes.formStatus.classList.toggle("is-error", isError);
}

function setConfigState() {
  if (!nodes.configStatus) {
    return;
  }

  if (!hasConfig()) {
    nodes.configStatus.textContent =
      "还没填写 GitHub OAuth 的 clientId，当前先显示演示模式。";
    if (nodes.setupTitle) {
      nodes.setupTitle.textContent = "你要填的关键值";
    }
    if (nodes.setupDesc) {
      nodes.setupDesc.textContent = "当前是配置引导态。线上请使用 GitHub Pages 地址，不要把 github.com 仓库地址当成 OAuth 回调地址。";
    }
    if (nodes.messageHint) {
      nodes.messageHint.textContent = "未完成 GitHub 配置前会显示演示卡片；配置完成后会切换为当前浏览器下的真实留言列表。";
    }
    return;
  }

  var config = getConfig();
  nodes.configStatus.textContent =
    "GitHub OAuth 配置已填写。点击登录后会跳到 GitHub 授权页，再通过 PKCE 回到当前站点。";
  if (nodes.setupTitle) {
    nodes.setupTitle.textContent = "当前配置状态";
  }
  if (nodes.setupDesc) {
    nodes.setupDesc.textContent = "这里显示当前已生效的登录配置摘要。注意：OAuth 回调地址必须是站点地址，不是 github.com 仓库地址。";
  }
  if (nodes.setupList) {
    nodes.setupList.innerHTML =
      "<li>Client ID 已填写：`" + escapeHtml(config.clientId) + "`</li>" +
      "<li>当前回调地址：`" + escapeHtml(config.redirectUri) + "`</li>" +
      "<li>当前作用域：`" + escapeHtml(config.scope) + "`</li>" +
      "<li>线上 GitHub Pages 示例：`https://mhxy13867806343.github.io/start-run-ai-end-fd/github-callback.html`</li>" +
      "<li>下一步直接点击左侧 `GitHub 登录` 按钮即可测试</li>";
  }
  if (nodes.messageHint) {
    nodes.messageHint.textContent = "当前配置已生效；如果还没登录且本地没有留言，会显示空状态而不是演示卡片。";
  }
}

function setUserState(user) {
  currentUser = user || null;

  if (!currentUser) {
    nodes.userName.textContent = "未登录";
    nodes.userMeta.textContent = hasConfig()
      ? "可点击 GitHub 登录，完成授权后显示 GitHub 用户信息"
      : "请先补充 GitHub clientId 和 redirectUri";
    nodes.avatar.textContent = "GH";
    nodes.avatar.style.backgroundImage = "";
    nodes.logoutBtn.disabled = true;
    nodes.submitBtn.disabled = false;
    return;
  }

  const displayName = currentUser.login || currentUser.name || "GitHub User";
  const avatar = currentUser.avatar_url || "";

  nodes.userName.textContent = displayName;
  nodes.userMeta.textContent = currentUser.name || currentUser.html_url || "GitHub 已登录";
  nodes.logoutBtn.disabled = false;

  if (avatar) {
    nodes.avatar.textContent = "";
    nodes.avatar.style.backgroundImage = 'url("' + avatar + '")';
  } else {
    nodes.avatar.textContent = getInitials(displayName);
    nodes.avatar.style.backgroundImage = "";
  }
}

function renderMessages(items) {
  if (!nodes.messages) {
    return;
  }

  const html = (items || []).map(function (item) {
    const name = escapeHtml(item.github_name || item.name || "Guest");
    const handle = escapeHtml(item.github_handle || item.handle || "");
    const message = escapeHtml(item.message || "");
    const createdAt = escapeHtml(formatTime(item.created_at));
    const avatar = item.avatar_url || item.avatar || "";
    const avatarMarkup = avatar
      ? '<div class="guestbook-message-avatar" style="background-image:url(\'' + escapeHtml(avatar) + '\')"></div>'
      : '<div class="guestbook-message-avatar">' + getInitials(name) + "</div>";

    return (
      '<article class="guestbook-message-card">' +
        '<div class="guestbook-message-head">' +
          avatarMarkup +
          '<div class="guestbook-message-meta">' +
            "<strong>" + name + "</strong>" +
            "<span>" + (handle || "访客") + " · " + createdAt + "</span>" +
          "</div>" +
        "</div>" +
        '<p class="guestbook-message-body">' + message + "</p>" +
      "</article>"
    );
  }).join("");

  nodes.messages.innerHTML = html || '<article class="guestbook-message-card"><p class="guestbook-message-body">还没有留言，来成为第一个留下痕迹的人。</p></article>';
}

function loadMessages() {
  const localMessages = loadLocalMessages();

  if (!localMessages.length) {
    if (hasConfig()) {
      renderMessages([]);
      return;
    }

    renderMessages(DEMO_MESSAGES);
    return;
  }

  renderMessages(localMessages);
}

async function syncSession() {
  const user = getStoredUser();
  const token = getStoredToken();

  if (!user || !token) {
    setUserState(null);
    return;
  }

  setUserState(user);
}

async function handleLogin() {
  if (!hasConfig()) {
    setStatus("请先填写 GitHub OAuth 的 clientId。", true);
    return;
  }

  try {
    await startGitHubLogin();
  } catch (error) {
    setStatus("GitHub 登录发起失败：" + (error.message || "未知错误"), true);
  }
}

async function handleLogout() {
  clearAuthSession();
  setUserState(null);
  setStatus("已退出登录。");
}

async function handleSubmit(event) {
  event.preventDefault();

  const message = (nodes.textarea.value || "").trim();

  if (!message) {
    setStatus("先写点内容再发布。", true);
    return;
  }

  if (!hasConfig()) {
    setStatus("先配置 GitHub OAuth 的 clientId 与回调地址。", true);
    return;
  }

  if (!currentUser) {
    setStatus("请先使用 GitHub 登录。", true);
    return;
  }

  nodes.submitBtn.disabled = true;
  appendLocalMessage({
    id: Date.now(),
    github_name: currentUser.login || currentUser.name || "GitHub User",
    github_handle: currentUser.login ? "@" + currentUser.login : "",
    avatar_url: currentUser.avatar_url || "",
    message: message,
    created_at: new Date().toISOString()
  });
  nodes.submitBtn.disabled = false;
  nodes.textarea.value = "";
  setStatus("留言已保存到当前浏览器。");
  loadMessages();
}

function bindEvents() {
  if (nodes.loginBtn) {
    nodes.loginBtn.addEventListener("click", handleLogin);
  }

  if (nodes.logoutBtn) {
    nodes.logoutBtn.addEventListener("click", handleLogout);
  }

  if (nodes.form) {
    nodes.form.addEventListener("submit", handleSubmit);
  }
}

async function init() {
  setConfigState();
  bindEvents();

  const config = getConfig();
  await syncSession();

  if (!hasConfig()) {
    setStatus("当前显示的是演示数据。填好 GitHub clientId 后会自动切换到真实登录流程。");
  } else {
    setStatus(
      "回调地址请配置为 `" +
        config.redirectUri +
        "`。如 token 交换遇到 CORS，再改成后端中转即可。"
    );
  }

  loadMessages();
}

init();
