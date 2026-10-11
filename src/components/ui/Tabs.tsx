import { useRef, type KeyboardEvent } from 'react';

export interface TabItem<Id extends string> {
  id: Id;
  label: string;
}

interface TabsProps<Id extends string> {
  label: string;
  tabs: ReadonlyArray<TabItem<Id>>;
  active: Id;
  onChange: (id: Id) => void;
}

export const tabId = (id: string) => `tab-${id}`;
export const panelId = (id: string) => `panel-${id}`;

/** WAI-ARIA tabs with roving tabindex: arrows, Home and End move between tabs. */
export function Tabs<Id extends string>({ label, tabs, active, onChange }: TabsProps<Id>) {
  const listRef = useRef<HTMLDivElement>(null);

  function select(index: number) {
    const tab = tabs[(index + tabs.length) % tabs.length];
    if (!tab) return;
    onChange(tab.id);
    listRef.current?.querySelector<HTMLElement>(`#${tabId(tab.id)}`)?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = tabs.findIndex((tab) => tab.id === active);
    const targets: Record<string, number> = {
      ArrowRight: current + 1,
      ArrowLeft: current - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    const target = targets[event.key];
    if (target === undefined) return;
    event.preventDefault();
    select(target);
  }

  return (
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus -- focus lives on the tabs (roving tabindex)
    <div ref={listRef} className="tabs" role="tablist" aria-label={label} onKeyDown={handleKeyDown}>
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            id={tabId(tab.id)}
            type="button"
            role="tab"
            className="tabs__tab"
            aria-selected={selected}
            aria-controls={panelId(tab.id)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
