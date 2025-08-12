// 默认游戏菜单按钮列表（按从上到下的顺序）
let defaultGameMenuButtons = [
    "GameMenuButtonOptions",      // 选项按钮
    "GameMenuButtonSoundOptions",  // 声音选项按钮
    "GameMenuButtonUIOptions",    // 界面选项按钮
    "GameMenuButtonKeybindings",  // 按键绑定按钮
    "GameMenuButtonMacros",       // 宏按钮
    "GameMenuButtonLogout",       // 登出按钮
    "GameMenuButtonQuit",         // 退出游戏按钮
    "GameMenuButtonContinue"      // 返回游戏按钮
];

// /​**​
//  * 创建自定义游戏菜单按钮
//  * 
//  * @param parent - 点击按钮时要显示/隐藏的父框架
//  * @param buttonText - 按钮上显示的文本
//  */
export function GameMenuButton(parent: WoWAPI.Frame, buttonText: string) {
    // 增加游戏菜单框架的高度（为新增按钮腾出空间）
    GameMenuFrame.SetSize(GameMenuFrame.GetWidth(), GameMenuFrame.GetHeight() + 23);

    // 创建新的游戏菜单按钮
    // 使用去除空格的按钮文本作为名称的一部分
    const gameMenuButton = CreateFrame("Button", 'gamemenu' + buttonText.replace(" ", ""), GameMenuFrame, "UIPanelButtonTemplate");
    
    // 将新按钮添加到默认按钮列表的开头（使其显示在顶部）
    defaultGameMenuButtons = [gameMenuButton.GetName()].concat(defaultGameMenuButtons);
    
    // 设置按钮位置（暂时放在顶部）
    gameMenuButton.SetPoint("TOP", GameMenuFrame, "TOP", 0, 0);
    
    // 设置按钮尺寸
    gameMenuButton.SetSize(144, 21);

    // 创建按钮文本
    const gameMenuButtonText = gameMenuButton.CreateFontString(null, "OVERLAY", "GameFontNormal");
    gameMenuButtonText.SetFont("Fonts\\FRIZQT__.TTF", 13, "OUTLINE"); // 使用Friz Quadrata字体
    gameMenuButtonText.SetText(buttonText); // 设置按钮文本
    gameMenuButtonText.SetPoint("CENTER"); // 文本居中
    gameMenuButtonText.SetTextColor(0.5, 0.7, 1); // 设置文本颜色（浅蓝色）

    // 设置按钮点击事件
    gameMenuButton.SetScript("OnClick", (f, button, down) => {
        // 隐藏游戏菜单
        HideUIPanel(GameMenuFrame);
        
        // 切换父框架的显示状态
        if (parent.IsShown() && parent.IsVisible()) {
            parent.Hide();
        } else {
            parent.Show();
        }
    });
    
    // 重新排列所有游戏菜单按钮
    let yOffset = -25; // 初始Y轴偏移（从顶部向下25像素）
    
    // 遍历所有按钮（包括新添加的）
    defaultGameMenuButtons.forEach(buttonName => {
        // 为"返回游戏"按钮增加额外间距
        if (buttonName == "GameMenuButtonContinue") yOffset -= 15;
        
        // 获取按钮框架
        const MenuButton: WoWAPI.Frame = _G[buttonName];
        
        if (MenuButton) {
            // 设置按钮位置
            MenuButton.SetPoint("TOP", GameMenuFrame, "TOP", 0, yOffset);
            
            // 增加Y轴偏移（为下一个按钮腾出空间）
            yOffset -= 23;
        }
    });
}