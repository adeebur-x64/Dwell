export default function OverviewPage() {
  return (
    <main className="flex flex-col w-full h-[calc(100vh-40px)] p-5 mt-5 mb-5 mr-5 align-center rounded-4xl bg-(--md-sys-color-surface-container)">
        <header className="flex flex-col align-center justify-items-center p-4 rounded-2xl bg-(--md-sys-color-surface-container-high)">
          <h1 className="text-4xl uppercase font-semibold text-(--md-sys-color-tertiary)">
            Your Overview
          </h1>
          <p className="ml-1 text-(--md-sys-color-on-surface-variant) text-sm">
            Have a quick oversight on where you&apos;re spending your time while
            using your computer.
          </p>
        </header>
        <hr className="h-px mt-4 mb-4 border-0 bg-(--md-sys-color-primary) rounded" />
        <div className="flex flex-col align-center justify-items-center h-full p-8 rounded-2xl bg-(--md-sys-color-surface-container-high)">
          <h1 className="text-3xl uppercase font-semibold text-(--md-sys-color-secondary) mb-3">
            Total Time Spent
          </h1>
          <h2 className="text-6xl uppercase font-bold text-(--md-sys-color-primary)">
            Coming Soon
          </h2>
        </div>
      </main>
  );
}
