// Cloudflare Pages Function: /functions/zhihu-callback.js
// 处理知乎 OAuth 回调，用 code 换取 access_token

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  // 错误处理
  if (error) {
    return new Response(redirectHTML('授权失败', error), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  if (!code || !state) {
    return new Response(redirectHTML('参数错误', '缺少必要参数'), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  try {
    // 用 code 换取 access_token
    const tokenResponse = await fetch('https://www.zhihu.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: '849',
        client_secret: '95bfa79d58d84b36a730f6292e2f0057',
        redirect_uri: 'https://moon.chipai.cc/zhihu-callback'
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return new Response(redirectHTML('获取令牌失败', errorText), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 获取用户信息
    const userResponse = await fetch('https://api.zhihu.com/people/self', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!userResponse.ok) {
      return new Response(redirectHTML('获取用户信息失败', ''), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    const userData = await userResponse.json();

    // 构建用户数据
    const userInfo = {
      id: userData.id,
      name: userData.name,
      avatar: userData.avatar_url || '',
      headline: userData.headline || ''
    };

    // 返回 HTML，将数据传递给前端
    return new Response(successHTML(userInfo, accessToken, state), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });

  } catch (err) {
    return new Response(redirectHTML('系统错误', err.message), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

function successHTML(userInfo, accessToken, state) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>登录成功</title>
<style>
:root{--ink:#e7fbf6;--cyan:#6fe8df}
*{margin:0;padding:0;box-sizing:border-box}
body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#05080e;color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif;text-align:center;padding:20px}
.container{max-width:480px;background:#0a0d12;border:2px solid #2a4556;border-radius:12px;padding:32px;box-shadow:0 8px 24px rgba(0,0,0,.5)}
h1{font-size:24px;color:var(--cyan);margin-bottom:16px}
p{font-size:14px;line-height:1.6;color:#8aa8ad;margin-bottom:24px}
.spinner{width:40px;height:40px;border:4px solid rgba(111,232,223,.2);border-top-color:var(--cyan);border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 20px}
@keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<div class="container">
<div class="spinner"></div>
<h1>登录成功</h1>
<p>欢迎，${userInfo.name}</p>
</div>
<script>
const userInfo = ${JSON.stringify(userInfo)};
const accessToken = ${JSON.stringify(accessToken)};
const state = ${JSON.stringify(state)};

localStorage.setItem('zhihu_user', JSON.stringify(userInfo));
localStorage.setItem('zhihu_access_token', accessToken);
localStorage.setItem('zhihu_login_time', Date.now().toString());
localStorage.setItem('zhihu_oauth_state', state);

setTimeout(() => {
  window.location.href = '/index.html';
}, 1500);
</script>
</body>
</html>`;
}

function redirectHTML(title, message) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
:root{--ink:#e7fbf6;--red:#e84a5f}
*{margin:0;padding:0;box-sizing:border-box}
body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#05080e;color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif;text-align:center;padding:20px}
.container{max-width:480px;background:#0a0d12;border:2px solid #2a4556;border-radius:12px;padding:32px}
h1{font-size:24px;color:var(--red);margin-bottom:16px}
p{font-size:14px;color:#8aa8ad;margin-bottom:24px}
button{background:#17606b;border:2px solid #6fe8df;color:#6fe8df;padding:10px 20px;font-size:14px;cursor:pointer;border-radius:6px;font-family:inherit}
</style>
</head>
<body>
<div class="container">
<h1>${title}</h1>
<p>${message}</p>
<button onclick="window.location.href='/index.html'">返回首页</button>
</div>
</body>
</html>`;
}
