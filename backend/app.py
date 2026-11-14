import os
import re
import datetime
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt
from werkzeug.security import generate_password_hash, check_password_hash

from db import get_db_connection, init_db, seed_db

app = Flask(__name__)

# Configuration
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "miniforum-super-secret-key-change-in-prod-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 72

# Enable CORS for React frontend (Vite port 5173, Vercel, Netlify, or any origin)
CORS(app, resources={r"/*": {"origins": "*"}})

# Ensure database is created and seeded on startup
init_db()
seed_db()

EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w+$"

# ============================================================================
# Auth Helpers & Decorators
# ============================================================================

def create_jwt_token(user_id):
    """Generates a signed JWT token valid for 72 hours."""
    payload = {
        "user_id": user_id,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.datetime.utcnow()
    }
    return jwt.encode(payload, app.config["SECRET_KEY"], algorithm=JWT_ALGORITHM)

def get_current_user_from_header():
    """Extracts and verifies JWT token from Authorization header if present."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=[JWT_ALGORITHM])
        with get_db_connection() as conn:
            user = conn.execute(
                "SELECT id, username, email, avatar_url, bio, created_at FROM users WHERE id = ?",
                (data["user_id"],)
            ).fetchone()
            return dict(user) if user else None
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, Exception):
        return None

def token_required(f):
    """Decorator to enforce authenticated requests."""
    @wraps(f)
    def decorated(*args, **kwargs):
        current_user = get_current_user_from_header()
        if not current_user:
            return jsonify({"error": "Authentication token is missing or invalid. Please log in."}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# ============================================================================
# Authentication Routes
# ============================================================================

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    # Validations
    if not username or len(username) < 3 or len(username) > 25:
        return jsonify({"error": "Username must be between 3 and 25 characters."}), 400
    if not re.match(r"^[a-zA-Z0-9_]+$", username):
        return jsonify({"error": "Username can only contain alphanumeric characters and underscores."}), 400
    if not email or not re.match(EMAIL_REGEX, email):
        return jsonify({"error": "Please provide a valid email address."}), 400
    if not password or len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long."}), 400

    avatar_url = f"https://api.dicebear.com/7.x/bottts/svg?seed={username}"

    with get_db_connection() as conn:
        cursor = conn.cursor()
        # Check if username exists
        existing_user = cursor.execute(
            "SELECT id FROM users WHERE username = ? COLLATE NOCASE", (username,)
        ).fetchone()
        if existing_user:
            return jsonify({"error": "Username is already taken. Please choose another."}), 409

        # Check if email exists
        existing_email = cursor.execute(
            "SELECT id FROM users WHERE email = ? COLLATE NOCASE", (email,)
        ).fetchone()
        if existing_email:
            return jsonify({"error": "An account with this email already exists."}), 409

        # Hash password and insert
        hashed_password = generate_password_hash(password)
        cursor.execute(
            "INSERT INTO users (username, email, password_hash, avatar_url, bio) VALUES (?, ?, ?, ?, ?)",
            (username, email, hashed_password, avatar_url, "Excited to join MiniForum!")
        )
        user_id = cursor.lastrowid
        conn.commit()

        token = create_jwt_token(user_id)
        user_data = {
            "id": user_id,
            "username": username,
            "email": email,
            "avatar_url": avatar_url,
            "bio": "Excited to join MiniForum!",
            "created_at": datetime.datetime.utcnow().isoformat()
        }
        return jsonify({
            "message": "User registered successfully!",
            "user": user_data,
            "token": token
        }), 201

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    identifier = (data.get("identifier") or data.get("email") or "").strip()
    password = data.get("password") or ""

    if not identifier or not password:
        return jsonify({"error": "Please provide username/email and password."}), 400

    with get_db_connection() as conn:
        user = conn.execute(
            "SELECT id, username, email, password_hash, avatar_url, bio, created_at FROM users WHERE email = ? COLLATE NOCASE OR username = ? COLLATE NOCASE",
            (identifier.lower(), identifier)
        ).fetchone()

        if not user or not check_password_hash(user["password_hash"], password):
            return jsonify({"error": "Invalid username/email or password."}), 401

        token = create_jwt_token(user["id"])
        user_data = {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "avatar_url": user["avatar_url"],
            "bio": user["bio"],
            "created_at": user["created_at"]
        }
        return jsonify({
            "message": "Logged in successfully!",
            "user": user_data,
            "token": token
        }), 200

@app.route("/api/auth/me", methods=["GET"])
@token_required
def get_me(current_user):
    # Also fetch user stats
    with get_db_connection() as conn:
        post_count = conn.execute(
            "SELECT COUNT(*) as count FROM posts WHERE user_id = ?", (current_user["id"],)
        ).fetchone()["count"]
        comment_count = conn.execute(
            "SELECT COUNT(*) as count FROM comments WHERE user_id = ?", (current_user["id"],)
        ).fetchone()["count"]
        total_karma = conn.execute("""
            SELECT COALESCE(SUM(v.vote_type), 0) as karma
            FROM votes v
            JOIN posts p ON v.post_id = p.id
            WHERE p.user_id = ?
        """, (current_user["id"],)).fetchone()["karma"]

    return jsonify({
        "user": current_user,
        "stats": {
            "posts": post_count,
            "comments": comment_count,
            "karma": total_karma
        }
    }), 200

@app.route("/api/auth/profile", methods=["PUT"])
@token_required
def update_profile(current_user):
    data = request.get_json() or {}
    bio = data.get("bio", current_user["bio"])
    avatar_url = data.get("avatar_url", current_user["avatar_url"])

    with get_db_connection() as conn:
        conn.execute(
            "UPDATE users SET bio = ?, avatar_url = ? WHERE id = ?",
            (bio, avatar_url, current_user["id"])
        )
        conn.commit()

        updated_user = conn.execute(
            "SELECT id, username, email, avatar_url, bio, created_at FROM users WHERE id = ?",
            (current_user["id"],)
        ).fetchone()

    return jsonify({"message": "Profile updated successfully!", "user": dict(updated_user)}), 200

# ============================================================================
# Categories Routes
# ============================================================================

@app.route("/api/categories", methods=["GET"])
def get_categories():
    with get_db_connection() as conn:
        rows = conn.execute("""
            SELECT c.id, c.name, c.slug, c.description, c.icon, c.color, c.created_at,
                   COUNT(p.id) as post_count
            FROM categories c
            LEFT JOIN posts p ON c.id = p.category_id
            GROUP BY c.id
            ORDER BY post_count DESC, c.name ASC
        """).fetchall()
        categories = [dict(row) for row in rows]
    return jsonify({"categories": categories}), 200

# ============================================================================
# Posts Routes
# ============================================================================

@app.route("/api/posts", methods=["GET"])
def get_posts():
    category_filter = request.args.get("category")
    sort_by = request.args.get("sort", "latest") # latest, popular, top
    search_query = (request.args.get("search") or "").strip()
    user_id_filter = request.args.get("user_id")

    current_user = get_current_user_from_header()
    current_user_id = current_user["id"] if current_user else None

    query = """
        SELECT
            p.id, p.title, p.content, p.created_at, p.updated_at,
            u.id as author_id, u.username as author_username, u.avatar_url as author_avatar,
            c.id as category_id, c.name as category_name, c.slug as category_slug, c.icon as category_icon, c.color as category_color,
            COALESCE(SUM(v.vote_type), 0) as score,
            COUNT(DISTINCT cmt.id) as comment_count,
            COALESCE((
                SELECT vote_type FROM votes WHERE post_id = p.id AND user_id = ?
            ), 0) as user_vote
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN categories c ON p.category_id = c.id
        LEFT JOIN votes v ON p.id = v.post_id
        LEFT JOIN comments cmt ON p.id = cmt.post_id
        WHERE 1=1
    """
    params = [current_user_id]

    if category_filter:
        query += " AND (c.slug = ? OR c.id = ?)"
        params.extend([category_filter, category_filter])

    if user_id_filter:
        query += " AND p.user_id = ?"
        params.append(user_id_filter)

    if search_query:
        query += " AND (p.title LIKE ? OR p.content LIKE ?)"
        term = f"%{search_query}%"
        params.extend([term, term])

    query += " GROUP BY p.id"

    # Sorting
    if sort_by == "popular":
        # Order by score DESC, then latest
        query += " ORDER BY score DESC, p.created_at DESC"
    elif sort_by == "top":
        query += " ORDER BY score DESC"
    else: # latest default
        query += " ORDER BY p.created_at DESC"

    with get_db_connection() as conn:
        rows = conn.execute(query, params).fetchall()
        posts = []
        for r in rows:
            posts.append({
                "id": r["id"],
                "title": r["title"],
                "content": r["content"],
                "created_at": r["created_at"],
                "updated_at": r["updated_at"],
                "author": {
                    "id": r["author_id"],
                    "username": r["author_username"],
                    "avatar_url": r["author_avatar"]
                },
                "category": {
                    "id": r["category_id"],
                    "name": r["category_name"],
                    "slug": r["category_slug"],
                    "icon": r["category_icon"],
                    "color": r["category_color"]
                },
                "score": r["score"],
                "comment_count": r["comment_count"],
                "user_vote": r["user_vote"]
            })

    return jsonify({"posts": posts, "total": len(posts)}), 200

@app.route("/api/posts/<int:post_id>", methods=["GET"])
def get_post_detail(post_id):
    current_user = get_current_user_from_header()
    current_user_id = current_user["id"] if current_user else None

    query = """
        SELECT
            p.id, p.title, p.content, p.created_at, p.updated_at,
            u.id as author_id, u.username as author_username, u.avatar_url as author_avatar, u.bio as author_bio,
            c.id as category_id, c.name as category_name, c.slug as category_slug, c.icon as category_icon, c.color as category_color,
            COALESCE(SUM(v.vote_type), 0) as score,
            COUNT(DISTINCT cmt.id) as comment_count,
            COALESCE((
                SELECT vote_type FROM votes WHERE post_id = p.id AND user_id = ?
            ), 0) as user_vote
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN categories c ON p.category_id = c.id
        LEFT JOIN votes v ON p.id = v.post_id
        LEFT JOIN comments cmt ON p.id = cmt.post_id
        WHERE p.id = ?
        GROUP BY p.id
    """
    with get_db_connection() as conn:
        r = conn.execute(query, (current_user_id, post_id)).fetchone()
        if not r:
            return jsonify({"error": "Post not found."}), 404

        post = {
            "id": r["id"],
            "title": r["title"],
            "content": r["content"],
            "created_at": r["created_at"],
            "updated_at": r["updated_at"],
            "author": {
                "id": r["author_id"],
                "username": r["author_username"],
                "avatar_url": r["author_avatar"],
                "bio": r["author_bio"]
            },
            "category": {
                "id": r["category_id"],
                "name": r["category_name"],
                "slug": r["category_slug"],
                "icon": r["category_icon"],
                "color": r["category_color"]
            },
            "score": r["score"],
            "comment_count": r["comment_count"],
            "user_vote": r["user_vote"]
        }

    return jsonify({"post": post}), 200

@app.route("/api/posts", methods=["POST"])
@token_required
def create_post(current_user):
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    content = (data.get("content") or "").strip()
    category_id = data.get("category_id")

    if not title or len(title) < 5 or len(title) > 250:
        return jsonify({"error": "Post title must be between 5 and 250 characters."}), 400
    if not content or len(content) < 5:
        return jsonify({"error": "Post content must be at least 5 characters."}), 400
    if not category_id:
        return jsonify({"error": "Please select a category for this post."}), 400

    with get_db_connection() as conn:
        cursor = conn.cursor()
        # Verify category exists
        cat = cursor.execute("SELECT id FROM categories WHERE id = ?", (category_id,)).fetchone()
        if not cat:
            return jsonify({"error": "Specified category does not exist."}), 400

        cursor.execute(
            "INSERT INTO posts (title, content, category_id, user_id) VALUES (?, ?, ?, ?)",
            (title, content, category_id, current_user["id"])
        )
        new_post_id = cursor.lastrowid

        # Automatically upvote author's own post (classic Reddit behavior)
        cursor.execute(
            "INSERT INTO votes (post_id, user_id, vote_type) VALUES (?, ?, 1)",
            (new_post_id, current_user["id"])
        )
        conn.commit()

    return jsonify({"message": "Post created successfully!", "post_id": new_post_id}), 201

@app.route("/api/posts/<int:post_id>", methods=["PUT"])
@token_required
def update_post(current_user, post_id):
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    content = (data.get("content") or "").strip()
    category_id = data.get("category_id")

    if not title or len(title) < 5 or len(title) > 250:
        return jsonify({"error": "Post title must be between 5 and 250 characters."}), 400
    if not content or len(content) < 5:
        return jsonify({"error": "Post content must be at least 5 characters."}), 400

    with get_db_connection() as conn:
        post = conn.execute("SELECT id, user_id FROM posts WHERE id = ?", (post_id,)).fetchone()
        if not post:
            return jsonify({"error": "Post not found."}), 404
        if post["user_id"] != current_user["id"]:
            return jsonify({"error": "You do not have permission to edit this post."}), 403

        if category_id:
            conn.execute(
                "UPDATE posts SET title = ?, content = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (title, content, category_id, post_id)
            )
        else:
            conn.execute(
                "UPDATE posts SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (title, content, post_id)
            )
        conn.commit()

    return jsonify({"message": "Post updated successfully!"}), 200

@app.route("/api/posts/<int:post_id>", methods=["DELETE"])
@token_required
def delete_post(current_user, post_id):
    with get_db_connection() as conn:
        post = conn.execute("SELECT id, user_id FROM posts WHERE id = ?", (post_id,)).fetchone()
        if not post:
            return jsonify({"error": "Post not found."}), 404
        if post["user_id"] != current_user["id"]:
            return jsonify({"error": "You do not have permission to delete this post."}), 403

        conn.execute("DELETE FROM posts WHERE id = ?", (post_id,))
        conn.commit()

    return jsonify({"message": "Post deleted successfully."}), 200

# ============================================================================
# Voting Routes
# ============================================================================

@app.route("/api/posts/<int:post_id>/vote", methods=["POST"])
@token_required
def vote_post(current_user, post_id):
    data = request.get_json() or {}
    direction = data.get("direction")  # 1 (upvote), -1 (downvote), or 0 (remove)

    if direction not in (-1, 0, 1):
        return jsonify({"error": "Vote direction must be 1, -1, or 0."}), 400

    with get_db_connection() as conn:
        cursor = conn.cursor()
        post = cursor.execute("SELECT id FROM posts WHERE id = ?", (post_id,)).fetchone()
        if not post:
            return jsonify({"error": "Post not found."}), 404

        existing_vote = cursor.execute(
            "SELECT id, vote_type FROM votes WHERE post_id = ? AND user_id = ?",
            (post_id, current_user["id"])
        ).fetchone()

        if direction == 0:
            if existing_vote:
                cursor.execute("DELETE FROM votes WHERE id = ?", (existing_vote["id"],))
            new_user_vote = 0
        elif existing_vote:
            if existing_vote["vote_type"] == direction:
                # Toggle off if clicking the same vote button
                cursor.execute("DELETE FROM votes WHERE id = ?", (existing_vote["id"],))
                new_user_vote = 0
            else:
                # Switch vote
                cursor.execute(
                    "UPDATE votes SET vote_type = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?",
                    (direction, existing_vote["id"])
                )
                new_user_vote = direction
        else:
            # New vote
            cursor.execute(
                "INSERT INTO votes (post_id, user_id, vote_type) VALUES (?, ?, ?)",
                (post_id, current_user["id"], direction)
            )
            new_user_vote = direction

        conn.commit()

        # Get updated score
        score_row = cursor.execute(
            "SELECT COALESCE(SUM(vote_type), 0) as score FROM votes WHERE post_id = ?",
            (post_id,)
        ).fetchone()
        updated_score = score_row["score"]

    return jsonify({
        "message": "Vote recorded.",
        "score": updated_score,
        "user_vote": new_user_vote
    }), 200

# ============================================================================
# Comments Routes
# ============================================================================

@app.route("/api/posts/<int:post_id>/comments", methods=["GET"])
def get_comments(post_id):
    with get_db_connection() as conn:
        rows = conn.execute("""
            SELECT
                c.id, c.content, c.created_at,
                u.id as author_id, u.username as author_username, u.avatar_url as author_avatar
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.post_id = ?
            ORDER BY c.created_at ASC
        """, (post_id,)).fetchall()

        comments = []
        for r in rows:
            comments.append({
                "id": r["id"],
                "content": r["content"],
                "created_at": r["created_at"],
                "author": {
                    "id": r["author_id"],
                    "username": r["author_username"],
                    "avatar_url": r["author_avatar"]
                }
            })

    return jsonify({"comments": comments, "total": len(comments)}), 200

@app.route("/api/posts/<int:post_id>/comments", methods=["POST"])
@token_required
def add_comment(current_user, post_id):
    data = request.get_json() or {}
    content = (data.get("content") or "").strip()

    if not content or len(content) < 2:
        return jsonify({"error": "Comment content cannot be empty."}), 400

    with get_db_connection() as conn:
        cursor = conn.cursor()
        post = cursor.execute("SELECT id FROM posts WHERE id = ?", (post_id,)).fetchone()
        if not post:
            return jsonify({"error": "Post not found."}), 404

        cursor.execute(
            "INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)",
            (post_id, current_user["id"], content)
        )
        new_comment_id = cursor.lastrowid
        conn.commit()

        comment_row = cursor.execute("""
            SELECT
                c.id, c.content, c.created_at,
                u.id as author_id, u.username as author_username, u.avatar_url as author_avatar
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        """, (new_comment_id,)).fetchone()

    return jsonify({
        "message": "Comment posted!",
        "comment": {
            "id": comment_row["id"],
            "content": comment_row["content"],
            "created_at": comment_row["created_at"],
            "author": {
                "id": comment_row["author_id"],
                "username": comment_row["author_username"],
                "avatar_url": comment_row["author_avatar"]
            }
        }
    }), 201

@app.route("/api/comments/<int:comment_id>", methods=["DELETE"])
@token_required
def delete_comment(current_user, comment_id):
    with get_db_connection() as conn:
        comment = conn.execute("SELECT id, user_id FROM comments WHERE id = ?", (comment_id,)).fetchone()
        if not comment:
            return jsonify({"error": "Comment not found."}), 404
        if comment["user_id"] != current_user["id"]:
            return jsonify({"error": "You do not have permission to delete this comment."}), 403

        conn.execute("DELETE FROM comments WHERE id = ?", (comment_id,))
        conn.commit()

    return jsonify({"message": "Comment deleted successfully."}), 200

# ============================================================================
# Trending & Stats Routes (For Right Sidebar)
# ============================================================================

@app.route("/api/trending", methods=["GET"])
def get_trending():
    with get_db_connection() as conn:
        # Top 4 trending posts by score
        trending_rows = conn.execute("""
            SELECT
                p.id, p.title, p.created_at,
                c.name as category_name, c.slug as category_slug,
                COALESCE(SUM(v.vote_type), 0) as score,
                COUNT(DISTINCT cmt.id) as comment_count
            FROM posts p
            JOIN categories c ON p.category_id = c.id
            LEFT JOIN votes v ON p.id = v.post_id
            LEFT JOIN comments cmt ON p.id = cmt.post_id
            GROUP BY p.id
            ORDER BY score DESC, comment_count DESC
            LIMIT 4
        """).fetchall()

        stats_row = conn.execute("""
            SELECT
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM posts) as total_posts,
                (SELECT COUNT(*) FROM comments) as total_comments
        """).fetchone()

        trending_posts = [dict(r) for r in trending_rows]
        stats = dict(stats_row)

    return jsonify({
        "trending_posts": trending_posts,
        "community_stats": stats
    }), 200

# ============================================================================
# Root / Health Check
# ============================================================================

@app.route("/", methods=["GET", "HEAD"])
def root():
    return jsonify({
        "status": "online",
        "service": "MiniForum REST API",
        "version": "1.0.0",
        "health": "/api/health"
    }), 200

@app.route("/api/health", methods=["GET", "HEAD"])
def health():
    return jsonify({
        "status": "online",
        "service": "MiniForum REST API",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }), 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    host = os.environ.get("HOST", "0.0.0.0")
    debug = os.environ.get("FLASK_ENV") == "development"
    print(f"MiniForum API server running on http://{host}:{port}")
    app.run(host=host, port=port, debug=debug)
