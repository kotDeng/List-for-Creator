/****************************************************************************************************
*    author: kot
*    date: 2018-5-18
*    description: 列表
*    comment: 
*    modify: 2018.5.18 kot建立 v1.0.0
****************************************************************************************************/
const { ccclass, property, menu } = cc._decorator;

import { ScrollView, LayoutType } from "../ScrollView";
import { ListItemBase } from "./ListItemBase";

@ccclass
@menu("Components/List/List")
export class List extends ScrollView {

    @property({ type: ListItemBase, tooltip: "显示节点母体" })
    protected item: ListItemBase;
    @property({ type: cc.Node, tooltip: "遮罩,显示区域,不放就是ScrollView自身" })
    protected mask: cc.Node = null;
    @property({ type: Number, tooltip: "横向间距" })
    protected spacingX: number = 0;
    @property({ type: Number, tooltip: "纵向间距" })
    protected spacingY: number = 0;
    @property({ type: Number, tooltip: "单行/列的数量" })
    protected aloneNum: number = 1;
    @property({ type: Boolean, tooltip: "是否反转数据" })
    protected reversal: boolean = false;
    @property({ type: Boolean, tooltip: "隐藏列表时是否摧毁item列表实例" })
    protected isDestroy: boolean = false;
    @property({ type: Number, tooltip: "执行updateItem的移动比列,建议以最小item宽高为值" })
    protected minUpDataItem: number = 100;

    private _items: Array<cc.Node> = [];
    private _dataArray: Array<any>;
    private _firstIndex: number;
    private _itemDelPos: cc.Vec2 = cc.Vec2.ZERO;    // 删除坐标,记录当前启用删除函数的左边点
    private _itemAddPos: cc.Vec2 = cc.Vec2.ZERO;    // 添加坐标,记录当前启用添加函数的左边点

    protected onLoad(): void {
        this.ifInit = false;
        super.onLoad();
        this.mask || (this.mask = this.node);
        this.content.removeAllChildren();
        // 重置 content 的部分数据,避免添加数据需要重新计算全部位置
        switch (this.layoutType) {
            case LayoutType.Horizontal:
                if (this.reversal) {
                    this.content.anchorX = 1;
                } else {
                    this.content.anchorX = 0;
                }
                break;
            case LayoutType.Vertical:
                if (this.reversal) {
                    this.content.anchorY = 0;
                } else {
                    this.content.anchorY = 1;
                }
                break;
        }
        return;
    }

    public get length(): number {
        return this._dataArray.length;
    }

    public get dataArray(): Array<any> {
        return this._dataArray;
    }

    public set dataArray(val: Array<any>) {
        this._dataArray = val;
        this.updateDataArray();
        switch (this.layoutType) {
            case LayoutType.Horizontal:
                if (this.reversal) {
                    this.scrollToRight(0);
                } else {
                    this.scrollToLeft(0);
                }
                break;
            case LayoutType.Vertical:
                if (this.reversal) {
                    this.scrollToBottom(0);
                } else {
                    this.scrollToTop(0);
                }
                break;
        }
        return;
    }

    protected moveContent(pos: cc.Vec2): void {
        // 更新item, 这里用循环吧,避免一次拖动太大
        let len: number;
        switch (this.layoutType) {
            case LayoutType.Horizontal:
                len = Math.ceil(Math.abs(pos.x) / this.minUpDataItem);

                // console.log("**********************************************************");
                // console.log("                         计算 开始                         ");
                // console.log(" this._itemAddPos x: " + this._itemAddPos.x + " y: " + this._itemAddPos.y);
                // console.log(" this._itemDelPos x: " + this._itemDelPos.x + " y: " + this._itemDelPos.y);
                // console.log(" 总数: " + (this.content.childrenCount + this._items.length));

                for (let i: number = 0; i < len; i++) {
                    let movePos: number = Math.min(this.minUpDataItem * (i + 1), Math.abs(pos.x));
                    this.updateItem(new cc.Vec2(pos.x < 0 ? -movePos : movePos, pos.y));
                }

                // console.log("%c 总数: " + (this.content.childrenCount + this._items.length), " color: #FF0000 ");
                // console.log(" this._itemAddPos x: " + this._itemAddPos.x + " y: " + this._itemAddPos.y);
                // console.log(" this._itemDelPos x: " + this._itemDelPos.x + " y: " + this._itemDelPos.y);
                // console.log("                         计算 结束                         ");
                // console.log("**********************************************************");
                break;
            case LayoutType.Vertical:
                len = Math.ceil(Math.abs(pos.y) / this.minUpDataItem);

                // console.log("**********************************************************");
                // console.log("                         计算 开始                         ");
                // console.log(" this._itemAddPos x: " + this._itemAddPos.x + " y: " + this._itemAddPos.y);
                // console.log(" this._itemDelPos x: " + this._itemDelPos.x + " y: " + this._itemDelPos.y);
                // console.log(" 总数: " + (this.content.childrenCount + this._items.length));

                for (let i: number = 0; i < len; i++) {
                    let movePos: number = Math.min(this.minUpDataItem * (i + 1), Math.abs(pos.y));
                    this.updateItem(new cc.Vec2(pos.x, pos.y < 0 ? -movePos : movePos));
                }

                // console.log("%c 总数: " + (this.content.childrenCount + this._items.length), " color: #FF0000 ");
                // console.log(" this._itemAddPos x: " + this._itemAddPos.x + " y: " + this._itemAddPos.y);
                // console.log(" this._itemDelPos x: " + this._itemDelPos.x + " y: " + this._itemDelPos.y);
                // console.log("                         计算 结束                         ");
                // console.log("**********************************************************");
                break;
        }
        // 移动视图
        super.moveContent(pos);
        return;
    }

    private updateItem(pos: cc.Vec2): void {
        switch (this.layoutType) {
            case LayoutType.Horizontal:
                let toX: number = this.content.x + pos.x;
                if (pos.x < 0) {
                    // 左移
                    if (this.reversal) {
                        // 先删除超出的数据
                        if (Math.abs(this.content.x) + Math.abs(this.rightEdge) < this._itemAddPos.y && toX > this.rightEdge) {
                            this.removeOutItem(false);
                        }
                        // 左边数据
                        if (Math.abs(this._itemAddPos.x) + Math.abs(this.rightEdge) > Math.abs(toX) && toX > this.rightEdge) {
                            this.updateDataArray(false);
                        }
                    } else {
                        // 先增加右边数据
                        if (toX < this.rightEdge) {
                            this.updateDataArray();
                        }

                        // 再删除左边超出的数据
                        if (-this._itemDelPos.x + this.leftEdge > toX && toX > this.rightEdge) {
                            this.removeOutItem();
                        }
                    }
                } else if (pos.x > 0) {
                    // 右移
                    if (this.reversal) {
                        // 先增加左边数据
                        if (toX > this.leftEdge) {
                            this.updateDataArray();
                        }
                        // 再删除右边超出的数据
                        if (this._itemDelPos.x + this.rightEdge < toX && toX < this.leftEdge) {
                            this.removeOutItem();
                        }
                    } else {
                        // 先删除超出的数据
                        if (Math.abs(toX + this.leftEdge) - this._itemAddPos.y < 0 && toX < this.leftEdge) {
                            this.removeOutItem(false);
                        }
                        // 左边数据
                        if (Math.abs(this._itemAddPos.x) + Math.abs(this.leftEdge) > Math.abs(toX) && toX < this.leftEdge) {
                            this.updateDataArray(false);
                        }
                    }
                }
                break;
            case LayoutType.Vertical:
                let toY: number = this.content.y + pos.y;
                if (pos.y < 0) {
                    // 下移
                    if (this.reversal) {
                        // 先增加上边数据
                        if (toY < this.topEdge) {
                            // console.log("%c----------------------------------------------------------", " color: #FF0000 ");
                            // console.log("%c                         添加 数据                         ", " color: #FF0000 ");
                            // console.log("%c                         这是 下移                         ", " color: #FF0000 ");
                            // console.log("%c----------------------------------------------------------", " color: #FF0000 ");
                            // console.log("%c添加前的坐标:", " color: #FF0000 ");
                            // console.log("%c this._itemAddPos x: " + this._itemAddPos.x + " y: " + this._itemAddPos.y, " color: #FF0000 ");
                            // console.log("%c this._itemDelPos x: " + this._itemDelPos.x + " y: " + this._itemDelPos.y, " color: #FF0000 ");
                            // console.log("%c this._items: " + this._items.length, " color: #FF0000 ");
                            // console.log("%c this.content.childrenCount: " + this.content.childrenCount, " color: #FF0000 ");
                            // console.log("%c ListItemBase.index: " + this.content.children[0].getComponent(ListItemBase).index, " color: #FF0000 ");
                            // console.log("%c 总数: " + (this.content.childrenCount + this._items.length), " color: #FF0000 ");

                            this.updateDataArray();

                            // console.log("%c添加后的坐标:", " color: #FF0000 ");
                            // console.log("%c this._itemAddPos x: " + this._itemAddPos.x + " y: " + this._itemAddPos.y, " color: #FF0000 ");
                            // console.log("%c this._itemDelPos x: " + this._itemDelPos.x + " y: " + this._itemDelPos.y, " color: #FF0000 ");
                            // console.log("%c this._items: " + this._items.length, " color: #FF0000 ");
                            // console.log("%c this.content.childrenCount: " + this.content.childrenCount, " color: #FF0000 ");
                            // console.log("%c ListItemBase.index: " + this.content.children[0].getComponent(ListItemBase).index, " color: #FF0000 ");
                            // console.log("%c 总数: " + (this.content.childrenCount + this._items.length), " color: #FF0000 ");
                            // console.log("%c----------------------------------------------------------", " color: #FF0000 ");
                        }
                        // 再删除下边超出的数据

                        // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@");
                        // console.log("this._itemDelPos x: ", this._itemDelPos.x, " y: ", this._itemDelPos.y);
                        // console.log("this._itemAddPos x: ", this._itemAddPos.x, " y: ", this._itemAddPos.y);
                        // console.log("this.bottomEdge", this.bottomEdge);
                        // console.log("toY", toY);
                        // console.log("this.topEdge", this.topEdge);
                        // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@");

                        if (Math.abs(toY) + this.bottomEdge > this._itemDelPos.x && toY > this.topEdge) {
                            // console.log("**********************************************************");
                            // console.log("                         删除 数据                         ");
                            // console.log("                         这是 下移                         ");
                            // console.log("**********************************************************");
                            // console.log("删除前的坐标:");
                            // console.log(" this._itemAddPos x: " + this._itemAddPos.x + " y: " + this._itemAddPos.y);
                            // console.log(" this._itemDelPos x: " + this._itemDelPos.x + " y: " + this._itemDelPos.y);
                            // console.log(" this._items: " + this._items.length);
                            // console.log(" this.content.childrenCount: " + this.content.childrenCount);
                            // console.log(" 总数: " + (this.content.childrenCount + this._items.length));

                            this.removeOutItem();

                            // console.log("删除后的坐标:");
                            // console.log(" this._itemAddPos x: " + this._itemAddPos.x + " y: " + this._itemAddPos.y);
                            // console.log(" this._itemDelPos x: " + this._itemDelPos.x + " y: " + this._itemDelPos.y);
                            // console.log(" this._items: " + this._items.length);
                            // console.log(" this.content.childrenCount: " + this.content.childrenCount);
                            // console.log(" ListItemBase.index: " + this.content.children[0].getComponent(ListItemBase).index);
                            // console.log(" 总数: " + (this.content.childrenCount + this._items.length));
                            // console.log("**********************************************************");
                        }
                    } else {
                        // 先删除下边超出的数据
                        if (Math.abs(toY + this.topEdge) - this._itemAddPos.y < 0 && toY > this.topEdge) {
                            this.removeOutItem(false);
                        }

                        // 再增加上边数据
                        if (Math.abs(this._itemAddPos.x) + Math.abs(this.topEdge) > Math.abs(toY) && toY > this.topEdge) {
                            this.updateDataArray(false);
                        }
                    }
                } else {
                    // 上移
                    if (this.reversal) {
                        // 先删除下边超出的数据
                        if (Math.abs(toY + this.bottomEdge) - this._itemAddPos.y < 0 && toY < this.bottomEdge) {
                            // console.log("**********************************************************");
                            // console.log("                         删除 数据                         ");
                            // console.log("                         这是 上移                         ");
                            // console.log("**********************************************************");
                            // console.log("删除前的坐标:");
                            // console.log(" this._itemAddPos x: " + this._itemAddPos.x + " y: " + this._itemAddPos.y);
                            // console.log(" this._itemDelPos x: " + this._itemDelPos.x + " y: " + this._itemDelPos.y);
                            // console.log(" this._items: " + this._items.length);
                            // console.log(" this.content.childrenCount: " + this.content.childrenCount);
                            // console.log(" ListItemBase.index: " + this.content.children[0].getComponent(ListItemBase).index);
                            // console.log(" 总数: " + (this.content.childrenCount + this._items.length));

                            this.removeOutItem(false);

                            // console.log("删除后的坐标:");
                            // console.log(" this._itemAddPos x: " + this._itemAddPos.x + " y: " + this._itemAddPos.y);
                            // console.log(" this._itemDelPos x: " + this._itemDelPos.x + " y: " + this._itemDelPos.y);
                            // console.log(" this._items: " + this._items.length);
                            // console.log(" this.content.childrenCount: " + this.content.childrenCount);
                            // console.log(" ListItemBase.index: " + this.content.children[0].getComponent(ListItemBase).index);
                            // console.log(" 总数: " + (this.content.childrenCount + this._items.length));
                            // console.log("**********************************************************");
                        }
                        // 再增加上边数据
                        if (Math.abs(this._itemAddPos.x) + Math.abs(this.bottomEdge) > Math.abs(toY) && toY < this.bottomEdge) {
                            // console.log("%c----------------------------------------------------------", " color: #FF0000 ");
                            // console.log("%c                         添加 数据                         ", " color: #FF0000 ");
                            // console.log("%c                         这是 上移                         ", " color: #FF0000 ");
                            // console.log("%c----------------------------------------------------------", " color: #FF0000 ");
                            // console.log("%c添加前的坐标:", " color: #FF0000 ");
                            // console.log("%c this._itemAddPos x: " + this._itemAddPos.x + " y: " + this._itemAddPos.y, " color: #FF0000 ");
                            // console.log("%c this._itemDelPos x: " + this._itemDelPos.x + " y: " + this._itemDelPos.y, " color: #FF0000 ");
                            // console.log("%c this._items: " + this._items.length, " color: #FF0000 ");
                            // console.log("%c this.content.childrenCount: " + this.content.childrenCount, " color: #FF0000 ");
                            // console.log("%c ListItemBase.index: " + this.content.children[0].getComponent(ListItemBase).index, " color: #FF0000 ");
                            // console.log("%c 总数: " + (this.content.childrenCount + this._items.length), " color: #FF0000 ");

                            this.updateDataArray(false);

                            // console.log("%c添加后的坐标:", " color: #FF0000 ");
                            // console.log("%c this._itemAddPos x: " + this._itemAddPos.x + " y: " + this._itemAddPos.y, " color: #FF0000 ");
                            // console.log("%c this._itemDelPos x: " + this._itemDelPos.x + " y: " + this._itemDelPos.y, " color: #FF0000 ");
                            // console.log("%c this._items: " + this._items.length, " color: #FF0000 ");
                            // console.log("%c this.content.childrenCount: " + this.content.childrenCount, " color: #FF0000 ");
                            // console.log("%c ListItemBase.index: " + this.content.children[0].getComponent(ListItemBase).index, " color: #FF0000 ");
                            // console.log("%c 总数: " + (this.content.childrenCount + this._items.length), " color: #FF0000 ");
                            // console.log("%c----------------------------------------------------------", " color: #FF0000 ");
                        }
                    } else {
                        // 先增加下边数据
                        if (toY > this.bottomEdge) {
                            this.updateDataArray();
                        }
                        // 再删除上边超出的数据
                        if (this._itemDelPos.x + this.topEdge < toY && toY < this.bottomEdge) {
                            this.removeOutItem();
                        }
                    }
                }
                break;
        }
        return;
    }

    /**
     * val: true 往前删除, false 往后删除
     * 
     * @private
     * @param {boolean} [val=true] 
     * @returns {void} 
     * @memberof List
     */
    private removeOutItem(val: boolean = true): void {
        let len: number = this.content.childrenCount;
        let itemPos: number;
        let itemPosObj: object = {};
        let row: number = -1; // 行
        let col: number = -1; // 列
        let index: number = 0;
        for (let i: number = 0; i < len; i++) {
            let item: cc.Node = this.content.children[i];
            index = item.getComponent(ListItemBase).index;
            switch (this.layoutType) {
                case LayoutType.Horizontal:
                    col = Math.floor(index / this.aloneNum);
                    if (this.reversal) {
                        itemPos = -(item.x - item.width * (1 - item.anchorX));
                        if ((val && itemPos <= this._itemDelPos.x) || (!val && itemPos >= this._itemAddPos.y)) {
                            this.content.removeChild(item);
                            this.putItem(item);
                            len = this.content.childrenCount;
                            i--;
                        } else {
                            if (itemPosObj[col.toString()]) {
                                itemPosObj[col.toString()].pos = Math.max(itemPos, itemPosObj[col.toString()].pos);
                                itemPosObj[col.toString()].size = Math.max(item.width, itemPosObj[col.toString()].size);
                            } else {
                                itemPosObj[col.toString()] = { pos: itemPos, size: item.width };
                            }
                        }
                    } else {
                        itemPos = item.x - item.width * item.anchorX;
                        if ((val && itemPos <= this._itemDelPos.x) || (!val && itemPos >= this._itemAddPos.y)) {
                            this.content.removeChild(item);
                            this.putItem(item);
                            len = this.content.childrenCount;
                            i--;
                        } else {
                            if (itemPosObj[col.toString()]) {
                                itemPosObj[col.toString()].pos = Math.max(itemPos, itemPosObj[col.toString()].pos);
                                itemPosObj[col.toString()].size = Math.max(item.width, itemPosObj[col.toString()].size);
                            } else {
                                itemPosObj[col.toString()] = { pos: itemPos, size: item.width };
                            }
                        }
                    }
                    break;
                case LayoutType.Vertical:
                    row = Math.floor(index / this.aloneNum);
                    if (this.reversal) {
                        itemPos = Math.abs(item.y - item.height * (1 - item.anchorY));
                        if ((val && itemPos <= this._itemDelPos.x) || (!val && itemPos >= this._itemAddPos.y)) {
                            this.content.removeChild(item);
                            this.putItem(item);
                            len = this.content.childrenCount;
                            i--;
                        } else {
                            if (itemPosObj[row.toString()]) {
                                itemPosObj[row.toString()].pos = Math.max(itemPos, itemPosObj[row.toString()].pos);
                                itemPosObj[row.toString()].size = Math.max(item.height, itemPosObj[row.toString()].size);
                            } else {
                                itemPosObj[row.toString()] = { pos: itemPos, size: item.height };
                            }
                        }
                    } else {
                        itemPos = Math.abs(item.y - item.height * item.anchorY);
                        if ((val && itemPos <= this._itemDelPos.x) || (!val && itemPos >= this._itemAddPos.y)) {
                            this.content.removeChild(item);
                            this.putItem(item);
                            len = this.content.childrenCount;
                            i--;
                        } else {
                            if (itemPosObj[row.toString()]) {
                                itemPosObj[row.toString()].pos = Math.max(itemPos, itemPosObj[row.toString()].pos);
                                itemPosObj[row.toString()].size = Math.max(item.height, itemPosObj[row.toString()].size);
                            } else {
                                itemPosObj[row.toString()] = { pos: itemPos, size: item.height };
                            }
                        }
                    }
                    break;
            }
        }
        let itemPosArr: Array<object> = [];
        for (var key in itemPosObj) {
            if (itemPosObj[key]) {
                itemPosArr.push(itemPosObj[key]);
            }
        }
        itemPosArr.sort(function (x: object, y: object): number {
            //比较函数
            if (x["pos"] < y["pos"]) {
                return -1;
            } else if (x["pos"] > y["pos"]) {
                return 1;
            } else {
                return 0;
            }
        });
        switch (this.layoutType) {
            case LayoutType.Horizontal:
                if (val) {
                    this._itemAddPos.x = this._itemDelPos.x;
                    this._itemDelPos.x = itemPosArr.length > 2 ? itemPosArr[this.reversal ? 0 : 1]["pos"] - (this.reversal ? 0 : this.spacingX) : this._itemDelPos.x;
                } else {
                    this._itemDelPos.y = this._itemAddPos.y;
                    this._itemAddPos.y = itemPosArr.length > 1 ? itemPosArr[itemPosArr.length - 1]["pos"] : this._itemAddPos.y;
                    if (this.reversal) {
                        this._itemAddPos.y -= itemPosArr[itemPosArr.length - 1]["size"];
                    }
                    this.content.width = this._itemDelPos.y;
                    this.setCRatio();
                }
                break;
            case LayoutType.Vertical:
                if (val) {
                    this._itemAddPos.x = this._itemDelPos.x;
                    this._itemDelPos.x = itemPosArr.length > 2 ? itemPosArr[this.reversal ? 1 : 0]["pos"] - (this.reversal ? this.spacingY : 0) : this._itemDelPos.x;
                } else {
                    this._itemDelPos.y = this._itemAddPos.y;
                    this._itemAddPos.y = itemPosArr.length > 1 ? itemPosArr[itemPosArr.length - (this.reversal ? 1 : 2)]["pos"] + (this.reversal ? 0 : this.spacingY) : this._itemAddPos.y;
                    // if (this.reversal) {
                    //     // this._itemAddPos.y -= itemPosArr[itemPosArr.length - (this.reversal ? 1 : 2)]["size"];
                    // }
                    this.content.height = this._itemDelPos.y;
                    this.setCRatio();
                }
                break;
        }
        return;
    }

    /**
     * val: true 往后更新, false 往前更新
     * 
     * @private
     * @param {boolean} [val=true] 
     * @returns 
     * @memberof List
     */
    private updateDataArray(val: boolean = true): void {
        let len: number = this.content.childrenCount;
        let sIndex: number = (len > 0 && !val) ? Number.MAX_VALUE : 0;
        for (let i: number = 0; i < len; i++) {
            if (val) {
                sIndex = Math.max(this.content.children[i].getComponent(ListItemBase).index + 1, sIndex);
            } else {
                sIndex = Math.min(this.content.children[i].getComponent(ListItemBase).index - 1, sIndex);
            }
        }
        if (sIndex >= this.length || sIndex < 0) return;
        let row: number = -1; // 行
        let col: number = -1; // 列
        let oldSize: number = this._itemDelPos.y;
        let curSize: number = oldSize;
        let items: Array<cc.Node> = [];
        let maxItemSize: number = 0;
        while (true) {
            if (sIndex >= this.length || sIndex < 0) {
                if (items.length > 0) {
                    switch (this.layoutType) {
                        case LayoutType.Horizontal:
                            for (let i: number = 0; i < items.length; i++) {
                                if (this.reversal) {
                                    items[i].x = -(this._itemAddPos.x - maxItemSize + (items[i].width * (1 - items[i].anchorX)));
                                } else {
                                    items[i].x = this._itemAddPos.x - maxItemSize + (items[i].width * items[i].anchorX);
                                }
                            }
                            this._itemDelPos.x = this._itemAddPos.x;
                            this._itemAddPos.x = Math.max(this._itemAddPos.x - maxItemSize - this.spacingX, 0);
                            break;
                        case LayoutType.Vertical:
                            for (let i: number = 0; i < items.length; i++) {
                                if (this.reversal) {
                                    items[i].y = this._itemAddPos.x - maxItemSize + (items[i].height * items[i].anchorY);
                                } else {
                                    items[i].y = -(this._itemAddPos.x - maxItemSize + (items[i].height * (1 - items[i].anchorY)));
                                }
                            }
                            this._itemDelPos.x = this._itemAddPos.x;
                            this._itemAddPos.x = Math.max(this._itemAddPos.x - maxItemSize - this.spacingY, 0);
                            break;
                    }
                }
                break;
            }
            let item: cc.Node = this.createItem();
            item.getComponent(ListItemBase).setData(this._dataArray[sIndex], sIndex);
            let pos: cc.Vec2 = new cc.Vec2();
            let itemRow: number; // 行
            let itemCol: number; // 列
            switch (this.layoutType) {
                case LayoutType.Horizontal:
                    itemRow = Math.floor(sIndex % this.aloneNum);
                    itemCol = Math.floor(sIndex / this.aloneNum);
                    // 记录当前列最大宽度, 如果换列了,重置,如果没换,比较
                    if (col != itemCol) {
                        if (curSize != oldSize) {
                            if (val) {
                                // 不能继续显示了,不要在添加了
                                if (oldSize + curSize + this.spacingX > this.mask.width) {
                                    sIndex = -1;
                                    break;
                                }
                            } else {
                                // 判断是否能继续显示 (暂时先用最大数显示吧)
                                if (items.length == this.aloneNum) {
                                    sIndex = -1;
                                    break;
                                }
                            }
                            // 记录起点
                            if (this._itemDelPos.x == 0) {
                                this._itemDelPos.x = curSize;
                                this._itemAddPos.x = 0;
                            }
                            oldSize = oldSize + curSize + this.spacingX;
                        }
                        col = itemCol;
                        curSize = item.width;
                    } else {
                        curSize = Math.max(item.width, curSize);
                    }
                    // 如果是往后更新,可以马上计算位置,否则等换列时,计算该列最大宽度,再调整位置
                    if (val) {
                        if (this.reversal) {
                            pos.x = -(oldSize + (item.width * (1 - item.anchorX)));
                        } else {
                            pos.x = oldSize + (item.width * item.anchorX);
                        }
                    } else {
                        items.push(item);
                        maxItemSize = Math.max(maxItemSize, item.width);
                    }
                    pos.y = itemRow * -(this.item.node.height + this.spacingY) - (item.height * item.anchorY) + this.svRatioTop;
                    break;
                case LayoutType.Vertical:
                    itemRow = Math.floor(sIndex / this.aloneNum);
                    itemCol = Math.floor(sIndex % this.aloneNum);
                    // 记录当前行最大高度, 如果换行了,重置,如果没换,比较
                    if (row != itemRow) {
                        if (curSize != oldSize) {
                            if (val) {
                                // 不能继续显示了,不要在添加了
                                if (oldSize + curSize + this.spacingY > this.mask.height) {
                                    sIndex = -1;
                                    break;
                                }
                            } else {
                                // 判断是否能继续显示 (暂时先用最大数显示吧)
                                if (items.length == this.aloneNum) {
                                    sIndex = -1;
                                    break;
                                }
                            }
                            // 记录起点
                            if (this._itemDelPos.x == 0) {
                                this._itemDelPos.x = curSize;
                                this._itemAddPos.x = 0;
                            }
                            oldSize = oldSize + curSize + this.spacingY;
                        }
                        row = itemRow;
                        curSize = item.height;
                    } else {
                        curSize = Math.max(item.height, curSize);
                    }
                    // 如果是往后更新,可以马上计算位置,否则等换行时,计算该行最大高度,再调整位置
                    if (val) {
                        if (this.reversal) {
                            pos.y = -(-oldSize - (item.height * (1 - item.anchorY)));
                        } else {
                            pos.y = -oldSize - (item.height * item.anchorY);
                        }
                    } else {
                        items.push(item);
                        maxItemSize = Math.max(maxItemSize, item.height);
                    }
                    pos.x = itemCol * (this.item.node.width + this.spacingX) + (item.width * item.anchorX) - this.svRatioRight;
                    break;
            }
            if (sIndex == -1) {
                // 范围超出,不要在继续添加了
                this.putItem(item);
            } else {
                item.x = pos.x;
                item.y = pos.y;
                this.content.addChild(item);
                val ? sIndex++ : sIndex--;
            }
        }
        // 计算视图新尺寸
        switch (this.layoutType) {
            case LayoutType.Horizontal:
                if (val) {
                    let toWidth: number = oldSize + curSize;
                    this._itemDelPos.y = toWidth + this.spacingX;
                    this._itemAddPos.y = oldSize;
                    this.content.width = toWidth;
                    this.setCRatio();
                }
                // if (isFirst) {
                //     if (this.reversal) {
                //         this.scrollToRight(0);
                //     } else {
                //         this.scrollToLeft(0);
                //     }
                // }
                break;
            case LayoutType.Vertical:
                if (val) {
                    let toHeight: number = oldSize + curSize;
                    this._itemDelPos.y = toHeight + this.spacingY;
                    this._itemAddPos.y = oldSize;
                    this.content.height = toHeight;
                    this.setCRatio();
                }
                // if (isFirst) {
                //     if (this.reversal) {
                //         this.scrollToBottom(0);
                //     } else {
                //         this.scrollToTop(0);
                //     }
                // }
                break;
        }
        return;
    }

    /**
     * 创建item
     * 
     * @private
     * @returns {cc.Node} 
     * @memberof List
     */
    private createItem(): cc.Node {
        let item: cc.Node = this._items.shift();
        if (!item) {
            item = cc.instantiate(this.item.node);
            item.getComponent(ListItemBase).init(true);
        }
        return item;
    }

    /**
     * 释放item
     * 
     * @private
     * @param {cc.Node} item 
     * @returns {void} 
     * @memberof List
     */
    private putItem(item: cc.Node): void {
        item.getComponent(ListItemBase).reset(false);
        this._items.push(item);
        return;
    }

    /**
     * 关闭列表
     * 
     * @protected
     * @returns {void} 
     * @memberof List
     */
    protected onDisable(): void {
        super.onDisable();
        this._itemDelPos = cc.Vec2.ZERO;
        this._itemAddPos = cc.Vec2.ZERO;
        let len: number = this.content.childrenCount;
        for (let i: number = 0; i < len; i++) {
            this._items.push(this.content.children[i]);
        }
        this.content.removeAllChildren();
        len = this._items.length;
        for (let i: number = 0; i < len; i++) {
            this._items[i].getComponent(ListItemBase).reset(this.isDestroy);
        }
        if (this.isDestroy) {
            this._items = [];
        }
        return;
    }

}