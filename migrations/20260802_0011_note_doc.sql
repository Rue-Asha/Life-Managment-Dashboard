-- Notizen bekommen einen Block-Editor: `doc` hält das Tiptap-Dokument als JSON,
-- `body` bleibt bestehen und trägt ab jetzt die daraus abgeleitete Klartext-
-- Fassung (Suche, Auszüge auf der Übersicht, Wortzähler).
--
-- Bestandsnotizen behalten ihren Klartext und bekommen `doc = ''`; der Server
-- baut daraus beim Lesen ein Dokument (Absätze an Leerzeilen). Erst beim
-- nächsten Speichern wird das JSON persistiert — so geht nichts verloren, auch
-- wenn eine alte Notiz nie wieder angefasst wird.
ALTER TABLE notes ADD COLUMN doc TEXT NOT NULL DEFAULT '';
