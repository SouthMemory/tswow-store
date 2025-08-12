import { BuyItemPayload } from "../../../shared/Payloads/BuyItemPayload";
import { StoreItem, StoreItemFlags } from "../../../shared/Payloads/StoreItemPayload";
import { createIcon } from "./Icon";

// 商品展示框列表
const itemFramesList: WoWAPI.Frame[] = [];

// 商品布局参数
const basePosX = 222;                  // 起始X坐标
const basePosY = -60;                  // 起始Y坐标
const visualizationSize = 90;          // 单个商品展示区高度
const spaceBetweenNodes = 155;         // 商品间距

// /​**​
//  * 创建所有商品展示框
//  * @param shopFrame 父级框架
//  * @returns 商品框架列表
//  */
export function createAllItems(shopFrame: WoWAPI.Frame) {
    // 创建8个商品展示框（2行4列布局）
    for (let i = 0; i < 8; i++) {
        // 计算当前商品框位置
        const posX = basePosX + (i % 4) * spaceBetweenNodes;
        const posY = basePosY - Math.floor(i / 4) * (spaceBetweenNodes + visualizationSize);
        
        // 创建商品框架
        const itemFrame = CreateFrame("Frame", "Item" + i, shopFrame);
        itemFrame.SetID(i);
        itemFrame.SetSize(shopFrame.GetWidth() / 5.75, shopFrame.GetHeight() / 2.5);
        itemFrame.EnableMouse(true);
        itemFrame.SetPoint("TOPLEFT", posX, posY);
        itemFrame.Hide();

        // 鼠标悬停效果
        itemFrame.SetScript("OnEnter", function() {
            itemFrame['hoverTexture'].Show();
            SetCursor("INSPECT_CURSOR");
        });

        itemFrame.SetScript("OnLeave", function() {
            itemFrame['hoverTexture'].Hide();
            SetCursor("POINT_CURSOR");
        });

        // 悬停高亮纹理
        itemFrame['hoverTexture'] = itemFrame.CreateTexture("hoverTexture" + i, "OVERLAY");
        itemFrame['hoverTexture'].SetAllPoints(itemFrame);
        itemFrame['hoverTexture'].SetTexture("Interface\\AddOns\\dh-store-assets\\NewStoreMain.blp");
        itemFrame['hoverTexture'].SetTexCoord(0.349609375, 0.491046875, 0.645625000, 0.849609375);
        itemFrame['hoverTexture'].Hide();

        // 商品背景纹理
        itemFrame['itemTexture'] = itemFrame.CreateTexture("itemTexture" + i, "ARTWORK");
        itemFrame['itemTexture'].SetAllPoints();
        itemFrame['itemTexture'].SetTexture("Interface\\AddOns\\dh-store-assets\\item-sale-bg.blp");
        itemFrame['itemTexture'].SetTexCoord(0.035156250, 0.601562500, 0.039062500, 0.849062500);

        // 商品名称文本
        itemFrame['itemString'] = itemFrame.CreateFontString("itemName" + i, "OVERLAY", "GameFontNormal");
        itemFrame['itemString'].SetFont("Fonts\\FRIZQT__.TTF", 13, "OUTLINE");
        itemFrame['itemString'].SetPoint("CENTER", 0, -20);
        itemFrame['itemString'].SetWidth(itemFrame.GetWidth() - 20);
        itemFrame['itemString'].SetWordWrap(true);

        // 选中状态纹理
        itemFrame['activeItemTexture'] = itemFrame.CreateTexture("itemTexture" + i, "ARTWORK");
        itemFrame['activeItemTexture'].SetAllPoints();
        itemFrame['activeItemTexture'].Hide();

        // 商品图标
        itemFrame['icon'] = createIcon(itemFrame, i, { 
            point: "TOP", 
            offsetX: 0, 
            offsetY: -32 
        }, { 
            width: 76, 
            height: 76 
        });
        itemFrame['icon'].EnableMouse(true);
        itemFrame['icon'].SetScript("OnLeave", () => GameTooltip.Hide());

        // 购买按钮
        itemFrame['buyButton'] = createBuyButton(itemFrame, i);
        
        // 价格图标
        itemFrame['costIcon'] = createCostIcon(itemFrame['buyButton'], i);
        
        itemFramesList.push(itemFrame);
    }
    return itemFramesList;
}

// /​**​
//  * 更新商品展示
//  * @param shopFrame 父级框架 
//  * @param items 商品数据数组
//  * @param currentTab 当前标签页
//  * @param currentPage 当前分页
//  */
export function updateItems(shopFrame: WoWAPI.Frame, items: TSArray<StoreItem>, currentTab: number, currentPage: number) {
    for (let i = 0; i < 8; i++) {
        if (items[i]) {
            const item = items[i];
            const itemFrame = itemFramesList[i];
            
            // 设置商品信息
            itemFrame['itemString'].SetText(item.Name);
            itemFrame['icon']['texture'].SetTexture(GetItemIcon(item.PurchaseID));
            const frameID = itemFrame.GetID() + (currentPage * 6);

            // 点击事件：显示3D模型预览
            itemFrame.SetScript("OnMouseDown", function() {
                // 根据商品类型显示不同模型
                if (containsFlag(item.Flags, StoreItemFlags.isEquipment)) {
                    // 装备类：显示玩家试穿效果
                    _G['shopCreatureModelFrame'].Hide();
                    _G['shopPlayerModelFrame'].SetUnit("player");
                    _G['shopPlayerModelFrame'].TryOn(`item:${item.PurchaseID}`);
                    _G['shopPlayerModelFrame'].Show();
                } 
                else if (containsFlag(item.Flags, StoreItemFlags.iSCreature)) {
                    // 生物类：显示生物模型
                    _G['shopPlayerModelFrame'].Hide();
                    _G['shopCreatureModelFrame'].SetCreature(item.ExtraID);
                    _G['shopCreatureModelFrame'].Show();
                }
                _G['shopModelFrame'].Show();
            });

            // 图标悬停显示物品提示
            itemFrame['icon'].SetScript("OnEnter", () => {
                GameTooltip.SetOwner(shopFrame, "ANCHOR_CURSOR");
                GameTooltip.SetHyperlink(`item:${item.PurchaseID}`);
                GameTooltip.Show();
            });

            // 购买按钮点击事件
            itemFrame['buyButton'].SetScript("OnClick", () => {
                buyFrameID = frameID;
                buyTabID = currentTab;
                // 显示确认购买弹窗
                // @ts-ignore
                StaticPopup_Show("SHOW_CONFIRM_SALE");
            });

            // 设置价格显示
            itemFrame['costIcon']['costText'].SetText(item.Cost.toString());
            itemFrame.Show();
        } else {
            itemFramesList[i].Hide();
        }
    }
}

// /​**​
//  * 检查标志位是否包含特定标记
//  * @param value 标志位值
//  * @param flag 要检查的标记
//  * @returns 是否包含
//  */
function containsFlag(value: number, flag: StoreItemFlags): boolean {
    return (value & flag) === flag;
}

// /​**​
//  * 创建价格显示图标
//  * @param parentFrame 父级按钮
//  * @param index 索引
//  * @returns 价格图标框架
//  */
export function createCostIcon(parentFrame: WoWAPI.Button, index: number) {
    const coinFrame = CreateFrame("Frame", "Coin" + index, parentFrame);
    coinFrame.SetSize(parentFrame.GetWidth() * 0.4, parentFrame.GetHeight());
    coinFrame.SetPoint("RIGHT", -10, 0);

    // 货币图标
    const buttonIcon = createIcon(coinFrame, 
        "Interface\\AddOns\\dh-store-assets\\coin.blp", 
        { point: "RIGHT", offsetX: 0, offsetY: 0 }, 
        { width: coinFrame.GetWidth() - 28, height: coinFrame.GetHeight() - 13 }
    );
    buttonIcon.Show();

    // 价格文本
    coinFrame['costText'] = coinFrame.CreateFontString(null, "OVERLAY", "GameFontNormal");
    coinFrame['costText'].SetFont("Fonts\\FRIZQT__.TTF", 13, "OUTLINE");
    coinFrame['costText'].SetPoint("RIGHT", buttonIcon, "LEFT", -2, 0);
    coinFrame['costText'].Show();
    
    return coinFrame;
}

// /​**​
//  * 创建购买按钮
//  * @param parentFrame 父级框架
//  * @param index 按钮索引
//  * @returns 按钮实例
//  */
export function createBuyButton(parentFrame: WoWAPI.Frame, index: number) {
    const button = CreateFrame('Button', 'BuyItemButton' + index, parentFrame);
    button.SetPoint('BOTTOM', parentFrame, 0, 20);
    button.SetSize(parentFrame.GetWidth() * 0.75, parentFrame.GetHeight() * 0.13);
    button.EnableMouse(true);

    // 按钮纹理状态
    const buttonTexture = button.CreateTexture('buttonText' + index);
    buttonTexture.SetTexture("Interface\\AddOns\\dh-store-assets\\StoreFrame_Main.blp");
    buttonTexture.SetAllPoints();

    // 高亮状态
    const highlightText = button.CreateTexture('buttonHighlight' + index);
    highlightText.SetTexture(buttonTexture.GetTexture());
    highlightText.SetAllPoints();
    button.SetHighlightTexture(highlightText);

    // 按下状态
    const pushedText = button.CreateTexture('buttonPushed' + index);
    pushedText.SetTexture(buttonTexture.GetTexture());
    pushedText.SetAllPoints();
    button.SetPushedTexture(pushedText);

    // 按钮文本
    const buttonText = button.CreateFontString(null, 'OVERLAY', "GameFontNormal");
    buttonText.SetPoint('LEFT', 10, 0);
    buttonText.SetFont("Fonts\\FRIZQT__.TTF", 11, "OUTLINE");
    buttonText.SetText("Buy");

    return button;
}

// 全局购买状态
let buyFrameID: number;  // 要购买的商品框架ID
let buyTabID: number;    // 当前标签页ID

// 购买确认弹窗配置
// @ts-ignore
StaticPopupDialogs["SHOW_CONFIRM_SALE"] = {
    text: "Are you sure?",
    button1: "Yes",
    button2: "No",
    OnAccept: function() {
        BuyItem(buyFrameID, buyTabID);
    },
    timeout: 0,
    whileDead: true,
    hideOnEscape: true,
};

// /​**​
//  * 发送购买请求
//  * @param itemIndex 商品索引
//  * @param tabIndex 分类索引
//  */
export function BuyItem(itemIndex: number, tabIndex: number) {
    const sendingPacket = new BuyItemPayload();
    sendingPacket.ItemIndex = itemIndex;
    sendingPacket.TabIndex = tabIndex;
    sendingPacket.BuildPacket().Send();
}