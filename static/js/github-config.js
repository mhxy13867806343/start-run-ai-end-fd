(function () {
  var path = window.location.pathname;
  var redirectUri = window.location.origin + path;

  // Keep localhost and GitHub Pages working with the same config file.
  if (/guestbook\.html$/.test(path)) {
    redirectUri = window.location.origin + path.replace(/guestbook\.html$/, "github-callback.html");
  }

  window.GITHUB_OAUTH_CONFIG = {
    clientId: "Ov23lixaPD32110Wqvp9",
    redirectUri: "https://mhxy13867806343.github.io/start-run-ai-end-fd/github-callback.html",
    scope: "read:user user:email"
  };
})();
