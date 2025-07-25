
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { loginAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { User } from '@/lib/types';
import { Icons } from './icons';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Log In
    </Button>
  );
}

export function LoginForm({ users }: { users: User[] }) {
  const initialState = { message: null };
  const [state, dispatch] = useActionState(loginAction, initialState);

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
            <Icons.Logo className="h-12 w-12 text-primary"/>
        </div>
        <CardTitle className="text-3xl font-bold">Da Bois Portal</CardTitle>
        <CardDescription>Welcome back, please log in to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={dispatch} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Member</Label>
            <Select name="name" required>
              <SelectTrigger id="name" className="w-full">
                <SelectValue placeholder="Select a member" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.name}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {state?.message && (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Login Failed</AlertTitle>
                <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
