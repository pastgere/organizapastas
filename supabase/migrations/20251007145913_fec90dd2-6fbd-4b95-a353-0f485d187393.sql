-- Add stable position ordering for topics
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS position integer;

-- Backfill existing rows with a stable order per folder by created_at
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY folder_id ORDER BY created_at ASC) AS rn
  FROM public.topics
)
UPDATE public.topics t
SET position = o.rn
FROM ordered o
WHERE t.id = o.id AND t.position IS NULL;

-- Helpful index for ordering within a folder
CREATE INDEX IF NOT EXISTS idx_topics_folder_position ON public.topics(folder_id, position);
