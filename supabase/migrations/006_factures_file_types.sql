-- Migration 006: Expand factures file_type constraint to accept all document types
-- Idempotent: safe to run multiple times

DO $$
BEGIN
  -- Drop existing constraint
  ALTER TABLE public.factures DROP CONSTRAINT IF EXISTS factures_file_type_check;

  -- Add new constraint with all supported file types
  ALTER TABLE public.factures ADD CONSTRAINT factures_file_type_check
    CHECK (file_type IN ('pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'xlsx', 'xls', 'doc', 'docx', 'csv', 'txt'));
END $$;
