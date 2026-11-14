import json
import unittest
from app import app

class MiniForumApiTestCase(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_01_health_check(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "online")

    def test_02_categories(self):
        res = self.client.get("/api/categories")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(len(data["categories"]) >= 6)

    def test_03_login_demo_user(self):
        res = self.client.post("/api/auth/login", json={
            "identifier": "demo_user",
            "password": "password123"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("token", data)
        self.assertEqual(data["user"]["username"], "demo_user")

    def test_04_get_posts(self):
        res = self.client.get("/api/posts?sort=popular")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(len(data["posts"]) > 0)
        self.assertIn("author", data["posts"][0])
        self.assertIn("score", data["posts"][0])

    def test_05_create_and_vote_post(self):
        # 1. Login
        login_res = self.client.post("/api/auth/login", json={
            "identifier": "demo_user",
            "password": "password123"
        })
        token = login_res.get_json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get categories to get an ID
        cats = self.client.get("/api/categories").get_json()["categories"]
        cat_id = cats[0]["id"]

        # 3. Create post
        create_res = self.client.post("/api/posts", headers=headers, json={
            "title": "Automated Unit Test Post for MiniForum",
            "content": "This is a comprehensive test post verifying the CRUD & voting pipeline.",
            "category_id": cat_id
        })
        self.assertEqual(create_res.status_code, 201)
        post_id = create_res.get_json()["post_id"]

        # 4. Downvote post
        vote_res = self.client.post(f"/api/posts/{post_id}/vote", headers=headers, json={
            "direction": -1
        })
        self.assertEqual(vote_res.status_code, 200)
        self.assertEqual(vote_res.get_json()["user_vote"], -1)

        # 5. Comment on post
        cmt_res = self.client.post(f"/api/posts/{post_id}/comments", headers=headers, json={
            "content": "Terrific discussion! Loving the MiniForum UI & API."
        })
        self.assertEqual(cmt_res.status_code, 201)
        cmt_id = cmt_res.get_json()["comment"]["id"]

        # 6. Fetch comments
        get_cmts = self.client.get(f"/api/posts/{post_id}/comments")
        self.assertEqual(get_cmts.status_code, 200)
        self.assertTrue(any(c["id"] == cmt_id for c in get_cmts.get_json()["comments"]))

        # 7. Delete comment
        del_cmt = self.client.delete(f"/api/comments/{cmt_id}", headers=headers)
        self.assertEqual(del_cmt.status_code, 200)

        # 8. Delete post
        del_post = self.client.delete(f"/api/posts/{post_id}", headers=headers)
        self.assertEqual(del_post.status_code, 200)

if __name__ == "__main__":
    unittest.main()
