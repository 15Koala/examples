//页面元素的交互
/**
 * 增减投注倍数,对应的投注金额及理论奖金的变化
 * @param {*增或减} bool 
 */
function stakesSum(bool) {
    //投注倍数的值
    var num = Number($(".stakes_num").val());
    if (bool != undefined) {
        if (bool) {
            num += 1;
        } else {
            num > 1 ? num -= 1 : num = 1;
        }
        $(".stakes_num").val(num);
    }
    let stakes_kinds = $(".table_checked tr.info");
    let stakes_kinds_len = stakes_kinds.length; //赌注种类
    //投注金额
    let stakes_pay_money = mul(mul(2, stakes_kinds_len), num); //stakes_pay_money =注数 * 赌注种类 * 每注单价为2NAS
    $('.stakes_pay_money').html(stakes_pay_money);

    //奖金金额stakes_win_money = 最高奖金*投注数num*投注单价
    let stakes_win_money,
        stake_price = 0;
    for (let index = 0; index < stakes_kinds_len; index++) {
        const element_price = Number($(stakes_kinds[index]).find("td:eq(2)").html());
        element_price > stake_price ? stake_price = element_price : null;
    }
    stakes_win_money = mul(mul(stake_price, num), 2);
    $('.stakes_win_money').html(stakes_win_money.toFixed(2));
}

//点击表格行,选中或取消选中赌注
function toggleStrokes(obj) {
    $(obj).toggleClass("info");
    stakesSum();
}

//导航栏点击切换
$("#navbar-collapse a").click(function(e) {
    $(e.target).parent().addClass("active");
    $(e.target).parent().siblings("li").removeClass("active");
    var show_item = $(e.target).attr("data-target");
    $("." + show_item).removeClass("hidden");
    $("." + show_item).siblings(".section").addClass("hidden");
    //切换时更新用户状态
    getAccountState(function() {
        if (show_item == 'section_personal') {
            getMyBets();
        }
    });
})

//用户点击支付发起交易
function onClickSendTx() {
    let stakes_kinds = $(".table_checked tr.info"); //获取页面中选择的赌注种类
    let stakes_kinds_len = stakes_kinds.length; //赌注种类的长度
    if (stakes_kinds_len <= 0) {
        layer.msg('还没有选择球队');
        return;
    } else if ($(".stakes_num").val() <= 0) {
        layer.msg("请选择投注倍数");
        return;
    } else if ($(".stakes_num").val() > 99) {
        layer.msg("最高投注数不超过99倍");
        return;
    }
    let wagers = []; //赌注种类id集合
    for (let i = 0; i < stakes_kinds_len; i++) {
        wagers.push({
            itemId: $(stakes_kinds[i]).attr('itemId'),
            value: 1 //赌赢
        });
    }
    let odds = Number($(".stakes_num").val()); //下注倍数
    let value = mul(mul(2, stakes_kinds.length), odds); //转账数额
    layer.confirm("确定要下注吗？这将花费您" + value + "个NAS币", {
        btn: ['确定', '取消'] //按钮
    }, function(index) {
        layer.close(index);
        value *= 1e18;
        //获取钱包状态
        getAccountState(function(account_state) {
            var new_nonce = Number(account_state.nonce) + 1;
            getWalletPrikey({
                value: value,
                nonce: new_nonce,
                contract: {
                    function: "bets",
                    args: JSON.stringify([wagers, odds])
                },
            }, returnTrxInfo); //验证钱包私钥
        })
    });
}

//获取钱包私钥，并验证
function getWalletPrikey(option, callback) {
    //获取钱包私钥
    layer.prompt({
        title: '请输入私钥密码',
        formType: 1
    }, function(pass, prompt_layer_index) {
        validatyWallet(pass, function(account) {
            layer.close(prompt_layer_index);
            //加载状态
            loading = layer.load(1, {
                shade: [0.6, '#000'],
                content: "<div style='position: absolute;color: #fff;top: 32px;left:-120px;width: 300px;'><h3 class='text-center'>请耐心等待...<h3></div>"
            });
            //验证成功获取节点信息
            getNodeInfo(function(info) {
                console.log("info is " + info);
                var chainId = Number(info.chain_id);
                //发送交易
                sendRawTransaction({
                    chainID: chainId,
                    from: account,
                    to: to,
                    value: option.value,
                    nonce: option.nonce,
                    contract: option.contract,
                    gasPrice: api_options.gasPrice,
                    gasLimit: api_options.gasLimit
                }, callback);
            });
        });
    });
}






/**
 * 交易成功后的处理
 * @param {*交易信息} receipt 
 */
function returnTrxInfo(receipt) {
    layer.close(loading);
    loading = null;
    //交易成功后清除页面的所选项
    $("tr.info").removeClass("info");
    $(".stakes_num").val(1);
    $(".stakes_pay_money").html("0");
    $(".stakes_win_money").val("0");
    var date = new Date();
    date = date.toDateString(receipt.timestamp);
    from = receipt.from;
    console.log(receipt.execute_result);
    var view = "<div style='padding: 20px;'><table class='table table-bordered table-striped table-hover'>" +
        "<tr><td>from</td><td>" + receipt.from + "</td></tr>" +
        "<tr><td>to</td><td>" + receipt.to + "</td></tr>" +
        "<tr><td>value</td><td>" + receipt.value + "</td></tr>" +
        "<tr><td>gas_limit</td><td>" + receipt.gas_limit + "</td></tr>" +
        "<tr><td>gas_price</td><td>" + receipt.gas_price + "</td></tr>" +
        "<tr><td>gas_used</td><td>" + receipt.gas_used + "</td></tr>" +
        "<tr><td>nonce</td><td>" + receipt.nonce + "</td></tr>" +
        "<tr><td>hash</td><td>" + receipt.hash + "</td></tr>" +
        "<tr><td>timestamp</td><td>" + date + "</td></tr>" +
        "<tr><td>status</td><td>success</td></tr>" +
        "<tr><td>chainId</td><td>" + receipt.chainId + "</td></tr>" +
        "<tr><td>execute_result</td><td>" + receipt.execute_result + "</td></tr>" +
        "<tr><td>type</td><td>" + receipt.type + "</td></tr>" +
        "</table></div>";
    layer.open({
        type: 1,
        title: '交易信息',
        content: view,
        area: '800px'
    })
}