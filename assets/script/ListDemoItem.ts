const { ccclass, property, menu } = cc._decorator;

import { ListItemBase } from "./components/list/ListItemBase";

@ccclass
@menu("DemoScript/ListDemoItem")
export class ListDemoItem extends ListItemBase {

    @property({ type: cc.Label })
    protected indexLabel: cc.Label;
    @property({ type: cc.Label })
    protected sizeLabel: cc.Label;
    @property({ type: cc.Node })
    protected back: cc.Node;


    public setData(data: cc.Vec2, index: number): void {
        super.setData(data, index);
        this.indexLabel.string = index.toString();
        this.sizeLabel.string = data.y.toString();
        // this.node.width = data.x;
        this.node.height = data.y;
        this.back.height = data.y - 4;
        return;
    }

}