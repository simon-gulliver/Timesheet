var Crypto = {
    SetLoginHash: function (email, password) {
        localStorage.removeItem("loginHash"); // explicit remove for iPad
        localStorage.loginHash = CryptoJS.SHA3(email.toUpperCase() + password);
    },

    EncryptToLocalStorage: function (name, value, password) {
        localStorage.removeItem(name); // explicit remove for iPad
        if (password === undefined) password = Crypto.DecryptSessionPassword();
        var jsonString = JSON.stringify(value);
        localStorage.setItem(name, CryptoJS.AES.encrypt(jsonString, password).toString());
        return jsonString;
    },

    DecryptFromLocalStorage: function (name, password) {
        if (!password) password = Crypto.DecryptSessionPassword();
        var encText = localStorage.getItem(name);
        if (!encText || !password) return null;
        return JSON.parse(CryptoJS.AES.decrypt(encText,password).toString(CryptoJS.enc.Utf8));
    },

    EncryptSessionPassword: function (password) {
        sessionStorage.password = CryptoJS.AES.encrypt(password, this.penc).toString();
    },

    DecryptSessionPassword: function () {
        var encPassword = sessionStorage.password;
        if (!encPassword) return null;
        return CryptoJS.AES.decrypt(encPassword, this.penc).toString(CryptoJS.enc.Utf8);
    },

    penc: "$$gsh4PPPP$$"
}



