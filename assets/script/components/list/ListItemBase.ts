/****************************************************************************************************
*    author: kot
*    date: 2018-5-24
*    description: 列表
*    comment: 
*    modify: 2018.5.24 kot建立 v1.0.0
****************************************************************************************************/
const { ccclass, property, menu } = cc._decorator;

@ccclass
@menu("Components/List/ListItemBase")
export class ListItemBase extends cc.Component {

    public static ITEM_CLICK: string = "itemClick"; // 点击事件

    private _data: any;    // item数据
    private _index: number = -1; // 位置
    /**
     * 初始化
     * 
     * @returns {void} 
     * @memberof ListItemBase
     */
    public init(isOnEvent: boolean = true): void {
        if (isOnEvent) {
            this.onEvent();
        }
        return;
    }

    /**
     * 设置数据
     * 
     * @param {any} data 
     * @param {boolean} isClick 
     * @returns 
     * @memberof ListItemBase
     */
    public setData(data: any, index: number): void {
        this.reset(false);
        this._index = index;
        this._data = data;
        return;
    }

    /**
     * 重置
     * 
     * @returns {void} 
     * @memberof ListItemBase
     */
    public reset(isOffEvent: boolean = true): void {
        this._index = -1;
        this._data = null;
        if (isOffEvent) {
            this.offEvent();
        }
        return;
    }

    /**
     * 刷新数据
     * 
     * @returns {void} 
     * @memberof ListItemBase
     */
    public updateData(): void {
        return;
    }

    /**
     * 触发点击
     * 
     * @returns {void} 
     * @memberof ListItemBase
     */
    public onClick(): void {
        this.node.dispatchEvent(new cc.Event(ListItemBase.ITEM_CLICK, false));
        return;
    }

    public get data(): any {
        return this._data;
    }

    public get index(): number {
        return this._index;
    }

    private onEvent(): void {
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouch, this);
        return;
    }

    private onTouch(evt: cc.Event.EventTouch): void {
        switch (evt.type) {
            case cc.Node.EventType.TOUCH_END:
                this.onClick();
                break;
            default:
                break;
        }
        return;
    }

    private offEvent(): void {
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouch, this);
        return;
    }

}