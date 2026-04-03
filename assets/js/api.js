// 基础地址（本地运行json-server时的地址）
const BASE_URL = "https://2-pi-topaz.vercel.app/api";

// 通用请求函数
async function request(url, method = "GET", data = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${BASE_URL}${url}`, options);
    return await response.json();
  } catch (error) {
    console.error("请求失败：", error);
    alert("网络请求失败，请检查json-server是否运行");
    return null;
  }
}

// 用户相关接口
export const userApi = {
  // 登录
  login: (username, password) => {
    return request(`/users?username=${username}&password=${password}`);
  },
  // 注册
  register: (userData) => {
    return request("/users", "POST", userData);
  },
  // 获取用户信息
  getUser: (id) => {
    return request(`/users/${id}`);
  },
};

// 失物招领接口
export const lostFoundApi = {
  // 获取所有失物招领
  getAll: () => request("/lost-found"),
  // 发布失物招领
  publish: (data) => request("/lost-found", "POST", data),
  // 获取最新3条
  getLatest: () => request("/lost-found?_sort=publishTime&_order=desc&_limit=3"),
};

// 二手平台接口
export const secondHandApi = {
  getAll: () => request("/second-hand"),
  publish: (data) => request("/second-hand", "POST", data),
  getLatest: () => request("/second-hand?_sort=publishTime&_order=desc&_limit=3"),
};

// 活动墙接口
export const activityWallApi = {
  getAll: () => request("/activity-wall"),
  publish: (data) => request("/activity-wall", "POST", data),
  getLatest: () => request("/activity-wall?_sort=publishTime&_order=desc&_limit=3"),
};

// 管理员统计接口
export const adminApi = {
  // 获取各模块总数
  getStats: async () => {
    const [lostCount, secondCount, activityCount, userCount] = await Promise.all([
      request("/lost-found").then(res => res.length),
      request("/second-hand").then(res => res.length),
      request("/activity-wall").then(res => res.length),
      request("/users").then(res => res.length)
    ]);
    return { lostCount, secondCount, activityCount, userCount };
  },
  // 获取所有用户
  getAllUsers: () => request("/users"),
  // 删除内容（通用）
  deleteItem: (type, id) => request(`/${type}/${id}`, "DELETE"),
};
