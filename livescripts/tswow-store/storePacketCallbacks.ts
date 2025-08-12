import { ClientCallbackOperations } from "../../shared/Messages";
import { BuyItemPayload } from "../../shared/Payloads/BuyItemPayload";
import { DonationPointsPayload } from "../../shared/Payloads/DonationPointsPayload";
import { StoreItem, StoreItemPayload } from "../../shared/Payloads/StoreItemPayload";
import { setupItems } from "./retrieveItems";

// 账户点数缓存字典：键为账户ID，值为点数
export let accountPoints: TSDictionary<uint32, number> = CreateDictionary<uint32, number>({});

// 商品字典：外层键为分类ID，内层键为商品索引，值为商品对象
export let itemDict: TSDictionary<uint32, TSDictionary<uint32, StoreItem>> = CreateDictionary<uint32, TSDictionary<uint32, StoreItem>>({});

// 商店数据负载对象
let storePayload: StoreItemPayload;

// /​**​
//  * 商店数据包回调注册函数
//  * @param events TSEvents事件系统
//  */
export function StorePacketCallbacks(events: TSEvents) {
    // 初始化商店数据
    storePayload = setupItems(itemDict);
    
    // 检查数据有效性
    if (!storePayload || !storePayload.AllItems.length) {
        return;
    }

    // 玩家登录事件处理
    events.Player.OnLogin((player, firstLogin) => {
        // 加载账户数据到缓存
        LoadAccountToCache(player.GetAccountID(), true);
        // 发送点数信息给玩家
        sendPoints(player);

        // 查询所有extra_id用于预加载
        const extraIDQuery = QueryWorld("SELECT DISTINCT extra_id FROM store_items");
        const extraIDs: number[] = [];
        while (extraIDQuery.GetRow()) {
            extraIDs.push(extraIDQuery.GetUInt64(0));
        }

        // 发送生物查询包预加载数据
        extraIDs.forEach((extraID) => {
            player.SendCreatureQueryPacket(extraID);
        });
    });

    // 注册数据包处理函数
    packetFunctions(events);
    
    // 注册重载命令
    reloadCommand(events);
}

// /​**​
//  * 数据包处理函数集合
//  * @param events TSEvents事件系统
//  */
function packetFunctions(events: TSEvents) {
    // 处理商品列表请求
    events.CustomPacket.OnReceive(ClientCallbackOperations.REQUEST_ITEMS, (op, packet, player) => {
        storePayload.BuildPacket().SendToPlayer(player);
    });

    // 处理点数请求
    events.CustomPacket.OnReceive(ClientCallbackOperations.REQUEST_POINTS, (op, packet, player) => {
        LoadAccountToCache(player.GetAccountID(), false);
        sendPoints(player);
    });

    // 处理购买请求
    events.CustomPacket.OnReceive(ClientCallbackOperations.BUY_ITEM, (op, packet, player) => {
        let buyPacket = new BuyItemPayload();
        buyPacket.read(packet);
        let tabIndex = buyPacket.TabIndex;
        let itemIndex = buyPacket.ItemIndex;

        // 验证商品有效性
        if (!checkItem(tabIndex, itemIndex)) {
            console.log("Bad Item Purchase Data. Player:" + player.GetName() + " tabIndex: " + tabIndex + " itemIndex: " + itemIndex);
            player.SendAreaTriggerMessage("Store Item Not Found")
            return;
        }

        let itemObj = itemDict[tabIndex][itemIndex];

        // 检查点数是否足够
        if (checkIfPlayerPoor(player.GetAccountID(), itemObj.Cost)) {
            player.SendAreaTriggerMessage("You do not have enough points.")
            return;
        }

        // 创建购买的商品
        let item = CreateItem(itemObj.PurchaseID, 1);
        if (!item) return;
        let itemsToSend: TSArray<TSItem> = [];
        itemsToSend.push(item);

        // 扣除点数并记录购买日志
        decrementPoints(player, itemObj.Cost);
        logBuyItem(player, itemObj);

        // 通过邮件发送商品给玩家
        player.SendGMMail("Your Purchase", "Thank you for your purchase", itemsToSend);
        sendPoints(player);
    });
}

// /​**​
//  * 加载账户数据到缓存
//  * @param accountID 账户ID
//  * @param force 是否强制刷新
//  */
function LoadAccountToCache(accountID: number, force: bool) {
    // 如果已存在且不强制刷新则直接返回
    if (accountPoints.keys().includes(accountID) && !force) { return }
    
    // 查询数据库获取点数
    const pointsQuery = QueryAuth(`SELECT donation_points FROM account WHERE id = ${accountID};`);
    while (pointsQuery.GetRow()) {
        let points = pointsQuery.GetInt32(0);
        if (points < 0) points = 0;  // 确保点数不为负
        accountPoints.set(accountID, points);
    }
}

// /​**​
//  * 记录购买日志
//  * @param player 玩家对象
//  * @param item 商品对象
//  */
function logBuyItem(player: TSPlayer, item: StoreItem) {
    QueryWorld(`INSERT INTO store_audit (cost, name, description, account_id) VALUES (${item.Cost}, "${item.Name}", "${item.Description}", ${player.GetAccountID()})`);
}

// /​**​
//  * 发送点数信息给玩家
//  * @param player 玩家对象
//  */
function sendPoints(player: TSPlayer) {
    let payload = new DonationPointsPayload();
    payload.points = accountPoints[player.GetAccountID()];
    payload.BuildPacket().SendToPlayer(player);
}

// /​**​
//  * 检查商品是否存在
//  * @param tabIndex 分类索引
//  * @param itemIndex 商品索引
//  * @returns 是否存在
//  */
function checkItem(tabIndex: number, itemIndex: number): boolean {
    if (!itemDict.contains(tabIndex)) return false;
    if (!itemDict[tabIndex].contains(itemIndex)) return false;
    return true;
}

// /​**​
//  * 扣除玩家点数
//  * @param player 玩家对象
//  * @param cost 扣除数量
//  */
function decrementPoints(player: TSPlayer, cost: number) {
    const accID = player.GetAccountID();
    // 更新数据库
    QueryAuth(`UPDATE account SET donation_points = donation_points - ${cost} WHERE id = ${accID}`);
    // 更新缓存
    accountPoints[accID] -= cost;
}

// /​**​
//  * 检查玩家点数是否不足
//  * @param accID 账户ID
//  * @param cost 所需点数
//  * @returns 是否不足
//  */
function checkIfPlayerPoor(accID: number, cost: number) {
    if (accountPoints[accID] < cost) return true;
    return false;
}

// /​**​
//  * 注册重载命令
//  * @param events TSEvents事件系统
//  */
function reloadCommand(events: TSEvents) {
    events.Player.OnCommand((player, command, found) => {
        if (player.IsPlayer() && player.IsInWorld()) {
            const commandText = command.get();

            // 处理重载商店命令
            if (commandText === "reload store_items") {
                // 检查GM权限
                if (player.GetGMRank() <= 3) {
                    // 重新加载商店数据
                    storePayload = setupItems(itemDict);
                    player.SendAreaTriggerMessage("The 'store_items' table has been reloaded.");
                    player.SendBroadcastMessage("Store items have been successfully reloaded.");
                } else {
                    player.SendAreaTriggerMessage("You do not have the required GM level to use this command.");
                }
                found.set(true);
            }
        }
    });
}



