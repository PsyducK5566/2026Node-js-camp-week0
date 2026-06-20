const headers = require("./header");

function errorHandle(res, message = "欄位填寫錯誤，或無此 todo id") {
	res.writeHead(400, headers);
	res.write(JSON.stringify({ status: "error", message }));
	res.end();
}

module.exports = errorHandle;
