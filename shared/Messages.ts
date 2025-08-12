// /​**​
//  * 客户端回调操作枚举
//  * 
//  * 定义了客户端与服务器之间可能的消息操作类型
//  */
export enum ClientCallbackOperations {
    // 商店相关操作
    REQUEST_ITEMS,    // 请求商品列表
    RECEIVE_ITEMS,    // 接收商品列表
    BUY_ITEM,         // 购买商品
    GET_POINTS,       // 获取点数
    REQUEST_POINTS,   // 请求点数信息
    ERROR,            // 错误消息
}

// /​**​
//  * 简单消息负载类
//  * 
//  * 用于在客户端和服务器之间传递简单的字符串消息
//  * 
//  * 注意：不要重用ID，确保每个消息类型有唯一ID
//  */
export class SimpleMessagePayload {
    // 操作码（消息类型）
    op: number = ClientCallbackOperations.REQUEST_ITEMS;
    
    // 消息内容
    message: string = "";

    // /​**​
    //  * 构造函数
    //  * 
    //  * @param opcode - 操作码（消息类型）
    //  * @param message - 消息内容
    //  */
    constructor(opcode: number, message: string) {
        this.message = message;
        this.op = opcode;
    }

    // /​**​
    //  * 从数据包中读取消息内容
    //  * 
    //  * @param read - TSPacketRead实例，用于读取数据
    //  */
    read(read: TSPacketRead): void {
        this.message = read.ReadString();
    }

    // /​**​
    //  * 将消息写入数据包
    //  * 
    //  * @returns 创建的数据包
    //  */
    write(): TSPacketWrite {
        // 创建自定义数据包（初始大小设为0，系统会自动调整）
        // 注意：当字符串导致问题时，可以尝试设置初始大小为2000
        let packet = CreateCustomPacket(this.op, 0);
        packet.WriteString(this.message);
        return packet;
    }
}

// /​**​
//  * 服务器到客户端的基本负载类
//  * 
//  * 用于服务器向客户端发送仅包含操作码的消息
//  */
export class ServerToClientPayload {
    // 操作码（消息类型）
    op: number = -1;

    // /​**​
    //  * 构造函数
    //  * 
    //  * @param opcode - 操作码（消息类型）
    //  */
    constructor(opcode: number) {
        this.op = opcode;
    }

    
    read(read: TSPacketRead): void {
        // 空实现，因为此类只包含操作码
    }

    write(): TSPacketWrite {
        // 创建自定义数据包（初始大小设为0）
        // 注意：当字符串导致问题时，可以尝试设置初始大小为2000
        let packet = CreateCustomPacket(this.op, 0);
        return packet;
    }
}