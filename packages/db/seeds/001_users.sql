-- Seed users
INSERT INTO users (email, name) VALUES
  ('alice@example.com', 'Alice'),
  ('bob@example.com', 'Bob')
ON CONFLICT (email) DO NOTHING;
