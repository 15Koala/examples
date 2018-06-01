//页面加载时，判断是否有钱包信息。没有则弹出选择钱包的输入框，验证钱包公钥，获取钱包信息
let import_wallet_layer, //导入钱包的弹出框
    import_input_view, //导入钱包的弹出框内容
    loading = null; //页面的加载状态;
$(function() {
    from = sessionStorage.getItem("address");
    if (from == null) {
        import_input_view = "<div class='text-center input_file_wrap' style='padding: 20px;'>" +
            "<div><input class='wallet_file' id='import_wallet' type='file' name='file'>" +
            "<label for='import_wallet'>导入钱包</label></div>" +
            "<div><a href='javascript: create_wallet()'>还没有钱包？去创建</a></div>" +
            "</div>";
        import_wallet_layer = layer.open({
            type: 1,
            closeBtn: 0,
            shade: 0.6,
            title: '请导入钱包文件',
            content: import_input_view
        });
    } else {
        getAccountState(function() {
            viewItemsList();
        });
    }

    //钱包的导入与更改钱包文件
    $(document).on("change", "input.wallet_file", function(e) {
        let wallet_file = e.target.files[0];
        var name = wallet_file.name; //获取用户的公钥
        name.lastIndexOf(".") != -1 ? name = name.substring(0, name.lastIndexOf(".")) : null;
        from = name;
        console.log("from" + from);

        //导入钱包后给sessionStorage赋值，并关掉弹出框
        getAccountState(function(res) {
            //读取钱包文件
            var file_reader = new FileReader();
            file_reader.readAsText(wallet_file, "utf-8");
            file_reader.onload = function(event) {
                wallet_fileJson = JSON.parse(event.target.result);
                console.log(JSON.stringify(wallet_fileJson))
                sessionStorage.setItem("address", from);
                sessionStorage.setItem("wallet_fileJson", JSON.stringify(wallet_fileJson));
            }
            layer.close(import_wallet_layer);
            viewItemsList();

        });
    })

})


/**
 * 获取钱包状态
 * @param {*回调函数} callback 
 */
function getAccountState(callback) {
    api.getAccountState({
        address: from
    }).then(function(res) {
        console.log("getAccountState success result is " + JSON.stringify(res));
        nonce = res.nonce;
        var balance = new BigNumber(res.balance);
        balance = balance.dividedBy(1e18).toString();;
        $("#user_balance").html(balance + " NAS");
        $(".lottery_btn").addClass("hidden");
        getMyBets();
        if (callback) {
            callback(res);
        }
    }, function(err) {
        console.log("getAccountState err is " + err);
        var message = err.message || "获取钱包信息失败";
        layer.alert(message);
    });
}

//加载比赛列表
function viewItemsList(callback) {
    api.call({
        from: from,
        to: to,
        value: 0,
        nonce: nonce,
        gasPrice: api_options.gasPrice,
        gasLimit: api_options.gasLimit,
        contract: {
            function: "viewItems",
            args: "[]"
        }
    }).then(function(res) {
        console.log("call viewItemsList result is " + JSON.stringify(res));
        var list = JSON.parse(res.result);
        if (list != null && list.length > 0) {
            var probabilityArr = [
                "19.27%", "16,24%", "13.86%", "12.63%", "11.37%", "5.68%", "3.79%", "4.06%", "2.58%", "2.27%", "1.62%",
                "1.03%", "0.81%", "0.87%", "0.52%", "0.57%", "0.32%", "0.28%", "0.28%", "0.23%", "0.23%", "0.28%",
                "0.23%", "0.23%", "0.08%", "0.09%", "0.11%", "0.09%", "0.09%", "0.11%", "0.07%", "0.06%"
            ];
            var index = Math.ceil(list.length / 2);
            var view1 = "",
                view2 = "";
            var list1 = list.slice(0, index);
            var list2 = list.slice(index);
            var probabilityArr1 = probabilityArr.slice(0, index);
            var probabilityArr2 = probabilityArr.slice(index);

            list1.forEach((item, index) => {
                view1 += "<tr itemId=" + item.itemId + " value=" + item.rate + " onclick='toggleStrokes(this)'>" +
                    "<td>" + item.itemId + "</td>" +
                    "<td><img src='./images/group" + item.itemId + ".png' alt=''><span>" + item.name + "</span></td>" +
                    "<td>" + item.rate + "</td>" +
                    "<td>" + probabilityArr1[index] + "</td>" +
                    "<td>2</td>" +
                    "</tr>";
            });
            $("#tbody1").html(view1);

            list2.forEach((item, index) => {
                view2 += "<tr itemId=" + item.itemId + " value=" + item.rate + " onclick='toggleStrokes(this)'>" +
                    "<td>" + item.itemId + "</td>" +
                    "<td><img src='./images/group" + item.itemId + ".png' alt=''><span>" + item.name + "</span></td>" +
                    "<td>" + item.rate + "</td>" +
                    "<td>" + probabilityArr2[index] + "</td>" +
                    "<td>2</td>" +
                    "</tr>";
            });
            $("#tbody2").html(view2);
        } else if (res.execute_err != "") {
            var message = res.execute_err || "加载比赛列表失败";
            layer.alert(message);
            return;
        }
        if (callback) { callback(list) }
    });
}

//加载用户的下注记录
function getMyBets() {
    api.call({
        from: from,
        to: to,
        value: 0,
        nonce: nonce,
        gasPrice: api_options.gasPrice,
        gasLimit: api_options.gasLimit,
        contract: {
            function: "viewBet",
            args: "[]"
        }
    }).then(function(receipt) {
        var win_itemId = undefined;
        viewItemsList(function(itemsList) { //加载列表
            for (var i = 0; i < itemsList.length; i++) {
                if (itemsList[i].result == 1) {
                    win_itemId = itemsList[i].itemId;
                }
            }
            console.log(win_itemId)
            var state = false; //开奖状态
            console.log(JSON.stringify(receipt));
            let bets = JSON.parse(JSON.parse(receipt.result));
            if (bets != null) {
                $("#trxlist").html("");
                for (var key in bets) {
                    if (bets[key].isSet == 1 || bets[key].isSet == "1") {
                        state = true; //已结算
                    }
                    if (win_itemId && win_itemId == bets[key].itemId) {
                        $("#trxlist").append("<tr class='win'><td>" + bets[key].itemId + "</td><td>" + bets[key].name + "</td><td>" + bets[key].odds + "</td></tr>");
                    } else {
                        $("#trxlist").append("<tr><td>" + bets[key].itemId + "</td><td>" + bets[key].name + "</td><td>" + bets[key].odds + "</td></tr>");
                    }
                };
                viewState(state)
            } else if (bets == null) {
                $("#trxlist").html("<tr><td class='text-center' colspan='5'>暂无记录</td></tr>");
            } else if (receipt.execute_err != "") {
                var message = receipt.execute_err || "获取用户下注记录失败！";
                layer.alert(message);
                return;
            }
        });


    });
}

//查看比赛项目状态
function viewState(state) {
    api.call({
        from: from,
        to: to,
        value: 0,
        nonce: nonce,
        gasPrice: api_options.gasPrice,
        gasLimit: api_options.gasLimit,
        contract: {
            function: "viewState",
            args: "[]"
        }
    }).then(function(res) {
        if (res.result == '0' || res.result == 0) {
            $("#noLottery").removeClass("hidden");
        } else if (res.result == '1' || res.result == 1) {
            console.log(state)
            if (state)
                $("#lottery").removeClass("hidden").html("已结算").attr("disabled", true);
            else
                $("#lottery").removeClass("hidden");
        } else if (res.execute_err != "") {
            var message = res.execute_err || "获取项目状态失败";
            layer.alert(message);
        }
    });
}
//可结算
function settlement(callback) {
    api.call({
        from: from,
        to: to,
        value: 0,
        nonce: nonce,
        gasPrice: api_options.gasPrice,
        gasLimit: api_options.gasLimit,
        contract: {
            function: "settlement",
            args: "[]"
        }
    }).then(function(res) {
        console.log(res);
        if (res.result == 0 || res.result == '0') {
            layer.alert("很遗憾您未中奖！");
        } else if (res.result > 0) {
            layer.alert("恭喜你获得 " + res.result + " NAS!", function(index) {
                layer.close(index);
                //获取钱包状态
                getAccountState(function(account_state) {
                    var new_nonce = Number(account_state.nonce) + 1;
                    getWalletPrikey({
                        value: 0,
                        nonce: new_nonce,
                        contract: {
                            function: "settlement",
                            args: "[]"
                        },
                    }, function(res) {
                        layer.close(loading);
                        loading = null;
                        layer.msg("结算成功！");
                        $("#lottery").removeClass("hidden").html("已结算").attr("disabled", true);
                        getAccountState();
                    }); //验证钱包私钥
                })
            });

        } else if (res.execute_err != "") {
            var message = res.execute_err || "结算失败！";
            layer.alert(message);
        }
    });
}