-- Admin Setup Script for CarIntel
-- This script updates sanderhelmink@gmail.com to have admin role

-- First check if the user exists
SELECT id, email, name, role, created_at 
FROM users 
WHERE email = 'sanderhelmink@gmail.com';

-- Update the user's role to admin
UPDATE users 
SET 
    role = 'admin',
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'sanderhelmink@gmail.com';

-- Verify the update
SELECT id, email, name, role, created_at, updated_at 
FROM users 
WHERE email = 'sanderhelmink@gmail.com';

-- Expected output: role should now be 'admin' 