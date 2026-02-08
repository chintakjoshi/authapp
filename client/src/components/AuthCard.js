import React from 'react';

function AuthCard({
  title,
  children,
  bottomContent,
  badge = 'Secure Access',
  headline = 'Confident authentication with a faster, clearer experience.',
  description = 'Reduced friction, stronger visual hierarchy, and better accessibility across every screen size.',
  points = ['Trusted session handling', 'Consistent cross-device layout', 'Clean visual hierarchy'],
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4.25rem)] w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="ui-card grid w-full overflow-hidden md:grid-cols-[1.03fr_1fr]">
        <aside className="relative hidden min-h-full flex-col justify-between overflow-hidden bg-[linear-gradient(155deg,#0f6ec6_0%,#0f7ec6_48%,#11a399_100%)] p-8 text-white md:flex">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-black/20 blur-2xl" />
          <div className="relative space-y-4">
            <p className="inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em]">
              {badge}
            </p>
            <h1 className="ui-display max-w-sm text-3xl font-semibold leading-tight">
              {headline}
            </h1>
            <p className="max-w-sm text-sm text-white/85">
              {description}
            </p>
            <ul className="space-y-2 pt-2 text-sm text-white/90">
              {points.slice(0, 3).map((item) => (
                <li key={item} className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative text-xs text-white/80">
            Modernized UX with unchanged backend workflows.
          </div>
        </aside>

        <section className="bg-[color-mix(in_srgb,var(--bg-surface)_92%,transparent)] p-5 sm:p-8 lg:p-10">
          <div className="mb-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-soft)] p-4 md:hidden">
            <p className="inline-flex rounded-full bg-[var(--brand-primary)]/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
              {badge}
            </p>
            <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">{headline}</p>
          </div>
          {title && (
            <div className="mb-6">
              <h2 className="ui-display text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                {title}
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Complete the form below to continue.
              </p>
            </div>
          )}
          {children}
          {bottomContent && (
            <div className="mt-6 border-t border-[var(--border-default)] pt-4 text-center text-sm text-[var(--text-secondary)]">
              {bottomContent}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default AuthCard;
