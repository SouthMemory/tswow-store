import { createCategories, updateCategories } from "./Components/Categories";
import { createAllItems, updateItems } from "./Components/Items";
import { setupModelFrame } from "./Components/modelFrame";
import { createNavButtons, updateNavButtonScripts } from "./Components/NavButtons";
import { createIcon } from "./Components/Icon";
import { StoreItemPayload } from "../../shared/Payloads/StoreItemPayload";
import { ClientCallbackOperations, SimpleMessagePayload } from "../../shared/Messages";
import { DonationPointsPayload } from "../../shared/Payloads/DonationPointsPayload";
import { GameMenuButton } from "./Components/GameMenu";

// 全局状态变量
let accountPoints = 0;                  // 当前账户点数
let storeData: StoreItemPayload = null; // 商店数据缓存
let shopMainFrame = null;               // 主窗口框架
let selectedCategory = -1;              // 当前选中分类索引
let currentTab = 0;                     // 当前标签页索引
let currentPage = 0;                    // 当前分页索引
let pointsFrameString = null;           // 点数显示文本对象

// /​**​
//  * 商店主界面初始化函数
//  */
export function shopFrameSetup() {
    // 创建主窗口框架
    shopMainFrame = CreateFrame("Frame", "ShopMainFrame", UIParent);
    UISpecialFrames.push(`ShopMainFrame`);  // 加入特殊框架列表便于全局访问

    // 设置窗口尺寸（屏幕宽高的60%和70%）
    shopMainFrame.SetSize(UIParent.GetWidth() / 1.6, UIParent.GetHeight() / 1.3);
    shopMainFrame.SetPoint("CENTER");  // 居中显示

    // 窗口显示事件处理
    shopMainFrame.SetScript("OnShow", (self, key) => {
        self.ClearAllPoints();
        self.SetPoint("CENTER");
        PlaySound(88);  // 播放界面打开音效
    });

    // 窗口隐藏事件处理
    shopMainFrame.SetScript("OnHide", (self, key) => {
        _G['shopModelFrame'].Hide();
        PlaySound(88);  // 播放界面关闭音效
    });

    // 设置窗口可拖动
    shopMainFrame.SetMovable(true);
    shopMainFrame.EnableMouse(true);
    shopMainFrame.RegisterForDrag("LeftButton");
    shopMainFrame.SetScript("OnDragStart", () => { shopMainFrame.StartMoving(); });
    shopMainFrame.SetScript("OnDragStop", () => { shopMainFrame.StopMovingOrSizing(); });

    // 创建窗口背景纹理
    let shopMainFrameTexture = shopMainFrame.CreateTexture();
    shopMainFrameTexture.SetAllPoints();
    shopMainFrameTexture.SetTexture("Interface\\AddOns\\dh-store-assets\\NewStoreMain.blp");
    shopMainFrameTexture.SetTexCoord(0, 0.789062500, 0, 0.539062500);
    shopMainFrameTexture.SetSize(shopMainFrame.GetWidth() * 1.8, shopMainFrame.GetHeight() * 1.3);

    // 创建点数显示文本
    pointsFrameString = shopMainFrame.CreateFontString(null, "OVERLAY", "GameFontNormal");
    pointsFrameString.SetFont("Fonts\\FRIZQT__.TTF", 13, "OUTLINE");
    pointsFrameString.SetText(`${accountPoints}`);

    // 创建货币图标
    let shopCoin = createIcon(
        shopMainFrame,
        "Interface\\AddOns\\dh-store-assets\\coin.blp",
        { point: "BOTTOMLEFT", offsetX: 75, offsetY: 28 },
        { width: 12, height: 14 },
        "OVERLAY"
    );
    pointsFrameString.SetPoint("BOTTOMLEFT", shopCoin, 15, 0);

    // 初始化各界面组件
    setupModelFrame();                  // 3D模型展示框
    createNavButtons(shopMainFrame);    // 导航按钮
    createAllItems(shopMainFrame);      // 商品展示区
    createCloseButton(shopMainFrame, { width: 30, height: 30 }, () => {
        shopMainFrame.Hide();           // 关闭按钮
    });
    GameMenuButton(shopMainFrame, "Store");  // 游戏菜单按钮
    createCategories(shopMainFrame);    // 分类标签
    StoreCallbacks();                   // 注册网络回调
}

// /​**​
//  * 商店界面更新函数
//  */
export function ShopFrameUpdate() {
    // 更新分类按钮状态
    let catButtons = updateCategories(
        storeData.AllItems.map((collection) => collection.Items[0].Category)
    );

    // 为每个分类按钮设置点击事件
    catButtons.forEach((catButton, i) => {
        catButton.catButton.SetScript("OnClick", (frame, button, down) => {
            // 取消之前选中的分类高亮
            if (selectedCategory !== -1) {
                let previousCatButton = catButtons[selectedCategory];
                previousCatButton.activeTexture.Hide();
            }

            // 设置新选中的分类
            selectedCategory = i;
            let currentCatButton = catButtons[selectedCategory];
            currentCatButton.activeTexture.Show();

            // 重置分页状态
            currentTab = i;
            currentPage = 0;

            // 更新商品展示（每页8个商品）
            updateItems(
                shopMainFrame,
                storeData.AllItems[currentTab].Items.slice(currentPage * 8, (currentPage * 8) + 8),
                currentTab,
                currentPage
            );

            // 隐藏所有模型展示框
            _G['shopCreatureModelFrame'].Hide();
            _G['shopPlayerModelFrame'].Hide();
            _G['shopModelFrame'].Hide();
        });
    });

    // 初始化商品展示
    updateItems(shopMainFrame, storeData.AllItems[currentTab].Items, currentTab, currentPage);

    // 更新导航按钮状态
    updateNavButtonScripts(currentTab, currentPage, shopMainFrame, storeData.AllItems[currentTab].Items);
}

// /​**
// * 商店网络回调注册函数
// */
function StoreCallbacks() {
    // 商品数据接收回调
    OnCustomPacket(ClientCallbackOperations.RECEIVE_ITEMS, (pkt) => {
        const data = new StoreItemPayload();
        storeData = data.read(pkt);  // 解析商店数据
        ShopFrameUpdate();           // 更新界面
        _G['ShopMainFrame'].Hide();  // 初始隐藏界面
    });

    // 点数数据接收回调
    OnCustomPacket(ClientCallbackOperations.GET_POINTS, (pkt) => {
        const data = new DonationPointsPayload();
        let returnData = data.read(pkt);
        accountPoints = returnData.points;  // 更新点数缓存
        pointsFrameString.SetText(`${accountPoints}`);  // 更新点数显示
    });

    // 主动请求服务器数据
    new SimpleMessagePayload(ClientCallbackOperations.REQUEST_ITEMS, "").write().Send();
    new SimpleMessagePayload(ClientCallbackOperations.REQUEST_POINTS, "").write().Send();
}