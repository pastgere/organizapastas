-- Add UPDATE policy to attachments table
CREATE POLICY "Users can update attachments in own topics"
ON public.attachments
FOR UPDATE
USING (EXISTS (
  SELECT 1
  FROM topics
  JOIN folders ON folders.id = topics.folder_id
  WHERE topics.id = attachments.topic_id
  AND folders.user_id = auth.uid()
));