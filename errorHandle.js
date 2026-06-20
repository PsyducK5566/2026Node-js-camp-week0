/** import X from './檔案.js' 對應 require('./檔案')，但副檔名 .js 不能省。 */
// const headers = require("./header");
import headers from "./header.js";

function errorHandle(res, message = "欄位填寫錯誤，或無此 todo id") {
	res.writeHead(400, headers);
	res.write(JSON.stringify({ status: "error", message }));
	res.end();
}

// module.exports = errorHandle;
export default errorHandle;
