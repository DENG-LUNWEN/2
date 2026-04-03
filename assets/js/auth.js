import { userApi } from "./api.js";

// DOM 元素
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const modalOverlay = document.getElementById("modalOverlay");
const modalClose = document.getElementById("modalClose");
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const adminEntrance = document.getElementById("adminEntrance");

// 登录/注册标签切换
loginTab.addEventListener("click", () => {
  loginTab.classList.add("active");
  registerTab.classList.remove("active");
  loginForm.classList.add("active");
  registerForm.classList.remove("active");
});

registerTab.addEventListener("click", () => {
  registerTab.classList.add("active");
  loginTab.classList.remove("active");
  registerForm.classList.add("active");
  loginForm.classList.remove("active");
});

// 弹窗显示/隐藏
loginBtn.addEventListener("click", () => {
  modalOverlay.classList.add("show");
  loginTab.click(); // 默认显示登录
});

registerBtn.addEventListener("click", () => {
  modalOverlay.classList.add("show");
  registerTab.click(); // 默认显示注册
});

modalClose.addEventListener("click", () => {
  modalOverlay.classList.remove("show");
});

// 点击遮罩关闭弹窗
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) {
    modalOverlay.classList.remove("show");
  }
});

// 登录表单提交
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;
  const errorTip = document.getElementById("loginError");

  // 验证输入
  if (!username || !password) {
    errorTip.textContent = "用户名和密码不能为空";
    errorTip.classList.add("show");
    return;
  }

  // 调用登录接口
  const res = await userApi.login(username, password);
  if (res && res.length > 0) {
    // 登录成功，存储用户信息
    const user = res[0];
    localStorage.setItem("currentUser", JSON.stringify(user));
    modalOverlay.classList.remove("show");
    // 更新页面UI
    updateAuthUI();
    alert("登录成功！");
  } else {
    errorTip.textContent = "用户名或密码错误";
    errorTip.classList.add("show");
  }
});

// 注册表单提交
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("registerUsername").value;
  const password = document.getElementById("registerPassword").value;
  const confirmPwd = document.getElementById("confirmPassword").value;
  const errorTip = document.getElementById("registerError");

  // 验证输入
  if (!username || !password) {
    errorTip.textContent = "用户名和密码不能为空";
    errorTip.classList.add("show");
    return;
  }
  if (password !== confirmPwd) {
    errorTip.textContent = "两次密码不一致";
    errorTip.classList.add("show");
    return;
  }

  // 检查用户名是否已存在
  const allUsers = await userApi.getAllUsers();
  const isExist = allUsers.some(user => user.username === username);
  if (isExist) {
    errorTip.textContent = "用户名已存在";
    errorTip.classList.add("show");
    return;
  }

  // 注册新用户
  const newUser = {
    username,
    password,
    role: "user" // 默认普通用户
  };
  const res = await userApi.register(newUser);
  if (res) {
    alert("注册成功！请登录");
    loginTab.click();
    // 清空注册表单
    registerForm.reset();
  } else {
    errorTip.textContent = "注册失败，请重试";
    errorTip.classList.add("show");
  }
});

// 更新登录状态UI
export function updateAuthUI() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (currentUser) {
    // 已登录
    loginBtn.style.display = "none";
    registerBtn.style.display = "none";
    // 管理员显示后台入口
    if (currentUser.role === "admin") {
      adminEntrance.classList.add("show");
    }
    // 添加退出按钮
    const logoutBtn = document.createElement("button");
    logoutBtn.textContent = "退出登录";
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("currentUser");
      window.location.reload();
    });
    document.querySelector(".auth-buttons").appendChild(logoutBtn);
  } else {
    // 未登录
    loginBtn.style.display = "inline-block";
    registerBtn.style.display = "inline-block";
    adminEntrance.classList.remove("show");
  }
}

// 页面加载时初始化登录状态
window.addEventListener("load", updateAuthUI);

// 管理员入口跳转
adminEntrance.addEventListener("click", () => {
  window.location.href = "./admin/admin-dashboard.html";
});