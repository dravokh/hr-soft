import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, PlusCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Ticket, TicketPriority, TicketStatus } from '../types';

interface TicketsPageProps {
  language: 'ka' | 'en';
}

const COPY: Record<TicketsPageProps['language'], {
  title: string;
  subtitle: string;
  stats: { open: string; inProgress: string; resolved: string };
  formTitle: string;
  titleLabel: string;
  descriptionLabel: string;
  priorityLabel: string;
  submit: string;
  submitting: string;
  required: string;
  success: string;
  noPermission: string;
  genericError: string;
  tableTitle: string;
  empty: string;
  createdBy: string;
  assignedTo: string;
  updated: string;
  status: string;
  priorityInfo: string;
}> = {
  ka: {
    title: 'მოთხოვნების თიკეტები',
    subtitle: 'მართეთ თანამშრომლების მოთხოვნები, აკონტროლეთ სტატუსები და პრიორიტეტები.',
    stats: {
      open: 'ღია თიკეტები',
      inProgress: 'მუშაობის პროცესში',
      resolved: 'დასრულებული თიკეტები'
    },
    formTitle: 'ახალი თიკეტის შექმნა',
    titleLabel: 'სათაური',
    descriptionLabel: 'აღწერა',
    priorityLabel: 'პრიორიტეტი',
    submit: 'თიკეტის დამატება',
    submitting: 'ინახება…',
    required: 'გთხოვთ, შეავსოთ ყველა ველი.',
    success: 'თიკეტი წარმატებით შეიქმნა.',
    noPermission: 'თქვენ არ გაქვთ ახალი თიკეტის შექმნის უფლება.',
    genericError: 'დაფიქსირდა შეცდომა, სცადეთ თავიდან.',
    tableTitle: 'აქტიური თიკეტები',
    empty: 'ჯერ არცერთი თიკეტი არ არის შექმნილი.',
    createdBy: 'შემქმნელი',
    assignedTo: 'მექალმე',
    updated: 'განახლდა',
    status: 'სტატუსი',
    priorityInfo: 'პრიორიტეტის შეცვლა შესაძლებელია მხოლოდ შესაბამისი ნებართვის მქონე მომხმარებლებისთვის.'
  },
  en: {
    title: 'Service Tickets',
    subtitle: 'Track employee requests, monitor statuses, and manage priorities.',
    stats: {
      open: 'Open tickets',
      inProgress: 'In progress',
      resolved: 'Resolved tickets'
    },
    formTitle: 'Create a new ticket',
    titleLabel: 'Title',
    descriptionLabel: 'Description',
    priorityLabel: 'Priority',
    submit: 'Add ticket',
    submitting: 'Saving…',
    required: 'Please complete every field.',
    success: 'Ticket created successfully.',
    noPermission: 'You do not have permission to create tickets.',
    genericError: 'Something went wrong. Please try again.',
    tableTitle: 'Active tickets',
    empty: 'No tickets have been created yet.',
    createdBy: 'Created by',
    assignedTo: 'Assigned to',
    updated: 'Updated',
    status: 'Status',
    priorityInfo: 'Only roles with permission can adjust ticket priority.'
  }
};

const STATUS_LABELS: Record<TicketStatus, { ka: string; en: string; icon: React.ReactNode; color: string }> = {
  open: {
    ka: 'ღია',
    en: 'Open',
    icon: <Clock3 className="w-4 h-4" />,
    color: 'bg-amber-100 text-amber-700'
  },
  in_progress: {
    ka: 'მიმდინარე',
    en: 'In progress',
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'bg-blue-100 text-blue-700'
  },
  resolved: {
    ka: 'დასრულებული',
    en: 'Resolved',
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'bg-emerald-100 text-emerald-700'
  }
};

const PRIORITY_LABELS: Record<TicketPriority, { ka: string; en: string; color: string }> = {
  low: { ka: 'დაბალი', en: 'Low', color: 'bg-slate-100 text-slate-600' },
  medium: { ka: 'საშუალო', en: 'Medium', color: 'bg-sky-100 text-sky-600' },
  high: { ka: 'მაღალი', en: 'High', color: 'bg-rose-100 text-rose-600' }
};

const STATUS_FLOW: TicketStatus[] = ['open', 'in_progress', 'resolved'];

export const TicketsPage: React.FC<TicketsPageProps> = ({ language }) => {
  const { tickets, saveTickets, users, currentUser, hasPermission } = useAppContext();
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'medium' as TicketPriority });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const t = COPY[language];
  const canCreate = hasPermission('create_tickets') && Boolean(currentUser);
  const canUpdate = hasPermission('update_tickets');
  const canSetPriority = hasPermission('set_ticket_priority');

  useEffect(() => {
    if (!canSetPriority && formData.priority !== 'medium') {
      setFormData((previous) => ({ ...previous, priority: 'medium' }));
    }
  }, [canSetPriority, formData.priority]);

  const statusCounts = useMemo(() => {
    return tickets.reduce(
      (acc, ticket) => {
        acc[ticket.status] += 1;
        return acc;
      },
      { open: 0, in_progress: 0, resolved: 0 } as Record<TicketStatus, number>
    );
  }, [tickets]);

  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [tickets]);

  const userLookup = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);

  const resetForm = () => {
    setFormData({ title: '', description: '', priority: 'medium' });
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!canCreate || !currentUser) {
      setError(t.noPermission);
      return;
    }

    const title = formData.title.trim();
    const description = formData.description.trim();
    const priority = (canSetPriority ? formData.priority : 'medium') as TicketPriority;

    if (!title || !description) {
      setError(t.required);
      return;
    }

    const now = new Date().toISOString();
    const nextId = tickets.reduce((max, ticket) => Math.max(max, ticket.id), 0) + 1;

    const hrUser = users.find((user) => user.roleId === 2) ?? null;

    const newTicket: Ticket = {
      id: nextId,
      title,
      description,
      status: 'open',
      priority,
      createdById: currentUser.id,
      assignedToId: hrUser?.id ?? null,
      createdAt: now,
      updatedAt: now
    };

    setIsSubmitting(true);

    try {
      await saveTickets([newTicket, ...tickets]);
      setSuccess(t.success);
      resetForm();
    } catch (submitError) {
      console.error('Unable to create ticket', submitError);
      setError(t.genericError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const advanceStatus = async (ticket: Ticket) => {
    if (!canUpdate) {
      return;
    }

    const currentIndex = STATUS_FLOW.indexOf(ticket.status);
    if (currentIndex === -1) {
      return;
    }
    const nextStatus = STATUS_FLOW[Math.min(currentIndex + 1, STATUS_FLOW.length - 1)];

    if (nextStatus === ticket.status) {
      return;
    }

    const updatedTickets = tickets.map((candidate) =>
      candidate.id === ticket.id ? { ...candidate, status: nextStatus, updatedAt: new Date().toISOString() } : candidate
    );

    try {
      await saveTickets(updatedTickets);
    } catch (updateError) {
      console.error('Unable to advance ticket status', updateError);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">{t.title}</h1>
        <p className="text-slate-600 mt-2">{t.subtitle}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {(['open', 'in_progress', 'resolved'] as TicketStatus[]).map((status) => {
          const icon =
            status === 'resolved' ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            ) : status === 'in_progress' ? (
              <AlertCircle className="w-10 h-10 text-blue-500" />
            ) : (
              <Clock3 className="w-10 h-10 text-amber-500" />
            );
          return (
            <div key={status} className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-600">{t.stats[status === 'in_progress' ? 'inProgress' : status]}</span>
                {icon}
              </div>
              <div className="text-4xl font-bold text-slate-800">{statusCounts[status]}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">{t.formTitle}</h2>
          <PlusCircle className="w-6 h-6 text-blue-500" />
        </div>

        {!canCreate ? (
          <p className="text-slate-500 text-sm">{t.noPermission}</p>
        ) : (
          <form className="grid gap-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700 mb-2" htmlFor="title">
                  {t.titleLabel}
                </label>
                <input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t.titleLabel}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700 mb-2" htmlFor="priority">
                  {t.priorityLabel}
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  disabled={!canSetPriority}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                >
                  {(Object.keys(PRIORITY_LABELS) as TicketPriority[]).map((priority) => (
                    <option key={priority} value={priority}>
                      {PRIORITY_LABELS[priority][language]}
                    </option>
                  ))}
                </select>
                {!canSetPriority ? (
                  <p className="mt-2 text-xs text-slate-500">{t.priorityInfo}</p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-2" htmlFor="description">
                {t.descriptionLabel}
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                placeholder={t.descriptionLabel}
              />
            </div>

            {error && <p className="text-sm text-rose-500">{error}</p>}
            {success && <p className="text-sm text-emerald-600">{success}</p>}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isSubmitting ? t.submitting : t.submit}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-800">{t.tableTitle}</h2>
          <span className="text-sm text-slate-500">{sortedTickets.length}</span>
        </div>

        {sortedTickets.length === 0 ? (
          <p className="text-slate-500 text-sm">{t.empty}</p>
        ) : (
          <div className="space-y-4">
            {sortedTickets.map((ticket) => {
              const statusCopy = STATUS_LABELS[ticket.status];
              const priorityCopy = PRIORITY_LABELS[ticket.priority];
              const creator = userLookup.get(ticket.createdById);
              const assignee = ticket.assignedToId ? userLookup.get(ticket.assignedToId) : null;

              return (
                <div key={ticket.id} className="border border-slate-200 rounded-xl p-5">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">{ticket.title}</h3>
                      <p className="text-sm text-slate-600 mb-4 whitespace-pre-line">{ticket.description}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>
                          {t.createdBy}: <strong className="text-slate-700">{creator?.name ?? '—'}</strong>
                        </span>
                        <span>
                          {t.assignedTo}: <strong className="text-slate-700">{assignee?.name ?? '—'}</strong>
                        </span>
                        <span>
                          {t.updated}: <strong className="text-slate-700">{new Date(ticket.updatedAt).toLocaleString(language === 'ka' ? 'ka-GE' : 'en-US')}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 min-w-[200px]">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${statusCopy.color}`}>
                        {statusCopy.icon}
                        {statusCopy[language]}
                      </span>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${priorityCopy.color}`}>
                        {PRIORITY_LABELS[ticket.priority][language]} {language === 'ka' ? 'პრიორიტეტი' : 'priority'}
                      </span>
                      {canUpdate && ticket.status !== 'resolved' && (
                        <button
                          type="button"
                          onClick={() => advanceStatus(ticket)}
                          className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition"
                        >
                          {language === 'ka' ? 'სტატუსის განახლება' : 'Advance status'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
