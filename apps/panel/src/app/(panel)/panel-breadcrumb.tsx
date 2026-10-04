'use client'

import { usePathname, useRouter } from 'next/navigation';
import { Fragment } from 'react';
import { ArrowLeft, Box } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  villas: 'Villas',
  cuotas: 'Cuotas',
  registrar: 'Registrar',
  operaciones: 'Operaciones',
  pagos: 'Pagos',
  admin: 'Administración',
  outbox: 'Outbox',
}

const HOME_HREF = '/dashboard'

export function PanelBreadcrumb() {
  const pathname = usePathname()
  const router = useRouter()

  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) return null

  const onDashboard = pathname === HOME_HREF

  const items = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    const isLast = index === segments.length - 1
    const label = LABELS[segment] ?? segment

    return { href, label, isLast }
  })

  const parent = items.at(-2)

  const showBackButton = segments.length >= 2

  const handleBack = () => {
    if (parent) {
      router.push(parent.href)
    } else {
      router.back()
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      {/* `min-w-0 overflow-x-auto` para que una ruta larga scrollee en lugar de
          empujar el botón "Volver" fuera de la pantalla. */}
      <div className="min-w-0 overflow-x-auto">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            {onDashboard ? (
              <BreadcrumbPage className="inline-flex items-center gap-1.5 font-semibold">
                <Box size={20} />
                Dashboard
              </BreadcrumbPage>
            ) : (
              <BreadcrumbLink
                href={HOME_HREF}
                className="inline-flex items-center gap-1.5 font-normal"
              >
                <Box size={20} />
                Dashboard
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>

          {!onDashboard &&
            items.map((item) => (
              <Fragment key={item.href}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {item.isLast ? (
                    <BreadcrumbPage className='font-semibold'>{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink className='font-normal' href={item.href}>{item.label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
        </BreadcrumbList>
      </Breadcrumb>
      </div>

      <Button
        variant="link"
        onClick={handleBack}
        className={`shrink-0 self-start text-gray-500 sm:self-auto ${showBackButton ? "" : "invisible pointer-events-none"}`}
        aria-label={parent ? `Volver a ${parent.label}` : "Volver atrás"}
      >
        <ArrowLeft size={16} />
        {parent ? `Volver a ${parent.label}` : "Volver atrás"}
      </Button>
    </div>
  )
}
