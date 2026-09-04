CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE invitation_response AS ENUM ('pending', 'accepted', 'maybe', 'declined');

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'user',
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_avatar_url TEXT,
  body TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT 'Your neighborhood',
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE comments (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE invitations (
  id BIGSERIAL PRIMARY KEY,
  recipient_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  host_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  host_name TEXT NOT NULL,
  title TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  event_at TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  response invitation_response NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX posts_created_at_idx ON posts(created_at DESC);
CREATE INDEX comments_post_id_idx ON comments(post_id);
CREATE INDEX invitations_recipient_idx ON invitations(recipient_user_id, event_at);

INSERT INTO posts (author_name, body, location, likes_count, created_at) VALUES
('Linda Miller', 'I have extra tomatoes from the garden. Happy to leave a bag on the porch for anyone who would like some.', '2 blocks away', 18, '2026-09-02T20:52:55.847Z'),
('Robert Davis', 'Does anyone have a handyman they trust for a small porch repair? I would appreciate a recommendation.', 'Maple Street', 9, '2026-09-02T19:47:55.847Z'),
('Carol Thompson', 'Walking group meets Saturday at 9:00 AM by the community center. Easy pace. Everyone is welcome!', 'Oak Ridge', 26, '2026-09-02T17:47:55.847Z');

INSERT INTO comments (post_id, author_name, body, created_at)
SELECT id, 'Mary Wilson', 'I would love some tomatoes, Linda. Thank you!', '2026-09-02T21:07:55.847Z'
FROM posts WHERE author_name = 'Linda Miller' LIMIT 1;
