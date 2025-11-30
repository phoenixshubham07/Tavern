-- Enable Realtime for direct_messages
begin;
  -- Check if the publication exists, if not create it (default in Supabase is supabase_realtime)
  -- We assume supabase_realtime exists.
  alter publication supabase_realtime add table direct_messages;
commit;
