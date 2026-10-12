import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import { StatusBadge } from '../../components/data-display/StatusBadge';
import { Button } from '../../components/ui/Button';
import { formatRelativeTime } from '../../lib/date';
import { ArrowRight } from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const projectStats = useMemo(() => projectService.getProjectStats(), []);

  return (
    <div className="space-y-5">
      {/* Page Heading */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
          Projects
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-0.5">
          Configured repositories monitored by GitLab CI/CD pipelines.
        </p>
      </div>

      {/* Simple Projects Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-2xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200/90 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-3.5 whitespace-nowrap">Project name</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Product</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Default branch</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap text-right">Total pipelines</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Latest pipeline status</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Last pipeline time</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projectStats.map(({ project, totalPipelines, latestPipeline }) => (
              <tr
                key={project.id}
                onClick={() => navigate(`/pipelines?project=${project.id}`)}
                className="cursor-pointer hover:bg-blue-50/50 transition-colors group"
              >
                <td className="py-2.5 px-3.5 whitespace-nowrap">
                  <div className="font-semibold text-slate-900 group-hover:text-blue-600">
                    {project.name}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {project.path}
                  </div>
                </td>
                <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-700">
                  {project.product}
                </td>
                <td className="py-2.5 px-3.5 whitespace-nowrap">
                  <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                    {project.defaultBranch}
                  </span>
                </td>
                <td className="py-2.5 px-3.5 whitespace-nowrap text-right font-mono text-slate-800 tabular-nums font-medium">
                  {totalPipelines}
                </td>
                <td className="py-2.5 px-3.5 whitespace-nowrap">
                  {latestPipeline ? (
                    <StatusBadge status={latestPipeline.status} size="xs" />
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-600">
                  {latestPipeline ? (
                    formatRelativeTime(latestPipeline.startedAt)
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td
                  className="py-2.5 px-3.5 whitespace-nowrap text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => navigate(`/pipelines?project=${project.id}`)}
                    className="hover:border-blue-300 hover:text-blue-600"
                    icon={<ArrowRight className="w-3 h-3" />}
                    iconPosition="right"
                  >
                    View Pipelines
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
