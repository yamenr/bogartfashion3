const dbSingleton = require('./dbSingleton');

async function makeUserAdmin() {
  let connection;
  
  try {
    // Get database connection
    const pool = dbSingleton.getConnection();
    console.log('Connected to database successfully!');

    // First, check if the user exists
    const [users] = await pool.execute(
      'SELECT user_id, email, role FROM users WHERE email = ?',
      ['admin@gmail.com']
    );

    if (users.length === 0) {
      console.log('❌ User admin@gmail.com not found in database!');
      console.log('Available users:');
      const [allUsers] = await pool.execute('SELECT email, role FROM users');
      allUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.role})`);
      });
      return;
    }

    const user = users[0];
    console.log(`Found user: ${user.email} (Current role: ${user.role})`);

    if (user.role === 'admin') {
      console.log('✅ User is already an admin!');
      return;
    }

    // Update user to admin
    await pool.execute(
      'UPDATE users SET role = ? WHERE email = ?',
      ['admin', 'admin@gmail.com']
    );

    console.log('✅ Successfully updated admin@gmail.com to admin role!');

    // Verify the change
    const [updatedUser] = await pool.execute(
      'SELECT email, role FROM users WHERE email = ?',
      ['admin@gmail.com']
    );
    
    console.log(`Verification: ${updatedUser[0].email} is now ${updatedUser[0].role}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the function
makeUserAdmin();
