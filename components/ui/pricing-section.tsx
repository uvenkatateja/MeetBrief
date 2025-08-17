import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'

export default function Pricing() {
  return (
    <section className="py-16 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <h1 className="text-center text-4xl font-semibold lg:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p>
            Choose a plan that fits your team&apos;s meeting summary and sharing needs.
          </p>
        </div>
        <div className="mt-8 grid gap-6 md:mt-20 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="font-medium">Free</CardTitle>
              <span className="my-3 block text-2xl font-semibold">$0 / mo</span>
              <CardDescription className="text-sm">For individuals</CardDescription>
              <Button
                asChild
                variant="outline"
                className="mt-4 w-full"
              >
                <Link href="">Get Started</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <hr className="border-dashed" />
              <ul className="list-outside space-y-3 text-sm">
                {['AI Summaries (5/month)', 'Edit & Share', 'Email Support'].map((item, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2"
                  >
                    <Check className="size-3" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="relative">
            <span className="bg-linear-to-br/increasing absolute inset-x-0 -top-3 mx-auto flex h-6 w-fit items-center rounded-full from-purple-400 to-amber-300 px-3 py-1 text-xs font-medium text-amber-950 ring-1 ring-inset ring-white/20 ring-offset-1 ring-offset-gray-950/5">
              Popular
            </span>
            <CardHeader>
              <CardTitle className="font-medium">Pro</CardTitle>
              <span className="my-3 block text-2xl font-semibold">$19 / mo</span>
              <CardDescription className="text-sm">For teams</CardDescription>
              <Button
                asChild
                className="mt-4 w-full"
              >
                <Link href="">Get Started</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <hr className="border-dashed" />
              <ul className="list-outside space-y-3 text-sm">
                {[
                  'Everything in Free Plan',
                  'Unlimited Summaries',
                  'Team Collaboration',
                  'Priority Email Support',
                  'Export to Notion/Slack',
                  'Share via Email',
                  'Custom Prompts',
                  'Summary Editing',
                  'Action Item Extraction',
                  'Monthly Product Updates',
                  'Enhanced Security'
                ].map((item, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2"
                  >
                    <Check className="size-3" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="font-medium">Business</CardTitle>
              <span className="my-3 block text-2xl font-semibold">$29 / mo</span>
              <CardDescription className="text-sm">For organizations</CardDescription>
              <Button
                asChild
                variant="outline"
                className="mt-4 w-full"
              >
                <Link href="">Get Started</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <hr className="border-dashed" />
              <ul className="list-outside space-y-3 text-sm">
                {['Everything in Pro Plan', 'Admin Controls', 'Advanced Integrations'].map((item, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2"
                  >
                    <Check className="size-3" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}