//创建钱包
function create_wallet() {
    var layer_prompt = layer.prompt({
        title: '请设置您的密码,并妥善保存(密码长度为9-16位)',
        attr: {},
        formType: 1,
    }, function(pass) {
        if (!(8 < pass.length < 17)) {
            layer.alert("密码长度不符合要求！")
            return;
        }
        var password = pass,
            address, keyStr, blob;
        var validateAll = validate();
        if (validateAll(password)) {
            layer.close(import_wallet_layer);
            layer.close(layer_prompt);
            var account = nebulas.Account.NewAccount(),
                address = account.getAddressString(),
                keyStr = account.toKeyString(password);
            blob = new Blob([keyStr], { type: "application/json; charset=utf-8" });
            //saveAs(blob, address);
            var i = window.document.createElement("a");
            i.target = "_blank";
            i.href = window.URL.createObjectURL(blob);
            i.download = address;
            document.body.appendChild(i);
            i.click();
            document.body.removeChild(i);
            layer.msg("创建钱包成功！")
            from = address;
            getAccountState(function() {
                viewItemsList();
            });
        }
    });

}


/**
 * 验证钱包私钥
 * @param {*私钥密码} pass 
 */
function validatyWallet(pass, callback) {
    var wallet_fileJson = wallet_fileJson || JSON.parse(sessionStorage.getItem("wallet_fileJson")); //钱包文件信息
    console.log("wallet_fileJson is " + wallet_fileJson);
    var account = Account.fromAddress(wallet_fileJson.address);
    try {
        account.fromKey(wallet_fileJson, pass);
        address = account.getAddressString();
        console.log("验证私钥成功！");
        if (callback) {
            callback(account);
        }
    } catch (err) {
        var message = err.message || "密码无效";
        layer.alert(message);
        if (loading != null) {
            layer.close(loading);
            loading = null;
        };
    }
}



//获取节点信息
function getNodeInfo(callback) {
    admin.nodeInfo().then(function(info) {
        console.log("info is " + info);
        if (callback) {
            callback(info);
        }
    }, function(err) {
        var message = err.message || '获取节点信息失败！';
        layer.alert(message);
        if (loading != null) {
            layer.close(loading);
            loading = null;
        };
    });
}


/**
 * 发起交易
 * @param {*交易配置项} tra_option 
 */
function sendRawTransaction(tra_option, callback) {
    var gTx = new Transaction(tra_option);
    gTx.signTransaction();
    api.sendRawTransaction({ data: gTx.toProtoString() }).then(function(hash) {
        console.log("trxhash is " + hash);
        getTransactionReceipt(hash.txhash, callback);
    }, function(err) {
        console.log("sendRawTransaction err is " + err);
        var message = err.message || '交易失败！';
        layer.alert(message);
        if (loading != null) {
            layer.close(loading);
            loading = null;
        };
    });
}


/**
 * 通过交易hash值查看交易是否成功
 * @param {*交易hash} txhash 
 * @param {*回调} callback 
 */
function getTransactionReceipt(txhash, callback) {
    var intervalTrx = setInterval(function() {
        api.getTransactionReceipt({
            hash: txhash
        }).then(function(receipt) {
            console.log(receipt);
            if (receipt.status == 1) { //1--success;2--pending;
                layer.msg("交易成功！");
                clearInterval(intervalTrx);
                if (callback) {
                    callback(receipt);
                }
            }
        }, function(err) {
            console.log(err);
            var message = err.message || "查询交易失败！";
            layer.alert(message);
            if (loading != null) {
                layer.close(loading);
                loading = null;
            };
        });
    }, 3000);
}



/**
 * 解锁密码钱包,验证成功，执行回调函数
 * @param {私钥密码} password 
 * @param {验证成功的回调函数} callback 
 */
// function unlockAccount(password, callback) {
//     admin.unlockAccount({
//         address: from,
//         passphrase: password,
//         duration: 1000000000
//     }).then(function(isUnLocked) {
//         console.log(isUnLocked);
//         if (isUnLocked && callback) {
//             layer.msg("验证钱包成功！");
//             callback(isUnLocked);
//         } else {
//             layer.msg("验证钱包失败，请重新验证！");
//         }
//     }, function(err) {
//         console.log("unlockAccount err is " + err);
//         layer.msg('验证钱包失败，请重新验证！');
//     })
// }


// /**
//  * 发送交易，返回交易hash值
//  * @param {交易配置参数} options 
//  * @param {回调函数} callback 
//  */
// function sendTransaction(options, callback) {
//     admin.sendTransaction(options).then(function(trxdata) {
//         //设置定时任务，查询交易是否成功
//         var intervalTrx = setInterval(function() {
//             api.getTransactionReceipt({
//                 hash: trxdata.txhash
//             }).then(function(receipt) {
//                 console.log(receipt);
//                 if (receipt.status == 1) { //1--success;2--pending;
//                     layer.msg("交易成功！");
//                     clearInterval(intervalTrx);
//                     if (callback) {
//                         callback(receipt);
//                     }
//                 }
//             }, function(err) {
//                 layer.msg("查询交易失败!");
//             });
//         }, 3000);
//     }, function(err) {
//         console.log("sendTransaction err is " + err);
//         if (loading != null) {
//             layer.close(loading);
//             loading = null;
//         };
//     })
// }