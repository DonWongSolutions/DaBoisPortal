
import Image from 'next/image';
import { LoginForm } from '@/components/login-form';
import { getUsers, getSettings } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';

export default async function LoginPage() {
  const users = await getUsers();
  const settings = await getSettings();

  return (
    <div className="w-full lg:grid lg:grid-cols-2 h-screen">
      <div className="flex items-center justify-center p-8">
        <LoginForm users={users} />
      </div>
      <div className="hidden lg:block relative">
        <Image
          src={settings.loginImageUrl}
          alt="Image"
          fill
          style={{objectFit: "cover"}}
          data-ai-hint="friends group"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-background/80 to-background"></div>
      </div>
    </div>
  );
}
