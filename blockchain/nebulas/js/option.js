//nebpay.js
// var NebPay = require("nebpay");
// var nebPay = new NebPay();
//neb.js
var nebulas = require("nebulas");
var Neb = nebulas.Neb;
var neb = new Neb();
var api = neb.api;
var HttpRequest = nebulas.HttpRequest;
neb.setRequest(new HttpRequest("http://116.196.90.220/neb"));
var admin = neb.admin; //用户自己的调用方法
var Account = nebulas.Account;
// var Utils = nebulas.Utils;
var Transaction = require("nebulas").Transaction;



//配置区
let from; //用户私钥
let to = "n1f1Aa33ZNdyRiRAcUmNGVo6m854r5Nmooo"; //合约地址
let nonce; //用户交易次数
let options = {
    goods: {}, //商品描述
    //callback 是交易查询服务器地址,
    //callback: NebPay.config.mainnetUrl //在主网查询(默认值)
    //callback: NebPay.config.testnetUrl //在测试网查询
}
let api_options = {
    gasPrice: 1000000,
    gasLimit: 2000000
}


//钱包
let wallet_fileJson; //钱包文件内容