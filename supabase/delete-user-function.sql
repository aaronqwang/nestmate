-- Function to delete auth user (must be run by authenticated user deleting their own account)
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete the auth user (only allow users to delete themselves)
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
