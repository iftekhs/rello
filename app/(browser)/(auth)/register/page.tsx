'use client';

export const dynamic = 'force-dynamic';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

const registerSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterFormData) {
    const { error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (signUpError) {
      if (signUpError.message.includes('User already registered')) {
        setError('email', {
          message: 'An account with this email already exists',
        });
      } else {
        setError('root', {
          message: signUpError.message,
        });
      }
      return;
    }

    router.push('/login');
    router.refresh();
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className={cn("flex flex-col gap-6")}>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Create an account</CardTitle>
              <CardDescription>
                Enter your email and password to register
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      {...register('email')}
                    />
                    {errors.email && (
                      <FieldDescription className="text-destructive">
                        {errors.email.message}
                      </FieldDescription>
                    )}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Min 8 characters"
                      {...register('password')}
                    />
                    {errors.password && (
                      <FieldDescription className="text-destructive">
                        {errors.password.message}
                      </FieldDescription>
                    )}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      {...register('confirmPassword')}
                    />
                    {errors.confirmPassword && (
                      <FieldDescription className="text-destructive">
                        {errors.confirmPassword.message}
                      </FieldDescription>
                    )}
                  </Field>
                  {errors.root && (
                    <FieldDescription className="text-destructive">
                      {errors.root.message}
                    </FieldDescription>
                  )}
                  <Field>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Creating account...' : 'Register'}
                    </Button>
                    <FieldDescription className="text-center">
                      Already have an account?{' '}
                      <a href="/login" className="text-primary hover:underline">
                        Sign in
                      </a>
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
          <FieldDescription className="px-6 text-center">
            By clicking continue, you agree to our{' '}
            <a href="/terms" className="text-primary hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </a>
            .
          </FieldDescription>
        </div>
      </div>
    </div>
  );
}
