import React from 'react';

const ProfileTest: React.FC = () => {
  console.log('ProfileTest: Component rendering');
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Test Page</h1>
        <p className="text-gray-600">This is a test page to check if the routing works.</p>
        <div className="mt-4 p-4 bg-green-100 rounded-lg">
          <p className="text-green-800">✅ Profile page is working!</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileTest;
