import { createIcon } from "./Icon";

// 定义商品类别数据结构
let categoryTable = [
    { name: "On Sale", icon: "interface\\icons\\inv_helmet_96" }, // 0 促销商品
    { name: "Convenience", icon: "Interface\\Icons\\INV_SCROLL_12.blp" }, // 1 便利道具
    { name: "Cosmetics", icon: "Interface\\AddOns\\dh-store-assets\\INV_ARMOR_EARTHENCIVILIAN_D_01_belt.blp" }, // 2 装饰外观
    { name: "Mounts", icon: "Interface\\Icons\\INV_SCROLL_12.blp" }, // 3 坐骑
    { name: "Bundles", icon: "Interface\\AddOns\\dh-store-assets\\ITEM_VENARI_PARAGONCHEST_02.blp" }, // 4 捆绑包
    { name: "Druid Forms", icon: "Interface\\AddOns\\dh-store-assets\\ABILITY_DRUID_SERENEFOCUS.blp" }, // 5 德鲁伊形态
    { name: "Warlock Forms", icon: "Interface\\AddOns\\dh-store-assets\\SPELL_WARLOCK_DEMONSOUL.blp" } // 6 术士形态
];

// 存储类别按钮的数组
let categoryButtons: { 
    catFrame: WoWAPI.Frame; // 类别背景框架
    catIcon: WoWAPI.Frame;  // 类别图标
    catString: WoWAPI.FontString; // 类别名称文本
    catButton: WoWAPI.Button; // 类别按钮
    activeTexture: WoWAPI.Texture // 激活状态纹理
}[] = [];

// 类别按钮的容器框架
let boundingFrame: WoWAPI.Frame | null = null;

// /​**​
//  * 更新显示的类别
//  * @param categories 需要显示的类别ID数组
//  * @returns 更新后的类别按钮数组
//  */
export function updateCategories(categories: number[]) {
    // 显示类别容器框架
    boundingFrame.Show();
    
    // 遍历所有类别
    categoryTable.forEach((category, i) => {
        let info = categoryButtons[i];
        
        // 检查当前类别是否在传入的类别数组中
        if (categories.includes(i)) {
            // 设置并显示类别名称
            info.catString.SetText(category.name);
            info.catString.Show();
            
            // 显示图标和框架
            info.catIcon.Show();
            info.catFrame.Show();
        } else {
            // 隐藏不在列表中的类别
            info.catString.Hide();
            info.catIcon.Hide();
            info.catFrame.Hide();
        }
    });
    
    return categoryButtons;
}

// /​**​
//  * 创建类别选择界面
//  * @param parentFrame 父级框架
//  */
export function createCategories(parentFrame: WoWAPI.Frame) {
    // 创建类别容器框架
    boundingFrame = CreateFrame("Frame", "BoundingCategory", parentFrame);
    
    // 设置容器尺寸（占父框架宽度的22.5%，高度的90%）
    boundingFrame.SetSize(
        (parentFrame.GetWidth() * 22.5) / 100,
        (parentFrame.GetHeight() * 90) / 100
    );
    
    // 定位容器框架（距离左上角18像素，向下偏移75像素）
    boundingFrame.SetPoint("TOPLEFT", 18, -75);

    // 为每个类别创建UI元素
    categoryTable.forEach((category, i) => {
        // 创建类别背景框架
        let categoryFrame = CreateFrame("Frame", "CategoryBG", boundingFrame);
        
        // 设置背景框架尺寸（宽度为容器宽度减8，高度为容器高度的12/150）
        categoryFrame.SetSize(
            boundingFrame.GetWidth() - 8,
            (boundingFrame.GetHeight() * 12) / 150
        );
        
        // 垂直排列类别（每个类别间隔0像素）
        categoryFrame.SetPoint("TOPLEFT", boundingFrame, 0, i * -(categoryFrame.GetHeight() + 0));

        // 创建类别按钮
        let categoryButton = CreateFrame("Button", "Category", categoryFrame);
        categoryButton.SetSize(categoryFrame.GetWidth(), categoryFrame.GetHeight());
        categoryButton.SetPoint("CENTER", categoryFrame, 0, 0);
        categoryButton.RegisterForClicks("AnyDown"); // 注册所有鼠标点击事件

        // 创建按钮背景纹理
        let text = categoryButton.CreateTexture("categoryText");
        text.SetAllPoints(); // 覆盖整个按钮
        text.SetTexture("Interface\\AddOns\\dh-store-assets\\NewStoreMainButton.blp");
        text.SetTexCoord(0.031250000, 0.711250000, 0.171875000, 0.316406250); // 设置纹理坐标

        // 创建高亮纹理（鼠标悬停时显示）
        let highlightText = categoryButton.CreateTexture("categoryTextHighlight");
        highlightText.SetAllPoints();
        highlightText.SetTexture("Interface\\AddOns\\dh-store-assets\\NewStoreMainButton.blp");
        highlightText.SetTexCoord(0.031250000, 0.710937500, 0.332031250, 0.476562500);
        categoryButton.SetHighlightTexture(highlightText); // 设置为高亮纹理

        // 创建类别名称文本
        let categoryString = categoryButton.CreateFontString(null, "OVERLAY", "GameFontNormal");
        categoryString.SetFont("Fonts\\FRIZQT__.TTF", 12, "OUTLINE"); // 使用Friz Quadrata字体
        categoryString.SetShadowOffset(1, -1); // 设置文本阴影
        categoryString.SetPoint("CENTER", 0, 0); // 居中显示
        categoryString.SetText(category.name); // 设置文本内容

        // 创建激活状态纹理（选中类别时显示）
        let catBTNActive = categoryButton.CreateTexture(null, "OVERLAY");
        catBTNActive.SetAllPoints();
        catBTNActive.SetTexture("Interface\\AddOns\\dh-store-assets\\NewStoreMainButton.blp");
        catBTNActive.SetTexCoord(0.031250000, 0.710937500, 0.500000000, 0.640625000);
        catBTNActive.Hide(); // 初始隐藏

        // 创建类别图标
        let icon: WoWAPI.Frame = createIcon(
            categoryFrame, 
            category.icon, 
            { point: "LEFT", offsetX: 6, offsetY: -1 }, // 定位在左侧
            { width: 30, height: 34 } // 图标尺寸
        );

        // 将创建的UI元素存入数组
        categoryButtons.push({ 
            catFrame: categoryFrame, 
            catIcon: icon, 
            catString: categoryString, 
            catButton: categoryButton, 
            activeTexture: catBTNActive 
        });
    });
}