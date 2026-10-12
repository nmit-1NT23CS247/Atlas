import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    if (pathnames.length === 0 || pathnames[0] === 'overview') {
      return [{ label: 'Overview' }];
    }

    const items: BreadcrumbItem[] = [];

    if (pathnames[0] === 'pipelines') {
      items.push({ label: 'Pipelines', path: '/pipelines' });
      if (pathnames[1]) {
        items.push({ label: `#${pathnames[1]}` });
      }
    } else if (pathnames[0] === 'projects') {
      items.push({ label: 'Projects', path: '/projects' });
      if (pathnames[1]) {
        items.push({ label: pathnames[1] });
      }
    }

    return items;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs text-slate-500 font-medium">
      <Link
        to="/"
        className="flex items-center hover:text-blue-600 transition-colors p-1 -m-1 rounded"
        title="Overview"
      >
        <Home className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
        <span className="hidden sm:inline">Home</span>
      </Link>
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-300 shrink-0" />
            {isLast || !item.path ? (
              <span className="text-slate-800 font-semibold truncate max-w-[180px]">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.path}
                className="hover:text-blue-600 transition-colors truncate max-w-[140px]"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
