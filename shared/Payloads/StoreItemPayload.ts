import { ClientCallbackOperations } from "../Messages";

// /​**​
//  * 商店商品类
//  * 表示商店中的一个可购买商品
//  */
export class StoreItem {
    Name: string = "";         // 商品名称
    Flags: number = 0;          // 商品标志位（用于特殊属性标记）
    ID: number = 0;            // 商品唯一ID
    Cost: number = 0;          // 商品价格（所需点数）
    Description: string = "";   // 商品描述
    Category: number = 0;      // 商品分类ID
    PurchaseID: number = 0;    // 购买后获得的物品/服务ID
    ExtraID: number = 0;       // 额外关联ID（如法术ID、坐骑ID等）
}

// /​**​
//  * 商店商品标志位枚举
//  * 使用位掩码方式定义商品特殊属性
//  */
export enum StoreItemFlags {
    iSCreature = 1,     // 是否为生物类型（宠物等）
    isEquipment = 2,    // 是否为装备
    isSale10 = 4,       // 是否享受10%折扣
    isSale20 = 8,       // 是否享受20%折扣
    isSale50 = 16       // 是否享受50%折扣
}

// /​**​
//  * 商品集合类
//  * 表示一个分类下的所有商品
//  */
export class StoreItemCollection {
    MaxItems: number = 0;       // 该分类下的商品总数
    Items: TSArray<StoreItem> = []; // 商品数组
}

// /​**​
//  * 商店数据负载类
//  * 用于在客户端和服务器之间传输商店数据
//  */
export class StoreItemPayload {
    MaxTabs: number = 0;                        // 商店分类总数
    AllItems: TSArray<StoreItemCollection> = []; // 所有分类的商品集合

    // /​**​
    //  * 从数据包中读取商店数据
    //  * @param read 数据包读取器
    //  * @returns 当前对象实例（支持链式调用）
    //  */
    read(read: TSPacketRead): StoreItemPayload {
        this.MaxTabs = read.ReadUInt32();  // 读取分类数量
        
        // 读取每个分类的数据
        for (let i = 0; i < this.MaxTabs; i++) {
            let storeItemCol = new StoreItemCollection();
            storeItemCol.MaxItems = read.ReadUInt32();  // 读取当前分类的商品数量
            
            // 读取当前分类的每个商品
            for (let h = 0; h < storeItemCol.MaxItems; h++) {
                let item = new StoreItem();
                item.ID = read.ReadUInt32();        // 商品ID
                item.Flags = read.ReadUInt32();     // 标志位
                item.Cost = read.ReadUInt32();      // 价格
                item.Name = read.ReadString();      // 名称
                item.Description = read.ReadString();// 描述
                item.Category = read.ReadUInt32();  // 分类
                item.PurchaseID = read.ReadUInt32();// 购买后获得的ID
                item.ExtraID = read.ReadUInt32();    // 额外ID
                
                storeItemCol.Items.push(item);      // 添加到分类集合
            }
            
            this.AllItems.push(storeItemCol);      // 添加到总集合
        }
        
        return this;
    }

    // /​**​
    //  * 构建数据包
    //  * @returns 包含商店数据的可发送数据包
    //  */
    BuildPacket(): TSPacketWrite {
        // 创建数据包（使用RECEIVE_ITEMS操作码）
        let packet = CreateCustomPacket(ClientCallbackOperations.RECEIVE_ITEMS, 0);
        
        // 写入分类总数
        packet.WriteUInt32(this.MaxTabs);
        
        // 写入每个分类的数据
        this.AllItems.forEach((storeItemCol) => {
            packet.WriteUInt32(storeItemCol.MaxItems);  // 写入当前分类的商品数
            
            // 写入当前分类的每个商品
            storeItemCol.Items.forEach((item) => {
                packet.WriteUInt32(item.ID);
                packet.WriteUInt32(item.Flags);
                packet.WriteUInt32(item.Cost);
                packet.WriteString(item.Name);
                packet.WriteString(item.Description);
                packet.WriteUInt32(item.Category);
                packet.WriteUInt32(item.PurchaseID);
                packet.WriteUInt32(item.ExtraID);
            });
        });
        
        return packet;
    }
}
