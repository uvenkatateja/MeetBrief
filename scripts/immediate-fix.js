// Immediate fix for user sync issue
// This will create your current user in the database with test summaries

const API_URL = 'http://localhost:3000';

async function fixUserIssue() {
  console.log('🔧 Immediate Fix for User Sync Issue');
  console.log('='.repeat(50));
  console.log('');

  try {
    console.log('1. 📡 Testing server connection...');
    
    // Test if server is running
    let response;
    try {
      response = await fetch(`${API_URL}/api/sync-user`, {
        method: 'GET'
      });
    } catch (error) {
      console.log('❌ Server not running or not accessible');
      console.log('');
      console.log('🔧 Please start your development server first:');
      console.log('   npm run dev');
      console.log('');
      console.log('Then run this script again.');
      return false;
    }

    if (!response.ok) {
      console.log('❌ API endpoint not responding correctly');
      return false;
    }

    console.log('✅ Server is running and accessible');
    console.log('');

    console.log('2. 🔄 Syncing your user account...');
    
    // Make POST request to sync user
    const syncResponse = await fetch(`${API_URL}/api/sync-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include' // Include cookies for authentication
    });

    const result = await syncResponse.json();

    if (syncResponse.ok) {
      console.log('✅ User sync successful!');
      console.log('');
      console.log('📊 Results:');
      console.log(`   👤 User: ${result.user?.name || 'User'}`);
      console.log(`   📧 Email: ${result.user?.email || 'Unknown'}`);
      console.log(`   📝 Summaries Created: ${result.summaries_created || 0}`);
      console.log(`   🔑 Clerk ID: ${result.user?.clerk_user_id || 'Unknown'}`);
      console.log('');
      
      if (result.summaries_created > 0) {
        console.log('🎉 SUCCESS! Your account now has test summaries!');
      } else {
        console.log('ℹ️  User already had summaries, no new ones created');
      }
      
      console.log('');
      console.log('🎯 Next Steps:');
      console.log('1. Refresh your browser on the summaries page');
      console.log('2. You should now see summaries instead of "No summaries found"');
      console.log('3. Try clicking on a summary to view its details');
      console.log('4. Test the email sharing functionality');
      console.log('');
      
      return true;
      
    } else {
      console.log('❌ User sync failed');
      console.log(`🔴 Error: ${result.error || 'Unknown error'}`);
      console.log(`📄 Message: ${result.message || 'No additional details'}`);
      
      if (result.error === 'Not authenticated') {
        console.log('');
        console.log('🔐 Authentication Issue:');
        console.log('1. Make sure you are logged in to your application');
        console.log('2. Open http://localhost:3000 in your browser');
        console.log('3. Sign in with Clerk');
        console.log('4. Then run this script again');
      }
      
      return false;
    }

  } catch (error) {
    console.log('💥 Unexpected error occurred:');
    console.log(error.message);
    
    if (error.message.includes('fetch')) {
      console.log('');
      console.log('🔗 Network Error:');
      console.log('1. Ensure your development server is running: npm run dev');
      console.log('2. Check that it\'s accessible at http://localhost:3000');
      console.log('3. Try refreshing your browser first');
    }
    
    return false;
  }
}

console.log('🚀 MeetBrief User Sync Fix');
console.log('This script will create your user in the database and add test summaries');
console.log('');

fixUserIssue().then((success) => {
  if (success) {
    console.log('✨ Fix completed successfully!');
    console.log('Your dashboard should now show summaries.');
  } else {
    console.log('❌ Fix failed. Please check the error messages above.');
    console.log('');
    console.log('🆘 Need help?');
    console.log('1. Make sure your .env.local file has correct DATABASE_URL');
    console.log('2. Ensure you\'re logged in to the application');
    console.log('3. Check that npm run dev is running');
  }
}).catch(error => {
  console.error('Fatal error:', error);
});
