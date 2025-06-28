// Test page to verify authentication bypass is working
import { verifySession, getCurrentUser } from '@/lib/dal';

export default async function TestAuthPage() {
  try {
    // This will use the bypass if DEV_DAL_BYPASS=true
    const session = await verifySession();
    const user = await getCurrentUser();

    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">🎉 Authentication Test - SUCCESS!</h1>
        
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <strong>Authentication Bypass Working!</strong>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Session Info:</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold">Current User:</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>

          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
            <strong>Next Steps:</strong>
            <ul className="list-disc list-inside mt-2">
              <li>Your authentication bypass is working correctly</li>
              <li>You can now access all protected routes</li>
              <li>Visit <code>/dashboard</code> to see the main dashboard</li>
              <li>When ready for production, remove <code>DEV_DAL_BYPASS</code> from .env.local</li>
            </ul>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">❌ Authentication Test - FAILED</h1>
        
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Authentication Error:</strong>
          <pre className="mt-2 text-sm">{error instanceof Error ? error.message : String(error)}</pre>
        </div>

        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <strong>Troubleshooting:</strong>
          <ul className="list-disc list-inside mt-2">
            <li>Check that <code>DEV_DAL_BYPASS=true</code> in your .env.local</li>
            <li>Restart your development server</li>
            <li>Check the console for error messages</li>
          </ul>
        </div>
      </div>
    );
  }
}