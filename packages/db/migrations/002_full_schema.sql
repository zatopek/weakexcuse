-- Full schema for Roast Board

-- Drop old users table and recreate with UUID PK linked to Supabase auth
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id         UUID PRIMARY KEY,  -- matches auth.users.id from Supabase
  email      TEXT NOT NULL UNIQUE,
  name       TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enums
CREATE TYPE incident_type AS ENUM (
  'last_minute_cancel',
  'ghosted',
  'late_af',
  'maybe_merchant',
  'weak_excuse'
);

CREATE TYPE severity AS ENUM (
  'mild',
  'bad',
  'criminal'
);

CREATE TYPE incident_status AS ENUM (
  'pending',
  'accepted',
  'confirmed',
  'disputed',
  'rejected',
  'expired'
);

CREATE TYPE group_member_role AS ENUM (
  'owner',
  'member'
);

CREATE TYPE reaction_emoji AS ENUM (
  'laugh',
  'cry',
  'skull',
  'handshake'
);

-- Groups
CREATE TABLE groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  emoji       TEXT NOT NULL DEFAULT '🔥',
  invite_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_by  UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Group members
CREATE TABLE group_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id  UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role      group_member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at   TIMESTAMPTZ,  -- non-null means frozen stats
  UNIQUE (group_id, user_id)
);

-- Incidents
CREATE TABLE incidents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id       UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  accused_id     UUID NOT NULL REFERENCES users(id),
  accuser_id     UUID NOT NULL REFERENCES users(id),
  type           incident_type NOT NULL,
  severity       severity NOT NULL DEFAULT 'mild',
  note           TEXT CHECK (char_length(note) <= 280),
  status         incident_status NOT NULL DEFAULT 'pending',
  is_self_report BOOLEAN NOT NULL GENERATED ALWAYS AS (accused_id = accuser_id) STORED,
  points         INT NOT NULL GENERATED ALWAYS AS (
    CASE severity
      WHEN 'mild' THEN 1
      WHEN 'bad' THEN 2
      WHEN 'criminal' THEN 3
    END
  ) STORED,
  expires_at     TIMESTAMPTZ NOT NULL,
  scored_at      TIMESTAMPTZ,  -- set on status transition to accepted/confirmed
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Votes (for disputed incidents)
CREATE TABLE votes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id),
  confirm     BOOLEAN NOT NULL,  -- true = confirm, false = reject
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (incident_id, user_id)
);

-- Reactions (emoji reactions on incidents)
CREATE TABLE reactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id),
  emoji       reaction_emoji NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (incident_id, user_id, emoji)
);

-- Indexes for common queries
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_incidents_group ON incidents(group_id);
CREATE INDEX idx_incidents_accused ON incidents(accused_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_expires ON incidents(expires_at) WHERE status IN ('pending', 'disputed');
CREATE INDEX idx_incidents_scored ON incidents(scored_at) WHERE scored_at IS NOT NULL;
CREATE INDEX idx_votes_incident ON votes(incident_id);
CREATE INDEX idx_reactions_incident ON reactions(incident_id);
