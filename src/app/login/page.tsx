
import Image from 'next/image';
import { LoginForm } from '@/components/login-form';
import { getUsers, getSettings } from '@/lib/data';

export default async function LoginPage() {
  const users = await getUsers();
  const settings = await getSettings();

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
        <LoginForm users={users} />
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
      </div>
    </div>
  );
}
