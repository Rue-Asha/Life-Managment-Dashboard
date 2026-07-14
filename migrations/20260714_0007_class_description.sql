-- Per-class free-text description (spec follow-up): a place for more context
-- beyond the structured fields (professor, schedule, …). Editable on the class
-- detail page in its own collapsible box.

ALTER TABLE classes ADD COLUMN description TEXT;
