'use strict';

var Item = function(text) {
    if (text) {
        var o = JSON.parse(text);
        this.itemId = new BigNumber(o.itemId); //项目id
        this.rate = new BigNumber(o.rate); //赔率
        this.price = new BigNumber(o.price); //押注价格
        this.result = new BigNumber(-1); //比赛结果
        this.settable = new BigNumber(0); //是否可结算
        this.done = new BigNumber(0); // 已完结

    } else {
        this.itemId = new BigNumber(0);
        this.rate = new BigNumber(0);
        this.price = new BigNumber(0);
        this.result = new BigNumber(-1);
        this.settable = new BigNumber(0);
        this.done = new BigNumber(0); // 已完结
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
        this.itemId = new BigNumber(o.itemId); //项目id
        this.odds = new BigNumber(o.odd); //购买数量
        this.value = new BigNumber(o.value); //押注选项
        this.isSet = new BigNumber(0); //是否已经计算
    } else {
        this.itemId = new BigNumber(0);
        this.odds = new BigNumber(0);
        this.value = new BigNumber(0);
        this.isSet = new BigNumber(0); //是否已经计算
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
    LocalContractStorage.defineMapProperty(this, "wagers", {
        parse: function(text) {
            return new Wager(text);
        },
        stringify: function(o) {
            return o.toString();
        }
    });
};

//彩票合约代码
LotteryContract.prototype = {
    init: function() {
        //设置管理员身份
        var from = Blockchain.transaction.from;
        LocalContractStorage.set("admin", from);
    },

    viewAdmin: function() {
        return LocalContractStorage.get("admin");
    },
    //下注，项目编号和压注大小, itemBets = [ { itemId, value }  ]
    bets: function(itemBets, odds) {
        //itemBets = JSON.parse(itemBets);
        var from = Blockchain.transaction.from;
        var odds = new BigNumber(odds);
        // from => { itemId => Wager{ itemId, value , odds } }
        var totalVal = new BigNumber(0);

        // 计算总的需要金额
        for (var i = 0; i < itemBets.length; i++) {
            var itemBet = itemBets[i];
            var myItemId = new BigNumber(itemBet.itemId);
            var price = this.items.get(myItemId).price.times(odds);
            if (price && price.gt(0)) {
                totalVal = totalVal.plus(price);
            }
        }

        //如果需要的金额大于发送金额，那么报错
        if (totalVal.gt(Blockchain.transaction.value)) {
            throw new Error("参与下注的金额不够!至少为" + totalVal);
        }

        var mywagers = this.wagers.get(from);

        if (!mywagers) {
            mywagers = {};
        }

        //更新该用户的下注信息
        for (var j = 0; j < itemBets.length; j++) {
            var itemBet = itemBets[j];
            var myItemId = new BigNumber(itemBet.itemId);
            var myValue = new BigNumber(itemBet.value);
            var key = myItemId + '-' + myValue; //项目id和值唯一决定一个赌注
            var mywager = mywagers[key];
            if (!mywager) mywager = new Wager();
            mywager.odds = mywager.odds.plus(odds);
            mywager.itemId = myItemId;
            mywager.value = itemBet.value;
            mywagers[key] = mywager;
        }
        this.wagers.put(from, mywagers);

    },

    //创建项目
    createItem: function(itemId, rate, price) {
        var from = Blockchain.transaction.from;
        var to = LocalContractStorage.get("admin");
        if (from != to) {
            throw new Error("普通用户无权限创建项目");
        }

        var myrate = new BigNumber(rate);
        var myprice = new BigNumber(price);
        if (myrate.lte(1) || myprice.lte(0) || !itemId) {
            throw new Error("参数不合法");
        }
        //console.log("itemId: " + itemId + ", rate: " + rate + ", price" + price)
        var item = new Item();
        item.itemId = new BigNumber(itemId);
        item.rate = myrate;
        item.price = myprice;
        this.items.put(item.itemId, item);
        return this.items.get(item.itemId);
    },

    //设置项目结果
    setItemResult: function(itemId, reuslt) {
        var from = Blockchain.transaction.from;
        var to = LocalContractStorage.get("admin");
        if (from != to) {
            throw new Error("普通用户无权限修改项目");
        }
        var myresult = new BigNumber(reuslt);
        var myitemId = new BigNumber(itemId);
        var item = this.item.get(myitemId);
        if (!item) {
            throw new Error("项目不存在");
        }

        //每次重新设置结果都会重置item
        item.result = myresult;
        item.settable = new BigNumber(1);
        this.items.put(myitemId, item);
        return this.items.get(myitemId);
    },

    //设置项目是否截止押注
    setItemDone: function(itemId) {
        var from = Blockchain.transaction.from;
        var to = LocalContractStorage.get("admin");
        if (from != to) {
            throw new Error("普通用户无权限修改项目");
        }
        var myitemId = new BigNumber(itemId);
        var item = this.item.get(myitemId);
        if (!item) {
            throw new Error("项目不存在");
        }

        item.done = new BigNumber(1);
        item.settable = new BigNumber(1);
        this.items.put(myitemId, item);
        return this.items.get(myitemId);
    },

    //查看项目信息
    viewItem: function(itemId) {
        return this.items.get(new BigNumber(itemId));
    },

    //查看个人押注信息
    viewBet: function() {
        var from = Blockchain.transaction.from;
        return this.wagers.get(from);
    },

    //结算，自助结算，可以结算多次，结算可计算的项目
    settlement: function() {
        var from = Blockchain.transaction.from;
        var to = Blockchain.transaction.to;
        var mywagers = this.wagers.get(from);
        var reward = new BigNumber(0);
        for (var key in mywagers) {
            var wager = mywagers[key];
            var item = this.items.get(wager.itemId);
            if (item.settable == 1 && wager.isSet == 0) {
                if (item.result == wager.value) {
                    reward = reward.plus(item.price.times(item.rate));
                }
                wager.isSet = 1;
                mywagers[key] = wager;
            }
        }

        if (reward.gt(0)) {
            //合约发放奖励
            var result = Blockchain.transfer(from, reward);
            if (!result) {
                throw new Error("transfer failed.");
            }
            Event.Trigger("Lottery", {
                Transfer: {
                    from: Blockchain.transaction.to,
                    to: from,
                    value: reward.toString()
                }
            });
        }

        this.wagers.put(from, mywagers);

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