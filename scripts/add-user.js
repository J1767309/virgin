require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease set these in your .env.local file');
  process.exit(1);
}

async function addUser() {
  // Get user details from command line arguments or set defaults
  const email = process.argv[2] || 'user@example.com';
  const password = process.argv[3] || 'ChangeThisPassword123!';
  const fullName = process.argv[4] || 'New User';

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  console.log(`Creating user: ${fullName} (${email})...`)

  // Create auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
  })

  if (authError) {
    console.error('Error creating auth user:', authError.message)
    return
  }

  console.log('Auth user created with ID:', authUser.user.id)

  // Insert user record into users table
  const { data: userData, error: userError } = await supabase.from('users').insert({
    id: authUser.user.id,
    email: email,
    full_name: fullName,
    role: 'viewer',
    scope: 'corporate',
  }).select().single()

  if (userError) {
    console.error('Error inserting user record:', userError.message)
    return
  }

  console.log('User record created successfully!')
  console.log('User details:', userData)
}

addUser()
