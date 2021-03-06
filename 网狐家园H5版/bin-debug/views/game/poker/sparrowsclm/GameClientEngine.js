var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/**
 * 断勾卡血战麻将
 */
var game;
(function (game) {
    var sparrowsclm;
    (function (sparrowsclm) {
        /**
         * 游戏引擎
         * 游戏协议
         * 场景消息
         * 用户服务
         */
        var GameClientEngine = (function (_super) {
            __extends(GameClientEngine, _super);
            /**
             * 构造
             */
            function GameClientEngine(engine) {
                var _this = _super.call(this) || this;
                //动作队列
                _this._actionList = [];
                _this.AK_GAME_BEGIN = 0; //游戏开始
                _this.AK_OUT_CARD = 1; //游戏出牌
                _this.AK_SEND_CARD = 2; //游戏抓牌
                _this.AK_DISPATCH_CARD = 3; //游戏发牌
                _this.AK_SICE = 4; //色子动画
                _this.AK_NO_GANG = 5; //禁杠动作
                _this.AK_OPERATE_NOTIFY = 6; //组合提醒
                _this.AK_OPERATE_RESULT = 7; //组合结果
                _this.AK_CHI_RESULT = 8; //吃胡
                _this.AK_GAME_END = 9;
                _this.AK_QING_HU = 10;
                _this.AK_BAO_HU = 11;
                _this.AK_GAME_ACTION = 12;
                _this.AK_TRANS_NOTIFY = 13;
                //报胡标识
                _this._bBaoHuFlag = false;
                //操作掩码
                _this._cbActionMask = 0;
                //操作数值
                _this._cbActionCard = 0;
                //发牌数值
                _this._cbSendCardData = 0;
                //剩余张数
                _this._cbRemindCardCount = cmd.sparrowsclm.MAX_REPERTORY;
                //请胡玩家
                _this._wQingHuUser = df.INVALID_CHAIR;
                //当前报胡
                _this._wCurrBaoUser = df.INVALID_CHAIR;
                //手牌索引
                _this._cbCardIndex = utils.allocArray(cmd.sparrowsclm.MAX_INDEX, Number);
                //非手牌索引
                _this._cbDisCardIndex = utils.allocArray(cmd.sparrowsclm.MAX_INDEX, Number);
                //手牌数据
                _this._cbCardData = utils.allocArray(cmd.sparrowsclm.MAX_COUNT, Number);
                //吃胡数据
                _this._cbChiHuCard = [0, 0, 0, 0];
                //当前玩家
                _this._wCurrentUser = df.INVALID_CHAIR;
                //庄家玩家
                _this._wBankerUser = df.INVALID_CHAIR;
                //禁杠数据
                _this._noGangCardList = [];
                //托管标识
                _this._bTrustee = false;
                //番数信息
                _this._FanInfo = [];
                /**游戏状态 */
                _this._cbGameStatus = 0;
                _this._bMoved = false;
                return _this;
            }
            GameClientEngine.prototype.createChildren = function () {
                _super.prototype.createChildren.call(this);
                this.name = "GameClientEngine"; //通过父显示对象容器的getChildByName()
                this.once(egret.Event.ADDED_TO_STAGE, this.onInitLayer, this);
                this.once(egret.Event.REMOVED_FROM_STAGE, this.onExit, this);
                //设置业务代理
                this._gameFrame.setDelegate(this);
                //注册触摸
                this.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onTouchBegan, this);
                this.addEventListener(egret.TouchEvent.TOUCH_MOVE, this.onTouchMove, this);
                this.addEventListener(egret.TouchEvent.TOUCH_END, this.onTouchEnd, this);
                //注册通知
                this.addEventListener(customEvent.CustomEvent.EVENT_USER_ENTER, this.onUserEnter, this);
                this.addEventListener(customEvent.CustomEvent.EVENT_USER_STATUS, this.onUserStatus, this);
            };
            /**初始化游戏界面 */
            GameClientEngine.prototype.onInitLayer = function () {
                this._gameviewLayer = new sparrowsclm.GameViewLayer(this);
                this.addChild(this._gameviewLayer);
            };
            /**变量初始化 */
            GameClientEngine.prototype.onInitEngine = function () {
                _super.prototype.onInitEngine.call(this);
                this._gameLogic = new sparrowsclm.GameLogic();
                this._bBaoHuFlag = false;
                this._bTrustee = false;
                this._cbActionMask = cmd.sparrowsclm.WIK_NULL;
                this._cbActionCard = 0;
                this._cbSendCardData = 0;
                this._wCurrentUser = df.INVALID_CHAIR; //当前玩家无效椅子
                this._wQingHuUser = df.INVALID_CHAIR; //请胡玩家无效椅子
                this._wBankerUser = df.INVALID_CHAIR; //庄家玩家无效椅子
                this._cbRemindCardCount = cmd.sparrowsclm.MAX_REPERTORY; //剩余牌数
            };
            /**变量重置*/
            GameClientEngine.prototype.onResetEngine = function () {
                this._bBaoHuFlag = false;
                this._bTrustee = false;
                this._cbActionMask = cmd.sparrowsclm.WIK_NULL;
                this._cbActionCard = 0;
                this._cbSendCardData = 0;
                this._wCurrentUser = df.INVALID_CHAIR;
                this._wQingHuUser = df.INVALID_CHAIR;
                this._wBankerUser = df.INVALID_CHAIR;
                this._cbRemindCardCount = cmd.sparrowsclm.MAX_REPERTORY;
                this._cbChiHuCard = [0, 0, 0, 0];
                for (var i = 0; i < cmd.sparrowsclm.MAX_INDEX; i++) {
                    this._cbCardIndex[i] = 0;
                    this._cbDisCardIndex[i] = 0;
                }
                for (var i = 0; i < cmd.sparrowsclm.MAX_COUNT; i++) {
                    this._cbCardData[i] = 0;
                }
                this._noGangCardList = [];
                this._FanInfo = [];
            };
            /**
             * 游戏层刷新
             */
            GameClientEngine.prototype.onUpdate = function () {
                this._gameviewLayer.update();
            };
            /**游戏人数 */
            GameClientEngine.prototype.gamePlayerCount = function () {
                return cmd.sparrowsclm.PLAYER_COUNT;
            };
            /**
             * 视图转换
             * 玩家逻辑索引
             */
            GameClientEngine.prototype.switchViewChairID = function (chairID) {
                if (chairID == this.getMeChair()) {
                    return cmd.sparrowsclm.MY_VIEW;
                }
                else if (chairID > this.getMeChair()) {
                    if (chairID == (this.getMeChair() + 1)) {
                        return cmd.sparrowsclm.RIGHT_VIEW;
                    }
                    else if (chairID == (this.getMeChair() + 2)) {
                        return cmd.sparrowsclm.LEFT_VIEW;
                    }
                }
                else {
                    if ((chairID + 1) == this.getMeChair()) {
                        return cmd.sparrowsclm.LEFT_VIEW;
                    }
                    else if ((chairID + 2) == this.getMeChair()) {
                        return cmd.sparrowsclm.RIGHT_VIEW;
                    }
                }
                return df.INVALID_CHAIR;
            };
            /**倒计时事件 */
            GameClientEngine.prototype.onClockUpdateEvent = function () {
                if (this._gameviewLayer && this._gameviewLayer.updateClockView) {
                    this._gameviewLayer.updateClockView();
                }
            };
            GameClientEngine.prototype.getGameStatus = function () {
                return this._cbGameStatus;
            };
            /**用户进入
             * 其他用户进入
             * */
            GameClientEngine.prototype.onUserEnter = function (object) {
                var data = object.data;
                var user = data.user;
                if (null != this._gameviewLayer) {
                    this._gameviewLayer.onUpdataUser(user);
                }
            };
            /**用户状态 */
            GameClientEngine.prototype.onUserStatus = function (object) {
                var data = object.data;
                var user = data.user;
                var newstatus = data.newstatus;
                var oldstatus = data.oldstatus;
                if (null != this._gameviewLayer) {
                    this._gameviewLayer.onUpdataUser(user, newstatus, oldstatus);
                }
            };
            /**用户聊天 */
            GameClientEngine.prototype.onUserChat = function (object) {
            };
            /**用户分数 */
            GameClientEngine.prototype.onUserScore = function (object) {
            };
            /**游戏场景 */
            GameClientEngine.prototype.onGameScene = function (status, object) {
                utils.LOG("GameClientEngine: 游戏场景");
                this._cbGameStatus = status;
                managers.FrameManager.getInstance().dismissPopWait(); //移除等待界面
                switch (this._cbGameStatus) {
                    case cmd.sparrowsclm.GAME_SCENE_FREE:
                        {
                            this.onSceneFree(object); //进入游戏
                        }
                        break;
                    case cmd.sparrowsclm.GS_PLAYING:
                        {
                            this.onScenePlaying(object); //断线重连
                        }
                        break;
                }
            };
            /**游戏协议 */
            GameClientEngine.prototype.onGameMessage = function (object) {
                var msg = object;
                switch (msg.wSubCmd) {
                    case cmd.sparrowsclm.SUB_S_GAME_START:
                        {
                            this.onSubGameStart(msg.cbBuffer);
                        }
                        break;
                    case cmd.sparrowsclm.SUB_S_OUT_CARD:
                        {
                            this.onSubOutCard(msg.cbBuffer);
                        }
                        break;
                    case cmd.sparrowsclm.SUB_S_SEND_CARD:
                        {
                            this.onSubSendCard(msg.cbBuffer);
                        }
                        break;
                    case cmd.sparrowsclm.SUB_S_NOGANG_INFO:
                        {
                            this.onSubNoGangInfo(msg.cbBuffer);
                        }
                        break;
                    case cmd.sparrowsclm.SUB_S_OPERATE_NOTIFY:
                        {
                            this.onSubOperateNotify(msg.cbBuffer);
                        }
                        break;
                    case cmd.sparrowsclm.SUB_S_OPERATE_RESULT:
                        {
                            this.onSubOperateResult(msg.cbBuffer);
                        }
                        break;
                    case cmd.sparrowsclm.SUB_S_CHIHU_RESULT:
                        {
                            this.onSubChiHuResult(msg.cbBuffer);
                        }
                        break;
                    case cmd.sparrowsclm.SUB_S_GAME_END:
                        {
                            this.onSubGameEnd(msg.cbBuffer);
                        }
                        break;
                    case cmd.sparrowsclm.SUB_S_TRUSTEE:
                        {
                            this.onSubTrustee(msg.cbBuffer);
                        }
                        break;
                    case cmd.sparrowsclm.SUB_S_VOICEPHRASE:
                        {
                        }
                        break;
                    case cmd.sparrowsclm.SUB_S_GAME_ACTION_NOTIFY:
                        {
                            this.onSubGameActionNotify(msg.cbBuffer);
                        }
                        break;
                    case cmd.sparrowsclm.SUB_S_GAME_RULE_SETTING:
                        {
                            var ruleSetting = new cmd.sparrowsclm.CMD_S_GAME_RULE_SETTING();
                            ruleSetting.onInit(msg.cbBuffer);
                            var data = utils.Memory.newLitteEndianByteArray(df.Len_Tcp_Head);
                            data.Append_SCORE(ruleSetting.lCellScore);
                            this._gameFrame.sendData(df.MDM_GF_GAME, cmd.sparrowsclm.SUB_C_GAME_RULE_SETTING, data);
                        }
                        break;
                    case cmd.sparrowsclm.SUB_S_GAME_RULE_NOTIFY:
                        {
                            var ruleNotify = new cmd.sparrowsclm.CMD_S_GAME_RULE_NOTIFY();
                            ruleNotify.onInit(msg.cbBuffer);
                            if (true == ruleNotify.bForceExit) {
                                this.onExitGame("对不起,您携带的分数不够,不能参与游戏!");
                            }
                            if (4 == ruleNotify.cbGamePlayer) {
                                this.onExitGame("暂不支持4人桌游戏!");
                            }
                        }
                        break;
                    case cmd.sparrowsclm.SUB_S_BAO_HU_NOTIFY:
                        {
                            this.onSubBaoHuNotify(msg.cbBuffer);
                        }
                        break;
                    case cmd.sparrowsclm.SUB_S_TRANSFER_NOTIFY:
                        {
                            this.onSubTransferNotify(msg.cbBuffer);
                        }
                        break;
                }
                console.log("GameClientEngine: 游戏协议:", msg.wSubCmd, cmd.sparrowsclm.MS_NAME[msg.wSubCmd]);
            };
            /**倒计时处理 */
            GameClientEngine.prototype.onClockEvent = function (viewId, clockId) {
                if (clockId == cmd.sparrowsclm.IDI_GAME_START) {
                    if (viewId == cmd.sparrowsclm.MY_VIEW) {
                        var userItem = this.getMeUserItem();
                        if (userItem.cbUserStatus < df.US_READY) {
                            this.onExitGame();
                        }
                    }
                }
                else if (clockId == cmd.sparrowsclm.IDI_OPERATE_CARD) {
                    if (viewId == cmd.sparrowsclm.MY_VIEW) {
                        if (!this._bTrustee) {
                        }
                    }
                }
            };
            /**游戏开始 */
            GameClientEngine.prototype.onSubGameStart = function (buffer) {
                //数据解析
                var start = new cmd.sparrowsclm.CMD_S_GameStart();
                start.onInit(buffer);
                //开始显示
                if (this._gameviewLayer && this._gameviewLayer.showGameStart) {
                    this._gameviewLayer.showGameStart(start);
                }
                //剩余张数
                this._gameviewLayer.setRemaindNum(cmd.sparrowsclm.MAX_REPERTORY);
                //报胡标识
                this._bBaoHuFlag = false;
                //排序手牌
                this._gameLogic.SortCardList(start.cbCardData, sparrowsclm.MAX_COUNT);
                //构造数据action数据
                var action = {};
                action.bLock = false;
                action.nKind = this.AK_GAME_BEGIN;
                action.actions = utils.allocArray(3, Number); //一个动作包含三个动作
                action.actions[0] = this.AK_SICE; //骰子动画
                action.actions[1] = this.AK_DISPATCH_CARD; //发牌动画
                action.actions[2] = this.AK_SEND_CARD; //庄家抓牌
                action.lSiceCount = start.lSiceCount; //骰子点数
                action.wBankerUser = start.wBankerUser; //庄家
                action.wCurrentUser = start.wCurrentUser; //当前用户
                action.wCurrBaoUser = start.wCurrBaoUser; //报胡用户
                action.cbCardData = start.cbCardData; //玩家牌列表
                action.cbActionMask = start.cbUserAction; //动作掩码
                //动作队列
                this._actionList.push(action);
                this.beginGameAction();
                //游戏状态
                this._cbGameStatus = cmd.sparrowsclm.GS_PLAYING;
                console.log("start:", start);
            };
            GameClientEngine.prototype.onSubOutCard = function (buffer) {
                //数据解析
                var outcard = new cmd.sparrowsclm.CMD_S_OutCard();
                outcard.onInit(buffer);
                //构造数据
                var action = {};
                action.nKind = this.AK_OUT_CARD;
                action.bTrusteeOut = outcard.bTrusteeOut; //托管出牌
                action.wOutCardUser = outcard.wOutCardUser; //出牌用户
                action.cbOutCardData = outcard.cbOutCardData; //出牌扑克
                //托管出牌
                if (outcard.wOutCardUser == this.getMeChair()) {
                    this._bTrustee = outcard.bTrusteeOut;
                }
                //出牌动作
                if (outcard.wOutCardUser != this.getMeChair() || (outcard.wOutCardUser == this.getMeChair() && this._bTrustee)) {
                    this._actionList.push(action);
                    this.beginGameAction();
                }
            };
            GameClientEngine.prototype.onSubSendCard = function (buffer) {
                var sendcard = new cmd.sparrowsclm.CMD_S_SendCard();
                sendcard.onInit(buffer);
                var action = {};
                action.nKind = this.AK_SEND_CARD;
                action.cbCardData = sendcard.cbCardData; //扑克数据
                action.cbActionMask = sendcard.cbActionMask; //动作掩码
                action.wCurrentUser = sendcard.wCurrentUser; //当前用户
                action.bTail = sendcard.bTail;
                this._actionList.push(action);
                this.beginGameAction();
            };
            GameClientEngine.prototype.onSubNoGangInfo = function (buffer) {
                var nogang = new cmd.sparrowsclm.CMD_S_NOGANG();
                nogang.onInit(buffer);
                var action = {};
                action.nKind = this.AK_NO_GANG;
                action.cbNoGangCard = [];
                action.cbNoGangCard[0] = nogang.cbNoGangCard[0];
                action.cbNoGangCard[1] = nogang.cbNoGangCard[1];
                action.cbNoGangCard[2] = nogang.cbNoGangCard[2];
                this._actionList.push(action);
                this.beginGameAction();
            };
            GameClientEngine.prototype.onSubOperateNotify = function (buffer) {
                var opNotify = new cmd.sparrowsclm.CMD_S_OperateNotify();
                opNotify.onInit(buffer);
                var action = {};
                action.nKind = this.AK_OPERATE_NOTIFY;
                action.wResumeUser = opNotify.wResumeUser; //还原用户
                action.cbActionMask = opNotify.cbActionMask; //动作掩码
                action.cbActionCard = opNotify.cbActionCard; //动作扑克
                this._actionList.push(action);
                this.beginGameAction();
            };
            GameClientEngine.prototype.onSubOperateResult = function (buffer) {
                var opResult = new cmd.sparrowsclm.CMD_S_OperateResult();
                opResult.onInit(buffer);
                var action = {};
                action.nKind = this.AK_OPERATE_RESULT;
                action.result = opResult;
                action.wOperateUser = opResult.wOperateUser; //操作用户
                action.wProvideUser = opResult.wProvideUser; //供应用户
                action.cbOperateCode = opResult.cbOperateCode; //操作代码
                action.cbCardData = [];
                action.cbCardData[0] = opResult.cbOperateCard[0];
                action.cbCardData[1] = opResult.cbOperateCard[0];
                action.cbCardData[2] = opResult.cbOperateCard[0];
                action.cbUserAction = opResult.cbUserAction; //玩家动作
                action.cbExcludeCard = opResult.cbExcludeCard; //排除扑克 
                this._actionList.push(action);
                this.beginGameAction();
            };
            GameClientEngine.prototype.onSubChiHuResult = function (buffer) {
            };
            GameClientEngine.prototype.onSubGameEnd = function (buffer) {
            };
            GameClientEngine.prototype.onSubTrustee = function (buffer) {
                var trustee = new cmd.sparrowsclm.CMD_S_Trustee();
                trustee.onInit(buffer);
                if (trustee.wChairID == this.getMeChair()) {
                    this._bTrustee = trustee.bTrustee;
                }
                //托管标识
                this._gameviewLayer.userTrustee(this.switchViewChairID(trustee.wChairID), trustee.bTrustee);
            };
            GameClientEngine.prototype.onSubGameActionNotify = function (buffer) {
                var gameAction = new cmd.sparrowsclm.CMD_S_GAME_ACTION_NOTIFY();
                gameAction.onInit(buffer);
                var action = {};
                action.nKind = this.AK_GAME_ACTION;
                action.GameAction = {};
                action.GameAction.cbActionType = gameAction.GameAction.cbActionType;
                action.GameAction.cbActionCode = gameAction.GameAction.cbActionCode;
                action.GameAction.wOperaterUser = gameAction.GameAction.wOperaterUser;
                action.GameAction.wProvideUser = gameAction.GameAction.wProvideUser;
                action.nPerUserFanCount = [];
                action.nPerUserFanCount[0] = gameAction.nPerUserFanCount[0];
                action.nPerUserFanCount[1] = gameAction.nPerUserFanCount[1];
                action.nPerUserFanCount[2] = gameAction.nPerUserFanCount[2];
                action.nPerUserFanCount[3] = gameAction.nPerUserFanCount[3];
                this._actionList.push(action);
                this.beginGameAction();
            };
            GameClientEngine.prototype.onSubBaoHuNotify = function (buffer) {
                var baoHuNotify = new cmd.sparrowsclm.CMD_S_BAO_HU_NOTIFY();
                baoHuNotify.onInit(buffer);
                var action = {};
                action.nKind = this.AK_BAO_HU;
                action.wCurrentUser = baoHuNotify.wCurrentUser;
                action.wLastUser = baoHuNotify.wLastUser;
                action.bBaoHuFlag = baoHuNotify.bBaoHuFlag;
                action.cbCardData = baoHuNotify.cbCardData;
                this._actionList.push(action);
                this.beginGameAction();
            };
            GameClientEngine.prototype.onSubTransferNotify = function (buffer) {
                var transferNotify = new cmd.sparrowsclm.CMD_S_TRANSFER_NOTIFY();
                transferNotify.onInit(buffer);
                var action = {};
                action.nKind = this.AK_TRANS_NOTIFY;
                action.cbGameActionIndex = transferNotify.cbGameActionIndex;
                action.cbTransferCount = transferNotify.cbTransferCount;
                action.lTransferScore = [];
                action.lTransferScore[0] = transferNotify.lTransferScore[0];
                action.lTransferScore[1] = transferNotify.lTransferScore[1];
                action.lTransferScore[2] = transferNotify.lTransferScore[2];
                action.lTransferScore[3] = transferNotify.lTransferScore[3];
                this._actionList.push(action);
                this.beginGameAction();
            };
            /**系统消息 */
            GameClientEngine.prototype.onGameSystemMessage = function (object) {
            };
            /**空闲场景 */
            GameClientEngine.prototype.onSceneFree = function (data) {
                if (this._gameviewLayer && this._gameviewLayer.showSceneFree) {
                    this._gameviewLayer.showSceneFree(data);
                    this._gameviewLayer.setRemaindNum(this._cbRemindCardCount);
                }
            };
            /**游戏场景 */
            GameClientEngine.prototype.onScenePlaying = function (data) {
            };
            /**游戏动作 */
            GameClientEngine.prototype.beginGameAction = function () {
                var action = this._actionList[0];
                if (null == action || action.bLock)
                    return; //bLock动作锁?
                action.bLock = true;
                if (action.nKind == this.AK_GAME_BEGIN) {
                    this.startGameStart(action, this.AK_SICE);
                }
                else if (action.nKind == this.AK_OUT_CARD) {
                    this.startOutCard(action);
                }
                else if (action.nKind == this.AK_SEND_CARD) {
                    this.startSendCard(action);
                }
                else if (action.nKind == this.AK_OPERATE_NOTIFY) {
                    this.startOperateNotify(action);
                }
                else if (action.nKind == this.AK_OPERATE_RESULT) {
                    this.startOperateResult(action);
                }
                else if (action.nKind == this.AK_GAME_ACTION) {
                    this.startGameAction(action);
                }
                else if (action.nKind == this.AK_BAO_HU) {
                    this.startBaoHuNotify(action);
                }
                else if (action.nkind == this.AK_CHI_RESULT) {
                    this.startChiHuResult(action);
                }
                else if (action.nKind == this.AK_GAME_END) {
                    this.startGameEnd(action);
                }
            };
            /**播放动画 */
            GameClientEngine.prototype.playGameAction = function (viewId, actionCode) {
            };
            /**游戏开始动作 */
            GameClientEngine.prototype.startGameStart = function (action, index) {
                var _this = this;
                if (action.actions.length > 0) {
                    if (index == this.AK_SICE) {
                        if (action.lSiceCount == 0) {
                            this.startGameStart(this._actionList[0], this.AK_DISPATCH_CARD); //骰子动画
                            return;
                        }
                        this.startSice(action.lSiceCount & 0x0000FFFF); //其余点数由其他玩家，规定发牌顺序
                    }
                    else if (index == this.AK_DISPATCH_CARD) {
                        //构造发牌数据
                        var dispatchInfo = [];
                        var nPos = action.wBankerUser; //庄家
                        var nIndex = -1;
                        for (var i = 0; i < cmd.sparrowsclm.PLAYER_COUNT; i++) {
                            for (var j = 0; j < (cmd.sparrowsclm.MAX_COUNT - 1) / 2; j++) {
                                var dispatch = {};
                                //玩家视图
                                var viewId = this.switchViewChairID(nPos); //通过座位ID获取视图ID?
                                if (viewId == cmd.sparrowsclm.MY_VIEW)
                                    nIndex++; //
                                nPos = (nPos + 1) % cmd.sparrowsclm.PLAYER_COUNT;
                                //发牌位置
                                dispatch.viewId = viewId;
                                //每次两张
                                dispatch.cout = 2;
                                //扑克数据
                                dispatch.cardData = utils.allocArray(2, Number);
                                dispatch.cardData[0] = (viewId == cmd.sparrowsclm.MY_VIEW) ? action.cbCardData[nIndex * 2 + 0] : 0xFF; //为什么不是MY_VIEW时候发牌数据为0xFF
                                dispatch.cardData[1] = (viewId == cmd.sparrowsclm.MY_VIEW) ? action.cbCardData[nIndex * 2 + 1] : 0xFF;
                                //加入队列
                                dispatchInfo.push(dispatch);
                                if (viewId == cmd.sparrowsclm.MY_VIEW) {
                                    this._cbCardData[nIndex * 2 + 0] = action.cbCardData[nIndex * 2 + 0];
                                    this._cbCardData[nIndex * 2 + 1] = action.cbCardData[nIndex * 2 + 1];
                                }
                            }
                        }
                        //动作回调
                        var callback = function () {
                            _this.startGameStart(_this._actionList[0], _this.AK_SEND_CARD); //为什么还是actionList[0]，在什么地方actionList.pop()?
                        };
                        this.startDispatchCard(dispatchInfo, callback);
                    }
                    else if (index == this.AK_SEND_CARD) {
                        //庄家起牌
                        console.log("庄家起牌");
                        //构造发牌数据
                        var dispatchInfo = [];
                        var dispatch = {};
                        //玩家视图
                        var viewId = this.switchViewChairID(action.wBankerUser);
                        //发牌位置
                        dispatch.viewId = viewId;
                        //庄家起牌数目
                        dispatch.cout = 1;
                        //扑克数据
                        dispatch.cardData = utils.allocArray(1, Number);
                        dispatch.cardData[0] = (viewId == cmd.sparrowsclm.MY_VIEW) ? action.cbCardData[cmd.sparrowsclm.MAX_COUNT - 1] : 0xFF;
                        //加入队列
                        dispatchInfo.push(dispatch);
                        //庄家牌
                        if (viewId == cmd.sparrowsclm.MY_VIEW) {
                            this._cbCardData[cmd.sparrowsclm.MAX_COUNT - 1] = action.cbCardData[cmd.sparrowsclm.MAX_COUNT - 1];
                        }
                        //动作回调
                        var callback = function () {
                            //转换索引
                            var count = (_this.switchViewChairID(action.wBankerUser) == cmd.sparrowsclm.MY_VIEW) ? sparrowsclm.MAX_COUNT : sparrowsclm.MAX_COUNT - 1;
                            _this._gameLogic.SwitchToCardIndexs(_this._cbCardData, count, _this._cbCardIndex);
                            _this.onFanAnalysis(true); //
                            //移除动作
                            _this.removeGameAction();
                        };
                        this.startDispatchCard(dispatchInfo, callback);
                    }
                }
            };
            /**出牌动画 */
            GameClientEngine.prototype.startOutCard = function (action) {
                //隐藏操作
                this._gameviewLayer.setOperateNotify();
                var cardIndex = this._gameLogic.SwitchToCardIndex(action.cbOutCardData);
                var viewid = this.switchViewChairID(action.wOutCardUser);
                if (viewid == cmd.sparrowsclm.MY_VIEW) {
                    //禁用手牌
                    this._gameviewLayer._handCardControl.setAllowOutCardStatus(false);
                    //上次出牌显示隐藏
                    this._gameviewLayer.userOutCard(df.INVALID_CHAIR);
                    //数据校验
                    if (this._gameLogic.RemoveCard(this._cbCardIndex, [action.cbOutCardData])) {
                        //转换数据
                        this._cbCardData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                        this._gameLogic.SwitchToCardDatas(this._cbCardIndex, this._cbCardData);
                        //刷新手牌
                        this._gameviewLayer._handCardControl.updateCardsData(cmd.sparrowsclm.MY_VIEW, this._cbCardData);
                    }
                }
                else {
                    //手牌刷新
                    this._gameviewLayer._handCardControl.removeHandCard(viewid, 1);
                }
                //重置变量
                this._wCurrentUser = df.INVALID_CHAIR;
                this._cbActionMask = 0;
                this._cbActionCard = 0;
                if ((null == action.special) || (0 == action.special)) {
                    //出牌显示
                    this._gameviewLayer.userOutCard(viewid, action.cbOutCardData, action.special);
                    //显示最近一次出牌标记
                    this._gameviewLayer.showNearOutIcon(viewid);
                }
                //番数分析
                this.onFanAnalysis(action.wOutCardUser == this.getMeChair());
                //继续动作
                this.removeGameAction(true);
            };
            /**完成出牌*/
            GameClientEngine.prototype.finishOutCard = function (action) {
                this.onUpdateFanTips();
            };
            /**开始抓牌 */
            GameClientEngine.prototype.startSendCard = function (action) {
                //数据更新
                if (action.wCurrentUser == this.getMeChair()) {
                    var cardIndex = this._gameLogic.SwitchToCardIndex(action.cbCardData);
                    this._cbCardIndex[cardIndex] = Number(this._cbCardIndex[cardIndex]) + 1;
                    this._cbCardData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    this._gameLogic.SwitchToCardDatas(this._cbCardIndex, this._cbCardData);
                }
                //玩家索引
                var viewid = this.switchViewChairID(action.wCurrentUser);
                //刷新手牌
                this._gameviewLayer.createHandCards(viewid, [action.cbCardData]);
                //剩余张数
                this._cbRemindCardCount--;
                this._gameviewLayer.setRemaindNum(this._cbRemindCardCount);
                //继续动作
                this.removeGameAction(true);
            };
            /**完成抓牌 */
            GameClientEngine.prototype.finishSendCard = function (action) {
                this._wCurrentUser = action.wCurrentUser;
                if (this._wCurrentUser == this.getMeChair()) {
                    this._cbActionMask = action.cbActionMask;
                    this._cbActionCard = action.cbCardData;
                    if (this._cbActionMask != sparrowsclm.WIK_NULL) {
                        //禁用手牌
                        this._gameviewLayer._handCardControl.setAllowOutCardStatus(false);
                        this._gameviewLayer.setOperateNotify(this._cbActionMask);
                    }
                    else {
                        this._gameviewLayer._handCardControl.setAllowOutCardStatus(!this._bBaoHuFlag);
                    }
                    this.onUpdateFanTips();
                }
            };
            /**禁杠动作 */
            GameClientEngine.prototype.startNoGangCard = function (action) {
                this._noGangCardList = [];
                for (var i = 0; i < action.cbNoGangCard.length; i++) {
                    if (action.cbNoGangCard[i] != 0) {
                        this._noGangCardList.push(action.cbNoGangCard[i]);
                    }
                }
                this.removeGameAction(true);
            };
            /**操作提示 */
            GameClientEngine.prototype.startOperateNotify = function (action) {
                if (action.cbActionMask != sparrowsclm.WIK_NULL) {
                    this._cbActionMask = action.cbActionMask;
                    this._cbActionCard = action.cbActionCard;
                    var MyChair = this.getMeChair();
                    if (this._wQingHuUser == MyChair && this._cbActionMask == sparrowsclm.WIK_CHI_HU) {
                        this.onUserAction(sparrowsclm.WIK_CHI_HU);
                    }
                    else {
                        //禁用手牌
                        this._gameviewLayer._handCardControl.setAllowOutCardStatus(false);
                        this._gameviewLayer.setOperateNotify(this._cbActionMask);
                    }
                }
                this.removeGameAction(true);
            };
            /**操作结果 */
            GameClientEngine.prototype.startOperateResult = function (action) {
                this._gameviewLayer.setOperateNotify();
                var MyChair = this.getMeChair();
                var opreateUser = action.wOperateUser;
                var provideUser = action.wProvideUser;
                var bPublic = true;
                var result = action.result;
                var opView = this.switchViewChairID(action.wOperateUser);
                var prView = this.switchViewChairID(action.wProvideUser);
                var operateCode = action.cbOperateCode;
                var card = action.cbCardData[0];
                var cardIndex = this._gameLogic.SwitchToCardIndex(card);
                this._wCurrentUser = action.wOperateUser;
                this._wQingHuUser = df.INVALID_CHAIR;
                //组合扑克
                if ((operateCode & sparrowsclm.WIK_GANG) != 0) {
                    this._gameviewLayer._weaveCardControl.operateResult(opView, result);
                    //手牌数据
                    if (opreateUser == MyChair) {
                        this._cbCardIndex[cardIndex] = 0;
                        this._cbCardData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                        this._gameLogic.SwitchToCardDatas(this._cbCardIndex, this._cbCardData);
                    }
                }
                else if ((operateCode & sparrowsclm.WIK_JIA_GANG) != 0) {
                    this._gameviewLayer._weaveCardControl.operateResult(opView, result);
                    //手牌数据
                    if (opreateUser == MyChair) {
                        this._cbCardIndex[cardIndex] = 0;
                        this._cbCardData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                        this._gameLogic.SwitchToCardDatas(this._cbCardIndex, this._cbCardData);
                    }
                }
                else if ((operateCode & sparrowsclm.WIK_QING_HU) != 0) {
                    this.playGameAction(opView, sparrowsclm.WIK_QING_HU);
                    this._wQingHuUser = action.wOperateUser;
                    if (action.wOperateUser == MyChair) {
                        this.onOutCard(card, cmd.sparrowsclm.OUT_CARD_QING_HU);
                    }
                    this._gameviewLayer.startOperateAni(opView, cmd.sparrowsclm.OUT_CARD_QING_HU);
                }
                else if ((operateCode & sparrowsclm.WIK_PENG) != 0) {
                    this._gameviewLayer._weaveCardControl.operateResult(opView, result);
                    //手牌数据
                    if (opreateUser == MyChair) {
                        this._cbCardIndex[cardIndex] = 0;
                        this._cbCardData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                        this._gameLogic.SwitchToCardDatas(this._cbCardIndex, this._cbCardData);
                    }
                }
                else {
                    egret.assert(false);
                }
                //手牌刷新 碰 杠 加杠
                if ((operateCode & sparrowsclm.WIK_QING_HU) == 0) {
                    var isLast = (operateCode & sparrowsclm.WIK_PENG) ? true : false;
                    if (opreateUser == MyChair) {
                        this._gameviewLayer._handCardControl.updateCardsData(cmd.sparrowsclm.MY_VIEW, this._cbCardData, isLast);
                    }
                    else {
                        var deleteCout = (operateCode & sparrowsclm.WIK_GANG) ? 4 : ((operateCode & sparrowsclm.WIK_JIA_GANG) ? 1 : 2);
                        this._gameviewLayer._handCardControl.removeHandCard(opView, deleteCout, isLast);
                    }
                }
                //操作玩家不是提供玩家则删除已出牌
                if (opreateUser != provideUser) {
                    this._gameviewLayer._tableCardControl.deleteProvideCard(prView, card);
                }
                //上次出牌显示隐藏
                if (opreateUser == this.getMeChair()) {
                    this._gameviewLayer.userOutCard(df.INVALID_CHAIR);
                }
                this._gameviewLayer.onEventUserAction();
                if (action.wOperateUser == MyChair) {
                    if (action.cbUserAction != 0) {
                        this._cbActionMask = action.cbUserAction;
                        this._gameviewLayer.setOperateNotify(this._cbActionMask);
                        //禁用手牌
                        this._gameviewLayer._handCardControl.setAllowOutCardStatus(false);
                    }
                    else if (this._wQingHuUser != MyChair) {
                        this._gameviewLayer._handCardControl.setAllowOutCardStatus(!this._bBaoHuFlag);
                    }
                    if (this._wQingHuUser != MyChair) {
                        this.onFanAnalysis(true);
                    }
                }
                else {
                    this.onFanAnalysis(false);
                }
                this.onUpdateFanTips();
                this.removeGameAction(true);
            };
            /**游戏动作 */
            GameClientEngine.prototype.startGameAction = function (action) {
                this.removeGameAction(true);
            };
            /**报胡提示 */
            GameClientEngine.prototype.startBaoHuNotify = function (action) {
                this._wCurrBaoUser = action.wCurrentUser;
                this._wCurrentUser = this._wBankerUser;
                var MyChair = this.getMeChair();
                var viewid = this.switchViewChairID(action.wLastUser);
                //报胡动画及标示
                if (action.bBaoHuFlag && viewid != df.INVALID_CHAIR) {
                    this._gameviewLayer.startOperateAni(viewid, sparrowsclm.WIK_BAO_HU);
                    this._gameviewLayer.setChiHuFlag(viewid, true);
                    this.playGameAction(action.wLastUser, sparrowsclm.WIK_BAO_HU);
                }
                //自己报胡
                if (action.wLastUser == MyChair) {
                    this._bBaoHuFlag = action.bBaoHuFlag;
                    this._gameviewLayer.onEventUserAction();
                    this._gameviewLayer._handCardControl.setAllowOutCardStatus(!this._bBaoHuFlag);
                }
                //是否还有人报胡
                if (this._wCurrBaoUser != df.INVALID_CHAIR) {
                    if (this._wCurrBaoUser == MyChair) {
                        this._gameviewLayer.setOperateNotify(sparrowsclm.WIK_BAO_HU);
                    }
                    else {
                        this._gameviewLayer.setOperateNotify();
                    }
                }
                else {
                    this._gameviewLayer.setOperateNotify();
                    if (action.wLastUser != this._wBankerUser || !action.bBaoHuFlag) {
                        if (this._wCurrentUser == MyChair) {
                            if (this._cbActionMask != 0) {
                                this._gameviewLayer.setOperateNotify(this._cbActionMask);
                            }
                            else {
                                this._gameviewLayer.setOperateNotify();
                                this._gameviewLayer.onEventUserAction();
                                this._gameviewLayer._handCardControl.setAllowOutCardStatus(!this._bBaoHuFlag);
                            }
                        }
                    }
                }
                this.removeGameAction(true);
            };
            /**吃胡动作 */
            GameClientEngine.prototype.startChiHuResult = function (action) {
                //上次出牌显示隐藏
                this._gameviewLayer.userOutCard(df.INVALID_CHAIR);
            };
            /**游戏结束 */
            GameClientEngine.prototype.startGameEnd = function (action) {
                //上次出牌显示隐藏
                this._gameviewLayer.userOutCard(df.INVALID_CHAIR);
            };
            /**结束完成 */
            GameClientEngine.prototype.finishGameEnd = function (action) {
            };
            /**呼叫转移 */
            GameClientEngine.prototype.startTransferNotify = function (action) {
                this.removeGameAction(true);
            };
            /**移除动作 */
            GameClientEngine.prototype.removeGameAction = function (bContinue) {
                var action = this._actionList[0];
                if (null == action || !action.bLock)
                    return;
                var nkind = action.nKind;
                if (nkind == this.AK_GAME_BEGIN) {
                    this.finishStartAction(action);
                }
                else if (nkind == this.AK_OUT_CARD) {
                    this.finishOutCard(action);
                }
                else if (nkind == this.AK_SEND_CARD) {
                    this.finishSendCard(action);
                }
                else if (nkind == this.AK_OPERATE_NOTIFY) {
                }
                else if (nkind == this.AK_OPERATE_RESULT) {
                }
                else if (nkind == this.AK_GAME_END) {
                    this.finishGameEnd(action);
                }
                //移除队列
                this._actionList.splice(0, 1);
                //下一动作
                if (bContinue == true && this._actionList.length > 0) {
                    this.beginGameAction();
                }
            };
            /**掷骰子动画 */
            GameClientEngine.prototype.startSice = function (lsice) {
                var _this = this;
                if (lsice > 0) {
                    var sice2 = (lsice & 0x00ff);
                    var sice1 = ((lsice >> 8) & 0x00ff);
                    var callback = function () {
                        _this.startGameStart(_this._actionList[0], _this.AK_DISPATCH_CARD);
                    };
                    this._gameviewLayer.drawSice(sice1, sice2, callback);
                }
            };
            /**发牌动画 */
            GameClientEngine.prototype.startDispatchCard = function (dispatchInfo, callback) {
                this._gameviewLayer.dispatchCard(dispatchInfo, callback); //发牌动画
            };
            /**开始动作完成 */
            GameClientEngine.prototype.finishStartAction = function (action) {
                var wCurrBaoUser = action.wCurrBaoUser;
                var wCurrentUser = action.wCurrentUser;
                var cbActionMask = action.cbActionMask;
                this._wCurrBaoUser = wCurrBaoUser;
                this._wCurrentUser = wCurrentUser;
                this._cbActionMask = cbActionMask;
                this._wBankerUser = action.wBankerUser;
                this.onUpdateFanTips();
                //报叫提示
                if (wCurrBaoUser == df.INVALID_CHAIR) {
                    //禁用手牌
                    this._gameviewLayer._handCardControl.setAllowOutCardStatus(false);
                    if (wCurrentUser == this._gameFrame.getMeUserItem().wChairID) {
                        if (cbActionMask != 0) {
                            this._gameviewLayer.setOperateNotify(cbActionMask);
                        }
                        else {
                            this._gameviewLayer._handCardControl.setAllowOutCardStatus(!this._bBaoHuFlag);
                        }
                        if (wCurrentUser != df.INVALID_CHAIR) {
                            var viewId = this.switchViewChairID(wCurrentUser);
                            this._gameviewLayer.setGameClock(cmd.sparrowsclm.TIME_OPERATE_CARD, cmd.sparrowsclm.IDI_OPERATE_CARD, viewId);
                        }
                    }
                }
                else {
                    //禁用手牌
                    this._gameviewLayer._handCardControl.setAllowOutCardStatus(false);
                    if (wCurrBaoUser == this._gameFrame.getMeUserItem().wChairID) {
                        this._gameviewLayer.setOperateNotify(cmd.sparrowsclm.WIK_BAO_HU);
                    }
                    var viewId = this.switchViewChairID(wCurrBaoUser);
                    this._gameviewLayer.setGameClock(cmd.sparrowsclm.TIME_BAO_JIAO, cmd.sparrowsclm.IDI_BAO_JIAO, viewId);
                }
            };
            /**托管 */
            GameClientEngine.prototype.onTrustee = function (bTrustee) {
            };
            /**出牌 */
            GameClientEngine.prototype.onOutCard = function (cbCard, special) {
                if (special === void 0) { special = 0; }
                if (this._bTrustee || !this._gameLogic.IsValidCard(cbCard) || this._wCurrBaoUser != df.INVALID_CHAIR)
                    return;
                //判断玩家
                var MyChair = this.getMeChair();
                var wCurrentUser = this._wCurrentUser;
                egret.assert(wCurrentUser == MyChair);
                if (wCurrentUser != MyChair) {
                    console.log("参数错误");
                    return;
                }
                //查找索引
                var outCardIndex = this._gameLogic.SwitchToCardIndex(cbCard);
                if (this._cbCardIndex[outCardIndex] == 0) {
                    return;
                }
                //禁用手牌
                this._gameviewLayer._handCardControl.setAllowOutCardStatus(false);
                //发送数据
                var outBuffer = utils.Memory.newLitteEndianByteArray(df.Len_Tcp_Head);
                outBuffer.Append_Byte(cbCard);
                outBuffer.Append_Byte(special);
                this._gameFrame.sendData(df.MDM_GF_GAME, cmd.sparrowsclm.SUB_C_OUT_CARD, outBuffer);
                //预处理动作
                var action = {};
                action.nKind = this.AK_OUT_CARD;
                action.bTrusteeOut = false;
                action.special = special;
                action.wOutCardUser = MyChair;
                action.cbOutCardData = cbCard;
                action.bSelfOut = true;
                this._actionList.push(action);
                this.beginGameAction();
            };
            /**多项选择 */
            GameClientEngine.prototype.onOperateSelected = function (info) {
                if (this._bTrustee)
                    return;
                if (null != info) {
                    var code = info.cbActionMask;
                    var card = info.cbActionCard;
                    var data = [];
                    data[0] = info.cbActionCard;
                    data[1] = info.cbCardData[0];
                    data[2] = info.cbCardData[1];
                    this._gameviewLayer.onEventUserAction();
                    //禁用手牌
                    this._gameviewLayer._handCardControl.setAllowOutCardStatus(false);
                    if (code != sparrowsclm.WIK_BAO_HU) {
                        if (code == sparrowsclm.WIK_JIA_GANG) {
                            this.onOutCard(card, cmd.sparrowsclm.OUT_CARD_JIA_GANG);
                            return;
                        }
                        else {
                            var buffer = utils.Memory.newLitteEndianByteArray(df.Len_Tcp_Head);
                            buffer.Append_Byte(code);
                            for (var i = 0; i < 3; i++) {
                                buffer.Append_Byte(Number(data[i]));
                            }
                            this._gameFrame.sendData(df.MDM_GF_GAME, cmd.sparrowsclm.SUB_C_OPERATE_CARD, buffer);
                        }
                    }
                    else {
                        var BaoHu = utils.Memory.newLitteEndianByteArray(df.Len_Tcp_Head);
                        BaoHu.Append_Byte(card);
                        BaoHu.Append_Byte(1);
                        this._gameFrame.sendData(df.MDM_GF_GAME, cmd.sparrowsclm.SUB_C_USER_BAO_HU, BaoHu);
                    }
                    this._wCurrentUser = df.INVALID_CHAIR;
                    this._cbActionMask = sparrowsclm.WIK_NULL;
                    this._cbActionCard = 0;
                }
            };
            /**组合操作 */
            GameClientEngine.prototype.onUserAction = function (opreateCode) {
                var myChair = df.INVALID_CHAIR;
                var obj = this;
                if (obj instanceof sparrowsclm.OperateView) {
                    obj = obj._scene._gameEngine;
                    myChair = obj.getMeChair();
                }
                else {
                    myChair = this.getMeChair();
                }
                if (df.TEST_SERVER) {
                    var opResult = new cmd.sparrowsclm.CMD_S_OperateResult();
                    opResult.cbOperateCard = [0x29, 0x29, 0x29];
                    opResult.cbOperateCode = sparrowsclm.WIK_GANG;
                    opResult.cbUserAction = 0x00;
                    opResult.wOperateUser = myChair;
                    opResult.wProvideUser = myChair;
                    obj._wCurrentUser = myChair;
                    var selectInfo = obj.getSelectCardInfo(opreateCode);
                    // let action: any = {}
                    // action.nKind = this.AK_OPERATE_RESULT;
                    // action.result = opResult;
                    // action.wOperateUser = opResult.wOperateUser;		    //操作用户
                    // action.wProvideUser = opResult.wProvideUser;			//供应用户
                    // action.cbOperateCode = opResult.cbOperateCode			//操作代码
                    // action.cbCardData = [];
                    // action.cbCardData[0] = opResult.cbOperateCard[0];
                    // action.cbCardData[1] = opResult.cbOperateCard[0];
                    // action.cbCardData[2] = opResult.cbOperateCard[0];
                    // action.cbUserAction = opResult.cbUserAction;		    //玩家动作
                    // action.cbExcludeCard = opResult.cbExcludeCard;			//排除扑克 
                    // obj.startOperateResult(action);
                    return;
                }
                //上次出牌显示隐藏
                obj._gameviewLayer.userOutCard(df.INVALID_CHAIR);
                if (obj._bTrustee || (myChair == df.INVALID_CHAIR))
                    return;
                //操作界面移除
                obj._gameviewLayer.setOperateNotify();
                if (opreateCode == cmd.sparrowsclm.WIK_BAO_HU) {
                    obj.onBaoHuAction(true);
                    return;
                }
                else if (opreateCode == sparrowsclm.WIK_NULL && (obj._wCurrBaoUser == myChair)) {
                    obj.onBaoHuAction();
                    return;
                }
                var cbOperateCode = opreateCode;
                var cbOperateCard = [0, 0, 0];
                if (sparrowsclm.WIK_NULL == opreateCode) {
                    obj._cbActionCard = 0;
                    obj._cbActionMask = 0;
                    obj._gameviewLayer.onEventUserAction();
                    if (obj._wCurrentUser == df.INVALID_CHAIR) {
                        var Op = utils.Memory.newLitteEndianByteArray(df.Len_Tcp_Head);
                        Op.Append_Byte(cbOperateCode);
                        for (var i = 0; i < 3; i++) {
                            Op.Append_Byte(0);
                        }
                        obj._gameFrame.sendData(df.MDM_GF_GAME, cmd.sparrowsclm.SUB_C_OPERATE_CARD, Op);
                    }
                    else {
                        //激活手牌
                        obj._gameviewLayer._handCardControl.setAllowOutCardStatus(true);
                    }
                    return;
                }
                var searchFinish = false;
                if (opreateCode == sparrowsclm.WIK_CHI_HU) {
                    searchFinish = true;
                }
                else {
                    var selectInfo = obj.getSelectCardInfo(opreateCode);
                    if (selectInfo.length > 0) {
                        if (1 == selectInfo.length) {
                            searchFinish = true;
                            cbOperateCode = selectInfo[0].cbActionMask;
                            cbOperateCard[0] = selectInfo[0].cbActionCard;
                            cbOperateCard[1] = selectInfo[0].cbCardData[0];
                            cbOperateCard[2] = selectInfo[0].cbCardData[1];
                            obj._gameviewLayer.onEventUserAction();
                            obj._gameviewLayer._handCardControl.setAllowOutCardStatus(false);
                        }
                        else {
                            obj._gameviewLayer.onEventUserAction(selectInfo);
                        }
                    }
                    else {
                        egret.assert(false);
                    }
                }
                if (true == searchFinish) {
                    if (cbOperateCode == sparrowsclm.WIK_JIA_GANG) {
                        obj.onOutCard(Number(cbOperateCard[0]), cmd.sparrowsclm.OUT_CARD_JIA_GANG);
                        return;
                    }
                    obj._wCurrentUser = df.INVALID_CHAIR;
                    obj._cbActionMask = 0;
                    obj._cbActionCard = 0;
                    var Op = utils.Memory.newLitteEndianByteArray(df.Len_Tcp_Head);
                    Op.Append_Byte(cbOperateCode);
                    for (var i = 0; i < 3; i++) {
                        Op.Append_Byte(Number(cbOperateCard[i]));
                    }
                    obj._gameFrame.sendData(df.MDM_GF_GAME, cmd.sparrowsclm.SUB_C_OPERATE_CARD, Op);
                }
            };
            //更新番
            GameClientEngine.prototype.onUpdateFanTips = function () {
                this.onShowFanTips(df.INVALID_BYTE);
                if (this._cbChiHuCard[this.getMeChair()] != 0) {
                    this._gameviewLayer.setChiHuTips(false);
                }
                else {
                    this._gameviewLayer.setChiHuTips(true);
                    this._gameviewLayer._handCardControl.setTingCardFlag();
                    for (var i = 0; i < this._FanInfo.length; i++) {
                        var info = this._FanInfo[i];
                        if (info.cbOutCardData != 0xFF && info.cbOutCardData != 0) {
                            this._gameviewLayer._handCardControl.setTingCardFlag(info.cbOutCardData);
                        }
                    }
                }
            };
            //分析番
            GameClientEngine.prototype.onFanAnalysis = function (bAnalyse) {
                if (bAnalyse === void 0) { bAnalyse = false; }
                if (this._cbChiHuCard[this.getMeChair()] != 0)
                    return; //当前玩家不是吃胡玩家
                if (bAnalyse) {
                    this._FanInfo = this._gameLogic.AnalyseTingCard(this._cbCardIndex, this._gameviewLayer._weaveCardControl.getWeaveInfo(cmd.sparrowsclm.MY_VIEW), this._gameviewLayer._weaveCardControl.getWeaveItemCount(cmd.sparrowsclm.MY_VIEW), this._cbDisCardIndex);
                }
                else {
                    //非自己牌型变更只更新剩余张数
                    for (var i = 0; i < this._FanInfo.length; i++) {
                        var info = this._FanInfo[i];
                        for (var j = 0; j < info.cbTingCount; j++) {
                            var cardIndex = this._gameLogic.SwitchToCardIndex(info.cbChiHuCard[j]);
                            var tmpcount = 4 - (Number(this._cbCardIndex[cardIndex]) + Number(this._cbDisCardIndex[cardIndex]));
                            info.cbRemindCount[j] = 0 > tmpcount ? 0 : tmpcount;
                        }
                    }
                }
            };
            /**
             * 显示番数
             * @param index 手牌排列索引
             * @param cbCardData 目标牌
             */
            GameClientEngine.prototype.onShowFanTips = function (index, cbCardData) {
                this._gameviewLayer.showFanTips();
                if (this._FanInfo.length == 0)
                    return;
                if (index == df.INVALID_BYTE || cbCardData == 0 || cbCardData == 0xFF)
                    return;
                for (var i = 0; i < this._FanInfo.length; i++) {
                    var info = this._FanInfo[i];
                    if (info.cbOutCardData == cbCardData) {
                        this._gameviewLayer.showFanTips(index, info);
                        return;
                    }
                }
                this._gameviewLayer.showFanTips();
            };
            //报胡
            GameClientEngine.prototype.onBaoHuAction = function (baohu) {
                if (baohu === void 0) { baohu = false; }
                var MyChair = this.getMeChair();
                var cbCardData = 0;
                if (baohu == true && this._wBankerUser == MyChair) {
                    var selectInfo = this.getSelectCardInfo(sparrowsclm.WIK_BAO_HU);
                    if (1 == selectInfo.length) {
                        cbCardData = selectInfo[0].cbActionCard;
                        this._gameviewLayer.onEventUserAction();
                        this._gameviewLayer._handCardControl.setAllowOutCardStatus(false);
                    }
                    else {
                        this._gameviewLayer.onEventUserAction(selectInfo);
                        return;
                    }
                }
                this._gameviewLayer.onEventUserAction();
                this._gameviewLayer._handCardControl.setAllowOutCardStatus(false);
                //发送消息
                var buffer = utils.Memory.newLitteEndianByteArray(df.Len_Tcp_Head);
                buffer.Append_Byte(cbCardData);
                buffer.Append_BOOL(baohu);
                this._gameFrame.sendData(df.MDM_GF_GAME, cmd.sparrowsclm.SUB_C_USER_BAO_HU, buffer);
            };
            /**提取组合*/
            GameClientEngine.prototype.getSelectCardInfo = function (opreateCode) {
                var selectInfo = [];
                var myChair = this.getMeChair();
                egret.assert(myChair != df.INVALID_CHAIR);
                //碰牌
                if (0 != (opreateCode & cmd.sparrowsclm.WIK_PENG) && this._cbActionCard != 0) {
                    var info = {};
                    info.cbActionCard = this._cbActionCard;
                    info.cbActionMask = cmd.sparrowsclm.WIK_PENG;
                    info.cbCardCount = 2;
                    info.cbCardData = [0, 0];
                    info.cbCardData[0] = this._cbActionCard;
                    info.cbCardData[1] = this._cbActionCard;
                    selectInfo.push(info);
                }
                //杠/加杠
                if (0 != (opreateCode & cmd.sparrowsclm.WIK_JIA_GANG) || 0 != (opreateCode & cmd.sparrowsclm.WIK_GANG)) {
                    if (this._wCurrentUser == myChair) {
                        for (var i = sparrowsclm.MIN_INDEX; i < sparrowsclm.MAX_INDEX; i++) {
                            if (this._cbCardIndex[i] == 1) {
                                var tmpData = this._gameLogic.SwitchToCardData(i);
                                if (null != this._gameviewLayer._weaveCardControl) {
                                    var search = this._gameviewLayer._weaveCardControl.searchWeaveItem(cmd.sparrowsclm.MY_VIEW, opreateCode, tmpData);
                                    if (search.nIndex != -1) {
                                        var info = {};
                                        info.cbActionCard = tmpData;
                                        info.cbActionMask = cmd.sparrowsclm.WIK_JIA_GANG;
                                        info.cbCardCount = 1;
                                        info.cbCardData = [];
                                        info.cbCardData[0] = tmpData;
                                        selectInfo.push(info);
                                    }
                                }
                            }
                            else if (this._cbCardIndex[i] == 4) {
                                var tmpData = this._gameLogic.SwitchToCardData(i);
                                var info = {};
                                info.cbActionCard = tmpData;
                                info.cbActionMask = cmd.sparrowsclm.WIK_GANG;
                                info.cbCardCount = 4;
                                info.cbCardData = [];
                                info[0] = tmpData;
                                info[1] = tmpData;
                                info[2] = tmpData;
                                info[3] = tmpData;
                                selectInfo.push(info);
                            }
                        }
                        //剔除禁杠的牌
                        for (var i = 0; i < this._noGangCardList.length; i++) {
                            for (var j = 0; j < selectInfo.length; j++) {
                                if (selectInfo[j].cbActionCard == this._noGangCardList[i]) {
                                    selectInfo.splice(j, 1);
                                }
                            }
                        }
                    }
                    else if (this._cbActionCard != 0) {
                        var info = {};
                        info.cbActionCard = this._cbActionCard;
                        info.cbActionMask = cmd.sparrowsclm.WIK_GANG;
                        info.cbCardCount = 3;
                        info.cbCardData = [];
                        info[0] = this._cbActionCard;
                        info[1] = this._cbActionCard;
                        info[2] = this._cbActionCard;
                        selectInfo.push(info);
                    }
                }
                //报胡
                if ((opreateCode & cmd.sparrowsclm.WIK_BAO_HU) != 0) {
                    var baohuList = [];
                    baohuList = this._gameLogic.AnalyseBaoOutCard(this._cbCardIndex, this._gameviewLayer._weaveCardControl.getWeaveInfo(cmd.sparrowsclm.MY_VIEW), this._gameviewLayer._weaveCardControl.getWeaveItemCount(cmd.sparrowsclm.MY_VIEW));
                    if (baohuList.length > 0) {
                        for (var i = 0; i < baohuList.length; i++) {
                            var info = {};
                            info.cbActionCard = baohuList[i];
                            info.cbActionMask = sparrowsclm.WIK_BAO_HU;
                            info.cbCardCount = 1;
                            info.cbCardData = [];
                            info.cbCardData[0] = baohuList[i];
                            info.cbCardData[1] = 0;
                            info.cbCardData[2] = 0;
                            selectInfo.push(info);
                        }
                    }
                }
                //请胡
                if ((opreateCode & cmd.sparrowsclm.WIK_QING_HU) != 0) {
                    for (var i = sparrowsclm.MIN_INDEX; i < sparrowsclm.MAX_INDEX; i++) {
                        if (this._cbCardIndex[i] == 1 || this._cbCardIndex[i] == 3) {
                            var tmpData = this._gameLogic.SwitchToCardData(i);
                            var info = {};
                            info.cbActionCard = tmpData;
                            info.cbActionMask = cmd.sparrowsclm.WIK_QING_HU;
                            info.cbCardCount = 1;
                            info.cbCardData = [];
                            info[0] = tmpData;
                            info[1] = 0;
                            info[2] = 0;
                            selectInfo.push(info);
                            break;
                        }
                    }
                }
                return selectInfo;
            };
            /** 触摸事件
            * onTouchBegan
            * onTouchMove
            * onTouchEnd
            */
            GameClientEngine.prototype.onTouchBegan = function (event) {
                //console.log("onTouch Began");
                this._bMoved = false;
            };
            GameClientEngine.prototype.onTouchMove = function (event) {
                //console.log("onTouch move");
                this._bMoved = true;
            };
            GameClientEngine.prototype.onTouchEnd = function (event) {
                //console.log("onTouch end");
            };
            /**返回大厅 */
            GameClientEngine.prototype.onQueryExitGame = function () {
                var _this = this;
                //游戏状态判断
                var msg = this.getGameStatus() == cmd.sparrowsclm.GAME_SCENE_FREE ? "是否确定退出游戏？" : "游戏已经开始，退出将由憨憨机器人代打哦！\n 是否确定退出游戏？";
                managers.FrameManager.getInstance().showDailog(1 /* OK_CANCELL */, msg, function () {
                    managers.FrameManager.getInstance().showPopWait("", 3000);
                    _this.onExitGame();
                });
            };
            /**移除舞台 */
            GameClientEngine.prototype.onExit = function () {
                _super.prototype.onExit.call(this);
                //移除触摸
                this.removeEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onTouchBegan, this);
                this.removeEventListener(egret.TouchEvent.TOUCH_MOVE, this.onTouchMove, this);
                this.removeEventListener(egret.TouchEvent.TOUCH_END, this.onTouchEnd, this);
                //移除通知
                this.removeEventListener(customEvent.CustomEvent.EVENT_USER_ENTER, this.onUserEnter, this);
                this.removeEventListener(customEvent.CustomEvent.EVENT_USER_STATUS, this.onUserStatus, this);
            };
            return GameClientEngine;
        }(models.GameModel));
        sparrowsclm.GameClientEngine = GameClientEngine;
    })(sparrowsclm = game.sparrowsclm || (game.sparrowsclm = {}));
})(game || (game = {}));
