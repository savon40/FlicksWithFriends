ALTER TABLE sessions ADD COLUMN selected_match_id uuid REFERENCES catalog_items(id) ON DELETE SET NULL;
