import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Settings01Icon,
  LockIcon,
  StarIcon,
  CheckmarkCircle02Icon,
  ArrowRight02Icon,
} from '@hugeicons/core-free-icons';

export default function Page() {
  return (
    <section className="py-32 w-full h-screen flex items-center justify-center">
      <div className="container mx-auto">
        <div className="absolute inset-0 top-0 -z-10 mx-auto w-full opacity-10"></div>

        <div className="flex items-center justify-center">
          <img
            src="https://oumts6nefv.ufs.sh/f/xb97pP2S5jPKA88MmolnwCzebdg1UB72WJromvTPSKYiX9p5"
            alt="logo"
            className="size-70"
          />
        </div>
        <h1 className="relative mx-auto mb-8 max-w-3xl flex-wrap text-center text-4xl font-semibold md:mb-10 md:text-6xl md:leading-snug">
          <span>The Open Source Kanban Built for Real Teams</span>
          <div className="absolute -top-10 -left-20 hidden w-fit -rotate-12 gap-1 border-b border-dashed border-muted-foreground text-sm font-normal text-muted-foreground underline-offset-3 lg:flex">
            <HugeiconsIcon icon={Settings01Icon} className="h-auto w-3" />
            Customizable
          </div>
          <div className="absolute top-14 -left-24 hidden w-fit -rotate-12 gap-1 border-b border-dashed border-muted-foreground text-sm font-normal text-muted-foreground underline-offset-3 lg:flex">
            <HugeiconsIcon icon={LockIcon} className="h-auto w-3" />
            Self-hostable
          </div>
          <div className="absolute -top-10 -right-24 hidden w-fit rotate-12 gap-1 border-b border-dashed border-muted-foreground text-sm font-normal text-muted-foreground underline-offset-3 lg:flex">
            Free forever
            <HugeiconsIcon icon={StarIcon} className="h-auto w-3" />
          </div>
          <div className="absolute top-14 -right-28 hidden w-fit rotate-12 gap-1 border-b border-dashed border-muted-foreground text-sm font-normal text-muted-foreground underline-offset-3 lg:flex">
            Open source
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              className="h-auto w-3"
            />
          </div>
        </h1>
        <p className="mx-auto mb-10 max-w-3xl text-center font-medium text-muted-foreground md:text-xl">
          A free, self-hostable project management board that gives your team
          full control no vendor lock-in, no hidden pricing, just clean and
          powerful task management.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 pt-3 pb-12">
          <Link href={'/login'}>
            <Button size={'lg'}  className="p-5 text-base cursor-pointer">
              <span>Get Started</span>
              <HugeiconsIcon
                icon={ArrowRight02Icon}
                className="transition-transform duration-300 group-hover/button:translate-x-1"
              />
            </Button>
          </Link>
          <div className="text-sm text-muted-foreground md:text-balance">
            Built with - Nextjs | TypeScript | Redux Toolkit | Supabase |
            Dnd-Kit
          </div>
        </div>
      </div>
    </section>
  );
}
