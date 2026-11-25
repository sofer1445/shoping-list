CREATE OR REPLACE FUNCTION public.prevent_duplicate_shopping_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  normalized_name text;
BEGIN
  IF COALESCE(NEW.archived, false) THEN
    RETURN NEW;
  END IF;

  normalized_name := lower(regexp_replace(btrim(normalize(NEW.name, NFKC)), '\s+', ' ', 'g'));

  IF TG_OP = 'UPDATE' THEN
    IF NEW.list_id = OLD.list_id
      AND COALESCE(NEW.archived, false) = COALESCE(OLD.archived, false)
      AND normalized_name = lower(regexp_replace(btrim(normalize(OLD.name, NFKC)), '\s+', ' ', 'g')) THEN
      RETURN NEW;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.shopping_lists
    WHERE id = NEW.list_id AND COALESCE(archived, false) = false
  ) THEN
    RETURN NEW;
  END IF;

  -- Serialize future item-entry operations per list, including concurrent household writes.
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.list_id::text, 0));

  IF EXISTS (
    SELECT 1 FROM public.shopping_items existing
    WHERE existing.list_id = NEW.list_id
      AND existing.id <> NEW.id
      AND COALESCE(existing.archived, false) = false
      AND lower(regexp_replace(btrim(normalize(existing.name, NFKC)), '\s+', ' ', 'g')) = normalized_name
  ) THEN
    RAISE EXCEPTION 'shopping_item_duplicate'
      USING ERRCODE = '23505', CONSTRAINT = 'shopping_items_unique_active_name';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_duplicate_shopping_item
BEFORE INSERT OR UPDATE OF name, list_id, archived ON public.shopping_items
FOR EACH ROW EXECUTE FUNCTION public.prevent_duplicate_shopping_item();