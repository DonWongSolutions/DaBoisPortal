
import Image from 'next/image';
import { LoginForm } from '@/components/login-form';
import { getUsers, getSettings, getWiseWords } from '@/lib/data';

function PinnedQuotes() {
    return (
        <div className="absolute bottom-8 right-8 text-white p-6 rounded-lg max-w-md bg-black/50 backdrop-blur-sm hidden lg:block">
            <h3 className="text-xl font-bold mb-4">Words of Wisdom</h3>
            <div className="space-y-4">
                {/* This will be populated by a client component */}
            </div>
        </div>
    )
}

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
         {pinnedQuotes.length > 0 && (
            <div className="absolute bottom-8 right-8 text-white p-6 rounded-lg max-w-md bg-black/50 backdrop-blur-sm hidden lg:block">
                <h3 className="text-xl font-bold mb-4">Words of Wisdom</h3>
                <div className="space-y-4">
                    {pinnedQuotes.map(quote => (
                        <blockquote key={quote.id} className="border-l-2 border-primary pl-4">
                            <p className="italic">"{quote.phrase}"</p>
                            <footer className="text-sm opacity-80 mt-1">~ {quote.author}</footer>
                        </blockquote>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
