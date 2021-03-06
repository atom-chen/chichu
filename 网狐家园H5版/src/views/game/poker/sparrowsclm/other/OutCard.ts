/**
 * 用户出牌
 */
namespace game {
    export namespace sparrowsclm {
        const OUT_POS: egret.Point[] = [new egret.Point(0,0),new egret.Point(949,112),new egret.Point(235,112)]
        export class OutCard {
            private _scene: any;
            private _outPanel: eui.Panel;
            private _gameLogic: GameLogic;
            constructor(scene) {
                this._scene = scene;
                this.onInit();
            }

            private onInit() {
                this._outPanel = this._scene._companet.getChildByName("outCard");
                this._gameLogic = new GameLogic();
            }

            /**设置出牌 */
            public setOutCard(viewId: number, cbCardsData?: number) {
                if (viewId == df.INVALID_ITEM) {
                    if (null != this._outPanel) {
                        let card = this._outPanel.getChildByName("card") as CardSprite;
                        if (null != card) {
                            this._outPanel.removeChild(card);
                        }
                        this._outPanel.visible = false;
                    }
                    return;
                }

                this._outPanel.visible = true;
                this._outPanel.x = OUT_POS[viewId].x;
                this._outPanel.y = OUT_POS[viewId].y;

                //创建扑克
                if (this._gameLogic.IsValidCard(cbCardsData)) {
                    let logicIndex = this._gameLogic.SwitchToCardIndex(cbCardsData) - 9;
                    
                    let params: any = {};
                    params.bSheet = true;
                    params.texture = "game_handcard_png";
                    params.key = "card";
                    params.pos = 0;
                    params.width = 88;
                    params.height = 128;

                    let card = new CardSprite("game_handcard_png",cbCardsData,params);
                    card.name = "card";
                    utils.setAnchorCenter(card);
                    card.x = this._outPanel.width/2;
                    card.y = this._outPanel.height/2 - 20;
                    this._outPanel.addChild(card);
                }
            }

            /**回收 */
            public dealloc() {
                this._outPanel = null;
                this._gameLogic = null;
            }
        }
    }
}