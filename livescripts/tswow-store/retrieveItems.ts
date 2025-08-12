import { StoreItem, StoreItemCollection, StoreItemPayload } from "../../shared/Payloads/StoreItemPayload";

// /​**​
//  * 设置物品字典，将物品按照分类存储到字典中。
//  * @param itemDict - 一个两层嵌套字典，用于存储分类后的物品。结构为：分类ID -> (物品索引 -> 物品对象)
//  * @returns 返回一个包含所有物品分类集合的StoreItemPayload对象
//  */
export function setupItems(itemDict: TSDictionary<uint32, TSDictionary<uint32, StoreItem>>) {
    // 从数据库检索物品数据
    let items = retrieveItems();
    
    // 遍历每个分类集合
    items.AllItems.forEach((collection, i) => {
        // 创建一个内层字典，用于存储当前分类下的物品（索引 -> 物品）
        let collDict = CreateDictionary<uint32, StoreItem>({});
        
        // 遍历当前分类下的每个物品
        collection.Items.forEach((item, j) => {
            // 将物品添加到内层字典，键为物品在数组中的索引j
            collDict.set(j, item);
        });
        
        // 将内层字典添加到外层字典，键为分类索引i
        itemDict.set(i, collDict);
    });
    
    return items;
}

// /​**​
//  * 从数据库查询商店物品数据，并组织成StoreItemPayload对象。
//  * @returns 返回一个包含所有物品分类集合的StoreItemPayload对象
//  */
function retrieveItems() {
    // 创建StoreItemPayload实例
    const payload = new StoreItemPayload();
    
    // 用于存储按分类分组的物品数组
    const filteredItems: TSArray<StoreItemCollection> = [];
    
    // 创建一个字典，键为分类ID，值为该分类下的物品数组
    const catItemsDict = CreateDictionary<number, TSArray<StoreItem>>({});
    
    // 执行SQL查询，获取store_items表中的所有数据
    const data = QueryWorld("SELECT * FROM store_items;");
    
    // 遍历查询结果的每一行
    while (data.GetRow()) {
        // 创建一个新的StoreItem对象
        const item = new StoreItem();
        
        // 从查询结果中读取每一列的值，并赋值给item对象的属性
        // 注意：列的索引从0开始，对应SELECT查询的列顺序
        item.ID = data.GetUInt64(0);          // 第一列：id
        item.Flags = data.GetUInt64(1);       // 第二列：flags
        item.Cost = data.GetUInt64(2);        // 第三列：cost
        item.Name = data.GetString(3);        // 第四列：name
        item.Description = data.GetString(4); // 第五列：description
        item.Category = data.GetDouble(5);    // 第六列：category（注意：这里使用GetDouble读取，但实际可能是整数）
        item.PurchaseID = data.GetUInt64(6); // 第七列：purchase_id
        item.ExtraID = data.GetUInt64(7);    // 第八列：extra_id
        
        // 如果字典中还没有该分类的数组，则创建一个空数组
        if (!catItemsDict.keys().includes(item.Category)) {
            catItemsDict.set(item.Category, <TSArray<StoreItem>>[]);
        }
        
        // 将当前物品添加到对应分类的数组中
        catItemsDict[item.Category].push(item);
    }
    
    // 遍历分类字典，将每个分类的物品数组转换为StoreItemCollection对象
    catItemsDict.forEach((category, itemArray) => {
        const listToAdd = new StoreItemCollection();
        listToAdd.MaxItems = itemArray.length; // 设置该分类下的物品数量
        listToAdd.Items = itemArray;            // 设置物品数组
        filteredItems.push(listToAdd);          // 将分类集合添加到结果数组
    });
    
    // 设置payload的属性
    payload.MaxTabs = filteredItems.length;     // 分类数量（即分类集合的大小）
    payload.AllItems = filteredItems;            // 所有分类的物品集合
    
    return payload;
}