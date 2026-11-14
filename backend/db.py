import os
import sqlite3
from werkzeug.security import generate_password_hash

# Determine database path robustly
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_DIR = os.path.join(BASE_DIR, "database")
DB_PATH = os.environ.get("DATABASE_PATH", os.path.join(DATABASE_DIR, "miniforum.db"))
SCHEMA_PATH = os.path.join(DATABASE_DIR, "schema.sql")

# Embedded SQL schema fallback in case schema.sql cannot be reached
DEFAULT_SCHEMA = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL COLLATE NOCASE,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    avatar_url TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT DEFAULT '',
    icon TEXT DEFAULT 'Hash',
    color TEXT DEFAULT 'orange',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    vote_type INTEGER NOT NULL CHECK (vote_type IN (-1, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_votes_post ON votes(post_id);
"""

def get_db_connection():
    db_dir = os.path.dirname(DB_PATH)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    db_dir = os.path.dirname(DB_PATH)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    with get_db_connection() as conn:
        if os.path.exists(SCHEMA_PATH):
            with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
                conn.executescript(f.read())
        else:
            conn.executescript(DEFAULT_SCHEMA)
        conn.commit()

def seed_db():
    """Populates the database with realistic sample categories, users, posts, comments, and votes."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Check if already seeded
        cursor.execute("SELECT COUNT(*) as count FROM users")
        if cursor.fetchone()["count"] > 0:
            return

        print("Seeding database with initial sample data...")

        # 1. Seed Categories
        categories = [
            ("Technology", "technology", "Latest trends in software, hardware, and artificial intelligence.", "Cpu", "orange"),
            ("Programming", "programming", "Discussions, tips, code snippets, and software engineering debates.", "Code", "blue"),
            ("Web Development", "webdev", "HTML, CSS, JS, React, Node, backend architectures, and modern web.", "Globe", "emerald"),
            ("Ask Reddit", "askreddit", "Thought-provoking questions, personal stories, and community advice.", "HelpCircle", "purple"),
            ("Gaming", "gaming", "Video games, PC builds, game releases, and nostalgic reviews.", "Gamepad2", "rose"),
            ("UI / UX Design", "design", "Interface aesthetics, user research, typography, and wireframes.", "Palette", "amber")
        ]
        cursor.executemany(
            "INSERT INTO categories (name, slug, description, icon, color) VALUES (?, ?, ?, ?, ?)",
            categories
        )

        # 2. Seed Users (password is 'password123' for all demo accounts)
        pwd_hash = generate_password_hash("password123")
        users = [
            ("demo_user", "demo@miniforum.com", pwd_hash, "https://api.dicebear.com/7.x/bottts/svg?seed=demo_user", "MiniForum enthusiast and full-stack explorer!"),
            ("alex_dev", "alex@example.com", pwd_hash, "https://api.dicebear.com/7.x/bottts/svg?seed=alex_dev", "Python & React fanatic. Building scalable cloud apps."),
            ("sarah_coder", "sarah@example.com", pwd_hash, "https://api.dicebear.com/7.x/bottts/svg?seed=sarah_coder", "Frontend architect passionate about CSS & sleek design."),
            ("tech_guru", "guru@example.com", pwd_hash, "https://api.dicebear.com/7.x/bottts/svg?seed=tech_guru", "Tech reviewer, hardware tinkerer, Linux user."),
            ("elena_ux", "elena@example.com", pwd_hash, "https://api.dicebear.com/7.x/bottts/svg?seed=elena_ux", "Design systems lead. Making interfaces intuitive.")
        ]
        cursor.executemany(
            "INSERT INTO users (username, email, password_hash, avatar_url, bio) VALUES (?, ?, ?, ?, ?)",
            users
        )

        # Fetch IDs for references
        cat_map = {row["slug"]: row["id"] for row in cursor.execute("SELECT id, slug FROM categories").fetchall()}
        user_map = {row["username"]: row["id"] for row in cursor.execute("SELECT id, username FROM users").fetchall()}

        # 3. Seed Posts
        posts = [
            (
                "Why Vite has completely replaced Create React App in 2025/2026",
                "Remember when waiting 45 seconds for Webpack dev server to reload was normal? Vite's instant native ES module bundling and lightning-fast HMR have fundamentally transformed developer productivity. What features of Vite do you appreciate most in your daily workflow?",
                cat_map["webdev"],
                user_map["sarah_coder"]
            ),
            (
                "What is the single best programming advice you've ever received?",
                "Early in my career, a senior principal engineer told me: 'Make it work, make it right, make it fast — in that exact order.' It saved me from premature optimization hundreds of times. What's the best advice that stuck with you?",
                cat_map["programming"],
                user_map["alex_dev"]
            ),
            (
                "The rise of local open-weights AI models running on consumer hardware",
                "With quantization methods and compact LLM architectures, we are now routinely running high-performance models locally on 16GB GPUs without sharing sensitive data with third parties. Is your team adopting local inference for development or code review?",
                cat_map["technology"],
                user_map["tech_guru"]
            ),
            (
                "What is your all-time favorite single-player RPG and why?",
                "From The Witcher 3 to Elden Ring, Baldur's Gate 3 to Chrono Trigger, single-player role-playing games offer unmatched storytelling depth. If you had to pick one to replay for the first time, which would it be?",
                cat_map["gaming"],
                user_map["demo_user"]
            ),
            (
                "Common UI/UX micro-interactions that make applications feel premium",
                "Subtle spring physics on buttons, optimistic UI updates, skeleton loaders with gentle shimmer, and contextual hover hints elevate an ordinary interface into a delightful experience. What micro-interaction always catches your eye?",
                cat_map["design"],
                user_map["elena_ux"]
            ),
            (
                "If you could add one native feature to Python 4, what would it be?",
                "Python's syntax is famously readable, but with true optional static typing, pattern matching enhancements, or full no-GIL execution, what would be on your wishlist for the future of the language?",
                cat_map["programming"],
                user_map["alex_dev"]
            )
        ]

        cursor.executemany(
            "INSERT INTO posts (title, content, category_id, user_id) VALUES (?, ?, ?, ?)",
            posts
        )

        post_rows = cursor.execute("SELECT id, title FROM posts").fetchall()
        p1, p2, p3, p4, p5, p6 = [r["id"] for r in post_rows]

        # 4. Seed Comments
        comments = [
            (p1, user_map["alex_dev"], "The sub-second Hot Module Replacement (HMR) alone makes going back to older bundlers feel painful!"),
            (p1, user_map["tech_guru"], "Also Vite plugins ecosystem with Rollup compatibility is super frictionless."),
            (p2, user_map["sarah_coder"], "Mine was: 'Read the error message carefully before googling.' Most of the time, the stack trace points directly to line and reason!"),
            (p2, user_map["elena_ux"], "'Write code for the human who maintains it 6 months later, who might be you with amnesia.'"),
            (p3, user_map["alex_dev"], "Ollama + local embedding models have completely changed how we build local vector search apps."),
            (p4, user_map["sarah_coder"], "Baldur's Gate 3! The sheer volume of player agency and branching paths is unbelievable."),
            (p5, user_map["alex_dev"], "Optimistic UI for upvotes and likes is huge. You don't want a network spinner every time someone clicks upvote."),
            (p6, user_map["tech_guru"], "The free-threaded Python 3.13/3.14 build with no GIL is already solving high-concurrency CPU tasks.")
        ]

        cursor.executemany(
            "INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)",
            comments
        )

        # 5. Seed Votes
        votes = [
            (p1, user_map["demo_user"], 1),
            (p1, user_map["alex_dev"], 1),
            (p1, user_map["tech_guru"], 1),
            (p2, user_map["sarah_coder"], 1),
            (p2, user_map["demo_user"], 1),
            (p2, user_map["tech_guru"], 1),
            (p2, user_map["elena_ux"], 1),
            (p3, user_map["demo_user"], 1),
            (p3, user_map["sarah_coder"], 1),
            (p4, user_map["alex_dev"], 1),
            (p4, user_map["elena_ux"], 1),
            (p5, user_map["demo_user"], 1),
            (p5, user_map["alex_dev"], 1),
            (p5, user_map["sarah_coder"], 1),
            (p6, user_map["demo_user"], 1)
        ]

        cursor.executemany(
            "INSERT INTO votes (post_id, user_id, vote_type) VALUES (?, ?, ?)",
            votes
        )

        conn.commit()
        print("Database seeded successfully!")

if __name__ == "__main__":
    init_db()
    seed_db()
