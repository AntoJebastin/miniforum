# MiniForum – Modern Reddit-Like Community Platform 🚀

MiniForum is a modern, responsive, full-stack Reddit-inspired discussion forum. It features user authentication, discussion threads, community categorisation, an interactive voting system with real-time score updates, nested comment sections, global search, and both dark and light modes.

---

## 🛠️ Technology Stack

- **Frontend:** [React.js](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/)
- **Backend:** [Python Flask](https://flask.palletsprojects.com/) + [Flask-CORS](https://flask-cors.readthedocs.io/)
- **Authentication:** JWT (JSON Web Tokens) with secure password hashing via `werkzeug.security`
- **Database:** [SQLite](https://www.sqlite.org/) with relational integrity (Foreign Keys, cascading deletes)

---

## ✨ Core Features

### 1. 🔐 User Authentication & Profiles
- **User Registration:** Validates unique username, email format, and password length (min 6 chars).
- **User Login:** Supports login with either username or email + password. Returns JWT bearer token.
- **One-Click Demo Login:** Dedicated button in the login modal automatically fills sample credentials for quick evaluation.
- **User Profile Modal:** View user stats (Post Karma, Total Discussions, Total Comments, Join Date), edit bio inline, and manage "My Discussions".
- **Logout:** Securely invalidates client-side session.

### 2. 📝 Forum Discussions (Posts)
- **Create Post:** Post to any community (`r/technology`, `r/programming`, `r/webdev`, `r/gaming`, etc.) with title, content, and real-time character counters.
- **Edit & Delete:** Authors can edit or delete their own posts. Cascade rules automatically clean up associated comments and votes.
- **View All Posts:** Displays title, content snippet, author avatar, username (`u/username`), community badge, and human-readable relative time (e.g. `2h ago`).

### 3. 💬 Discussion Comments
- **Comment Thread:** Full comment list with user avatars, usernames, and timestamps.
- **Add Comments:** Authenticated users can post comments directly on any discussion.
- **Delete Own Comments:** Comment authors can delete their own comments with instant score/count updates.

### 4. 🔺 Dynamic Voting System (Reddit-Style)
- **Upvote & Downvote:**
  - Upvoting highlights arrow in orange (`#FF4500`) and adds `+1`.
  - Downvoting highlights arrow in blue (`#7193FF`) and adds `-1`.
  - Clicking the active vote button again toggles the vote back to neutral (`0`).
- **Optimistic UI Updates:** Vote scores update instantaneously on the frontend while syncing smoothly with the backend.
- **Author Self-Vote:** Newly created discussions automatically start with an upvote from the author (classic Reddit behavior).

### 5. 🌐 Community & Feed Navigation
- **Filter Feeds:**
  - 🔥 **Popular:** Sorted by highest net vote score.
  - 🕒 **Latest:** Sorted by most recent timestamp.
  - 🔝 **Top:** Ranked by total popularity.
- **Community Categories:** Browse by dedicated tags with custom icons (`r/technology`, `r/programming`, `r/webdev`, `r/askreddit`, `r/gaming`, `r/design`).
- **Live Search:** Instant search filter across discussion titles and body text with clear button.
- **Right Sidebar:** Displays community guidelines, total platform statistics (users, posts, comments), and top trending discussions.
- **Theme Switcher:** Seamless Dark Mode and Light Mode with system preference detection and localStorage persistence.

---

## 🗄️ Database Design

MiniForum uses SQLite with Foreign Key constraints enabled (`PRAGMA foreign_keys = ON;`).

```
 +--------------------+       +--------------------+
 |     categories     |       |       users        |
 +--------------------+       +--------------------+
 | id (PK)            |       | id (PK)            |
 | name (UNIQUE)      |       | username (UNIQUE)  |
 | slug (UNIQUE)      |       | email (UNIQUE)     |
 | description        |       | password_hash      |
 | icon, color        |       | avatar_url, bio    |
 | created_at         |       | created_at         |
 +---------+----------+       +---------+----------+
           | 1                          | 1
           |                            |
           +-------------+  +-----------+
                         |  |
                         v  v
                  +---------------+
                  |     posts     |
                  +---------------+
                  | id (PK)       |
                  | title         |
                  | content       |
                  | category_id FK|
                  | user_id FK    |
                  | created_at    |
                  | updated_at    |
                  +-------+-------+
                          |
             +------------+------------+
             | 1                       | 1
             v                         v
      +--------------+          +--------------+
      |   comments   |          |    votes     |
      +--------------+          +--------------+
      | id (PK)      |          | id (PK)      |
      | post_id (FK) |          | post_id (FK) |
      | user_id (FK) |          | user_id (FK) |
      | content      |          | vote_type    |
      | created_at   |          | created_at   |
      +--------------+          | UNIQUE(post, |
                                |        user) |
                                +--------------+
```

### Table Definitions
1. **`users`**: User credentials, profile picture, bio, creation timestamp.
2. **`categories`**: Community topics (`r/programming`), slug, description, visual icon, badge theme.
3. **`posts`**: Title, text content, author relation (`user_id`), category relation (`category_id`), timestamps.
4. **`comments`**: Comment text, post relation (`post_id`), author relation (`user_id`), timestamp.
5. **`votes`**: Vote direction (`1` for upvote, `-1` for downvote), post relation (`post_id`), user relation (`user_id`). Enforces `UNIQUE(post_id, user_id)` constraint.

---

## 📁 Project Structure

```
social media web(demo)/
├── backend/
│   ├── app.py              # Main Flask REST API application
│   ├── db.py               # SQLite connection, initialization & sample data seeder
│   ├── test_api.py         # Automated API unit tests
│   ├── requirements.txt    # Python backend dependencies
│   └── .env.example        # Environment variable template
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Top header with search, theme toggle, and auth actions
│   │   │   ├── LeftSidebar.jsx      # Navigation feeds and community list
│   │   │   ├── RightSidebar.jsx     # Community stats & trending discussions
│   │   │   ├── PostCard.jsx         # Reddit-style post card with voting gutter
│   │   │   ├── PostDetailModal.jsx  # Full discussion & interactive comments thread
│   │   │   ├── CreatePostModal.jsx  # Create and edit post dialog
│   │   │   ├── AuthModal.jsx        # Login & Registration modal with demo auto-fill
│   │   │   └── ProfileModal.jsx     # User profile, stats, and "My Discussions"
│   │   ├── context/
│   │   │   ├── AuthContext.jsx      # Global authentication & modal state management
│   │   │   └── ThemeContext.jsx     # Dark/Light mode provider
│   │   ├── utils/
│   │   │   └── format.js            # Time ago (e.g. '2h ago') & number formatting
│   │   ├── api.js                   # Axios client with JWT request interceptor
│   │   ├── App.jsx                  # Main application orchestrator
│   │   ├── main.jsx                 # React root entry
│   │   └── index.css                # Tailwind CSS v4 styling & scrollbars
│   ├── index.html                   # HTML entry point with metadata
│   ├── package.json                 # Frontend dependencies and scripts
│   └── vite.config.js               # Vite config with backend proxy and Tailwind plugin
├── database/
│   ├── schema.sql          # SQLite DDL schema creation script
│   ├── seed.sql            # Category & sample data insert script
│   └── miniforum.db        # SQLite database file (created automatically on startup)
├── .vscode/
│   ├── launch.json         # VS Code F5 Run & Debug configuration
│   └── tasks.json          # VS Code background server tasks
├── run_backend.bat         # Quick Windows launcher for Flask backend
├── run_frontend.bat        # Quick Windows launcher for React frontend
├── start_all.bat           # One-click launcher for both Frontend & Backend
└── README.md               # Complete project documentation
```

---

## 🚀 Installation and Execution Instructions

### Prerequisites
- **Python 3.8+** installed (`python --version`)
- **Node.js 18+** & **npm** installed (`node --version`)

---

### Method A: One-Click Launch (Windows)
Double-click `start_all.bat` in the project root. It will open two console windows:
1. One for the Flask backend on `http://127.0.0.1:5000`
2. One for the React frontend on `http://localhost:5173`

---

### Method B: Manual Step-by-Step Launch

#### 1. Start the Flask Backend
Open a terminal in the project directory:

```bash
# 1. Navigate to backend directory
cd backend

# 2. (Optional but recommended) Create virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Initialize and seed database (automatically runs on startup, or manually run:)
python db.py

# 5. Start Flask REST API server
python app.py
```
Backend will be live at: **`http://127.0.0.1:5000`**

#### 2. Start the React Frontend
Open a **second** terminal window:

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install npm dependencies
npm install

# 3. Start Vite dev server
npm run dev
```
Frontend will be live at: **`http://localhost:5173`**

---

## 💻 Running in Visual Studio Code (VS Code)

This repository includes pre-configured `.vscode` configurations for seamless execution in VS Code:

### Option 1: Integrated Terminal (Easiest)
1. Open the project folder in VS Code (`File -> Open Folder...`).
2. Open a new terminal (`Terminal -> New Terminal` or `` Ctrl + ` ``).
3. Split the terminal into two panes by clicking the **Split Terminal** icon (`Ctrl + Shift + 5`).
4. In Pane 1 (Backend):
   ```bash
   cd backend
   python app.py
   ```
5. In Pane 2 (Frontend):
   ```bash
   cd frontend
   npm run dev
   ```
6. Click the link in the terminal to open `http://localhost:5173` in your browser.

### Option 2: Using VS Code Tasks
1. Press `Ctrl + Shift + P` (or `Cmd + Shift + P` on macOS).
2. Type **`Tasks: Run Task`** and press Enter.
3. Select **`Run Backend (Flask)`**.
4. Repeat and select **`Run Frontend (Vite)`**.

### Option 3: Using VS Code Run & Debug
1. Go to the **Run & Debug** panel (`Ctrl + Shift + D`).
2. Select **`Python: Flask Backend`** from the dropdown.
3. Press **F5** to run the backend in debug mode with breakpoints enabled!

---

## 👥 Demo Accounts (Pre-Seeded)

The database comes pre-populated with realistic discussion threads and test user accounts:

| Username | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **`demo_user`** | `demo@miniforum.com` | `password123` | Active Member |
| **`alex_dev`** | `alex@example.com` | `password123` | Full-Stack Developer |
| **`sarah_coder`** | `sarah@example.com` | `password123` | Frontend Architect |
| **`tech_guru`** | `guru@example.com` | `password123` | Hardware & AI Reviewer |
| **`elena_ux`** | `elena@example.com` | `password123` | UI/UX Designer |

> 💡 **Tip:** When opening the Login modal in the web app, simply click the **"Auto-Fill Demo"** button to instantly populate `demo_user` and log in with one click!

---

## 🧪 Running Automated Unit Tests

A full suite of unit tests is included in `backend/test_api.py` covering authentication, authorization, CRUD posts, comment threads, vote toggling, and cascading deletions:

```bash
cd backend
python test_api.py
```

Expected output:
```
.....
----------------------------------------------------------------------
Ran 5 tests in 0.253s

OK
```

---

## 📡 REST API Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user | No |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT | No |
| `GET` | `/api/auth/me` | Get logged-in user profile & karma stats | **Yes** |
| `PUT` | `/api/auth/profile` | Update bio and avatar URL | **Yes** |
| `GET` | `/api/categories` | List all communities with post counts | No |
| `GET` | `/api/posts` | Get posts (filters: `category`, `sort`, `search`, `user_id`) | Optional |
| `GET` | `/api/posts/<id>` | Get single post details and current user vote | Optional |
| `POST` | `/api/posts` | Create a new discussion post | **Yes** |
| `PUT` | `/api/posts/<id>` | Update owned discussion post | **Yes** (Owner) |
| `DELETE` | `/api/posts/<id>` | Delete owned discussion post | **Yes** (Owner) |
| `POST` | `/api/posts/<id>/vote` | Upvote (`1`), Downvote (`-1`), or Toggle (`0`) | **Yes** |
| `GET` | `/api/posts/<id>/comments` | List all comments for a post | No |
| `POST` | `/api/posts/<id>/comments` | Add comment to a post | **Yes** |
| `DELETE` | `/api/comments/<id>` | Delete owned comment | **Yes** (Owner) |
| `GET` | `/api/trending` | Get top trending discussions & stats | No |
| `GET` | `/api/health` | API status check | No |

---

## 🎨 Design Highlights
- **Vibrant Reddit Aesthetics:** Classic upvote/downvote vertical column, community badges (`r/webdev`), author stamps (`u/username`), and clean card elevation.
- **Micro-Interactions:** Instant optimistic score transitions, toast notifications for links/actions, modal transitions, and smooth hover reactions.
- **Mobile Responsive:** Collapsible drawer menu for communities and touch-friendly mobile layouts.
- **True Dark/Light Modes:** Specially tuned dark mode (`#0b1416`) matching modern community dark themes without visual strain.
