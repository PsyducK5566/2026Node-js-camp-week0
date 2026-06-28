const http = require("http"); // Node.js 內建，用來建立 HTTP 伺服器
const fs = require("fs"); // Node.js 內建，用來讀寫檔案
const { v4: uuidv4 } = require("uuid"); // 產生唯一 ID
const errorHandle = require("./errorHandle");
const successHandle = require("./successHandle");
const headers = require("./header");

// 資料持久化：將 todos 存進 JSON 檔案，重啟後資料不遺失
const DB_PATH = "./todos.json";

function loadTodos() {
	try {
		const raw = fs.readFileSync(DB_PATH, "utf8");
		return JSON.parse(raw);
	} catch {
		return []; // 檔案不存在或格式錯誤時，從空陣列開始
	}
}

function saveTodos(todos) {
	fs.writeFileSync(DB_PATH, JSON.stringify(todos, null, 2), "utf8");
}

//如果不需要持久化，可以直接用 const todos = [];，資料存在記憶體，重啟就清空。
const todos = loadTodos(); // 伺服器啟動時載入資料

const MAX_BODY_SIZE = 1 * 1024 * 1024; // 1MB 安全限制

const requestListener = function (req, res) {
	let body = "";
	let bodyTooLarge = false;

	// 接收 request body（資料會分批送達，用 data 事件累積）
	req.on("data", (chunk) => {
		body += chunk;
		if (body.length > MAX_BODY_SIZE) {
			bodyTooLarge = true;
			req.destroy();
			errorHandle(res, "Request body 超過大小限制（1MB）");
		}
	});

	// ─────────────────────  路由判斷 ───────────────────────────────
	// GET /todos ：取得所有待辦事項
	if (req.url === "/todos" && req.method === "GET") {
		successHandle(res, todos);

		// POST /todos ── 新增一筆待辦事項
	} else if (req.url === "/todos" && req.method === "POST") {
		req.on("end", () => {
			// 若 body 過大已提前中止並回應，這裡直接返回，避免重複呼叫 res.end()
			if (bodyTooLarge) return;

			try {
				const { title } = JSON.parse(body);
				// 同時擋空字串和純空白
				if (title !== undefined && title.trim() !== "") {
					const todo = { title, id: uuidv4() };
					todos.push(todo);
					saveTodos(todos);
					successHandle(res, todos);
				} else {
					errorHandle(res, "請填寫 title 欄位");
				}
			} catch {
				// JSON.parse 失敗代表 body 格式不合法
				errorHandle(res, "Request body 格式錯誤，請確認是否為合法 JSON");
			}
		});

		// DELETE /todos ：清空所有待辦事項
	} else if (req.url === "/todos" && req.method === "DELETE") {
		todos.length = 0; // 清空陣列（不能 todos = []，因為是 const宣告不能重新賦值，但可以修改陣列內容，且其他地方若有保留參考也會同步清空）
		saveTodos(todos);
		successHandle(res, todos);

		// DELETE /todos/:id ：刪除單筆待辦事項
	} else if (req.url.startsWith("/todos/") && req.method === "DELETE") {
		const id = req.url.split("/").pop();
		const index = todos.findIndex((todo) => todo.id === id);

		if (index !== -1) {
			todos.splice(index, 1); // 從 index 位置移除 1 筆
			saveTodos(todos);
			successHandle(res, todos);
		} else {
			errorHandle(res, `找不到 id 為 "${id}" 的待辦事項`);
		}

		// PATCH /todos/:id ：更新單筆待辦事項的 title
	} else if (req.url.startsWith("/todos/") && req.method === "PATCH") {
		req.on("end", () => {
			if (bodyTooLarge) return;

			try {
				const { title } = JSON.parse(body);
				const id = req.url.split("/").pop();
				const index = todos.findIndex((todo) => todo.id === id);

				// 先算出 titleValid，避免重複判斷邏輯
				const titleValid = title !== undefined && title.trim() !== "";
				if (titleValid && index !== -1) {
					todos[index].title = title;
					saveTodos(todos);
					successHandle(res, todos);
				} else if (!titleValid) {
					errorHandle(res, "請填寫 title 欄位");
				} else {
					errorHandle(res, `找不到 id 為 "${id}" 的待辦事項`);
				}
			} catch {
				errorHandle(res, "Request body 格式錯誤，請確認是否為合法 JSON");
			}
		});
	} else if (req.method === "OPTIONS") {
		res.writeHead(200, headers);
		res.end();
	} else {
		res.writeHead(404, headers);
		res.write(JSON.stringify({ status: "error", message: "無此網站路由" }));
		res.end();
	}
};

const server = http.createServer(requestListener);
server.listen(process.env.PORT || 3005);
