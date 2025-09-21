import { AuthProvider, useAuth } from './hooks/useAuth'
import AuthForm from './components/AuthForm'
import ZettleLearningApp from './App-zettle-enhanced'

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthForm />;
  }

  return <ZettleLearningApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
