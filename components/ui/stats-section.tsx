import Image from 'next/image'

export default function StatsSection() {
  return (
    <section className="py-16 md:py-32">
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-12">
        <div className="relative z-10 max-w-xl space-y-6">
          <h2 className="text-4xl font-medium lg:text-5xl">
            Your Meetings, Summarized Instantly
          </h2>
          <p>
            Upload, summarize, edit, and share—all in one place for your team.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 md:gap-12 lg:gap-24">
          <div>
            <p>
              Save hours on manual note-taking and sharing with AI-powered summaries.
            </p>
            <div className="mb-12 mt-12 grid grid-cols-2 gap-2 md:mb-0">
              <div className="space-y-4">
                <div className="bg-linear-to-r from-zinc-950 to-zinc-600 bg-clip-text text-5xl font-bold text-transparent dark:from-white dark:to-zinc-800">
                  +1200
                </div>
                <p>Summaries Generated</p>
              </div>
              <div className="space-y-4">
                <div className="bg-linear-to-r from-zinc-950 to-zinc-600 bg-clip-text text-5xl font-bold text-transparent dark:from-white dark:to-zinc-800">
                  +500
                </div>
                <p>Teams Sharing Notes</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <blockquote className="border-l-4 pl-4">
              <p>
                Using TailsUI has been like unlocking a secret design superpower. It&apos;s the perfect fusion of simplicity and versatility, enabling us to create UIs that are as stunning as they are user-friendly.
              </p>
              <div className="mt-6 space-y-3">
                <cite className="block font-medium">John Doe, CEO</cite>
                <Image
                  className="h-5 w-fit dark:invert"
                  src="https://html.tailus.io/blocks/customers/nvidia.svg"
                  alt="Nvidia Logo"
                  height={20}
                  width={80}
                />
              </div>
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  )
}