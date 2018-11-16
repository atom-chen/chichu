/**
 * 游戏逻辑
 */
namespace game {
    export namespace sparrowsclm {
        const CardsData: number[] = [
            0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19,						//索子
            0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19,						//索子
            0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19,						//索子
            0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19,						//索子
            0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29,						//同子
            0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29,						//同子
            0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29,						//同子
            0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29,                       //同子
        ];

        /////////////////////////////////////////////////////////////////////////

        //逻辑掩码

        export const MASK_COLOR = 0xF0								//花色掩码
        export const MASK_VALUE = 0x0F								//数值掩码

        export const MAX_INDEX = 27                                //最大索引
        export const MIN_INDEX = 9
        export const MAX_COUNT = 11
        export const MAX_WEAVE = 3
        export const MAX_HUA_CARD = 0

        //////////////////////////////////////////////////////////////////////////
        //动作定义

        //动作标志
        export const WIK_NULL = 0x00								//没有类型
        export const WIK_LEFT = 0x01								//左吃类型
        export const WIK_PENG = 0x02								//碰牌类型
        export const WIK_GANG = 0x04								//杠牌类型
        export const WIK_JIA_GANG = 0x08                                //杠牌类型
        export const WIK_BAO_HU = 0x10								//报胡类型
        export const WIK_QING_HU = 0x20                                //请胡类型 
        export const WIK_CHI_HU = 0x40                                //吃胡类型

        //扩展动作
        export const WIK_EX_CHI_BAO_HU = 0x0001                              //抓胡类型  
        export const WIK_EX_CHI_QING_HU = 0x0002                              //抓胡类型  
        export const WIK_EX_TIAN_HU = 0x0100                              //天胡类型  
        export const WIK_EX_DI_HU = 0x0200                              //地胡类型
        export const WIK_EX_FANG_PAO = 0x0400                              //放炮动作
        export const WIK_EX_CHI_HU = 0x0800                              //吃胡动作                
        export const WIK_EX_ZIMO = 0x1000                              //自摸动作
        export const WIK_EX_GANG_PAO = 0x2000                              //杠上炮
        export const WIK_EX_GANG_KAI = 0x4000                              //杠上花
        export const WIK_EX_QING_HU = 0x8000                              //请胡类型 

        //听牌类型
        export const TING_KIND_NONE = 0x00								//听牌类型
        export const TING_KIND_NORMAL = 0x01								//听牌类型
        export const TING_KIND_WUDUI = 0x02								//听牌类型

        //////////////////////////////////////////////////////////////////////////
        //胡牌定义

        //胡牌牌型
        export const CHR_PING_HU = 0x00000001						//平胡
        export const CHR_DUI_DUI_HU = 0x00000002						//对对胡
        export const CHR_QING_DUI = 0x00000004                        //清对对
        export const CHR_JIANG_DUI = 0x00000008                        //将对对
        export const CHR_QING_YI_SE = 0x00000010						//清一色
        export const CHR_WU_DUI = 0x00000020						//五小对
        export const CHR_QING_WU_DUI = 0x00000040						//清五对
        export const CHR_LONG_WU_DUI = 0x00000100						//龙五对
        export const CHR_QLONG_WU_DUI = 0x00000200						//清龙五对
        export const CHR_TAKE_YI_JIU = 0x00001000						//带幺九
        export const CHR_DUI_TAKE_YI_JIU = 0x00002000						//对对胡带幺九
        export const CHR_QING_TAKE_YI_JIU = 0x00008000						//清幺九
        export const CHR_TIAN_HU = 0x00010000                        //天胡
        export const CHR_DI_HU = 0x00020000                        //地胡 

        //加倍项
        export const CHR_BREAK_YI_JIU = 0x00100000						 //断幺九 
        export const CHR_GANG_KAI = 0x00200000                         //杠上花
        export const CHR_GANG_PAO = 0x00400000                         //杠上炮
        export const CHR_QIANG_GANG = 0x00800000                         //抢杠 
        export const CHR_HAI_DI_LAO = 0x01000000                         //海底捞
        export const CHR_HAI_DI_PAO = 0x02000000                         //海底炮
        export const CHR_BAO_JIAO = 0x04000000                         //报叫
        //////////////////////////////////////////////////////////////////////////
        class tagKindItem {
            public cbWeaveKind: number = 0;						//组合类型
            public cbCenterCard: number = 0;					//中心扑克
            public cbValidIndex: number[] = [];					//实际扑克索引
        }

        class tagAnalyseItem {
            public cbCardEye: number = 0;							//牌眼扑克
            public cbWeaveKind: number[] = [0, 0, 0];				//组合类型
            public cbCenterCard: number[] = [0, 0, 0];			    //中心扑克
            public cbCardData = utils.alloc2Array<Number>(MAX_WEAVE, 4, Number);//实际扑克
        }

        export class TingCardInfo {
            public cbTingCount: number = 0; //听牌数目
            public cbChiHuFan: any[] = []; //吃胡番数
            public cbChiHuCard: any[] = []; //吃胡数据
            public cbRemindCount: any[] = []; //剩余张数
            public cbOutCardData: number = 0xff;
        }
        export class GameLogic {

            public GetCardValue(cbCardData: number): number {
                let cbValue = 0;
                return cbValue = (cbCardData & MASK_VALUE);
            }

            public GetCardColor(cbCardData: number): number {
                let cbColor = 0;
                return cbColor = (cbCardData & MASK_COLOR) >> 4;
            }

            //校验数据
            public IsValidCard(cbCardData): boolean {
                const cbValue = (cbCardData & MASK_VALUE);
                const cbColor = (cbCardData & MASK_COLOR) >> 4;
                return (((cbValue >= 1) && (cbValue <= 9) && (cbColor <= 2)) || ((cbValue >= 1) && (cbValue <= 0x0f) && (cbColor == 3)));
            }

            //删除扑克
            public RemoveCard(cbCardIndex: any[], cbRemoveCard: any[]) {
                //删除扑克
                for (let i = 0; i < cbRemoveCard.length; i++) {
                    //效验扑克
                    egret.assert(this.IsValidCard(cbRemoveCard[i]));
                    egret.assert(cbCardIndex[this.SwitchToCardIndex(cbRemoveCard[i])] > 0);

                    //删除扑克
                    let cbRemoveIndex = this.SwitchToCardIndex(cbRemoveCard[i]);
                    if (cbCardIndex[cbRemoveIndex] == 0) {
                        //错误断言
                        egret.assert(false);

                        //还原删除
                        for (let j = 0; j < i; j++) {
                            egret.assert(this.IsValidCard(cbRemoveCard[j]));
                            cbCardIndex[this.SwitchToCardIndex(cbRemoveCard[j])]++;
                        }

                        return false;
                    }
                    else {
                        //删除扑克
                        --cbCardIndex[cbRemoveIndex];
                    }
                }

                return true;
            }

            //扑克转换
            public SwitchToCardData(cbCardIndex: number) {
                egret.assert(cbCardIndex < MAX_INDEX);
                if (cbCardIndex < 27)
                    return ((cbCardIndex / 9) << 4) | (cbCardIndex % 9 + 1);
                else return (0x30 | (cbCardIndex - 27 + 1));
            }

            //扑克转换
            public SwitchToCardDatas(cbCardIndex: any[], cbCardData: any[]) {
                //转换扑克
                let cbPosition = 0;
                for (let i = MIN_INDEX; i < MAX_INDEX; i++) {
                    if (cbCardIndex[i] != 0) {
                        for (let j = 0; j < cbCardIndex[i]; j++) {
                            egret.assert(cbPosition < MAX_COUNT);
                            cbCardData[cbPosition++] = this.SwitchToCardData(i);
                        }
                    }
                }

                return cbPosition;
            }

            //扑克转换
            public SwitchToCardIndex(cbCardData: number) {
                let cbCardIndex: number = 0;
                return cbCardIndex = ((cbCardData & MASK_COLOR) >> 4) * 9 + (cbCardData & MASK_VALUE) - 1;
            }

            public SwitchToCardIndexs(cbCardData: any[], cbCardCount: number, cbCardIndex: any[]) {
                //转换扑克
                let cbPos: number = 0;
                for (let i = 0; i < cbCardCount; i++) {
                    egret.assert(this.IsValidCard(cbCardData[i]));
                    cbCardIndex[this.SwitchToCardIndex(cbCardData[i])]++;
                    cbPos++;
                }
                egret.assert(cbPos <= MAX_COUNT);
                return cbCardCount;
            }

            //排序,根据牌值排序
            public SortCardList(cbCardData: any[], cbCardCount: number) {
                //数目过虑
                if (cbCardCount == 0 || cbCardCount > cmd.sparrowsclm.MAX_COUNT) return false;

                //排序操作
                let bSorted: boolean = true;
                let cbSwitchData = 0, cbLast = cbCardCount - 1;
                do {
                    bSorted = true;
                    for (let i = 0; i < cbLast; i++) {
                        if (cbCardData[i] > cbCardData[i + 1]) {
                            //设置标志
                            bSorted = false;

                            //扑克数据
                            cbSwitchData = cbCardData[i];
                            cbCardData[i] = cbCardData[i + 1];
                            cbCardData[i + 1] = cbSwitchData;
                        }
                    }
                    cbLast--;
                } while (bSorted == false);

                return true;
            }

            //扑克数目
            public GetCardCount(cbCardIndex: any[]) {
                //数目统计
                let cbCardCount: number = 0;
                for (let i = MIN_INDEX; i < MAX_INDEX; i++)
                    cbCardCount += cbCardIndex[i];

                return cbCardCount;
            }

            //权位过滤
            public FiltrateRight(chr: CChiHuRight) {
                /*	组合权位  */

                //清对对
                if (chr.LogicAnd(CHR_QING_YI_SE) && chr.LogicAnd(CHR_DUI_DUI_HU)) {
                    chr.OrAssignment(CHR_QING_DUI);
                    chr.AndAssignment(~CHR_QING_YI_SE);
                    chr.AndAssignment(~CHR_DUI_DUI_HU);
                }

                //清幺九
                if (chr.LogicAnd(CHR_QING_YI_SE) && chr.LogicAnd(CHR_TAKE_YI_JIU)) {
                    chr.OrAssignment(CHR_QING_TAKE_YI_JIU);
                    chr.AndAssignment(~CHR_QING_YI_SE);
                    chr.AndAssignment(~CHR_TAKE_YI_JIU);
                }
            }

            //胡牌等级
            public GetChiHuActionRank(ChiHuRight: CChiHuRight) {
                let wFanShu = 0;

                //平胡
                if (ChiHuRight.LogicAnd(CHR_PING_HU))
                    wFanShu = 1;
                //对对胡
                if (ChiHuRight.LogicAnd(CHR_DUI_DUI_HU))
                    wFanShu = 2;
                //清一色
                if (ChiHuRight.LogicAnd(CHR_QING_YI_SE))
                    wFanShu = 3;
                //五对
                if (ChiHuRight.LogicAnd(CHR_WU_DUI))
                    wFanShu = 3;
                //清对对
                if (ChiHuRight.LogicAnd(CHR_QING_DUI))
                    wFanShu = 4;
                //龙五对
                if (ChiHuRight.LogicAnd(CHR_LONG_WU_DUI))
                    wFanShu = 4;
                //带幺九
                if (ChiHuRight.LogicAnd(CHR_TAKE_YI_JIU))
                    wFanShu = 5;
                //清五对
                if (ChiHuRight.LogicAnd(CHR_QING_WU_DUI))
                    wFanShu = 5;
                //将对对
                if (ChiHuRight.LogicAnd(CHR_JIANG_DUI))
                    wFanShu = 6;
                //清龙五对
                if (ChiHuRight.LogicAnd(CHR_QLONG_WU_DUI))
                    wFanShu = 6;
                //对对胡带幺九
                if (ChiHuRight.LogicAnd(CHR_DUI_TAKE_YI_JIU))
                    wFanShu = 6;
                //清幺九
                if (ChiHuRight.LogicAnd(CHR_QING_TAKE_YI_JIU))
                    wFanShu = 6;
                //天胡
                if (ChiHuRight.LogicAnd(CHR_TIAN_HU))
                    wFanShu = 6;
                //地胡
                if (ChiHuRight.LogicAnd(CHR_DI_HU))
                    wFanShu = 6;

                //加番-抢杠
                if (ChiHuRight.LogicAnd(CHR_QIANG_GANG))
                    ++wFanShu;
                //加番-杠上花
                if (ChiHuRight.LogicAnd(CHR_GANG_KAI))
                    ++wFanShu;
                //加番-杠上炮
                if (ChiHuRight.LogicAnd(CHR_GANG_PAO))
                    ++wFanShu;
                //加番-海底捞
                if (ChiHuRight.LogicAnd(CHR_HAI_DI_LAO))
                    ++wFanShu;
                //加番-海底炮
                if (ChiHuRight.LogicAnd(CHR_HAI_DI_PAO))
                    ++wFanShu;
                //加番-断幺九
                if (ChiHuRight.LogicAnd(CHR_BREAK_YI_JIU))
                    ++wFanShu;
                //加番-报叫
                if (ChiHuRight.LogicAnd(CHR_BAO_JIAO))
                    wFanShu += 2;

                //加番-根数目
                wFanShu += ChiHuRight.m_cbGengCount;
                //加番-456夹
                wFanShu += ChiHuRight.m_cbQiaCount;

                return wFanShu;
            }

            //听牌分析
            public AnalyseTingCard(cbCardIndex: any[], WeaveItem: any[], cbWeaveCount: number,cbDisCardIndex: any[]) {

                //分析队列
                let TingCardArray: TingCardInfo[] = [];
                let ChiHuRight = new CChiHuRight();
                if (this.GetCardCount(cbCardIndex) + cbWeaveCount * 3 == MAX_COUNT - 1) {
                    //扑克轮询
                    let tingInfo = new TingCardInfo();
                    for (let i = MIN_INDEX; i < MAX_INDEX; i++) {
                        let cbCurrentCard: number = this.SwitchToCardData(i);
                        let analyse = this.AnalyseChiHuCard(cbCardIndex, WeaveItem, cbWeaveCount, cbCurrentCard, ChiHuRight, false, false);
                        if (analyse.kind == WIK_CHI_HU) {

                            tingInfo.cbChiHuCard[tingInfo.cbTingCount] = cbCurrentCard;
                            tingInfo.cbChiHuFan[tingInfo.cbTingCount] = 6 > analyse.fan ? analyse.fan : 6;
                            let temp = 4 - cbCardIndex[i] - cbDisCardIndex[i]; 
                            tingInfo.cbRemindCount[tingInfo.cbTingCount] = 0 < temp ? temp : 0;
                            tingInfo.cbTingCount++;
                        }
                    }

                    if (tingInfo.cbTingCount > 0) {
                        TingCardArray.push(tingInfo);
                    }
                } else {
                    //变量定义
                    let cbTempCardIndex = utils.allocArray<Number>(MAX_INDEX, Number);
                    for (let i = MIN_INDEX; i < MAX_INDEX; i++) {
                        cbTempCardIndex[i] = cbCardIndex[i];
                    }

                    for (let i = MIN_INDEX; i < MAX_INDEX; i++) {
                        if (cbTempCardIndex[i] == 0) continue;
                        cbTempCardIndex[i] = Number(cbTempCardIndex[i]) - 1;

                        let tingInfo = new TingCardInfo();
                        for (let j = MIN_INDEX; j < MAX_INDEX; j++) {
                            if (i != j) {
                                let cbCurrentCard = this.SwitchToCardData(j);
                                let analyse = this.AnalyseChiHuCard(cbTempCardIndex, WeaveItem, cbWeaveCount, cbCurrentCard, ChiHuRight, false, false);
                                if (analyse.kind == WIK_CHI_HU) {
                                    tingInfo.cbChiHuCard[tingInfo.cbTingCount] = cbCurrentCard;
                                    tingInfo.cbChiHuFan[tingInfo.cbTingCount] = 6 > analyse.fan ? analyse.fan : 6;
                                    let temp = 4 - cbCardIndex[j] - cbDisCardIndex[i]; 
                                    tingInfo.cbRemindCount[tingInfo.cbTingCount] = 0 < temp ? temp : 0;
                                    tingInfo.cbTingCount++;
                                }
                            }
                        }

                        if (tingInfo.cbTingCount > 0) {
                            tingInfo.cbOutCardData = this.SwitchToCardData(i);
                            TingCardArray.push(tingInfo);
                        }

                        cbTempCardIndex[i] = Number(cbTempCardIndex[i]) + 1;
                    }
                }

                return TingCardArray;
            }
            //请胡分析
            public AnalyseQingCard(cbCardIndex: any[], cbCurrentCard: number) {
                //变量定义
                let cbCardIndexTemp = utils.allocArray<Number>(MAX_INDEX, Number);
                for (let i = MIN_INDEX; i < MAX_INDEX; i++) {
                    cbCardIndexTemp[i] = cbCardIndex[i];
                }
                cbCardIndexTemp[this.SwitchToCardIndex(cbCurrentCard)] = Number(cbCardIndexTemp[this.SwitchToCardIndex(cbCurrentCard)]) + 1;

                //五对分析
                let bQingWuDui: boolean;
                let cbGengCount = 0, cbYiJiuCount = 0;
                if (this.IsWuDui(cbCardIndexTemp, cbCurrentCard, bQingWuDui, cbGengCount, cbYiJiuCount) == true) {
                    return WIK_QING_HU;
                }

                return WIK_NULL;
            }

            //报牌分析
            public AnalyseBaoOutCard(cbCardIndex: any[], WeaveItem: any[], cbWeaveCount: number) {
                //设置变量
                let CanOutCardArray: number[] = [];

                //定义变量
                let cbCardIndexTemp = utils.allocArray<Number>(MAX_INDEX, Number);
                for (let i = MIN_INDEX; i < MAX_INDEX; i++) {
                    cbCardIndexTemp[i] = cbCardIndex[i];
                }

                //轮询手中的牌
                for (let i = MIN_INDEX; i < MAX_INDEX; i++) {
                    if (cbCardIndexTemp[i] == 0) continue;

                    //删除扑克
                    cbCardIndexTemp[i] = Number(cbCardIndexTemp[i]) - 1;

                    let cbChiHuCardDataCount: number = 0;
                    for (let j = MIN_INDEX; j < MAX_INDEX; j++) {
                        let cbCurrentCard: number = this.SwitchToCardData(j);

                        //分析扑克
                        cbCardIndexTemp[j] = Number(cbCardIndexTemp[j]) + 1;

                        let AnalyseItemArray: any[] = [];
                        this.AnalyseCard(cbCardIndexTemp, WeaveItem, cbWeaveCount, AnalyseItemArray);
                        cbCardIndexTemp[j] = Number(cbCardIndexTemp[j]) - 1;

                        //胡牌分析
                        let len: number = AnalyseItemArray.length;
                        cbChiHuCardDataCount += len;
                    }
                    if (cbChiHuCardDataCount > 0) CanOutCardArray.push(this.SwitchToCardData(utils.MathUtils.getUnsignedByte(i)));

                    //添加扑克
                    cbCardIndexTemp[i] = Number(cbCardIndexTemp[i]) + 1;
                }

                //统计对子数
                let cbDuiCount: number = 0;
                for (let i = MIN_INDEX; i < MAX_INDEX; i++) cbDuiCount += Math.floor(cbCardIndex[i] / 2);

                //四对即可报请
                if (cbDuiCount >= 4) {
                    for (let cbIndex = MIN_INDEX; cbIndex < MAX_INDEX; ++cbIndex) {
                        if (cbCardIndex[cbIndex] % 2 == 1) {
                            //变量定义
                            let cbCardData = this.SwitchToCardData(cbIndex);
                            let bCardExits: boolean = false;
                            for (let nOutCount = 0; nOutCount < CanOutCardArray.length; ++nOutCount) {
                                if (cbCardData == CanOutCardArray[nOutCount]) {
                                    bCardExits = true;
                                    break;
                                }
                            }

                            //添加出牌
                            if (bCardExits == false) CanOutCardArray.push(cbCardData);
                        }
                    }
                }

                return CanOutCardArray;
            }


            //获取组合
            public GetWeaveCard(cbWeaveKind: number, cbCenterCard: number, cbCardBuffer: any[], bOrder: boolean = true) {
                //组合扑克
                switch (cbWeaveKind) {
                    case WIK_LEFT:		//上牌操作
                        {
                            //设置变量
                            cbCardBuffer[0] = cbCenterCard;
                            cbCardBuffer[1] = cbCenterCard + 1;
                            cbCardBuffer[2] = cbCenterCard + 2;

                            return 3;
                        }
                    case WIK_PENG:		//碰牌操作
                        {
                            //设置变量
                            cbCardBuffer[0] = cbCenterCard;
                            cbCardBuffer[1] = cbCenterCard;
                            cbCardBuffer[2] = cbCenterCard;

                            return 3;
                        }
                    case WIK_GANG:		//杠牌操作
                    case WIK_JIA_GANG:	//杠牌操作
                        {
                            //设置变量
                            cbCardBuffer[0] = cbCenterCard;
                            cbCardBuffer[1] = cbCenterCard;
                            cbCardBuffer[2] = cbCenterCard;
                            cbCardBuffer[3] = cbCenterCard;

                            return 4;
                        }
                    default:
                        {
                            egret.assert(false);
                        }
                }

                return 0;
            }

            //五对
            public IsWuDui(cbCardIndex: any[], cbCurrentCard: number, bQingWuDui: boolean, cbGengCount: number, cbYiJiuCount: number) {
                //参数校验
                if (this.GetCardCount(cbCardIndex) < MAX_COUNT - 1) return false;

                //设置变量	
                bQingWuDui = true;
                cbGengCount = 0;
                cbYiJiuCount = 0;

                //变量定义
                let cbCardColor = 0xff;
                let cbDuiCount = 0;
                for (let i = MIN_INDEX; i < MAX_INDEX; i++) {
                    if (cbCardIndex[i] <= 1) continue;

                    //暗杠
                    if (cbCardIndex[i] == 4)++cbGengCount;

                    //幺九
                    if (cbCardIndex[i] >= 2 && (i % 9 == 0 || i % 9 == 8))
                        cbYiJiuCount += cbCardIndex[i] / 2;

                    //记录花色
                    if (cbCardColor == 0xff)
                        cbCardColor = i / 9;
                    else if (cbCardColor != i / 9)
                        bQingWuDui = false;

                    //计算对子
                    cbDuiCount += cbCardIndex[i] / 2;
                }

                return cbDuiCount == 5;
            }

            //根数目
            public GetGengCount(cbCardIndex: any[], WeaveItem: any[], cbItemCount: number) {
                //变量定义
                let cbTempCardIndex = utils.allocArray<Number>(MAX_INDEX, Number);

                //组合转换
                for (let i = 0; i < cbItemCount; i++) {
                    let cbCardCount = WeaveItem[i].cbWeaveKind == WIK_GANG ? 4 : 3;
                    for (let j = 0; j < cbCardCount; j++) {
                        let cbIndex = this.SwitchToCardIndex(WeaveItem[i].cbCardData[j]);
                        if (cbIndex < MAX_INDEX) {
                            cbTempCardIndex[cbIndex] = Number(cbTempCardIndex[cbIndex]) + 1;
                        }
                    }
                }

                //统计根数目
                let cbGengCount = 0;
                for (let i = MIN_INDEX; i < MAX_INDEX; i++) {
                    if (cbCardIndex[i] + cbTempCardIndex[i] == 4)++cbGengCount;
                }

                return cbGengCount;
            }

            //幺九数目
            public GetYiJiuCount(pAnalyseItem: tagAnalyseItem) {
                //变量定义
                let cbYiJiuCount = 0;

                //组合牌
                for (let i = 0; i < MAX_WEAVE; i++) {
                    //幺九判断
                    if ((pAnalyseItem.cbWeaveKind[i] & WIK_LEFT) != 0) {
                        if ((pAnalyseItem.cbCenterCard[i] & MASK_VALUE) == 1 || (pAnalyseItem.cbCenterCard[i] & MASK_VALUE) == 7)
                            ++cbYiJiuCount;
                    }
                    else {
                        if ((pAnalyseItem.cbCenterCard[i] & MASK_VALUE) == 1 || (pAnalyseItem.cbCenterCard[i] & MASK_VALUE) == 9)
                            ++cbYiJiuCount;
                    }
                }

                //将头
                if ((pAnalyseItem.cbCardEye & MASK_VALUE) == 1 || (pAnalyseItem.cbCardEye & MASK_VALUE) == 9)
                    ++cbYiJiuCount;

                return cbYiJiuCount;
            }

            //掐数目
            public GetQiaCount(pAnalyseItem: tagAnalyseItem, cbCurrentCard: number, bZiMo: boolean) {
                if (!bZiMo && (cbCurrentCard & MASK_VALUE) != 5) return 0;

                //变量定义
                let cbQiaCount = 0;
                for (let i = 0; i < MAX_WEAVE; i++) {
                    if ((pAnalyseItem.cbWeaveKind[i] & WIK_LEFT) == 0) continue;
                    if (bZiMo == true) {
                        if (((pAnalyseItem.cbCenterCard[i] + 1) & MASK_VALUE) == 5)
                            ++cbQiaCount;
                    }
                    else {
                        if (pAnalyseItem.cbCenterCard[i] + 1 == cbCurrentCard)
                            return 1;
                    }
                }

                return cbQiaCount;
            }

            //清一色
            public IsQingYiSe(pAnalyseItem: tagAnalyseItem) {
                //参数校验
                if (pAnalyseItem == null) return false;

                //变量定义
                let cbCardColor = pAnalyseItem.cbCardEye & MASK_COLOR;
                for (let i = 0; i < MAX_WEAVE; i++) {
                    if ((pAnalyseItem.cbCenterCard[i] & MASK_COLOR) != cbCardColor) return false;
                }

                return true;
            }

            //大对胡
            public IsDaDuiHu(pAnalyseItem: tagAnalyseItem, bJiangDui: boolean) {
                //参数校验
                if (pAnalyseItem == null) return false;

                //变量设置
                bJiangDui = true;

                //检查牌眼
                if ((pAnalyseItem.cbCardEye & MASK_VALUE) % 3 != 2) bJiangDui = false;

                //变量定义
                for (let i = 0; i < MAX_WEAVE; i++) {
                    //类型判断
                    if ((pAnalyseItem.cbWeaveKind[i] & (WIK_PENG | WIK_GANG)) == 0) return false;

                    //将对判断
                    if (bJiangDui) {
                        if ((pAnalyseItem.cbCenterCard[i] & MASK_VALUE) % 3 != 2)
                            bJiangDui = false;
                    }
                }

                return true;
            }

            //吃胡分析
            public AnalyseChiHuCard(cbCardIndex: any[], WeaveItem: any[], cbWeaveCount: number, cbCurrentCard: number, ChiHuRight: CChiHuRight, bZiMo: boolean, bQingHu: boolean = false) {
                //变量定义
                let wChiHuKind: number = WIK_NULL;
                let AnalyseItemArray: tagAnalyseItem[] = [];

                //设置变量
                ChiHuRight.SetEmpty();

                //构造扑克
                let cbCardIndexTemp = utils.allocArray<Number>(MAX_INDEX, Number);
                //拷贝
                for (let i = MIN_INDEX; i < MAX_INDEX; i++) {
                    cbCardIndexTemp[i] = cbCardIndex[i];
                }

                //cbCurrentCard一定不为0			!!!!!!!!!
                egret.assert(cbCurrentCard != 0);
                if (cbCurrentCard == 0) return { kind: WIK_NULL, fan: 0 };

                //插入扑克
                if (cbCurrentCard != 0)
                    cbCardIndexTemp[this.SwitchToCardIndex(cbCurrentCard)] = Number(cbCardIndexTemp[this.SwitchToCardIndex(cbCurrentCard)]) + 1;

                //五对分析
                let bQingWuDui: boolean = false;
                let cbGengCount = 0, cbYiJiuCount = 0;
                if (bQingHu && this.IsWuDui(cbCardIndexTemp, cbCurrentCard, bQingWuDui, cbGengCount, cbYiJiuCount)) {
                    //清五对
                    if (bQingWuDui) {
                        ChiHuRight.OrAssignment(CHR_QING_WU_DUI);
                    }

                    //龙五对
                    if (cbGengCount > 0) {
                        ChiHuRight.OrAssignment(CHR_LONG_WU_DUI);
                        ChiHuRight.m_cbGengCount = cbGengCount - 1;
                    }

                    //五对
                    if (ChiHuRight.IsEmpty() == true)
                        ChiHuRight.OrAssignment(CHR_WU_DUI);


                    //断幺九
                    if (cbYiJiuCount == 0) ChiHuRight.OrAssignment(CHR_BREAK_YI_JIU);
                }

                //分析扑克
                if (ChiHuRight.IsEmpty()) {
                    this.AnalyseCard(cbCardIndexTemp, WeaveItem, cbWeaveCount, AnalyseItemArray);
                }

                //胡牌分析
                let wMaxFanShu = 0, wCurrFanShu = 0;
                if (AnalyseItemArray.length > 0) {
                    //变量定义
                    let cbGengCount = this.GetGengCount(cbCardIndexTemp, WeaveItem, cbWeaveCount);

                    //牌型分析
                    for (let i = 0; i < AnalyseItemArray.length; i++) {
                        //变量定义
                        let pAnalyseItem: tagAnalyseItem = AnalyseItemArray[i];
                        let TempChr = new CChiHuRight();
                        TempChr.SetEmpty();
                        let cbYiJiuCount = this.GetYiJiuCount(pAnalyseItem);

                        //--基本牌型--//

                        //清一色
                        if (this.IsQingYiSe(pAnalyseItem) == true)
                            TempChr.OrAssignment(CHR_QING_YI_SE);

                        //大对胡
                        let bJiangDui: boolean = false;
                        if (this.IsDaDuiHu(pAnalyseItem, bJiangDui) == true) {
                            //将对对
                            if (bJiangDui)
                                TempChr.OrAssignment(CHR_JIANG_DUI);
                            //对对胡
                            else
                                TempChr.OrAssignment(CHR_DUI_DUI_HU);
                        }

                        //平胡
                        if (TempChr.IsEmpty())
                            TempChr.OrAssignment(CHR_PING_HU);

                        //--基本牌型--//

                        //带幺九
                        if (cbYiJiuCount == 4)
                            TempChr.OrAssignment(CHR_TAKE_YI_JIU);

                        //断幺九
                        if (cbYiJiuCount == 0)
                            TempChr.OrAssignment(CHR_BREAK_YI_JIU);

                        //根数目
                        TempChr.m_cbGengCount = cbGengCount;

                        //掐数目
                        TempChr.m_cbQiaCount = this.GetQiaCount(pAnalyseItem, cbCurrentCard, bZiMo);

                        //调整权限
                        this.FiltrateRight(TempChr);
                        wCurrFanShu = this.GetChiHuActionRank(TempChr);
                        if (wCurrFanShu > wMaxFanShu) {
                            wMaxFanShu = wCurrFanShu;
                            ChiHuRight.Assignment(TempChr);
                        }
                    }
                }

                if (!ChiHuRight.IsEmpty()) wChiHuKind = WIK_CHI_HU;

                return { kind: wChiHuKind, fan: wCurrFanShu };
            }

            //分析扑克
            public AnalyseCard(cbCardIndex: any[], WeaveItem: cmd.sparrowsclm.tagWeaveItem[], cbWeaveCount: number, AnalyseItemArray: any[]) {

                //计算数目
                const cbCardCount = this.GetCardCount(cbCardIndex);

                //效验数目+*
                egret.assert((cbCardCount >= 2) && (cbCardCount <= MAX_COUNT) && ((cbCardCount - 2) % 3 == 0));
                if ((cbCardCount < 2) || (cbCardCount > MAX_COUNT) || ((cbCardCount - 2) % 3 != 0))
                    return false;

                //变量定义
                let cbKindItemCount = 0;
                let KindItem = utils.allocArray<tagKindItem>(27 * 2 + 28, tagKindItem);

                //需求判断
                let cbLessKindItem = Math.floor((cbCardCount - 2) / 3);
                egret.assert((cbLessKindItem + cbWeaveCount) == MAX_WEAVE);

                //单吊判断
                if (cbLessKindItem == 0) {
                    //效验参数
                    egret.assert((cbCardCount == 2) && (cbWeaveCount == MAX_WEAVE));

                    //牌眼判断
                    for (let i = MIN_INDEX; i < MAX_INDEX - MAX_HUA_CARD; i++) {
                        if (cbCardIndex[i] == 2) {
                            //变量定义
                            let AnalyseItem = new tagAnalyseItem();

                            //设置结果
                            for (let j = 0; j < cbWeaveCount; j++) {
                                AnalyseItem.cbWeaveKind[j] = WeaveItem[j].cbWeaveKind;
                                AnalyseItem.cbCenterCard[j] = WeaveItem[j].cbCenterCard;
                                for (let k = 0; k < 4; k++) {
                                    AnalyseItem.cbCardData[j][k] = WeaveItem[j].cbCardData[k];
                                }

                            }
                            AnalyseItem.cbCardEye = this.SwitchToCardData(i);

                            //插入结果
                            AnalyseItemArray.push(AnalyseItem);

                            return true;
                        }
                    }
                    return false;
                }

                //拆分分析
                let cbMagicCardIndex = utils.allocArray<Number>(MAX_INDEX, Number);
                for (let i = MIN_INDEX; i < MAX_INDEX; i++) {
                    cbMagicCardIndex[i] = cbCardIndex[i];
                }

                if (cbCardCount >= 3) {
                    for (let i = MIN_INDEX; i < MAX_INDEX - MAX_HUA_CARD; i++) {
                        //同牌判断
                        //如果是财神,并且财神数小于3,则不进行组合
                        if (cbMagicCardIndex[i] >= 3) {
                            let nTempIndex = Math.min(3, Number(cbMagicCardIndex[i]));
                            do {
                                egret.assert(cbKindItemCount < 27 * 2 + 28);
                                let cbIndex = i;
                                let cbCenterCard = this.SwitchToCardData(i);

                                //设置变量
                                KindItem[cbKindItemCount].cbWeaveKind = WIK_PENG;
                                KindItem[cbKindItemCount].cbCenterCard = cbCenterCard;
                                KindItem[cbKindItemCount].cbValidIndex[0] = cbIndex;
                                KindItem[cbKindItemCount].cbValidIndex[1] = cbIndex;
                                KindItem[cbKindItemCount].cbValidIndex[2] = cbIndex;
                                cbKindItemCount++;

                            } while (--nTempIndex > 0 && nTempIndex >= 3);
                        }

                        //连牌判断
                        if ((i < (MAX_INDEX - MAX_HUA_CARD - 2)) && ((i % 9) < 7)) {
                            //只要财神牌数加上3个顺序索引的牌数大于等于3,则进行组合
                            if (Number(cbMagicCardIndex[i]) + Number(cbMagicCardIndex[i + 1]) + Number(cbMagicCardIndex[i + 2]) >= 3) {
                                let cbIndex: number[] = [Number(cbMagicCardIndex[i]), Number(cbMagicCardIndex[i + 1]), Number(cbMagicCardIndex[i + 2])];

                                //定义变量
                                let bSuccess: boolean = false;
                                let cbValidIndex: number[] = [0, 0, 0];
                                while (cbIndex[0] + cbIndex[1] + cbIndex[2] >= 3) {
                                    bSuccess = true;
                                    for (let j = 0; j < 3; j++) {
                                        if (cbIndex[j] > 0) {
                                            cbIndex[j]--;
                                            cbValidIndex[j] = i + j;
                                        }
                                        else {
                                            bSuccess = false;
                                            break;
                                        }
                                    }
                                    if (bSuccess) {
                                        egret.assert(cbKindItemCount < 27 * 2 + 28);
                                        KindItem[cbKindItemCount].cbWeaveKind = WIK_LEFT;
                                        KindItem[cbKindItemCount].cbCenterCard = this.SwitchToCardData(i);
                                        KindItem[cbKindItemCount].cbValidIndex[0] = cbValidIndex[0];
                                        KindItem[cbKindItemCount].cbValidIndex[1] = cbValidIndex[1];
                                        KindItem[cbKindItemCount].cbValidIndex[2] = cbValidIndex[2];

                                        cbKindItemCount++;
                                    }
                                    else break;
                                }
                            }
                        }
                    }
                }

                //组合分析
                if (cbKindItemCount >= cbLessKindItem) {
                    //变量定义
                    let cbCardIndexTemp = utils.allocArray<Number>(MAX_INDEX, Number);

                    //变量定义
                    let cbIndex: number[] = [0, 0, 0];
                    for (let i = 0; i < 3; i++)
                        cbIndex[i] = i;

                    let pKindItem = utils.allocArray<tagKindItem>(MAX_WEAVE, tagKindItem);
                    let KindItemTemp = utils.allocArray<tagKindItem>(27 * 2 + 28, tagKindItem);
                    for (let i = 0; i < 27 * 2 + 28; i++) {
                        let item = KindItemTemp[i];
                        item.cbCenterCard = KindItem[i].cbCenterCard;
                        item.cbWeaveKind = KindItem[i].cbWeaveKind;

                        for (let j = 0; j < KindItem[i].cbValidIndex.length; j++) {
                            item.cbValidIndex[j] = KindItem[i].cbValidIndex[j];
                        }
                    }

                    //开始组合
                    do {
                        //设置变量
                        for (let i = MIN_INDEX; i < MAX_INDEX; i++) {
                            cbCardIndexTemp[i] = cbCardIndex[i];
                        }

                        for (let i = 0; i < 27 * 2 + 28; i++) {
                            let item = KindItem[i];
                            item.cbCenterCard = KindItemTemp[i].cbCenterCard;
                            item.cbWeaveKind = KindItemTemp[i].cbWeaveKind;

                            for (let j = 0; j < KindItemTemp[i].cbValidIndex.length; j++) {
                                item.cbValidIndex[j] = KindItemTemp[i].cbValidIndex[j];
                            }
                        }


                        for (let i = 0; i < cbLessKindItem; i++) {
                            pKindItem[i].cbCenterCard = KindItem[cbIndex[i]].cbCenterCard;
                            pKindItem[i].cbWeaveKind = KindItem[cbIndex[i]].cbWeaveKind;

                            for (let j = 0; j < KindItem[cbIndex[i]].cbValidIndex.length; j++) {
                                pKindItem[i].cbValidIndex[j] = KindItem[cbIndex[i]].cbValidIndex[j];
                            }
                        }

                        //数量判断
                        let bEnoughCard: boolean = true;

                        for (let i = 0; i < cbLessKindItem * 3; i++) {
                            //存在判断
                            const index: number = pKindItem[Math.floor(i / 3)].cbValidIndex[i % 3];
                            if (cbCardIndexTemp[index] == 0) {
                                bEnoughCard = false;
                                break;
                            }
                            else {
                                cbCardIndexTemp[index] = Number(cbCardIndexTemp[index]) - 1;
                            }
                        }

                        //胡牌判断
                        if (bEnoughCard == true) {
                            //牌眼判断
                            let cbCardEye: number = 0;
                            if (this.GetCardCount(cbCardIndexTemp) == 2) {
                                for (let i = MIN_INDEX; i < MAX_INDEX - MAX_HUA_CARD; i++) {
                                    if (cbCardIndexTemp[i] == 2) {
                                        cbCardEye = this.SwitchToCardData(i);
                                        break;
                                    }
                                }
                            }

                            //组合类型
                            if (cbCardEye != 0) {
                                //变量定义
                                let AnalyseItem = new tagAnalyseItem();

                                //设置组合
                                for (let i = 0; i < cbWeaveCount; i++) {
                                    AnalyseItem.cbWeaveKind[i] = WeaveItem[i].cbWeaveKind;
                                    AnalyseItem.cbCenterCard[i] = WeaveItem[i].cbCenterCard;
                                    this.GetWeaveCard(WeaveItem[i].cbWeaveKind, WeaveItem[i].cbCenterCard, AnalyseItem.cbCardData[i]);
                                }

                                //设置牌型
                                for (let i = 0; i < cbLessKindItem; i++) {
                                    AnalyseItem.cbWeaveKind[i + cbWeaveCount] = pKindItem[i].cbWeaveKind;
                                    AnalyseItem.cbCenterCard[i + cbWeaveCount] = pKindItem[i].cbCenterCard;
                                    AnalyseItem.cbCardData[cbWeaveCount + i][0] = this.SwitchToCardData(pKindItem[i].cbValidIndex[0]);
                                    AnalyseItem.cbCardData[cbWeaveCount + i][1] = this.SwitchToCardData(pKindItem[i].cbValidIndex[1]);
                                    AnalyseItem.cbCardData[cbWeaveCount + i][2] = this.SwitchToCardData(pKindItem[i].cbValidIndex[2]);
                                }

                                //设置牌眼
                                AnalyseItem.cbCardEye = cbCardEye;

                                //插入结果
                                AnalyseItemArray.push(AnalyseItem);
                            }
                        }

                        //设置索引
                        if (cbIndex[cbLessKindItem - 1] == (cbKindItemCount - 1)) {
                            let i: number;
                            for (i = cbLessKindItem - 1; i > 0; i--) {
                                if ((cbIndex[i - 1] + 1) != cbIndex[i]) {
                                    let cbNewIndex = cbIndex[i - 1];
                                    for (let j = (i - 1); j < cbLessKindItem; j++)
                                        cbIndex[j] = cbNewIndex + j - i + 2;
                                    break;
                                }
                            }
                            if (i == 0)
                                break;
                        }
                        else
                            cbIndex[cbLessKindItem - 1]++;
                    } while (true);

                }

                return (AnalyseItemArray.length > 0);
            }
        }
    }
}