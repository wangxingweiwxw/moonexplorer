// 知乎 OAuth 登录模块
const ZhihuOAuth = {
  APP_ID: '849',
  APP_KEY: '95bfa79d58d84b36a730f6292e2f0057',
  REDIRECT_URI: 'https://moon.chipai.cc/zhihu-callback',
  AUTHORIZE_URL: 'https://www.zhihu.com/oauth/authorize',

  // 获取当前用户信息
  getUserInfo() {
    const data = localStorage.getItem('zhihu_user');
    return data ? JSON.parse(data) : null;
  },

  // 保存用户信息
  saveUserInfo(userInfo) {
    localStorage.setItem('zhihu_user', JSON.stringify(userInfo));
    localStorage.setItem('zhihu_login_time', Date.now().toString());
  },

  // 清除用户信息
  clearUserInfo() {
    localStorage.removeItem('zhihu_user');
    localStorage.removeItem('zhihu_access_token');
    localStorage.removeItem('zhihu_login_time');
    localStorage.removeItem('zhihu_oauth_state');
  },

  // 检查登录状态
  isLoggedIn() {
    const user = this.getUserInfo();
    const loginTime = localStorage.getItem('zhihu_login_time');
    if (!user || !loginTime) return false;

    // 登录有效期 30 天
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    return (Date.now() - parseInt(loginTime)) < thirtyDays;
  },

  // 发起 OAuth 授权
  startAuth() {
    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('zhihu_oauth_state', state);

    const params = new URLSearchParams({
      client_id: this.APP_ID,
      redirect_uri: this.REDIRECT_URI,
      response_type: 'code',
      state: state,
      scope: 'get_profile'
    });

    window.location.href = `${this.AUTHORIZE_URL}?${params.toString()}`;
  },

  // 登出
  logout() {
    this.clearUserInfo();
    return true;
  },

  // 获取 access token
  getAccessToken() {
    return localStorage.getItem('zhihu_access_token');
  }
};

// 导出到全局
window.ZhihuOAuth = ZhihuOAuth;
