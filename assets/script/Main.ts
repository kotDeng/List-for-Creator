const { ccclass, property, menu } = cc._decorator;

import { List } from "./components/list/List";

@ccclass
@menu("DemoScript/Main")
export class Main extends cc.Component {

    @property(List)
    protected horizontal: List;
    @property(List)
    protected vertical: List;

    public onEnable(): void {
        // this.horizontal.dataArray = this.dataHorizontal;
        this.vertical.dataArray = this.dataVertical;
        return;
    }

    private get dataHorizontal(): Array<cc.Vec2> {
        let data: Array<cc.Vec2> = [];
        for (let i: number = 0; i < 10000; i++) {
            data.push(new cc.Vec2(Math.random() > 0.6 ? Math.random() > 0.5 ? 200 : 300 : 100, 100));
        }
        return data;
    }

    private get dataVertical(): Array<cc.Vec2> {
        let data: Array<cc.Vec2> = [];
        for (let i: number = 0; i < 10000; i++) {
            data.push(new cc.Vec2(100, Math.random() > 0.6 ? Math.random() > 0.5 ? 200 : 300 : 100));
        }
        return data;
    }

}