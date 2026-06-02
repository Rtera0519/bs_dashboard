interface TopNavBarProps {
  title: string;
}

export default function TopNavBar({ title }: TopNavBarProps) {
  return (
    <header className="flex justify-between items-center h-16 px-lg bg-surface border-b border-outline-variant shrink-0 w-full z-10 sticky top-0">
      <div>
        <h2 className="text-headline-md font-headline-md font-extrabold text-on-surface">{title}</h2>
      </div>
      <div className="flex items-center gap-md">
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-lowest transition-colors relative group">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border border-surface"></span>
        </button>
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-lowest transition-colors">
          <span className="material-symbols-outlined">help_outline</span>
        </button>
      </div>
    </header>
  );
}
