'use strict';

var Item = function(text) {
    if (text) {
        var o = JSON.parse(text);
        this.itemId = new Number(o.itemId); //项目id
        this.rate = new Number(o.rate); //赔率
        this.price = new Number(o.price); //押注价格
        this.result = new Number(o.result); //比赛结果
        this.settable = new Number(o.settable); //是否可结算
        this.name = o.name; //项目名称
    } else {
        this.itemId = new Number(0);
        this.rate = new Number(0);
        this.price = new Number(0);
        this.result = new Number(-1);
        this.settable = new Number(0);
        this.name = "";
    }
};

Item.prototype = {
    toString: function() {
        return JSON.stringify(this);
    }
};

var Wager = function(text) {

    if (text) {
        var o = JSON.parse(text);
        this.itemId = new Number(o.itemId); //项目id
        this.odds = new Number(o.odds); //购买数量
        this.value = new Number(o.value); //押注选项
        this.isSet = new Number(o.isSet); //是否已经计算
        this.name = o.name;
    } else {
        this.itemId = new Number(0);
        this.odds = new Number(0);
        this.value = new Number(0);
        this.isSet = new Number(0); //是否已经计算
        this.name = "";
    }

};

Wager.prototype = {
    toString: function() {
        return JSON.stringify(this);
    }
};

var LotteryContract = function() {
    LocalContractStorage.defineMapProperty(this, "items", { //存储项目
        parse: function(text) {
            return new Item(text);
        },
        stringify: function(o) {
            return o.toString();
        }
    });
    LocalContractStorage.defineMapProperty(this, "wagers");
};

//彩票合约代码
LotteryContract.prototype = {
    init: function() {
        //设置管理员身份
        var from = Blockchain.transaction.from;
        LocalContractStorage.set("admin", from);
        //是否截止
        LocalContractStorage.set("done", 0);
        //是否可结算
        LocalContractStorage.set("set", 0);
        //初始化项目
        this.createItem(1, "2.95", 2, "巴西");
        this.createItem(2, "3.50", 2, "德国");
        this.createItem(3, "4.10", 2, "西班牙");
        this.createItem(4, "4.50", 2, "阿根廷");
        this.createItem(5, "5.00", 2, "法国");
        this.createItem(6, "10.00", 2, "比利时");
        this.createItem(7, "15.00", 2, "葡萄牙");
        this.createItem(8, "14.00", 2, "英格兰");
        this.createItem(9, "22.00", 2, "乌拉圭");
        this.createItem(10, "25.00", 2, "哥伦比亚");
        this.createItem(11, "35.00", 2, "克罗地亚");
        this.createItem(12, "55.00", 2, "俄罗斯");
        this.createItem(13, "70.00", 2, "墨西哥");
        this.createItem(14, "65.00", 2, "波兰");
        this.createItem(15, "110.0", 2, "瑞士");
        this.createItem(16, "100.0", 2, "丹麦");
        this.createItem(17, "175.0", 2, "塞尔维亚");
        this.createItem(18, "200.0", 2, "瑞典");
        this.createItem(19, "200.0", 2, "秘鲁");
        this.createItem(20, "250.0", 2, "日本");
        this.createItem(21, "250.0", 2, "尼日利亚");
        this.createItem(22, "200.0", 2, "塞内加尔");
        this.createItem(23, "250.0", 2, "埃及");
        this.createItem(24, "250.0", 2, "冰岛");
        this.createItem(25, "700.0", 2, "突尼斯");
        this.createItem(26, "600.0", 2, "澳大利亚");
        this.createItem(27, "500.0", 2, "摩洛哥");
        this.createItem(28, "600.0", 2, "韩国");
        this.createItem(29, "600.0", 2, "伊朗");
        this.createItem(30, "500.0", 2, "哥斯达黎加");
        this.createItem(31, "800.0", 2, "巴拿马");
        this.createItem(32, "1000", 2, "沙特");
    },

    viewAdmin: function() {
        return LocalContractStorage.get("admin");
    },
    //下注，项目编号和压注大小, itemBets = [ { itemId, value }  ]
    bets: function(itemBets, odds) {

        if (LocalContractStorage.get("done") == 1) throw new Error("活动已经结束！");
        //itemBets = JSON.parse(itemBets);
        var from = Blockchain.transaction.from;
        var odds = new Number(odds);
        // from => { itemId => Wager{ itemId, value , odds } }

        if (odds <= 0) {
            throw new Error("参与下注个数必须大于0！");
        }

        var totalVal = new Number(0);

        // 计算总的需要金额
        for (var i = 0; i < itemBets.length; i++) {
            var itemBet = itemBets[i];
            var myItemId = new Number(itemBet.itemId);
            var price = this.items.get(myItemId).price * odds;
            if (price && price > 0) {
                totalVal = totalVal + price;
            }
        }

        var trxValue = Blockchain.transaction.value.dividedBy('1000000000000000000').toNumber();
        console.log("LotteryContract totalVal, trxValue: " + totalVal + ", " + trxValue);

        //如果需要的金额大于发送金额，那么报错
        if (totalVal > trxValue) {
            throw new Error("参与下注的金额不够! 至少为" + totalVal);
        }

        var mywagers = this.wagers.get(from);

        console.log("LotteryContract 1 mywagers: " + mywagers);


        if (!mywagers) mywagers = "{}";

        mywagers = JSON.parse(mywagers);

        //更新该用户的下注信息
        for (var j = 0; j < itemBets.length; j++) {
            var itemBet = itemBets[j];
            var myItemId = new Number(itemBet.itemId);
            var myValue = new Number(1); //买冠军只能是1 TODO
            var key = myItemId + '-' + myValue; //项目id和值唯一决定一个赌注
            var mywager = mywagers[key];
            if (!mywager) mywager = new Wager();
            else {
                mywager = new Wager(JSON.stringify(mywager));
            }
            mywager.odds += odds;
            mywager.itemId = myItemId;
            mywager.value = itemBet.value;
            var name = this.items.get(myItemId).name;
            mywager.name = name;
            console.log("LotteryContract for mywager: " + mywager);
            mywagers[key] = mywager;
        }

        console.log("LotteryContract 2 mywagers: " + JSON.stringify(mywagers));

        this.wagers.put(from, JSON.stringify(mywagers));
        return JSON.parse(this.wagers.get(from));
    },

    //创建项目
    createItem: function(itemId, rate, price, name) {
        var from = Blockchain.transaction.from;
        var to = LocalContractStorage.get("admin");
        if (from != to) {
            throw new Error("普通用户无权限创建项目");
        }

        var myrate = new Number(rate);
        var myprice = new Number(price);
        if (myrate <= 1 || myprice <= 0 || !itemId) {
            throw new Error("参数不合法");
        }
        //console.log("itemId: " + itemId + ", rate: " + rate + ", price" + price)
        var item = new Item();
        item.itemId = new Number(itemId);
        item.rate = myrate;
        item.price = myprice;
        item.name = name;
        this.items.put(item.itemId, item);
        return this.items.get(item.itemId);
    },

    //设置项目结果
    setItemResult: function(itemId) {
        var itemIdNum = new Number(itemId);
        var from = Blockchain.transaction.from;
        var to = LocalContractStorage.get("admin");
        if (from != to) {
            throw new Error("普通用户无权限修改项目");
        }

        for (var i = 1; i <= 32; i++) {
            var item = this.items.get(new Number(i));
            var myItemId = new Number(i);
            if (itemIdNum - myItemId == 0) {
                item.result = new Number(1);
            }
            item.settable = new Number(1);
            console.log("LotteryContract item: " + item + ", " + (itemIdNum - myItemId));
            this.items.put(myItemId, new Item(JSON.stringify(item)));
        }
        LocalContractStorage.set("set", 1);
        return 1;
    },

    //设置项目是否截止押注, itemId是冠军id
    setItemDone: function() {
        var from = Blockchain.transaction.from;
        var to = LocalContractStorage.get("admin");
        if (from != to) {
            throw new Error("普通用户无权限修改项目");
        }
        LocalContractStorage.set("done", 1);
        return LocalContractStorage.get("done");
    },

    //查看项目信息
    viewItems: function() {
        var result = [];
        for (var i = 1; i <= 32; i++) {
            result.push(this.items.get(new Number(i)));
        }
        return result;
    },

    //查看个人押注信息
    viewBet: function() {
        var from = Blockchain.transaction.from;
        return this.wagers.get(from);
    },

    //查看是否可以结算
    viewState: function() {
        return LocalContractStorage.get("set");
    },



    //结算，自助结算，可以结算多次，结算可计算的项目
    settlement: function() {

        if (LocalContractStorage.get("set") == 0) throw new Error("活动当前不可结算！");

        var from = Blockchain.transaction.from;
        var to = Blockchain.transaction.to;
        var mywagers = this.wagers.get(from);
        mywagers = JSON.parse(mywagers);
        var reward = new Number(0);
        for (var key in mywagers) {
            var wager = new Wager(JSON.stringify(mywagers[key]));
            var item = this.items.get(wager.itemId);
            console.log("LotteryContract settlement " + wager + ", " + item);
            if (item.settable - 1 == 0 && wager.isSet == 0) {
                if (item.result - wager.value == 0) {
                    reward = reward + item.price * item.rate * wager.odds;
                }
                wager.isSet = new Number(1);
                mywagers[key] = wager;
            }
            console.log("LotteryContract settlement " + wager + ", " + item);
        }

        if (reward > 0) {
            //合约发放奖励
            var rewardValue = new BigNumber(reward.toFixed(2)).times('1000000000000000000');
            var result = Blockchain.transfer(from, rewardValue);
            if (!result) {
                throw new Error("结算失败，合约地址余额不足，请联系管理员补款！");
            }
            Event.Trigger("Lottery", {
                Transfer: {
                    from: Blockchain.transaction.to,
                    to: from,
                    value: rewardValue.toString()
                }
            });
        }

        this.wagers.put(from, JSON.stringify(mywagers));
        return reward;
    },

    //如果发生合约迭代，则管理员需要取出余额，转出
    takeout: function(value) {
        var from = Blockchain.transaction.from;
        var to = LocalContractStorage.get("admin");
        var bk_height = new BigNumber(Blockchain.block.height);
        var amount = new BigNumber(value);

        if (from != to) {
            throw new Error("普通用户无权限取出余额");
        }

        var result = Blockchain.transfer(from, amount);
        if (!result) {
            throw new Error("transfer failed.");
        }
        Event.Trigger("Lottery", {
            Transfer: {
                from: Blockchain.transaction.to,
                to: from,
                value: amount.toString()
            }
        });
    },

    verifyAddress: function(address) {
        // 1-valid, 0-invalid
        var result = Blockchain.verifyAddress(address);
        return {
            valid: result == 0 ? false : true
        };
    }
};
module.exports = LotteryContract;