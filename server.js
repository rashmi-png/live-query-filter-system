const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const db = new sqlite3.Database("./catalog.db");

// Create catalog table
db.run(`
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL
    )
`, (err) => {

    if (err) {
        console.error("Database error:", err);
        return;
    }

    console.log("Catalog table ready.");

    // Add 250 records only when database is empty
    db.get("SELECT COUNT(*) AS count FROM products", (err, row) => {

        if (err) {
            console.error("Count error:", err);
            return;
        }

        if (row.count === 0) {

            const categories = [
                "Electronics",
                "Books",
                "Clothing",
                "Home",
                "Sports"
            ];

            const stmt = db.prepare(
                "INSERT INTO products (name, category, description) VALUES (?, ?, ?)"
            );

            for (let i = 1; i <= 250; i++) {

                const category = categories[(i - 1) % categories.length];

                const name = `${category} Product ${i}`;

                const description =
                    `High quality ${category.toLowerCase()} item for everyday use.`;

                stmt.run(name, category, description);
            }

            stmt.finalize(() => {
                console.log("250 catalog records added.");
            });
        }
    });
});


// Search API
app.get("/api/search", (req, res) => {

    const search = req.query.search || "";
    const category = req.query.category || "All";
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(
        Math.max(parseInt(req.query.limit) || 12, 1),
        50
    );

    const offset = (page - 1) * limit;

    let where = [];
    let params = [];

    // Search filter
    if (search) {
        where.push("(name LIKE ? OR description LIKE ?)");
        params.push(`%${search}%`, `%${search}%`);
    }

    // Category filter
    if (category && category !== "All") {
        where.push("category = ?");
        params.push(category);
    }

    const whereClause =
        where.length > 0
            ? "WHERE " + where.join(" AND ")
            : "";

    // Get total number of matching records
    db.get(
        `SELECT COUNT(*) AS total FROM products ${whereClause}`,
        params,
        (err, countRow) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            // Get current page
            db.all(
                `
                SELECT *
                FROM products
                ${whereClause}
                ORDER BY id ASC
                LIMIT ? OFFSET ?
                `,
                [...params, limit, offset],
                (err, rows) => {

                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    res.json({
                        results: rows,
                        total: countRow.total,
                        page: page,
                        limit: limit,
                        totalPages: Math.ceil(
                            countRow.total / limit
                        )
                    });
                }
            );
        }
    );
});


// Start server
app.listen(PORT, () => {
    console.log(
        `Live Query Filter System running on http://localhost:${PORT}`
    );
});