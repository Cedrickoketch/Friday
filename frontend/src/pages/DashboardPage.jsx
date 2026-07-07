import { useState, useEffect, } from 'react'
import TopBar from '../components/dashboard/TopBar'
import NewsPanel from '../components/news/NewsPanel'
import TasksPanel from '../components/tasks/TasksPanel'
import CalendarPanel from '../components/calendar/CalendarPanel'
import ChatDrawer from '../components/chat/ChatDrawer'
import { useChatStore } from '../store/chatStore'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import axios from 'axios'

export default function DashboardPage() {
  const { toggle } = useChatStore()
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();

  // Get the ?upgrade=success parameter safely
  const upgrade = searchParams.get('upgrade');
  
  const fetchUserData = async () => {
    const res = await axios.get('/api/accounts/user/profile/');
    setUser(res.data);
  };

  // 1. Function to refresh profile from Django database
  const refreshUserStatus = async () => {
    try {
      const accessToken = localStorage.getItem('access_token'); // Or wherever you store your JWT token
      const res = await fetch('http://localhost:8000/api/auth/profile/', { // Replace with your exact route
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const freshUserData = await res.json();
        const pendingTier = sessionStorage.getItem('test_upgrade_tier')
        if (pendingTier) {
          freshUserData.tier = pendingTier
        }
        setUser(freshUserData); // Saves the upgraded tier (e.g., 'pro' or 'premium') to state
      }
    } catch (error) {
      console.error("Failed to fetch fresh user status", error);
    }
  };

  useEffect(() => {
    // Initial fetch when mounting dashboard

    const urlParams = new URLSearchParams(window.location.search);
    const upgradeStatus = urlParams.get('upgrade');

    if (upgradeStatus === 'success') {
      alert("Upgrade initiated!")
      // 1. Grab the tier directly out of the URL parameter
      const rawTier = urlParams.get('tier') || 'pro'; 
      sessionStorage.setItem('test_upgrade_tier', rawTier)
      // 2. Direct-inject it straight into your global store state 
      // (This forces TopBar to update instantly without waiting on a broken DB path)
      setUser({ ...user, tier: rawTier });

      const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: cleanUrl }, '', cleanUrl);

      refreshUserStatus()
    } else {
      refreshUserStatus()
    }

    setTimeout(() => {
      refreshUserStatus()
    }, 600)
  }, []);


  return (
    <div className="h-screen flex flex-col bg-gray-950">
      <TopBar />

      {/* Main 3-column grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-2 max-w-(--breakpoint-2xl) mx-auto w-full h-screen">
        {/* Left — News */}
        <section className="lg:col-span-1 flex flex-col gap-4">
          <NewsPanel />
        </section>

        {/* Centre — Logo (click to open chat) + Calendar */}
        <section className="lg:col-span-1 flex flex-col items-center gap-4">
          <img src="/src/assets/Friday-logo.svg" alt="Friday Logo" className="w-20 h-20 cursor-pointer" onClick={toggle} />
          <CalendarPanel />
        </section>

        {/* Right — Tasks */}
        <section className="lg:col-span-1 flex flex-col gap-4">
          <TasksPanel />
        </section>
      </main>

      {/* Chat drawer — slides in from the bottom */}
      <ChatDrawer />
    </div>
  )
}
