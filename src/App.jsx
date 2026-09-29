 
import { useState } from 'react' 
import { supabase } from './lib/supabase' 
import backgroundImage from './assets/artist.jpg' 
import LandingPage from './LandingPage' 
 
function App() { 
  const [isSignUp, setIsSignUp] = useState(false) 
  const [fullName, setFullName] = useState('') 
  const [email, setEmail] = useState('') 
  const [password, setPassword] = useState('') 
  const [message, setMessage] = useState('') 
  const [loading, setLoading] = useState(false) 
  const [currentPage, setCurrentPage] = useState('landing') 
 
  const openSignUp = () => {
  setIsSignUp(true)
  setMessage('')
  setCurrentPage('auth')
}

const openLogin = () => {
  setIsSignUp(false)
  setMessage('')
  setCurrentPage('auth')
}
 
  const handleSubmit = async (e) => { 
    e.preventDefault() 
    setMessage('') 
    setLoading(true) 
 
    try { 
      if (isSignUp) { 
        const { error } = await supabase.auth.signUp({ 
          email, 
          password, 
          options: { 
            data: { 
              full_name: fullName, 
            }, 
          }, 
        }) 
 
        if (error) throw error 
 
        setMessage('Account created! Please check your email to verify your account.') 
      } else { 
        const { error } = await supabase.auth.signInWithPassword({ 
          email, 
          password, 
        }) 
 
        if (error) throw error 
 
        setMessage('Login successful!') 
      } 
    } catch (error) { 
      setMessage(error.message) 
    } finally { 
      setLoading(false) 
    } 
  } 

  if (currentPage === 'landing') {
  return (
    <LandingPage
      onGetStarted={openSignUp}
      onLogin={openLogin}
    />
  )
}
 
  return ( 
    <div className="min-h-screen bg-[#0b0b0d] text-white lg:grid lg:grid-cols-2"> 
 
      {/* Left visual section */} 
      <div className="relative hidden min-h-screen overflow-hidden lg:block"> 
        <img 
          src={backgroundImage} 
          alt="Tattoo artist working on a tattoo" 
          className="absolute inset-0 h-full w-full object-cover opacity-60" 
        /> 
 
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" /> 
 
        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16"> 
          <div className="flex items-center gap-3"> 
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600 text-xl font-bold"> 
              T 
            </div> 
            <span className="text-xl font-bold tracking-wide"> 
              TATTOO<span className="text-purple-400">SHOP</span> 
            </span> 
          </div> 
 
          <div className="max-w-lg"> 
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-purple-300"> 
              Art that stays with you 
            </p> 
 
            <h1 className="text-5xl font-bold leading-tight xl:text-6xl"> 
              Your story. 
              <br /> 
              Your skin. 
              <br /> 
              <span className="text-purple-400">Your art.</span> 
            </h1> 
 
            <p className="mt-6 max-w-md text-lg leading-relaxed text-gray-300"> 
              Discover unique tattoo designs and book your next appointment 
              with ease. 
            </p> 
 
            <div className="mt-10 flex items-center gap-3"> 
              <div className="h-1 w-12 rounded-full bg-purple-500" /> 
              <span className="text-sm text-gray-400"> 
                Designed for self-expression 
              </span> 
            </div> 
          </div> 
 
          <p className="text-sm text-gray-400"> 
            © 2026 TattooShop. All rights reserved. 
          </p> 
        </div> 
      </div> 
 
      {/* Right authentication section */} 
      <div className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10"> 
        <div className="w-full max-w-md"> 
 
          {/* Mobile logo */} 
          <div className="mb-10 flex items-center justify-center gap-3 lg:hidden"> 
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-lg font-bold"> 
              T 
            </div> 
            <span className="text-xl font-bold tracking-wide"> 
              TATTOO<span className="text-purple-400">SHOP</span> 
            </span> 
          </div> 
 
          <div className="mb-8"> 
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-purple-400"> 
              {isSignUp ? 'Join our community' : 'Welcome back'} 
            </p> 
 
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl"> 
              {isSignUp ? 'Create your account' : 'Sign in to your account'} 
            </h2> 
 
            <p className="mt-3 text-gray-400"> 
              {isSignUp 
                ? 'Create an account to start your tattoo journey.' 
                : 'Enter your details to access your account.'} 
            </p> 
          </div> 
 
          {/* Form */} 
          <form onSubmit={handleSubmit} className="space-y-5"> 
 
            {isSignUp && ( 
              <div> 
                <label className="mb-2 block text-sm font-medium text-gray-300"> 
                  Full Name 
                </label> 
 
                <input 
                  type="text" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  placeholder="John Doe" 
                  required 
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-white placeholder-gray-600 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20" 
                /> 
              </div> 
            )} 
 
            <div> 
              <label className="mb-2 block text-sm font-medium text-gray-300"> 
                Email Address 
              </label> 
 
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="you@example.com" 
                required 
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-white placeholder-gray-600 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20" 
              /> 
            </div> 
 
            <div> 
              <label className="mb-2 block text-sm font-medium text-gray-300"> 
                Password 
              </label> 
 
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Enter your password" 
                minLength={6} 
                required 
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-white placeholder-gray-600 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20" 
              /> 
            </div> 
 
            {message && ( 
              <div 
                className={`rounded-xl border p-4 text-sm ${ 
                  message.toLowerCase().includes('successful') || 
                  message.toLowerCase().includes('created') 
                    ? 'border-green-500/20 bg-green-500/10 text-green-300' 
                    : 'border-red-500/20 bg-red-500/10 text-red-300' 
                }`} 
              > 
                {message} 
              </div> 
            )} 
 
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full rounded-xl bg-purple-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50" 
            > 
              {loading 
                ? 'Please wait...' 
                : isSignUp 
                  ? 'Create Account' 
                  : 'Sign In'} 
            </button> 
          </form> 
 
          {/* Switch form */} 
          <div className="mt-8 text-center text-sm text-gray-400"> 
            {isSignUp 
              ? 'Already have an account?' 
              : "Don't have an account?"} 
 
            <button 
              type="button" 
              onClick={() => { 
                setIsSignUp(!isSignUp) 
                setMessage('') 
              }} 
              className="ml-2 font-semibold text-purple-400 transition hover:text-purple-300" 
            > 
              {isSignUp ? 'Sign In' : 'Create Account'} 
            </button> 
          </div> 
 
          <p className="mt-10 text-center text-xs leading-relaxed text-gray-600"> 
            By continuing, you agree to our Terms of Service and Privacy Policy. 
          </p> 
        </div> 
      </div> 
    </div> 
  ) 
} 
 
export default App 
 