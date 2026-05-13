import {
  exchangeCodeForToken,
  fetchGitHubUser,
  getConfig,
  getStoredState,
  hasConfig
} from "./github-pkce.js";

const statusNode = document.getElementById("callback-status");
const detailNode = document.getElementById("callback-detail");

function setCallbackStatus(title, detail, isError = false) {
  if (statusNode) {
    statusNode.textContent = title;
  }

  if (detailNode) {
    detailNode.textContent = detail;
    detailNode.classList.toggle("is-error", isError);
  }
}

function getGuestbookUrl() {
  return window.location.origin + window.location.pathname.replace(/github-callback\.html$/, "guestbook.html");
}

async function handleCallback() {
  if (!hasConfig()) {
    setCallbackStatus(
      "缺少 GitHub 配置",
      "请先在 `github-callback.html` 和 `guestbook.html` 中填写相同的 clientId 与 redirectUri。",
      true
    );
    return;
  }

  try {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    if (error) {
      throw new Error(errorDescription || error);
    }

    if (!code) {
      throw new Error("没有拿到 GitHub code");
    }

    if (!state || state !== getStoredState()) {
      throw new Error("state 校验失败，可能存在 CSRF 风险");
    }

    setCallbackStatus("正在交换 token...", "准备使用 `code` 与 `code_verifier` 请求 GitHub token。");
    const token = await exchangeCodeForToken(code);

    setCallbackStatus("正在获取用户信息...", "token 已拿到，继续请求 `https://api.github.com/user`。");
    await fetchGitHubUser(token);

    setCallbackStatus("登录成功", "用户信息已保存，正在返回留言板。");
    window.setTimeout(function () {
      window.location.replace(getGuestbookUrl());
    }, 800);
  } catch (err) {
    const message = err && err.message ? err.message : "GitHub 登录失败";
    const config = getConfig();
    const tips =
      "若这里报 token 交换失败或浏览器 CORS，说明当前 GitHub OAuth App 不支持浏览器直换 token，可先确认回调地址为 `" +
      config.redirectUri +
      "`，或改为后端中转。";

    setCallbackStatus("登录失败", message + "。 " + tips, true);
  }
}

handleCallback();
