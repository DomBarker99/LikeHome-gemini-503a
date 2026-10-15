import { useSyncExternalStore } from 'react'
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { getCurrentUserFn } from '@/server/functions'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'LikeHome — Find a place that feels like home',
      },
      {
        name: 'description',
        content:
          'Search over 3,000 hotels worldwide with interactive street maps, verified rates, and LikeHome Rewards.',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  loader: async () => {
    const session = await getCurrentUserFn()
    return {
      user: session?.user || null,
    }
  },
  shellComponent: RootDocument,
  component: RootComponent,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        {process.env.NODE_ENV !== 'production' && (
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        )}
        <Scripts />
      </body>
    </html>
  )
}

const emptySubscribe = () => () => {}
const useHydrated = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )

function RootComponent() {
  const data = Route.useLoaderData()
  const hydrated = useHydrated()

  return (
    <div
      data-hydrated={hydrated ? 'true' : undefined}
      className="min-h-screen flex flex-col bg-[var(--bg-page)] text-[var(--text-primary)]"
    >
      {/* Top Header */}
      <Header user={data.user} />

      {/* Centered 1120px Canvas flanked by subtle desktop rails */}
      <div className="flex-1 w-full relative">
        {/* Soft violet desktop decorative side rails */}
        <div className="hidden 2xl:block absolute inset-y-0 left-0 w-[calc((100vw-1120px)/2)] bg-[var(--bg-rail)]/15 border-r border-dashed border-[var(--border)] pointer-events-none" />
        <div className="hidden 2xl:block absolute inset-y-0 right-0 w-[calc((100vw-1120px)/2)] bg-[var(--bg-rail)]/15 border-l border-dashed border-[var(--border)] pointer-events-none" />

        <main className="max-w-[1120px] mx-auto px-4 py-8">
          <Outlet />
        </main>
      </div>

      {/* Global Footer */}
      <Footer />
    </div>
  )
}
