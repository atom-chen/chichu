/**
 * 组合扑克
 */
var game;
(function (game) {
    //组合牌宽度
    var WEAVE_WIDTH = 0;
    //最大组合数
    var MAX_WEAVE_COUNT = 3;
    //组合位置
    var WEAVE_POS = [new egret.Point(10, 525), new egret.Point(99, 440), new egret.Point(-10, 0)];
    //右边玩家
    var RIGHT_USER = 2;
    //左边玩家 
    var LEFT_USER = 1;
    //组合间隔
    var WEAVE_SPACE = [20, 30, 20];
    //纹理数据
    var TEXTURE_DATA = [{ width: 74, height: 100 }, { width: 62, height: 50 }, { width: 62, height: 50 }];
    var sparrowsclm;
    (function (sparrowsclm) {
        var WeaveCard = (function () {
            function WeaveCard(scene) {
                this._weavePanel = [];
                //组合位置偏移
                this._offset = [];
                this._scene = scene;
                this.onInit();
            }
            //初始数据
            WeaveCard.prototype.onInit = function () {
                this._nWeaveCount = utils.allocArray(MAX_WEAVE_COUNT, Number);
                this._nWeaveIndex = utils.allocArray(MAX_WEAVE_COUNT, Number);
                this._weaveInfo = utils.alloc2Array(cmd.sparrowsclm.PLAYER_COUNT, MAX_WEAVE_COUNT, cmd.sparrowsclm.tagWeaveItem);
                for (var i = 0; i < cmd.sparrowsclm.PLAYER_COUNT; i++) {
                    this._weavePanel[i] = this._scene._companet.getChildByName("WeaveCard" + i);
                }
                this._offset = [WEAVE_POS[0].x, WEAVE_POS[1].y, WEAVE_POS[2].y];
            };
            //重置
            WeaveCard.prototype.onRest = function () {
                this._nWeaveCount = [0, 0, 0];
                this._nWeaveIndex = [0, 0, 0];
                this._weaveInfo = null;
                this._weaveInfo = utils.alloc2Array(cmd.sparrowsclm.PLAYER_COUNT, MAX_WEAVE_COUNT, cmd.sparrowsclm.tagWeaveItem);
                this._offset = [WEAVE_POS[0].x, WEAVE_POS[1].y, WEAVE_POS[2].y];
                for (var i = 0; i < cmd.sparrowsclm.PLAYER_COUNT; i++) {
                    this._weavePanel[i] = this._scene._companet.getChildByName("WeaveCard" + i);
                    this._weavePanel[i].removeChildren();
                }
            };
            //组合数目
            WeaveCard.prototype.getWeaveItemCount = function (viewId) {
                return this._nWeaveCount[viewId];
            };
            //组合宽度
            WeaveCard.prototype.getWeaveItemWidth = function (viewId) {
                if (viewId < 0 || viewId >= cmd.sparrowsclm.PLAYER_COUNT)
                    return;
                return WEAVE_SPACE[viewId];
            };
            //偏移位置
            WeaveCard.prototype.getOffsetPos = function (viewId) {
                if (viewId < 0 || viewId >= cmd.sparrowsclm.PLAYER_COUNT)
                    return;
                return this._offset[viewId];
            };
            //获取组合
            WeaveCard.prototype.getWeaveInfo = function (viewId) {
                egret.assert(viewId >= 0 && viewId < cmd.sparrowsclm.PLAYER_COUNT);
                if (viewId < 0 || viewId >= cmd.sparrowsclm.PLAYER_COUNT)
                    return null;
                if (null == this._weaveInfo[viewId])
                    return null;
                return this._weaveInfo[viewId];
            };
            //组合数据
            WeaveCard.prototype.getWeaveItem = function (viewId, nIndex) {
                egret.assert(viewId >= 0 && viewId < cmd.sparrowsclm.PLAYER_COUNT);
                egret.assert(nIndex < MAX_WEAVE_COUNT);
                if (nIndex >= MAX_WEAVE_COUNT)
                    return;
                if (null != this._weaveInfo[viewId][nIndex]) {
                    return this._weaveInfo[viewId][nIndex];
                }
            };
            //组合数据
            WeaveCard.prototype.operateResult = function (viewId, result) {
                egret.assert(result.cbOperateCard[0] > 0);
                if (result.cbOperateCard[0] == 0)
                    return;
                //判断加杠、放杠
                if (result.cbOperateCode & cmd.sparrowsclm.WIK_GANG || result.cbOperateCode & cmd.sparrowsclm.WIK_JIA_GANG) {
                    //放杠
                    if (result.wOperateUser != result.wProvideUser) {
                        var tagWeaveItem = new cmd.sparrowsclm.tagWeaveItem();
                        tagWeaveItem.cbWeaveKind = cmd.sparrowsclm.WIK_GANG;
                        tagWeaveItem.cbPublicCard = 1;
                        tagWeaveItem.cbCenterCard = Number(result.cbOperateCard[0]);
                        tagWeaveItem.wProvideUser = result.wProvideUser;
                        tagWeaveItem.cbCardData[0] = Number(result.cbOperateCard[0]);
                        tagWeaveItem.cbCardData[1] = Number(result.cbOperateCard[0]);
                        tagWeaveItem.cbCardData[2] = Number(result.cbOperateCard[0]);
                        tagWeaveItem.cbCardData[3] = Number(result.cbOperateCard[0]);
                        this._weaveInfo[viewId][this._nWeaveIndex[viewId]] = tagWeaveItem;
                        this.showWeaveItem(viewId, tagWeaveItem);
                        this._nWeaveIndex[viewId]++;
                        this._nWeaveCount[viewId]++;
                        egret.assert(this._nWeaveIndex[viewId] <= MAX_WEAVE_COUNT);
                        return;
                    }
                    //加杠
                    var searchResult = {};
                    searchResult = this.searchWeaveItem(viewId, cmd.sparrowsclm.WIK_PENG, result.cbOperateCard[0]);
                    if (null != searchResult && null != searchResult.weaveItem) {
                        var tagWeaveItem = searchResult.weaveItem;
                        tagWeaveItem.cbWeaveKind = cmd.sparrowsclm.WIK_JIA_GANG;
                        tagWeaveItem.cbPublicCard = 1;
                        tagWeaveItem.wProvideUser = result.wProvideUser;
                        tagWeaveItem.cbCardData[0] = Number(result.cbOperateCard[0]);
                        tagWeaveItem.cbCardData[1] = Number(result.cbOperateCard[0]);
                        tagWeaveItem.cbCardData[2] = Number(result.cbOperateCard[0]);
                        tagWeaveItem.cbCardData[3] = Number(result.cbOperateCard[0]);
                        this._weaveInfo[viewId][this._nWeaveIndex[viewId]] = tagWeaveItem;
                        this.showWeaveItem(viewId, searchResult.weaveItem, searchResult.nIndex);
                        return;
                    }
                }
                //暗杠 碰
                if (null != this._weaveInfo[viewId][this._nWeaveIndex[viewId]] && this._weaveInfo[viewId][this._nWeaveIndex[viewId]].cbCardData[0] == 0) {
                    var tagWeaveItem = new cmd.sparrowsclm.tagWeaveItem();
                    tagWeaveItem.cbWeaveKind = result.cbOperateCode;
                    tagWeaveItem.cbCenterCard = result.cbOperateCard[0];
                    tagWeaveItem.cbPublicCard = (result.cbOperateCode & cmd.sparrowsclm.WIK_GANG) ? 0 : 1;
                    tagWeaveItem.wProvideUser = result.wProvideUser;
                    tagWeaveItem.cbCardData[0] = Number(result.cbOperateCard[0]);
                    tagWeaveItem.cbCardData[1] = Number(result.cbOperateCard[0]);
                    tagWeaveItem.cbCardData[2] = Number(result.cbOperateCard[0]);
                    tagWeaveItem.cbCardData[3] = (result.cbOperateCode & cmd.sparrowsclm.WIK_GANG) ? Number(result.cbOperateCard[0]) : 0;
                    this._weaveInfo[viewId][this._nWeaveIndex[viewId]] = tagWeaveItem;
                    this.showWeaveItem(viewId, tagWeaveItem);
                    this._nWeaveIndex[viewId]++;
                    this._nWeaveCount[viewId]++;
                }
                egret.assert(this._nWeaveIndex[viewId] <= MAX_WEAVE_COUNT);
            };
            /**设置组合 */
            WeaveCard.prototype.setWeaveItem = function (viewId, tagWeaveItem) {
                egret.assert(tagWeaveItem.cbCardData[0] > 0);
                egret.assert(tagWeaveItem.cbWeaveKind != cmd.sparrowsclm.WIK_NULL);
                if (tagWeaveItem.cbCardData[0] == 0 || tagWeaveItem.cbWeaveKind == cmd.sparrowsclm.WIK_NULL)
                    return;
                if (null != this._weaveInfo[viewId][this._nWeaveIndex[viewId]] && this._weaveInfo[viewId][this._nWeaveIndex[viewId]].cbCardData[0] == 0) {
                    this._weaveInfo[viewId][this._nWeaveIndex[viewId]] = tagWeaveItem;
                    this.showWeaveItem(viewId, tagWeaveItem);
                    this._nWeaveIndex[viewId]++;
                    this._nWeaveCount[viewId]++;
                }
                egret.assert(this._nWeaveIndex[viewId] <= MAX_WEAVE_COUNT);
            };
            /**搜索组合 */
            WeaveCard.prototype.searchWeaveItem = function (viewId, cbOperateCode, cbActionData) {
                var searchResult = {};
                searchResult.weaveItem = null;
                searchResult.nIndex = -1;
                for (var i = 0; i < this._weaveInfo[viewId].length; i++) {
                    var item = this._weaveInfo[viewId][i];
                    if (item.cbWeaveKind == sparrowsclm.WIK_PENG && item.cbCenterCard == cbActionData) {
                        searchResult.weaveItem = item;
                        searchResult.nIndex = i;
                        break;
                    }
                }
                return searchResult;
            };
            /**显示组合
             * 碰
             * 杠
             */
            WeaveCard.prototype.showWeaveItem = function (viewId, tagWeaveItem, nShowIndex) {
                if (tagWeaveItem.cbWeaveKind == cmd.sparrowsclm.WIK_NULL)
                    return;
                if ((tagWeaveItem.cbWeaveKind & cmd.sparrowsclm.WIK_GANG) || (tagWeaveItem.cbWeaveKind & cmd.sparrowsclm.WIK_JIA_GANG)) {
                    //杠
                    if (tagWeaveItem.cbPublicCard == 0) {
                        //暗杠
                        this.createWeaveCard(viewId, tagWeaveItem.cbCardData, 4);
                    }
                    else {
                        //明杠
                        if (null != nShowIndex && nShowIndex >= 0 && nShowIndex < MAX_WEAVE_COUNT) {
                            this.createWeaveCard(viewId, [tagWeaveItem.cbCenterCard], 1, nShowIndex);
                        }
                        else {
                            this.createWeaveCard(viewId, tagWeaveItem.cbCardData, 4);
                        }
                    }
                }
                else if (0 != (tagWeaveItem.cbWeaveKind & cmd.sparrowsclm.WIK_PENG)) {
                    //碰
                    this.createWeaveCard(viewId, tagWeaveItem.cbCardData, 3);
                }
            };
            /**创建组合牌 */
            WeaveCard.prototype.createWeaveCard = function (viewId, cbCardsData, nShowCount, nShowIndex) {
                var params = {};
                var textureFile = "";
                switch (viewId) {
                    case cmd.sparrowsclm.MY_VIEW:
                        {
                            textureFile = "game_weave_0_png";
                            params.bSheet = true; //纹理集标识
                            params.src = textureFile;
                            params.key = "weave";
                            params.pos = 1; //麻将资源从1开始 0代表牌背
                            params.width = TEXTURE_DATA[viewId].width;
                            params.height = TEXTURE_DATA[viewId].height;
                        }
                        break;
                    case LEFT_USER:
                        {
                            textureFile = "game_tablecard_h_png";
                            params.bSheet = true; //纹理集标识
                            params.src = textureFile;
                            params.key = "table_1_";
                            params.pos = 1; //麻将资源从1开始 0代表牌背
                            params.width = TEXTURE_DATA[viewId].width;
                            params.height = TEXTURE_DATA[viewId].height;
                        }
                        break;
                    case RIGHT_USER:
                        {
                            textureFile = "game_tablecard_h2_png";
                            params.bSheet = true; //纹理集标识
                            params.src = textureFile;
                            params.key = "table_2_";
                            params.pos = 1; //麻将资源从1开始 0代表牌背
                            params.width = TEXTURE_DATA[viewId].width;
                            params.height = TEXTURE_DATA[viewId].height;
                        }
                        break;
                }
                for (var i = 0; i < nShowCount; i++) {
                    var card = new sparrowsclm.CardSprite(textureFile, Number(cbCardsData[i]), params);
                    if (viewId == LEFT_USER && nShowCount > 1) {
                        if (i < 3) {
                            this._weavePanel[viewId].addChildAt(card, 0);
                        }
                        else {
                            this._weavePanel[viewId].addChild(card);
                        }
                    }
                    else {
                        this._weavePanel[viewId].addChild(card);
                    }
                    card.name = "weave";
                    //暗杠显示牌背 
                    var item = this._weaveInfo[viewId][this._nWeaveIndex[viewId]];
                    if (item.cbPublicCard == 0) {
                        card.updateTexture(0xFF);
                    }
                    //调整位置
                    this.sortWeaveItemPos(viewId, card, i, nShowCount, nShowIndex);
                    //非手牌索引
                    this._scene._gameEngine._cbDisCardIndex[card._nCardLogicIndex] = Number(this._scene._gameEngine._cbDisCardIndex[card._nCardLogicIndex]) + 1;
                }
            };
            /**调整位置
             * @param viewId 玩家视图索引
             * @param card   扑克精灵
             * @param nIndex 当前组合显示索引 0 1 2
             * @param nShowCount 显示张数
             * @param nShowIndex 明杠或放杠此前碰的索引
             */
            WeaveCard.prototype.sortWeaveItemPos = function (viewId, card, nIndex, nShowCount, nShowIndex) {
                //明杠或者放杠
                if (nShowCount == 1 && null != nShowIndex) {
                    egret.assert(nShowIndex < MAX_WEAVE_COUNT);
                    if (nShowIndex >= MAX_WEAVE_COUNT)
                        return;
                    //计算偏移位置
                    var offset = 0;
                    switch (viewId) {
                        case cmd.sparrowsclm.MY_VIEW:
                            {
                                offset = WEAVE_POS[viewId].x + nShowIndex * WEAVE_SPACE[viewId] + nShowIndex * 3 * card.width + card.width;
                            }
                            break;
                        case LEFT_USER:
                            {
                                offset = WEAVE_POS[viewId].y - nShowIndex * WEAVE_SPACE[viewId] - nShowIndex * 3 * 40 - 40;
                            }
                            break;
                        case RIGHT_USER:
                            {
                                offset = WEAVE_POS[viewId].y + nShowIndex * WEAVE_SPACE[viewId] + nShowIndex * 3 * 40 + 40;
                            }
                            break;
                    }
                    card.x = (viewId == cmd.sparrowsclm.MY_VIEW) ? offset : (viewId == LEFT_USER) ? WEAVE_POS[1].x + 2 : WEAVE_POS[2].x + 2;
                    card.y = (viewId == cmd.sparrowsclm.MY_VIEW) ? WEAVE_POS[0].y - 20 : offset - 2;
                    return;
                }
                switch (viewId) {
                    case cmd.sparrowsclm.MY_VIEW:
                        {
                            var weaveCout = this.getWeaveItemCount(viewId);
                            var isAnGang = (nShowCount == 4) ? true : false;
                            var temp = nIndex;
                            if (isAnGang == true) {
                                temp = Math.min(nIndex, 2);
                            }
                            var offset = WEAVE_POS[viewId].x + weaveCout * WEAVE_SPACE[viewId] + weaveCout * 3 * card.width +
                                temp * card.width;
                            card.x = offset - ((nIndex == 3) ? card.width : 0);
                            card.y = WEAVE_POS[viewId].y - ((nIndex == 3) ? 20 : 0);
                            this._offset[viewId] = WEAVE_POS[viewId].x + (weaveCout + 1) * WEAVE_SPACE[viewId] + weaveCout * 3 * card.width +
                                (temp + 1) * card.width;
                        }
                        break;
                    case LEFT_USER:
                        {
                            var weaveCout = this.getWeaveItemCount(viewId);
                            var isAnGang = (nShowCount == 4) ? true : false;
                            var temp = nIndex;
                            if (isAnGang == true) {
                                temp = Math.min(nIndex, 2);
                            }
                            var offset = WEAVE_POS[viewId].y - weaveCout * WEAVE_SPACE[viewId] - weaveCout * 3 * 40 - temp * 40;
                            card.x = WEAVE_POS[viewId].x;
                            card.y = offset + ((nIndex == 3) ? 30 : 0);
                            this._offset[viewId] = WEAVE_POS[viewId].y - (weaveCout + 1) * WEAVE_SPACE[viewId] - weaveCout * 3 * 40 - (temp + 1) * 40;
                        }
                        break;
                    case RIGHT_USER:
                        {
                            var weaveCout = this.getWeaveItemCount(viewId);
                            var isAnGang = (nShowCount == 4) ? true : false;
                            var temp = nIndex;
                            if (isAnGang == true) {
                                temp = Math.min(nIndex, 2);
                            }
                            var offset = WEAVE_POS[viewId].y + weaveCout * WEAVE_SPACE[viewId] + weaveCout * 3 * 40 + temp * 40;
                            card.x = WEAVE_POS[viewId].x;
                            card.y = offset - ((nIndex == 3) ? 40 : 0);
                            this._offset[viewId] = WEAVE_POS[viewId].y + (weaveCout + 1) * WEAVE_SPACE[viewId] + weaveCout * 3 * 40 + (temp + 1) * 40;
                        }
                        break;
                }
            };
            /**显示组合
             * 游戏结束
             */
            WeaveCard.prototype.showPublicCards = function () {
                //查找暗杠
                for (var i = 0; i < cmd.sparrowsclm.PLAYER_COUNT; i++) {
                    for (var j = 0; j < MAX_WEAVE_COUNT; j++) {
                        if (this._weaveInfo[i][j].cbPublicCard == 0) {
                        }
                    }
                }
            };
            /**内存回收 */
            WeaveCard.prototype.dealloc = function () {
                for (var i = 0; i < cmd.sparrowsclm.PLAYER_COUNT; i++) {
                    this._weavePanel[i] = null;
                }
                this._weavePanel = null;
            };
            return WeaveCard;
        }());
        sparrowsclm.WeaveCard = WeaveCard;
    })(sparrowsclm = game.sparrowsclm || (game.sparrowsclm = {}));
})(game || (game = {}));
