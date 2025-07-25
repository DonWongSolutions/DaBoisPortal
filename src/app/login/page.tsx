
import Image from 'next/image';
import { LoginForm } from '@/components/login-form';
import { getUsers, getSettings } from '@/lib/data';

export default async function LoginPage() {
  const users = await getUsers();
  const settings = await getSettings();

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <LoginForm users={users} />
        </div>
      </div>
      <div className="hidden bg-muted lg:block relative">
        <Image
          src={settings.loginImageUrl}
          alt="Image"
          width="1920"
          height="1080"
          className="h-full w-full object-cover"
          data-ai-hint="friends group"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-background/80 to-background"></div>
      </div>
    </div>
  );
}
