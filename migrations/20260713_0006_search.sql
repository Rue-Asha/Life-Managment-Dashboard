-- Brick 8: global search (spec: FTS5). One index table over all modules,
-- kept in sync by triggers; document bodies flow in via the documents table.

CREATE VIRTUAL TABLE search_fts USING fts5(
  kind UNINDEXED,
  ref_id UNINDEXED,
  title,
  body,
  tokenize = 'unicode61 remove_diacritics 2'
);

-- Backfill existing rows.
INSERT INTO search_fts (kind, ref_id, title, body)
  SELECT 'task', id, title, '' FROM tasks;
INSERT INTO search_fts (kind, ref_id, title, body)
  SELECT 'uni_task', id, title, '' FROM uni_tasks;
INSERT INTO search_fts (kind, ref_id, title, body)
  SELECT 'class', id, name, COALESCE(professor, '') FROM classes;
INSERT INTO search_fts (kind, ref_id, title, body)
  SELECT 'note', n.id, n.title, COALESCE(d.text_plain, '')
  FROM notes n LEFT JOIN documents d ON d.id = n.document_id;
INSERT INTO search_fts (kind, ref_id, title, body)
  SELECT 'project', p.id, p.name,
         COALESCE(p.description, '') || ' ' || COALESCE(p.tech_stack, '') || ' ' || COALESCE(d.text_plain, '')
  FROM projects p LEFT JOIN documents d ON d.id = p.document_id;

-- tasks
CREATE TRIGGER trg_search_tasks_ai AFTER INSERT ON tasks BEGIN
  INSERT INTO search_fts (kind, ref_id, title, body) VALUES ('task', new.id, new.title, '');
END;
CREATE TRIGGER trg_search_tasks_au AFTER UPDATE OF title ON tasks BEGIN
  UPDATE search_fts SET title = new.title WHERE kind = 'task' AND ref_id = new.id;
END;
CREATE TRIGGER trg_search_tasks_ad AFTER DELETE ON tasks BEGIN
  DELETE FROM search_fts WHERE kind = 'task' AND ref_id = old.id;
END;

-- uni_tasks
CREATE TRIGGER trg_search_uni_ai AFTER INSERT ON uni_tasks BEGIN
  INSERT INTO search_fts (kind, ref_id, title, body) VALUES ('uni_task', new.id, new.title, '');
END;
CREATE TRIGGER trg_search_uni_au AFTER UPDATE OF title ON uni_tasks BEGIN
  UPDATE search_fts SET title = new.title WHERE kind = 'uni_task' AND ref_id = new.id;
END;
CREATE TRIGGER trg_search_uni_ad AFTER DELETE ON uni_tasks BEGIN
  DELETE FROM search_fts WHERE kind = 'uni_task' AND ref_id = old.id;
END;

-- classes
CREATE TRIGGER trg_search_classes_ai AFTER INSERT ON classes BEGIN
  INSERT INTO search_fts (kind, ref_id, title, body)
  VALUES ('class', new.id, new.name, COALESCE(new.professor, ''));
END;
CREATE TRIGGER trg_search_classes_au AFTER UPDATE ON classes BEGIN
  UPDATE search_fts SET title = new.name, body = COALESCE(new.professor, '')
  WHERE kind = 'class' AND ref_id = new.id;
END;
CREATE TRIGGER trg_search_classes_ad AFTER DELETE ON classes BEGIN
  DELETE FROM search_fts WHERE kind = 'class' AND ref_id = old.id;
END;

-- notes
CREATE TRIGGER trg_search_notes_ai AFTER INSERT ON notes BEGIN
  INSERT INTO search_fts (kind, ref_id, title, body) VALUES ('note', new.id, new.title, '');
END;
CREATE TRIGGER trg_search_notes_au AFTER UPDATE OF title ON notes BEGIN
  UPDATE search_fts SET title = new.title WHERE kind = 'note' AND ref_id = new.id;
END;
CREATE TRIGGER trg_search_notes_ad AFTER DELETE ON notes BEGIN
  DELETE FROM search_fts WHERE kind = 'note' AND ref_id = old.id;
END;

-- projects
CREATE TRIGGER trg_search_projects_ai AFTER INSERT ON projects BEGIN
  INSERT INTO search_fts (kind, ref_id, title, body)
  VALUES ('project', new.id, new.name, COALESCE(new.description, '') || ' ' || COALESCE(new.tech_stack, ''));
END;
CREATE TRIGGER trg_search_projects_au AFTER UPDATE ON projects BEGIN
  UPDATE search_fts SET title = new.name,
    body = COALESCE(new.description, '') || ' ' || COALESCE(new.tech_stack, '') || ' ' ||
           COALESCE((SELECT text_plain FROM documents WHERE id = new.document_id), '')
  WHERE kind = 'project' AND ref_id = new.id;
END;
CREATE TRIGGER trg_search_projects_ad AFTER DELETE ON projects BEGIN
  DELETE FROM search_fts WHERE kind = 'project' AND ref_id = old.id;
END;

-- documents: push the fresh text into the owning note/project row.
CREATE TRIGGER trg_search_documents_au AFTER UPDATE OF text_plain ON documents BEGIN
  UPDATE search_fts SET body = new.text_plain
  WHERE kind = 'note' AND ref_id = (SELECT id FROM notes WHERE document_id = new.id);
  UPDATE search_fts
  SET body = (SELECT COALESCE(p.description, '') || ' ' || COALESCE(p.tech_stack, '')
              FROM projects p WHERE p.document_id = new.id) || ' ' || new.text_plain
  WHERE kind = 'project' AND ref_id = (SELECT id FROM projects WHERE document_id = new.id);
END;
