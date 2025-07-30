
import Image from 'next/image';
import { LoginForm } from '@/components/login-form';
import { getUsers, getSettings, getWiseWords } from '@/lib/data';
import { PinnedQuotesClient } from '@/components/pinned-quotes';

export default async function LoginPage() {
  const users = await getUsers();
  const settings = await getSettings();
  const pinnedQuotes = await getWiseWords().then(words => words.filter(w => w.pinned));

  const displayedUsers = settings.maintenanceMode 
    ? users.filter(u => u.role === 'admin') 
    : users;

  return (
    <div className="relative min-h-screen w-full lg:grid lg:grid-cols-4">
      {/* Background Image for Mobile */}
      <div className="absolute inset-0 lg:hidden">
         <Image
          src={settings.loginImageUrl}
          alt="Background"
          fill
          style={{objectFit: "cover"}}
          className="opacity-50"
          data-ai-hint="friends group"
        />
        <div className="absolute inset-0 bg-background/30"></div>
      </div>
      
      {/* Login Form Section */}
      <div className="relative flex items-center justify-center min-h-screen p-8 lg:col-span-1">
        <LoginForm users={displayedUsers} maintenanceMode={settings.maintenanceMode} />
      </div>

      {/* Image Section for Desktop */}
      <div className="hidden lg:block lg:col-span-3 relative">
        <Image
          src={settings.loginImageUrl}
          alt="Image"
          fill
          style={{objectFit: "cover"}}
          data-ai-hint="friends group"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-background" />
         <PinnedQuotesClient quotes={pinnedQuotes} />
      </div>
    </div>
  );
}
