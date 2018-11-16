/**
 * 游戏交互
 */

namespace game {
    export namespace sparrowsclm {
        //用户头像位置
        import CMD_C_OutCard = cmd.runfast.CMD_C_OutCard;
        const HeadPoint: any[] = [{ x: 667, y: 618 }, { x: 1074, y: 172 }, { x: 144, y: 172 }];
        export class GameViewLayer extends eui.UILayer {
            private _gameEngine: GameClientEngine;
            private _clockView: ClockView;
            private _wBankerUser: number = df.INVALID_CHAIR;
            private _bTrustee: boolean = true;
            private _lCellScore: number = 0;
            private _bAllowJoin: boolean = true;
            private _bIsRuleSetting: boolean = false;
            private _lTurnScore: number[] = [0, 0, 0, 0];
            private _lCollectScore: number[] = [0, 0, 0, 0];

            private _handCardControl: HandCard;
            private _operateView: OperateView;
            public _weaveCardControl: WeaveCard;
            public _tableCardControl: TableCard;
            public _outCardControl: OutCard;

            private _opSelectView: OpSelectView;
            private _FanTipsView: FanTipsView;

            /**
             * 构造
             */
            constructor(engine: any) {
                super();
                this._gameEngine = engine;
            }
            protected createChildren(): void {
                super.createChildren();

                this.name = "GameViewLayer";

                this.once(egret.Event.ADDED_TO_STAGE, this.onInitLayer, this);
                this.once(egret.Event.REMOVED_FROM_STAGE, this.onExit, this);

                //注册触摸
                this.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onTouchBegan, this);
                this.addEventListener(egret.TouchEvent.TOUCH_MOVE, this.onTouchMove, this);
                this.addEventListener(egret.TouchEvent.TOUCH_END, this.onTouchEnd, this);
            }

            /**初始化 */
            public _companet: eui.Component;
            private _userList: models.UserItem[] = [];
            private onInitLayer(): void {
                let componet = new eui.Component();
                this.addChild(componet);
                this._companet = componet;

                //设置皮肤
                componet.skinName = skins.sparrowsclm.GameLayer;

                //控件初始化
                this._handCardControl = new HandCard(this);//手牌控制器
                this._weaveCardControl = new WeaveCard(this);//
                this._tableCardControl = new TableCard(this);
                this._outCardControl = new OutCard(this);

                //操作界面
                this._operateView = new OperateView(this, this._gameEngine.onUserAction);
                this.addChildAt(this._operateView, 30);
                this._operateView.visible = false;

                //选择界面
                this._opSelectView = new OpSelectView(this._gameEngine);
                this.addChildAt(this._opSelectView, 30);
                this._opSelectView.visible = false;

                //番数提示
                this._FanTipsView = new FanTipsView(this._gameEngine);
                this.addChildAt(this._FanTipsView, 30);
                this._FanTipsView.visible = false;

                //显示自己信息
                this.showMyselfInfo();

                //初始化桌面
                this.initDesk();

                //初始化用户
                for (let i = 0; i < cmd.sparrowsclm.PLAYER_COUNT; i++) {
                    this.onInitUser(i);
                }

                //按钮事件
                this.initButton();
            }

            /**清理桌面 */
            public onRestGameView() {
                this._wBankerUser = df.INVALID_CHAIR;
                this._bTrustee = true;
                this._lCellScore = 0;
                this._bAllowJoin = true;
                this._bIsRuleSetting = false;
                this._bWatiTips = false;
                this._lTurnScore = [0, 0, 0, 0];
                this._lCollectScore = [0, 0, 0, 0];

                //准备
                let bt = this._companet.getChildByName("start");
                bt.visible = true;
                bt.x = 840;

                //换桌
                bt = this._companet.getChildByName("changeDesk");
                bt.visible = true;
                bt.x = 494;

                //停止动作
                this.stopAllAction();

                //隐藏
                for (let i = 0; i < cmd.sparrowsclm.PLAYER_COUNT; i++) {
                    //准备小手
                    let userPanel = this._companet.getChildByName("userinfo" + i) as eui.Panel;
                    const readyIcon = userPanel.getChildByName("ready");
                    readyIcon.visible = false;

                    //用户信息
                    if (i != cmd.sparrowsclm.MY_VIEW) {
                        this.onInitUser(i);
                    }
                }

                //清空用户缓存
                for (let i = 0; i < this._userList.length; i++) {
                    let user = this._userList[i];
                    this._userList.shift();
                    user = null;
                }
                this._userList = [];

                //初始化桌面
                this.initDesk();

                //手牌重置
                if (null != this._handCardControl) {
                    this._handCardControl.onRestCardsData();
                }

                //组合牌重置
                if (null != this._weaveCardControl) {
                    this._weaveCardControl.onRest();
                }

                //桌面扑克
                if (null != this._tableCardControl) {
                    this._tableCardControl.onRest();
                }

                //出牌显示
                if (null != this._outCardControl) {
                    this._outCardControl.setOutCard(df.INVALID_ITEM);
                }

            }

            /**帧率刷新 */
            private _lCurTime = egret.getTimer();
            private _nDotIndex: number = 0;
            public update() {
                if (this._bWatiTips) {
                    let delay = egret.getTimer();
                    if (delay - this._lCurTime >= 500) {
                        for (let k = 0; k < 3; k++) {
                            let dot = this.getChildByName("dot" + k);
                            dot.visible = (this._nDotIndex == k) ? true : false;
                        }
                        this._nDotIndex = (this._nDotIndex + 1) % 3;
                        this._lCurTime = egret.getTimer();
                    }
                }
            }

            /**停止动画 */
            public stopAllAction() {
                this.showWaitTips(0, false);
            }

            /**掷骰子 */
            public drawSice(lsice0: number, lsice1: number, callback?: any) {
                let sice = new SiceView(lsice0, lsice1, callback);
                this.addChild(sice);
            }

            /**更换背景 */
            public changeBackGround(index: number) {

            }

            /**剩余张数 */
            private _remaindTip: utils.LabelAtlas;
            public setRemaindNum(nCout: number) {
                if (null == this._remaindTip) {
                    this._remaindTip = utils.LabelAtlas.createLabel(`${nCout}`, "game_num_0_png", ",0123456789", 28, 35);
                    this.addChild(this._remaindTip);
                    utils.setAnchorLeftTop(this._remaindTip);
                    this._remaindTip.x = 56;
                    this._remaindTip.y = 21;
                } else {
                    this._remaindTip.setText(`${nCout}`);
                }
            }

            /**创建扑克 */
            public createHandCards(viewId: number, cbCardsData: number[]) {
                this._handCardControl.createHandCard(viewId, cbCardsData, (cbCardsData.length == 1) ? true : false);
            }

            /**用户出牌 */
            public userOutCard(viewid: number, cbCardData: number = 0, special: boolean = false) {
                //出牌显示
                if (viewid != cmd.sparrowsclm.MY_VIEW) {
                    this._outCardControl.setOutCard(viewid, cbCardData);
                }

                if (viewid == df.INVALID_CHAIR) return;

                //桌面显示
                this._tableCardControl.createTableCard(viewid, [cbCardData], true);
            }

            /**用户托管 */
            public userTrustee(viewId: number, bTrustee: number) {

            }

            /**操作提示 */
            public setOperateNotify(cbActionMask?: any) {
                if (null == this._operateView) return;

                if (null == cbActionMask || cmd.sparrowsclm.WIK_NULL == cbActionMask) {
                    this._operateView.visible = false;
                    return;
                }
                this._operateView.visible = true;
                this._operateView.setOperateNotify(cbActionMask);
            }

            /**操作动作 */
            public onEventUserAction(selectInfo?: any) {
                if (null == selectInfo) {
                    this._opSelectView.onEventUserAction();
                } else {
                    this._opSelectView.onEventUserAction(selectInfo);
                }
            }

            /**开始发牌 */
            public dispatchCard(dispatchInfo: any[], callback?: any) {

                //组合动画
                let actions: any[] = [];
                for (let i = 0; i < dispatchInfo.length; i++) {
                    let dispatch = dispatchInfo[i];

                    let callfunc = () => {
                        this.createHandCards(dispatch.viewId, dispatch.cardData);//
                        this._gameEngine._cbRemindCardCount--;//剩余的牌数,为什么不减少两张
                        this.setRemaindNum(this._gameEngine._cbRemindCardCount);
                    };

                    actions.push(callfunc);
                }

                //结束回调
                if (null != callback) {
                    actions.push(callback);
                }

                //开始动画
                this._nActionIndex = 0;
                this.startDispatch(actions);
            }

            //递归发牌
            private _nActionIndex: number = 0;
            private startDispatch(actions: any[]) {
                if (null == actions) return;

                //递归调用
                egret.Tween.get(this)
                    .wait(50)
                    .call(() => {
                        let callback = actions[this._nActionIndex];
                        if (null != callback) {
                            this._nActionIndex++;
                            if (this._nActionIndex == actions.length) {
                                actions = null;
                            }
                            callback();

                            if (null == actions) return;
                            if (this._nActionIndex < actions.length) {
                                this.startDispatch(actions);
                            }
                        }
                    })
            }

            public startOperateAni(viewId: number, operateCode: number) {

            }

            public setChiHuFlag(viewId: number, isShow: boolean = false) {

            }

            //提示胡牌信息 小灯泡按钮
            public setChiHuTips(isVisible: boolean = false) {

            }

            /**
             * 显示番信息
             */
            public showFanTips(index: number = df.INVALID_BYTE, fanInfo?: any) {
                if (index == df.INVALID_BYTE) {
                    this._FanTipsView.visible = false;
                } else {
                    this._FanTipsView.showFanTips(fanInfo,400,490);
                    this._FanTipsView.visible = true;
                }
            }

            /**
             * 显示最近一次出牌标识
             * 默认显示
             */
            public showNearOutIcon(outViewId: number, isShow: boolean = true) {
                this._tableCardControl.showNearOutIcon(outViewId, isShow);
            }

            /**桌面基本信息 */
            public initDesk() {
                //桌号
                let num = this._gameEngine._gameFrame.getTableID();
                if (num == df.INVALID_TABLE)  return;
                   
                if (null != this.getChildByName("deskNum")) {
                    let deskNum = this.getChildByName("deskNum") as utils.LabelAtlas;
                    deskNum.setText(`${num+1}`);
                } else {
                    let deskNum = utils.LabelAtlas.createLabel(`${num+1}`, "yz_num_count_png", ":/0123456789", 28, 35);
                    deskNum.name = "deskNum";
                    utils.setAnchorLeftMid(deskNum);
                    deskNum.x = 565;
                    deskNum.y = 115;
                    this.addChild(deskNum);
                }

                //底分
                let formatStr = utils.StringUtils.formatNumberThousands(this._lCellScore);
                if (null != this.getChildByName("deskCell")) {
                    let deskCell = this.getChildByName("deskCell") as utils.LabelAtlas;
                    deskCell.setText(formatStr);
                } else {
                    let deskCell = utils.LabelAtlas.createLabel(formatStr, "yz_num_cell_png", ",0123456789", 28, 35);
                    deskCell.name = "deskCell";
                    utils.setAnchorLeftMid(deskCell);
                    deskCell.x = 815;
                    deskCell.y = 115;
                    this.addChild(deskCell);
                }
            }

            /**显示自己信息 */
            private showMyselfInfo() {
                const myself = this._gameEngine.getMeUserItem();

                if (null == myself) return;

                if (myself.cbUserStatus == df.US_READY) {
                    this.showUserReady(myself);
                }

                //头像
                let headPanel = this._companet.getChildByName("userinfo0") as eui.Panel;
                let head = models.HeadSprite.createHead(myself, 120, 120, 35, 35);
                utils.setAnchorCenter(head);
                headPanel.addChild(head);
                head.x = HeadPoint[cmd.sparrowsclm.MY_VIEW].x;
                head.y = HeadPoint[cmd.sparrowsclm.MY_VIEW].y;

                //id
                let userid = headPanel.getChildByName("userID") as eui.Label;
                userid.text = "ID:" + myself.dwUserID;

                //昵称
                let nick = headPanel.getChildByName("userNick") as eui.Label;
                nick.text = utils.StringUtils.clipByConfig(myself.szNickName, 150, utils.StringUtils.getSystemConfig(24));

                //分数
                let score = headPanel.getChildByName("userScore") as eui.Label;
                score.text = utils.StringUtils.clipByConfig(utils.StringUtils.formatNumberThousands(myself.lScore), 150, utils.StringUtils.getSystemConfig(24));
            }

            /**加入缓存 */
            private cacheUser(user: models.UserItem) {

                //判断重复
                for (let i = 0; i < this._userList.length; i++) {
                    let target: models.UserItem = this._userList[i];
                    if (target.dwUserID == user.dwUserID) {
                        this._userList.splice(i, 1);
                        break;
                    }
                }

                //拷贝对象
                let copy = new models.UserItem(user);
                this._userList.push(copy);
            }

            /**移除缓存 */
            private removeUserCache(user: models.UserItem): number {
                if (this._userList.length == 0)
                    return df.INVALID_ITEM;

                let bSuccess: boolean = false;
                let deleteIndex: number = df.INVALID_ITEM;
                for (let i = 0; i < this._userList.length; i++) {
                    let target: models.UserItem = this._userList[i];
                    if (target.dwUserID == user.dwUserID) {
                        this._userList.splice(i, 1);
                        bSuccess = true;
                        deleteIndex = this._gameEngine.switchViewChairID(target.wChairID);
                        break;
                    }
                }
                egret.assert(bSuccess);
                return deleteIndex;
            }

            /**等待提示 */
            private _bWatiTips: boolean = false;
            private showWaitTips(nShowIndex: number, isShow: boolean) {
                let tips = this._companet.getChildByName("waitImg") as eui.Image;
                if (null == tips) return;

                tips.visible = isShow;
                if (isShow == false) {
                    this._bWatiTips = false;
                    for (let i = 0; i < 3; i++) {
                        if (null != this.getChildByName("dot" + i)) {
                            this.removeChild(this.getChildByName("dot" + i))
                        }
                    }
                    return;
                }

                if (nShowIndex == 0) {
                    tips.source = "game_ready_text_wait_png";
                } else {

                }

                let beginPosX = 884;
                for (let i = 0; i < 3; i++) {
                    if (null != this.getChildByName("dot" + i))
                        continue;

                    let dot = new eui.Image(`dot_${i + 1}_png`);
                    dot.name = "dot" + i;
                    utils.setAnchorLeftMid(dot);
                    this.addChild(dot);
                    dot.visible = i == 0 ? true : false;

                    dot.x = beginPosX;
                    dot.y = 490;
                }

                //等待动画
                this._nDotIndex = 0;
                this._bWatiTips = true;
                this._lCurTime = egret.getTimer();

            }

            /**显示准备 */
            private showUserReady(user: models.UserItem, isshow: boolean = true) {
                const userindex = this._gameEngine.switchViewChairID(user.wChairID);
                let userPanel = this._companet.getChildByName("userinfo" + userindex) as eui.Panel;
                let readyIcon = userPanel.getChildByName("ready");
                readyIcon.visible = isshow;

                if (!isshow || userindex != cmd.sparrowsclm.MY_VIEW) return;

                //隐藏开始按钮
                let startBt = this._companet.getChildByName("start");
                startBt.visible = false;

                //调整换桌按钮位置
                let changeDesk = this._companet.getChildByName("changeDesk");
                changeDesk.x = this.width / 2;

                //显示等待提示
                this.showWaitTips(0, true);
            }

            /**用户断线 */
            private showUserOffLine(user: models.UserItem) {


            }

            /**显示用户 */
            private showUser(user: models.UserItem, isShow: boolean) {

                //加入缓存
                if (null != user) {
                    this.cacheUser(user);
                }

                //视图索引
                let userIndex = this._gameEngine.switchViewChairID(user.wChairID);

                //用户信息
                let userPanel = this._companet.getChildByName("userinfo" + userIndex) as eui.Panel;

                //校验重复
                if (null != userPanel.getChildByName("userHead"))
                    userPanel.removeChild(userPanel.getChildByName("userHead"));

                if (userIndex != cmd.sparrowsclm.MY_VIEW) {
                    let orignalBg = userPanel.getChildByName("head") as eui.Image;
                    orignalBg.visible = false;

                    let normalBg = userPanel.getChildByName("head_normal") as eui.Image;
                    normalBg.visible = true;
                }

                //头像
                let head = models.HeadSprite.createHead(user, 120, 120, 35, 35);
                utils.setAnchorLeftTop(head);
                head.name = "userHead";
                userPanel.addChild(head);
                head.x = HeadPoint[userIndex].x;
                head.y = HeadPoint[userIndex].y;

                //id
                let userid = userPanel.getChildByName("userID") as eui.Label;
                userid.visible = true;
                userid.text = "ID:" + user.dwUserID;

                //昵称
                let nick = userPanel.getChildByName("userNick") as eui.Label;
                nick.visible = true;
                nick.text = utils.StringUtils.clipByConfig(user.szNickName, 150, utils.StringUtils.getSystemConfig(24));

                // 分数
                let score = userPanel.getChildByName("userScore") as eui.Label;
                score.visible = true;
                score.text = utils.StringUtils.clipByConfig(utils.StringUtils.formatNumberThousands(user.lScore), 150, utils.StringUtils.getSystemConfig(24));

            }

            /**删除用户 */
            private removeUser(user: models.UserItem) {
                //查找记录
                const userIndex = this.removeUserCache(user);
                if (userIndex == df.INVALID_ITEM) return;

                this.onInitUser(userIndex, false);
            }

            /**初始用户 */
            private onInitUser(userIndex: number, isShow: boolean = false) {
                let userPanel = this._companet.getChildByName("userinfo" + userIndex) as eui.Panel;
                userPanel.x = 0;
                let head = userPanel.getChildByName("userHead");
                if (null != head && !isShow) {
                    userPanel.removeChild(head);
                }



                //隐藏准备
                const readyIcon = userPanel.getChildByName("ready");
                readyIcon.visible = false;

                //头像框
                if (userIndex != cmd.sparrowsclm.MY_VIEW) {
                    let orignalBg = userPanel.getChildByName("head") as eui.Image;
                    orignalBg.visible = true;

                    let normalBg = userPanel.getChildByName("head_normal") as eui.Image;
                    normalBg.visible = false;

                    //id
                    let userid = userPanel.getChildByName("userID") as eui.Label;
                    userid.visible = isShow;

                    //昵称
                    let nick = userPanel.getChildByName("userNick") as eui.Label;
                    nick.visible = isShow;

                    //分数
                    let score = userPanel.getChildByName("userScore") as eui.Label;
                    score.visible = isShow;
                }
            }

            /**游戏开始
             * 头像移动
             */
            private gamePlayingHeadAnim(isAction: boolean = true) {
                const offX: number[] = [-585, 115, -115];

                for (let i = 0; i < cmd.sparrowsclm.PLAYER_COUNT; i++) {
                    let userPanel = this._companet.getChildByName("userinfo" + i) as eui.Panel;

                    let tw = egret.Tween.get(userPanel)
                        .to({ x: offX[i] }, isAction ? 200 : 0);
                }
            }
            /**
             * 用户变更
             * 状态变更
             * 分数变更
             */
            public onUpdataUser(user: models.UserItem, newStatus?: any, oldStatus?: any) {
                if (null == user) return;
                if (user.cbUserStatus >= df.US_SIT && user.cbUserStatus != df.US_LOOKON) {
                    if (user.dwUserID != managers.FrameManager.getInstance().m_GlobalUserItem.dwUserID) {
                        this.showUser(user, true);
                    }

                    //用户准备
                    if (user.cbUserStatus == df.US_READY) {
                        this.showUserReady(user);
                    }

                    //用户断线
                    if (user.cbUserStatus == df.US_OFFLINE) {
                        this.showUserOffLine(user);
                    }
                }

                //用户起立或离开
                if (user.cbUserStatus <= df.US_FREE) {
                    this.removeUser(user);
                }
            }

            /**
             * 初始按钮
             */
            private initButton() {
                //返回
                let bt = this._companet.getChildByName("back");
                bt.addEventListener(egret.TouchEvent.TOUCH_END, this.onButtonClick, this);

                //准备
                bt = this._companet.getChildByName("start");
                bt.addEventListener(egret.TouchEvent.TOUCH_END, this.onButtonClick, this);

                //换桌
                bt = this._companet.getChildByName("changeDesk");
                bt.addEventListener(egret.TouchEvent.TOUCH_END, this.onButtonClick, this);

            }
            /**按钮事件 */
            private _changeRecord: number = egret.getTimer();
            private onButtonClick(e: egret.Event) {
                let target = e.target as eui.Button;
                switch (target.name) {
                    case "back":
                        {
                            this._gameEngine.onQueryExitGame();
                        }
                        break;
                    case "start":
                        {
                            //判断用户状态
                            const userItem = this._gameEngine.getMeUserItem();
                            if (userItem.cbUserStatus >= df.US_READY)
                                return;

                            //发送准备
                            this._gameEngine._gameFrame.onUserReady();

                            target.visible = false;
                        }
                        break;
                    case "changeDesk":
                        {
                            //频繁过滤
                            let curTime = egret.getTimer();
                            if (curTime - this._changeRecord < 1000) {
                                managers.FrameManager.getInstance().showToast("亲,换的太频繁了!");
                                this._changeRecord = egret.getTimer();
                                return;
                            }

                            //发送换桌
                            managers.FrameManager.getInstance().showPopWait("");
                            this._gameEngine._bChangeDesk = true;
                            this._gameEngine._gameFrame.onChangeDesk();
                            this._changeRecord = egret.getTimer();

                            target.visible = false;
                        }
                        break;
                }
            }

            /**刷新倒计时 */
            public updateClockView() {
                if (null != this._clockView) {
                    this._clockView.onUpdateClockEvent();
                }
            }


            /**显示场景 */
            public showSceneFree(data: any) {
                if (null == this._clockView) {
                    this._clockView = new ClockView(this);
                }
                this.setGameClock(cmd.sparrowsclm.TIME_GAME_START, cmd.sparrowsclm.IDI_GAME_START);

                //数据解析
                let dataBuffer = data as network.Message;
                let sceneFree = new cmd.sparrowsclm.CMD_S_StatusFree(dataBuffer.cbBuffer);

                this._wBankerUser = sceneFree.wBankerUser;
                this._bTrustee = false;

                this._lCellScore = sceneFree.lCellScore;
                this._bAllowJoin = sceneFree.bAllowJoin;
                this._bIsRuleSetting = sceneFree.bIsRuleSetting;

                this._lTurnScore = sceneFree.lTurnScore;
                this._lCollectScore = sceneFree.lCollectScore;

                //更新底分
                this.initDesk();
            }

            //设置倒计时
            private setGameClock(nTime: number, clockId: number = 0, viewId: number = 0) {
                if (null == this._clockView) {
                    this._clockView = new ClockView(this);
                }

                this._clockView.setClockTime(nTime, clockId, viewId);
            }

            /**游戏开始 */
            public showGameStart(start: cmd.sparrowsclm.CMD_S_GameStart) {
                //隐藏开始按钮
                let startBt = this._companet.getChildByName("start");
                startBt.visible = false;

                //隐藏换桌按钮
                let changeDesk = this._companet.getChildByName("changeDesk");
                changeDesk.visible = false;

                //隐藏等待提示
                this.showWaitTips(0, false);

                //隐藏准备标识
                for (let i = 0; i < cmd.sparrowsclm.PLAYER_COUNT; i++) {
                    let userPanel = this._companet.getChildByName("userinfo" + i) as eui.Panel;
                    let readyIcon = userPanel.getChildByName("ready");
                    readyIcon.visible = false;
                }

                //头像移动
                this.gamePlayingHeadAnim();
            }

            /** 触摸事件
            * onTouchBegan
            * onTouchMove
            * onTouchEnd
            */
            private onTouchBegan(event: egret.TouchEvent) {
                //console.log("GameViewLayer onTouch Began");
                this._bMoved = false;
            }

            private _bMoved = false;
            private onTouchMove(event: egret.TouchEvent) {
                // console.log("GameViewLayer onTouch move");
                this._bMoved = true;
            }

            private onTouchEnd(event: egret.TouchEvent) {
                // console.log("GameViewLayer onTouch end");
            }

            /**
             * 移除舞台 
             */
            private onExit() {
                //移除触摸
                this.removeEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onTouchBegan, this);
                this.removeEventListener(egret.TouchEvent.TOUCH_MOVE, this.onTouchMove, this);
                this.removeEventListener(egret.TouchEvent.TOUCH_END, this.onTouchEnd, this);


                if (null != this._handCardControl) {
                    this._handCardControl.dealloc();
                    this._handCardControl = null;
                }

                if (null != this._weaveCardControl) {
                    this._weaveCardControl.dealloc();
                    this._weaveCardControl = null;
                }

                if (null != this._tableCardControl) {
                    this._tableCardControl.dealloc();
                    this._tableCardControl = null;
                }

                if (null != this._outCardControl) {
                    this._outCardControl.dealloc();
                    this._outCardControl = null;
                }
        
                this._operateView = null;
                this._opSelectView = null;
                this._FanTipsView = null;
            }
        }
    }
}