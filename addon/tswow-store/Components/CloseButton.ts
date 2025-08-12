function createCloseButton(parent: WoWAPI.Frame, size: { width: number; height: number }, closeFunction: () => void) {
    const closeButton = CreateFrame("Button", "UniqueName", parent, "UIPanelCloseButton");
    closeButton.SetSize(size.width, size.height);
    closeButton.SetPoint("TOPRIGHT", -2, -8);
    closeButton.EnableMouse(true);
    closeButton.SetScript("OnClick", (frame, button, down) => { closeFunction(); });
}

// demo: 创建一个关闭按钮
// createCloseButton(
//     myFrame,                // 父框架
//     { width: 32, height: 32 }, // 尺寸
//     () => {                 // 关闭功能
//         myFrame.Hide();     // 隐藏父框架
//         PlaySound("gsTitleOptionExit"); // 播放关闭音效
//     }
// );