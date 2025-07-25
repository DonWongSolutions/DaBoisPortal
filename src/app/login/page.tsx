
import Image from 'next/image';
import { LoginForm } from '@/components/login-form';
import { getUsers, getSettings } from '@/lib/data';

export default async function LoginPage() {
  const users = await getUsers();
  const settings = await getSettings();

  return (
    <div className="w-full lg:grid lg:grid-cols-4 h-screen">
      <div className="flex items-center justify-center py-12 lg:col-span-1">
        <div className="mx-auto grid w-[350px] gap-6">
          <LoginForm users={users} />
        </div>
      </div>
      <div className="hidden lg:block relative lg:col-span-3">
        <Image
          src={settings.loginImageUrl}
          alt="Image"
          fill
          style={{objectFit: "cover"}}
          data-ai-hint="friends group"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-background/30 via-background/80 to-background"></div>
      </div>
    </div>
  );
}
