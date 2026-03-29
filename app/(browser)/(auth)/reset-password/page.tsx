'use client';

export const dynamic = 'force-dynamic';

import { ResetPasswordForm } from './_components/reset-password-form';
import Link from 'next/link';

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <img
            src="https://oumts6nefv.ufs.sh/f/xb97pP2S5jPKA88MmolnwCzebdg1UB72WJromvTPSKYiX9p5"
            alt="logo"
            className="w-30 py-4"
          />
        </Link>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
