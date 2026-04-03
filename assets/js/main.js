import { lostFoundApi, secondHandApi, activityWallApi } from "./api.js";

// 页面加载时获取最新内容
window.addEventListener("load", async () => {
  await loadLatestContent();
});

// 加载三大模块最新内容（各取1条，共3条）
async function loadLatestContent() {
  const [lostLatest, secondLatest, activityLatest] = await Promise.all([
    lostFoundApi.getLatest(),
    secondHandApi.getLatest(),
    activityWallApi.getLatest()
  ]);

  const contentList = document.getElementById("latestContentList");
  contentList.innerHTML = "";

  // 整合最新内容（各取第一条）
  const latestItems = [
    ...(lostLatest.length > 0 ? [{ ...lostLatest[0], type: "失物招领" }] : []),
    ...(secondLatest.length > 0 ? [{ ...secondLatest[0], type: "校园二手" }] : []),
    ...(activityLatest.length > 0 ? [{ ...activityLatest[0], type: "校园活动" }] : [])
  ];

  // 渲染到页面
  latestItems.forEach(item => {
    const itemElement = document.createElement("div");
    itemElement.className = "content-item";
    itemElement.innerHTML = `
      <div class="type">${item.type}</div>
      <div class="title">${item.title}</div>
      <div class="desc">${item.description.substring(0, 50)}${item.description.length > 50 ? "..." : ""}</div>
    `;
    contentList.appendChild(itemElement);
  });
}