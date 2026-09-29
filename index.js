const express = require("express");
const path = require("path");
let app = express();
// 从pg package取得Pool
const { Pool } = require("pg");

// 读取.env文件中的环境变量
require("dotenv").config();

// 使用DATABASE_URL创建数据库连接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // 使用SSL加密连接
  ssl: {
    rejectUnauthorized: false,
  },
});

app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
// 当客户端发送GET /posts时，读取所有posts
app.get("/posts", async (req, res) => {
  try {
    // 执行SQL，取得posts table里的所有资料
    const result = await pool.query(
      "SELECT * FROM posts"
    );

    // 把查询到的所有rows作为JSON返回
    res.json(result.rows);
  } catch (error) {
    // 在服务器Terminal显示真正的错误
    console.error(error);

    // 向客户端返回500服务器错误
    res.status(500).json({
      error: "Something went wrong",
    });
  }
});
app.get("/posts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM posts WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});
app.post("/posts", async (req, res) => {
  const { title, content, author } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO posts (title, content, author) VALUES ($1, $2, $3) RETURNING *",
      [title, content, author],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});
app.patch("/posts/:id", async (req, res) => {
  const { id } = req.params;
  const { title, content, author } = req.body;

  try {
    const result = await pool.query(
      "UPDATE posts SET title = $1, content = $2, author = $3 WHERE id = $4 RETURNING *",
      [title, content, author, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});
app.delete("/posts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM posts WHERE id = $1 RETURNING *",
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json({ message: "Post deleted", post: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(3000, () => {
  console.log("App is listening on port 3000");
});
