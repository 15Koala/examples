function validate() {
    // these validates performed in order listed in the value of data-validate-order-matters
    // queries inputs on each validateAll call so you can add or remove <input> into selector at any time
    var nebulas = require("nebulas"),
        mRules = {
            eqgt0: function(s) { return s > -1; },
            gt0: function(s) { return s > 0; },
            lengthEq35: function(s) { return s.length == 35; },
            lengthEq64: function(s) { return s.length == 64; },
            lengthGt8: function(s) { return s.length > 8; },
            number: function(s) {
                try {
                    nebulas.Utils.toBigNumber(s);
                    return true;
                } catch (e) {
                    return false;
                }
            },
            required: function(s) { return s.length != 0; }
        };

    return validateAll;


    function validateAll(password) {
        var ret = true;
        var arr, i, len,
            s = "required lengthGt8";
        for (arr = s.match(/\S+/g) || [], i = 0, len = arr.length; i < len; ++i) {
            if (mRules[arr[i]]) {
                if (!mRules[arr[i]](password)) {
                    if (ret) {
                        ret = false;
                    }
                }
            } else {
                console.log("validateAll - unknown rule -", arr[i] + ", ignored");
            }
        }
        return ret;
    }
}