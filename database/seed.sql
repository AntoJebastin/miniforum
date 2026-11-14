-- ========================================================
-- MiniForum Sample Data Seed Script (SQLite)
-- Note: You can also run 'python backend/db.py' which automatically
-- seeds the database with hashed passwords.
-- ========================================================

-- Categories
INSERT OR IGNORE INTO categories (id, name, slug, description, icon, color) VALUES
(1, 'Technology', 'technology', 'Latest trends in software, hardware, and artificial intelligence.', 'Cpu', 'orange'),
(2, 'Programming', 'programming', 'Discussions, tips, code snippets, and software engineering debates.', 'Code', 'blue'),
(3, 'Web Development', 'webdev', 'HTML, CSS, JS, React, Node, backend architectures, and modern web.', 'Globe', 'emerald'),
(4, 'Ask Reddit', 'askreddit', 'Thought-provoking questions, personal stories, and community advice.', 'HelpCircle', 'purple'),
(5, 'Gaming', 'gaming', 'Video games, PC builds, game releases, and nostalgic reviews.', 'Gamepad2', 'rose'),
(6, 'UI / UX Design', 'design', 'Interface aesthetics, user research, typography, and wireframes.', 'Palette', 'amber');
