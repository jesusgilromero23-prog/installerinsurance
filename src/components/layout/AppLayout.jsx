import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Button } from "@/components/ui/button";
import { Menu, Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { differenceInDays, isPast } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { data: insurances = [] } = useQuery({
    queryKey: ['insurances-alerts'],
    queryFn: () => base44.entities.Insurance.list(),
  });
  
  const alertCount = insurances.filter(ins => {
    const expDate = new Date(ins.expiration_date);
    return isPast(expDate) || differenceInDays(expDate, new Date()) <= 30;
  }).length;
  
  return (
    <div className="min-h-screen bg-background font-inter">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="flex-1" />
            
            <Link to="/Alerts" className="relative">
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
              {alertCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                  {alertCount}
                </Badge>
              )}
            </Link>
          </div>
        </header>
        
        <main className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}