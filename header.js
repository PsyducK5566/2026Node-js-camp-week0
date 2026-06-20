const headers = {
	"Access-Control-Allow-Headers":
		"Content-Type, Authorization, Content-Length, X-Requested-With",
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "PATCH, POST, GET, OPTIONS, DELETE",
	"Content-Type": "application/json",
};

// module.exports = headers;
// export default 是 ESM 的「預設匯出」，對應 CommonJS 的 module.exports。
export default headers;
