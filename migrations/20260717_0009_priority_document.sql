-- Rich-text bodies for 25-5 priority descriptions: give each priority its own
-- document (ProseMirror/Tiptap), exactly like notes and projects, so the free
-- text can be authored and rendered as Markdown instead of a plain textarea.
--
-- No data copy happens here. The legacy plain-text `description` is wrapped into
-- a fresh document lazily on first load (see ensurePriorityDocument), which keeps
-- this migration trivial and avoids building ProseMirror JSON in SQL.
-- classes already carry a document_id column (see 20260713_0002_uni.sql).
ALTER TABLE priorities ADD COLUMN document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL;
