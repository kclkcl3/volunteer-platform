import Link from 'next/link';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-8 px-6">
        <div className="flex items-center gap-3 text-primary">
          <GraduationCap className="h-9 w-9" />
          <span className="text-lg font-semibold">UniHelp</span>
        </div>
        <div className="max-w-3xl">
          <h1 className="text-5xl font-semibold tracking-tight md:text-7xl">Student task exchange for university teams</h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            Publish study tasks, respond by skills, choose helpers, manage the workflow and keep ratings transparent without payments.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/register"><Button>Join platform <ArrowRight className="h-4 w-4" /></Button></Link>
          <Link href="/login"><Button className="border bg-background text-foreground">Log in</Button></Link>
        </div>
      </section>
    </main>
  );
}
