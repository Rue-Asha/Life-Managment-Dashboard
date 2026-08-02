-- Notes get a block editor: `doc` holds the Tiptap document as JSON, `body`
-- stays and from now on carries the plain text derived from it (search,
-- excerpts on the overview, word count).
--
-- Existing notes keep their plain text and get `doc = ''`; the server builds a
-- document from it on read (paragraphs split on blank lines). The JSON is only
-- persisted on the next save — so nothing is lost, even if an old note is never
-- touched again.
ALTER TABLE notes ADD COLUMN doc TEXT NOT NULL DEFAULT '';
