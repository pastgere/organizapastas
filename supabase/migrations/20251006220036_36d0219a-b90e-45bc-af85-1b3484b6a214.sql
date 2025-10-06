-- Criar tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Política: Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela de pastas
CREATE TABLE public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Habilitar RLS na tabela folders
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- Políticas para folders
CREATE POLICY "Users can view own folders"
  ON public.folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders"
  ON public.folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON public.folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON public.folders FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at em folders
CREATE TRIGGER update_folders_updated_at
  BEFORE UPDATE ON public.folders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela de tópicos
CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Habilitar RLS na tabela topics
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

-- Políticas para topics (baseadas no dono da pasta)
CREATE POLICY "Users can view topics from own folders"
  ON public.topics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.folders
      WHERE folders.id = topics.folder_id
      AND folders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create topics in own folders"
  ON public.topics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.folders
      WHERE folders.id = topics.folder_id
      AND folders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update topics in own folders"
  ON public.topics FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.folders
      WHERE folders.id = topics.folder_id
      AND folders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete topics from own folders"
  ON public.topics FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.folders
      WHERE folders.id = topics.folder_id
      AND folders.user_id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at em topics
CREATE TRIGGER update_topics_updated_at
  BEFORE UPDATE ON public.topics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela de anexos
CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Habilitar RLS na tabela attachments
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Políticas para attachments (baseadas no dono do tópico/pasta)
CREATE POLICY "Users can view attachments from own topics"
  ON public.attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.topics
      JOIN public.folders ON folders.id = topics.folder_id
      WHERE topics.id = attachments.topic_id
      AND folders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create attachments in own topics"
  ON public.attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.topics
      JOIN public.folders ON folders.id = topics.folder_id
      WHERE topics.id = attachments.topic_id
      AND folders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete attachments from own topics"
  ON public.attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.topics
      JOIN public.folders ON folders.id = topics.folder_id
      WHERE topics.id = attachments.topic_id
      AND folders.user_id = auth.uid()
    )
  );

-- Criar bucket de armazenamento para arquivos
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para visualizar arquivos
CREATE POLICY "Users can view own attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Políticas de storage para fazer upload
CREATE POLICY "Users can upload own attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Políticas de storage para deletar arquivos
CREATE POLICY "Users can delete own attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );