import { Button } from '@/components/ui/button';
import { ArrowRight02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

export default function Page() {
  return (
    <section className="py-32 w-full h-screen flex items-center justify-center">
      <div className="container mx-auto">
        <div
          className="absolute inset-0 top-0 -z-10 mx-auto w-full opacity-10"
          //   style='background-image: url("https://deifkwefumgah.cloudfront.net/shadcnblocks/block/patterns/grid3.svg"); background-repeat: repeat; mask-image: radial-gradient(80% 100% at 50% 30%, rgb(0, 0, 0) 40%, transparent 75%);'
        ></div>
        <h1 className="relative mx-auto mb-8 max-w-3xl flex-wrap text-center text-4xl font-semibold md:mb-10 md:text-6xl md:leading-snug">
          <span>The Open Source Kanban Built for Real Teams</span>
          <div className="absolute -top-10 -left-20 hidden w-fit -rotate-12 gap-1 border-b border-dashed border-muted-foreground text-sm font-normal text-muted-foreground underline-offset-3 lg:flex">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              className="lucide lucide-zap h-auto w-3"
              aria-hidden="true"
            >
              <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
            </svg>
            Self-Hostable
          </div>
          <div className="absolute top-14 -left-24 hidden w-fit -rotate-12 gap-1 border-b border-dashed border-muted-foreground text-sm font-normal text-muted-foreground underline-offset-3 lg:flex">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              className="lucide lucide-lock h-auto w-3"
              aria-hidden="true"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Self-hostable
          </div>
          <div className="absolute -top-10 -right-24 hidden w-fit rotate-12 gap-1 border-b border-dashed border-muted-foreground text-sm font-normal text-muted-foreground underline-offset-3 lg:flex">
            Free forever
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              className="lucide lucide-star h-auto w-3"
              aria-hidden="true"
            >
              <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path>
            </svg>
          </div>
          <div className="absolute top-14 -right-28 hidden w-fit rotate-12 gap-1 border-b border-dashed border-muted-foreground text-sm font-normal text-muted-foreground underline-offset-3 lg:flex">
            Open source
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              className="lucide lucide-circle-check h-auto w-3"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <path d="m9 12 2 2 4-4"></path>
            </svg>
          </div>
        </h1>
        <p className="mx-auto mb-10 max-w-3xl text-center font-medium text-muted-foreground md:text-xl">
          A free, self-hostable project management board that gives your team
          full control no vendor lock-in, no hidden pricing, just clean and
          powerful task management.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 pt-3 pb-12">
          <Button size={'lg'} className="group p-5 text-base cursor-pointer">
            <span>Get Started</span>
            <HugeiconsIcon
              icon={ArrowRight02Icon}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Button>
          <div className="text-sm text-muted-foreground md:text-balance">
            Built with - Nextjs & TypeScript
          </div>
        </div>
      </div>
    </section>
  );
}
