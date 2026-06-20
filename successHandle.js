// const headers = require("./header");
import headers from "./header.js";

function successHandle(res, data) {
	res.writeHead(200, headers);
	res.write(JSON.stringify({ status: "success", data }));
	res.end();
}

// module.exports = successHandle;
export default successHandle;
