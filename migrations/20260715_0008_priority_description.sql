-- Long-form description/notes per 25-5 priority. The short `note` stays as the
-- one-line summary on the strip; `description` holds the details, edited on the
-- new /curriculum/priorities/[id] page.

ALTER TABLE priorities ADD COLUMN description TEXT;
