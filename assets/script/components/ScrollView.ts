/****************************************************************************************************
*    author: kot
*    date: 2018-5-18
*    description: 滚动视图
*    comment: 滚动视图
*    modify: 2018.5.18 kot建立 v1.0.0
****************************************************************************************************/
const { ccclass, property, menu } = cc._decorator;

export const LayoutType = {
    Horizontal: 0,
    Vertical: 1
};

@ccclass
@menu("Components/ScrollView")
export class ScrollView extends cc.Component {

    @property({ type: cc.Node, tooltip: "包含可滚动展示类容的节点引用" })
    protected content: cc.Node = null;
    @property({ type: cc.Enum(LayoutType), tooltip: "布局方向:\nHorizontal:横向布局\nVertical竖向布局" })
    protected layoutType: number = LayoutType.Horizontal;
    @property({ type: Boolean, tooltip: "是否开启滚动惯性" })
    protected inertia: boolean = true;
    @property({ type: Boolean, tooltip: "是否允许滚动内容超过边界,并在停止触摸后回弹" })
    protected elastic: boolean = true;

    protected ifInit: boolean = true;
    private _elasticDuration: number = 0.1;

    private _svRatioLeft: number;     // ScrollView 左边比列
    private _svRatioRight: number;    // ScrollView 右边比列
    private _svRatioBottom: number;   // ScrollView 下边比列
    private _svRatioTop: number;      // ScrollView 上边比列

    private _cRatioLeft: number;     // content 左边比列
    private _cRatioRight: number;    // content 右边比列
    private _cRatioBottom: number;   // content 下边比列
    private _cRatioTop: number;      // content 上边比列

    private _elasticWidth: number;   // 回弹开启后拖动宽范围
    private _elasticHeight: number;  // 回弹开启后拖动高范围

    // 惯性相关
    private _inertiaStopTime: number = 200;   // 惯性有效停待时间(毫秒)
    private _inertiaDistance: number = 100;   // 惯性有效距离
    private _forceDistanceBasic: number = 120;   // 力度相关距离基数
    private _forceTimeBasic: number = 3;   // 力度相关时间基数(帧)
    private _touchStartPos: cc.Vec2;    // 惯性有效起点
    private _touchStartTime: number;    // 惯性有效时间
    private _moveDistance: number;       // 最终移动距离
    private _moveTime: number;       // 最终移动时间(帧)
    private _maxMoveTime: number;   // 最终移动时间(帧)

    protected onLoad(): void {
        this._elasticWidth = this.node.width * .5;
        this._elasticHeight = this.node.height * .5;
        this.setSVRatio();
        if (this.ifInit) {
            this.setCRatio();
        }
        return;
    }

    /**
     * 计算ScrollView宽高比列
     * 
     * @private
     * @returns {void} 
     * @memberof ScrollView
     */
    private setSVRatio(): void {
        this._svRatioLeft = this.node.anchorX * this.node.width;
        this._svRatioRight = (1 - this.node.anchorX) * this.node.width;
        this._svRatioBottom = this.node.anchorY * this.node.height;
        this._svRatioTop = (1 - this.node.anchorY) * this.node.height;
        return;
    }

    /**
     * 计算content宽高比列
     * 
     * @returns {void} 
     * @memberof ScrollView
     */
    protected setCRatio(): void {
        this._cRatioLeft = this.content.anchorX * this.content.width;
        this._cRatioRight = (1 - this.content.anchorX) * this.content.width;
        this._cRatioBottom = this.content.anchorY * this.content.height;
        this._cRatioTop = (1 - this.content.anchorY) * this.content.height;
        return;
    }

    protected start(): void {
        return;
    }

    protected onEnable(): void {
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouch, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouch, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouch, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouch, this);
        return;
    }

    protected lateUpdate(): void {
        return;
    }

    protected update(): void {
        // 惯性相关
        if (this._moveTime > 0) {
            this._moveTime--;
            let outPos: cc.Vec2;
            switch (this.layoutType) {
                case LayoutType.Horizontal:
                    this.moveContent(new cc.Vec2(this._moveDistance / this._maxMoveTime * (1 + this._moveTime / this._maxMoveTime), 0));
                    // 超过边界重置位置
                    if (this.content.x < this.rightEdge) {
                        this._moveTime = 0;
                        this.content.x = this.rightEdge;
                    } else if (this.content.x > this.leftEdge) {
                        this._moveTime = 0;
                        this.content.x = this.leftEdge;
                    }
                    break;
                case LayoutType.Vertical:
                    this.moveContent(new cc.Vec2(0, this._moveDistance / this._maxMoveTime * (1 + this._moveTime / this._maxMoveTime)));
                    // 超过边界重置位置
                    if (this.content.y < this.topEdge) {
                        this._moveTime = 0;
                        this.content.y = this.topEdge;
                    } else if (this.content.y > this.bottomEdge) {
                        this._moveTime = 0;
                        this.content.y = this.bottomEdge;
                    }
                    break;
            }
        }
        return;
    }

    private onTouch(evt: cc.Event.EventTouch): void {
        switch (evt.type) {
            case cc.Node.EventType.TOUCH_START:
                this._moveTime = 0;
                // 惯性
                if (this.inertia) {
                    this._touchStartPos = evt.getLocation();
                    this._touchStartTime = Date.now();
                }
                break;
            case cc.Node.EventType.TOUCH_MOVE:
                let previousLocation: cc.Vec2 = evt.getPreviousLocation();
                let location: cc.Vec2 = evt.getLocation();
                this.moveContent(new cc.Vec2(location.x - previousLocation.x, location.y - previousLocation.y));
                // 惯性
                if (this.inertia) {
                    let nowTime: number = Date.now();
                    if (nowTime - this._touchStartTime > this._inertiaStopTime) {
                        this._touchStartPos = location;
                        this._touchStartTime = nowTime;
                    }
                }
                break;
            case cc.Node.EventType.TOUCH_CANCEL:
            case cc.Node.EventType.TOUCH_END:
                if (this.isDrag) {
                    // 回弹
                    this.toEdge();
                    // 惯性
                    this.onInertia(evt);
                }
                break;
        }
        return;
    }

    /**
     * 移动视图
     * 
     * @private
     * @param {cc.Vec2} pos 
     * @returns {void} 
     * @memberof ScrollView
     */
    protected moveContent(pos: cc.Vec2): void {
        if (!this.isDrag) return;
        switch (this.layoutType) {
            case LayoutType.Horizontal:
                let toX: number = this.content.x + pos.x;
                if (toX > this.leftEdgeElastic) {
                    // 右移,计算超出范围
                    pos.x = this.leftEdgeElastic - this.content.x;
                } else if (toX < this.rightEdgeElastic) {
                    // 左移,计算超出范围
                    pos.x = this.rightEdgeElastic - this.content.x;
                }
                if (pos.x != 0) this.content.x += pos.x;
                break;
            case LayoutType.Vertical:
                let toY: number = this.content.y + pos.y;
                if (toY > this.bottomEdgeElastic) {
                    // 上移,计算超出范围
                    pos.y = this.bottomEdgeElastic - this.content.y;
                } else if (toY < this.topEdgeElastic) {
                    // 下移,计算超出范围
                    pos.y = this.topEdgeElastic - this.content.y;
                }
                if (pos.y != 0) this.content.y += pos.y;
                break;
        }
        return;
    }

    /**
     * 惯性
     * 
     * @protected
     * @returns {void} 
     * @memberof ScrollView
     */
    protected onInertia(evt: cc.Event.EventTouch): void {
        if (!this.inertia) return;
        switch (this.layoutType) {
            case LayoutType.Horizontal:
                if (this.content.x < this.leftEdge && this.content.x > this.rightEdge) {
                    let nowTime: number = Date.now() - this._touchStartTime;
                    let distance: number = evt.getLocation().x - this._touchStartPos.x;
                    if (nowTime < this._inertiaStopTime && Math.abs(distance) > this._inertiaDistance) {
                        let force: number = Math.abs(distance) / nowTime;
                        this._moveDistance = distance > 0 ? this._forceDistanceBasic * force : -this._forceDistanceBasic * force;
                        this._maxMoveTime = this._moveTime = this._forceTimeBasic * force;
                    }
                }
                break;
            case LayoutType.Vertical:
                if (this.content.y < this.bottomEdge && this.content.y > this.topEdge) {
                    let nowTime: number = Date.now() - this._touchStartTime;
                    let distance: number = evt.getLocation().y - this._touchStartPos.y;
                    if (nowTime < this._inertiaStopTime && Math.abs(distance) > this._inertiaDistance) {
                        let force: number = Math.abs(distance) / nowTime;
                        this._moveDistance = distance > 0 ? this._forceDistanceBasic * force : -this._forceDistanceBasic * force;
                        this._maxMoveTime = this._moveTime = this._forceTimeBasic * force;
                    }
                }
                break;
        }
        return;
    }

    /**
     * 回弹到边界
     * 
     * @private
     * @returns {void} 
     * @memberof ScrollView
     */
    protected toEdge(duration: number = -1): void {
        if (!this.elastic) return;
        let to: number;
        switch (this.layoutType) {
            case LayoutType.Horizontal:
                to = this.leftEdge;
                if (this.content.x > to) {
                    this.runContentActionMoveTo(duration == -1 ? this._elasticDuration * ((this.content.x - to) / this._elasticWidth) : duration, new cc.Vec2(to, this.content.y));
                    break;
                }
                to = this.rightEdge;
                if (this.content.x < to) {
                    this.runContentActionMoveTo(duration == -1 ? this._elasticDuration * ((to - this.content.x) / this._elasticWidth) : duration, new cc.Vec2(to, this.content.y));
                    break;
                }
                break;
            case LayoutType.Vertical:
                to = this.bottomEdge;
                if (this.content.y > to) {
                    this.runContentActionMoveTo(duration == -1 ? this._elasticDuration * ((this.content.y - to) / this._elasticHeight) : duration, new cc.Vec2(this.content.x, to));
                    break;
                }
                to = this.topEdge;
                if (this.content.y < to) {
                    this.runContentActionMoveTo(duration == -1 ? this._elasticDuration * ((to - this.content.y) / this._elasticHeight) : duration, new cc.Vec2(this.content.x, to));
                    break;
                }
                break;
        }
        return;
    }

    /**
     * content 移动最左
     * 
     * @param {number} [duration=-1] 
     * @returns {void} 
     * @memberof ScrollView
     */
    public scrollToLeft(duration: number = -1): void {
        let to: number = this.leftEdge;
        this.runContentActionMoveTo(duration == -1 ? this._elasticDuration * ((to - this.content.y) / this._elasticHeight) : duration, new cc.Vec2(to, this.content.y));
        return;
    }

    /**
     * content 移动最右
     * 
     * @param {number} [duration=-1] 
     * @returns {void} 
     * @memberof ScrollView
     */
    public scrollToRight(duration: number = -1): void {
        let to: number = this.rightEdge;
        this.runContentActionMoveTo(duration == -1 ? this._elasticDuration * ((to - this.content.y) / this._elasticHeight) : duration, new cc.Vec2(to, this.content.y));
        return;
    }

    /**
     * content 移动最下
     * 
     * @param {number} [duration=-1] 
     * @returns {void} 
     * @memberof ScrollView
     */
    public scrollToBottom(duration: number = -1): void {
        let to: number = this.bottomEdge;
        this.runContentActionMoveTo(duration == -1 ? this._elasticDuration * ((to - this.content.y) / this._elasticHeight) : duration, new cc.Vec2(this.content.x, to));
        return;
    }

    /**
     * content 移动最上
     * 
     * @param {number} [duration=-1] 
     * @returns {void} 
     * @memberof ScrollView
     */
    public scrollToTop(duration: number = -1): void {
        let to: number = this.topEdge;
        this.runContentActionMoveTo(duration == -1 ? this._elasticDuration * ((to - this.content.y) / this._elasticHeight) : duration, new cc.Vec2(this.content.x, to));
        return;
    }

    /**
     * 移动 content
     * 
     * @private
     * @param {number} duration 
     * @param {cc.Vec2} pos 
     * @returns {void} 
     * @memberof ScrollView
     */
    private runContentActionMoveTo(duration: number, pos: cc.Vec2): void {
        this.content.stopAllActions();
        this.content.runAction(cc.moveTo(duration, pos));
        return;
    }

    /**
     * 计算左边缘
     * 
     * @readonly
     * @private
     * @type {number}
     * @memberof ScrollView
     */
    protected get leftEdge(): number {
        return this._cRatioLeft - this._svRatioLeft;
    }

    /**
     * 计算右边缘
     * 
     * @readonly
     * @protected
     * @type {number}
     * @memberof ScrollView
     */
    protected get rightEdge(): number {
        return -this._cRatioRight + this._svRatioRight;
    }

    /**
     * 计算下边缘
     * 
     * @readonly
     * @protected
     * @type {number}
     * @memberof ScrollView
     */
    protected get bottomEdge(): number {
        return this._cRatioBottom - this._svRatioBottom;
    }

    /**
     * 计算顶边缘
     * 
     * @readonly
     * @protected
     * @type {number}
     * @memberof ScrollView
     */
    protected get topEdge(): number {
        return -this._cRatioTop + this._svRatioTop;
    }

    /**
     * 计算左边缘 (检查回弹)
     * 
     * @readonly
     * @private
     * @type {number}
     * @memberof ScrollView
     */
    protected get leftEdgeElastic(): number {
        if (this.elastic) {
            return this.leftEdge + this._elasticWidth;
        } else {
            return this.leftEdge;
        }
    }

    /**
     * 计算右边缘 (检查回弹)
     * 
     * @readonly
     * @protected
     * @type {number}
     * @memberof ScrollView
     */
    protected get rightEdgeElastic(): number {
        if (this.elastic) {
            return this.rightEdge - this._elasticWidth;
        } else {
            return this.rightEdge;
        }
    }

    /**
     * 计算下边缘 (检查回弹)
     * 
     * @readonly
     * @protected
     * @type {number}
     * @memberof ScrollView
     */
    protected get bottomEdgeElastic(): number {
        if (this.elastic) {
            return this.bottomEdge + this._elasticHeight;
        } else {
            return this.bottomEdge;
        }
    }

    /**
     * 计算顶边缘 (检查回弹)
     * 
     * @readonly
     * @protected
     * @type {number}
     * @memberof ScrollView
     */
    protected get topEdgeElastic(): number {
        if (this.elastic) {
            return this.topEdge - this._elasticHeight;
        } else {
            return this.topEdge;
        }
    }

    /**
     * ScrollView 左边比列
     * 
     * @readonly
     * @protected
     * @type {number}
     * @memberof ScrollView
     */
    protected get svRatioLeft(): number {
        return this._svRatioLeft;
    }

    /**
     * ScrollView 右边比列
     * 
     * @readonly
     * @protected
     * @type {number}
     * @memberof ScrollView
     */
    protected get svRatioRight(): number {
        return this._svRatioRight;
    }

    /**
     * ScrollView 下边比列
     * 
     * @readonly
     * @protected
     * @type {number}
     * @memberof ScrollView
     */
    protected get svRatioBottom(): number {
        return this._svRatioBottom;
    }

    /**
     * ScrollView 上边比列
     * 
     * @readonly
     * @protected
     * @type {number}
     * @memberof ScrollView
     */
    protected get svRatioTop(): number {
        return this._svRatioTop;
    }


    /**
     * content 左边比列
     * 
     * @readonly
     * @protected
     * @type {number}
     * @memberof ScrollView
     */
    protected get cRatioLeft(): number {
        return this._cRatioLeft;
    }

    /**
     * content 右边比列
     * 
     * @readonly
     * @protected
     * @type {number}
     * @memberof ScrollView
     */
    protected get cRatioRight(): number {
        return this._cRatioRight;
    }

    /**
     * content 下边比列
     * 
     * @readonly
     * @protected
     * @type {number}
     * @memberof ScrollView
     */
    protected get cRatioBottom(): number {
        return this._cRatioBottom;
    }

    /**
     * content 上边比列
     * 
     * @readonly
     * @protected
     * @type {number}
     * @memberof ScrollView
     */
    protected get cRatioTop(): number {
        return this._cRatioTop;
    }

    /**
     * 检查是否能拖动
     * 
     * @protected
     * @returns {boolean} 
     * @memberof ScrollView
     */
    protected get isDrag(): boolean {
        switch (this.layoutType) {
            case LayoutType.Horizontal:
                return this.content.width > this.node.width;
            case LayoutType.Vertical:
                return this.content.height > this.node.height;
        }
        return false;
    }

    protected onDisable(): void {
        this.node.off(cc.Node.EventType.TOUCH_START, this.onTouch, this);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this.onTouch, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouch, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouch, this);
        return;
    }

    protected onDestroy(): void {
        return;
    }
}