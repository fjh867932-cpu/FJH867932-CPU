-- ==========================================
-- huiwu.com — Supabase 数据库初始化
-- 在 Supabase SQL Editor 中执行此脚本
-- ==========================================

-- 便签表
CREATE TABLE IF NOT EXISTS notes (
  id         TEXT PRIMARY KEY,
  pos_x      NUMERIC(5,2) NOT NULL DEFAULT 50.00,
  pos_y      NUMERIC(5,2) NOT NULL DEFAULT 50.00,
  content    TEXT DEFAULT '',
  rolled     BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 设置表
CREATE TABLE IF NOT EXISTS settings (
  key_name   TEXT PRIMARY KEY,
  value      TEXT DEFAULT ''
);

-- 书籍表
CREATE TABLE IF NOT EXISTS books (
  id         TEXT PRIMARY KEY,
  title      TEXT DEFAULT '',
  cover_url  TEXT DEFAULT '',
  review     TEXT DEFAULT '',
  color      TEXT DEFAULT '',
  pos_x      NUMERIC(5,2) NOT NULL DEFAULT 50.00,
  pos_y      NUMERIC(5,2) NOT NULL DEFAULT 50.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 启用行级安全
ALTER TABLE notes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE books    ENABLE ROW LEVEL SECURITY;

-- 允许匿名访问
DROP POLICY IF EXISTS "allow_all_notes"    ON notes;
DROP POLICY IF EXISTS "allow_all_settings" ON settings;
DROP POLICY IF EXISTS "allow_all_books"    ON books;
CREATE POLICY "allow_all_notes"    ON notes    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_settings" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_books"    ON books    FOR ALL USING (true) WITH CHECK (true);

-- 默认背景行
INSERT INTO settings (key_name, value)
VALUES ('bg_image', '')
ON CONFLICT (key_name) DO NOTHING;
