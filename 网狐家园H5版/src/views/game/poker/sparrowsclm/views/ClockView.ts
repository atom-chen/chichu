/**
 * 倒计时
 */
namespace game {
    export namespace sparrowsclm {
        export class ClockView extends egret.Sprite {
            /**构造 */
            private _scene: any;
            private _clockID: number = 0;
            private _viewId: number = 0;
            private _gameEngine: any;
            constructor(scene: any,clockId?: number) {
                super();
                this._scene = scene;
                this._gameEngine = this._scene._gameEngine;
                this._clockID = clockId;
                this.onInitClock();

                this.setCurClockID(clockId);
            }

            private _clockMC: egret.MovieClip[] = []; 
            private onInitClock() {
                var data = RES.getRes("anim_json");
                var txtr = RES.getRes("anim_png");

                let companet = this._scene._companet as eui.Component;
                for (let i = 0; i < cmd.sparrowsclm.GAME_PLAYER; i++) {
                    let clock = companet.getChildByName(`clock${i}`) as eui.Panel;
                    var mcFactory: egret.MovieClipDataFactory = new egret.MovieClipDataFactory( data, txtr );
                    var mc: egret.MovieClip = new egret.MovieClip( mcFactory.generateMovieClipData( "clockanim" ) ); 
                    clock.addChild(mc);
                    mc.x = -4;
                    this._clockMC.push(mc);
                    mc.visible = false;
                }
            }

            public setClockId(clockId: number) {
                this._clockID = clockId;
            }

            public getClockId() {
                return this._clockID;
            }

            public setClockViewId(viewId: number) {
                this._viewId = viewId;
            }

            public getClockViewId() {
                return this._viewId;
            }

            /**刷新时间 */
            public onUpdateClockEvent() {
                if (this._clockTime -1 >= 0) {
                    this._clockTime--;
                    
                    if (this._clockTime == 0) {
                        if (this._scene && this._scene.logicTimeZero) {
                            this._scene.onClockEvent(this.getClockViewId(),this.getClockId());
                        }
                    }

                    this.updateShow();
                }
            }

            /**设置时间 */
            private _clockTime: number = 0;
            public setClockTime(nTime: number,clockId: number = 0,viewId: number = cmd.sparrowsclm.MY_VIEW) {
                if (nTime <= 0)
                    return;
                this._clockTime = nTime;    
                this.setClockId(clockId);
                this.setClockViewId(viewId);
                this.setCurClockID(viewId);

                this.updateShow();
            }

            /**显示 */
            private _clockNum: utils.LabelAtlas;
            private updateShow() {
                let str = "";
                str = (this._clockTime >= 10 ) ? `${this._clockTime}` : ("0"+this._clockTime);

                if (null != this._clockNum) {
                    this._clockNum.setText(str);
                    return;
                }

                let companet = this._scene._companet as eui.Component;
                let time = utils.LabelAtlas.createLabel(str, "game_num_1_png", "0123456789", 28, 52);
                utils.setAnchorCenter(time);
                companet.addChild(time);
                time.x = 667;
                time.y = 277;
                this._clockNum = time;
            }

            /**删除倒计时 */
            public deleteClock() {
                let companet = this._scene._companet as eui.Component;
                for (let i = 0; i < this._clockMC.length; i++) {
                  
                    let mc = this._clockMC[i];
                    if (null != mc) {
                         mc.stop();
                         mc = null;     
                    } 
                }
                //置空引用
                this._clockMC = null;
            }

            /**设置倒计时索引 */
            private setCurClockID(clockId: number) {
                if (clockId < 0 || null == clockId)
                    return;

                this._clockID = clockId;
                if (clockId == df.INVALID_ITEM) {
                    for (let i = 0; i < cmd.sparrowsclm.GAME_PLAYER; i++) {
                        let mc = this._clockMC[i] as egret.MovieClip;
                        mc.visible = false;
                        mc.stop();
                    }
                    return;
                }

                //帧动画
                for (let i = 0; i < cmd.sparrowsclm.GAME_PLAYER; i++) {
                    let mc = this._clockMC[i] as egret.MovieClip;
                    if (i == clockId) {
                        mc.visible = true;
                        mc.gotoAndPlay(1,-1);
                    } else {
                        mc.visible = false;
                        mc.stop();
                    }
                }
            }
        }
    }
}