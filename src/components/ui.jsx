/* eslint-disable react-refresh/only-export-components */
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function Button({ className, variant = 'primary', size = 'md', children, ...props }) {
    const variants = {
        primary: 'bg-primary text-white hover:bg-primary-dark shadow-[0_18px_36px_-22px_rgba(10,63,55,0.8)]',
        secondary: 'bg-secondary text-white hover:bg-secondary/90 shadow-[0_18px_34px_-22px_rgba(184,109,47,0.82)]',
        outline: 'border border-primary/25 bg-white/55 text-primary-dark hover:border-primary/45 hover:bg-primary-light/70',
        ghost: 'text-primary-dark hover:bg-primary-dark/5',
        danger: 'bg-red-600 text-white hover:bg-red-700 shadow-[0_18px_34px_-24px_rgba(185,28,28,0.8)]',
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-2.5 text-base',
        lg: 'px-7 py-3.5 text-base sm:text-lg',
    };

    return (
        <button
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-full font-display font-semibold tracking-tight transition-all duration-300 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none',
                'focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-secondary/55',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}

export function Card({ className, children, ...props }) {
    return (
        <div
            className={cn(
                'venue-panel overflow-hidden rounded-[2rem] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_30px_90px_-56px_rgba(52,39,21,0.72)]',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function Badge({ className, variant = 'green', children }) {
    const variants = {
        green: 'bg-primary-light text-primary-dark ring-primary/15',
        orange: 'bg-secondary-light text-orange-900 ring-secondary/20',
        gray: 'bg-stone-100 text-stone-700 ring-stone-200',
        red: 'bg-red-50 text-red-700 ring-red-200',
    };

    return (
        <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1', variants[variant], className)}>
            {children}
        </span>
    );
}

export function Pagination({ currentPage, totalPages, onPageChange }) {
    const safeTotalPages = Number.isFinite(totalPages) && totalPages > 0
        ? Math.floor(totalPages)
        : 1;
    const safeCurrentPage = Math.min(Math.max(currentPage, 1), safeTotalPages);

    const buildPageItems = () => {
        if (safeTotalPages <= 7) {
            return Array.from({ length: safeTotalPages }, (_, index) => index + 1);
        }

        const pages = new Set([1, safeTotalPages]);

        for (let page = safeCurrentPage - 1; page <= safeCurrentPage + 1; page += 1) {
            if (page > 1 && page < safeTotalPages) {
                pages.add(page);
            }
        }

        const sortedPages = Array.from(pages).sort((a, b) => a - b);
        const items = [];

        sortedPages.forEach((page, index) => {
            items.push(page);

            const nextPage = sortedPages[index + 1];
            if (nextPage && nextPage - page > 1) {
                items.push(`ellipsis-${page}`);
            }
        });

        return items;
    };

    const pageItems = buildPageItems();

    return (
        <div className="flex items-center justify-between border-t border-stone-200/70 bg-stone-50/80 px-4 py-3">
            <div className="flex flex-1 justify-between sm:hidden">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
                    disabled={safeCurrentPage === 1}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.min(safeTotalPages, safeCurrentPage + 1))}
                    disabled={safeCurrentPage === safeTotalPages}
                >
                    Next
                </Button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-stone-700">
                        Page <span className="font-medium">{safeCurrentPage}</span> of <span className="font-medium">{safeTotalPages}</span>
                    </p>
                </div>
                <div>
                    <nav className="relative inline-flex overflow-hidden rounded-full border border-stone-200 bg-white shadow-sm" aria-label="Pagination">
                        <button
                            onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
                            disabled={safeCurrentPage === 1}
                            className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <span className="sr-only">Previous</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </button>
                        {pageItems.map((item) => {
                            if (typeof item === 'string') {
                                return (
                                    <span
                                        key={item}
                                        className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-stone-400"
                                    >
                                        ...
                                    </span>
                                );
                            }

                            return (
                                <button
                                    key={item}
                                    onClick={() => onPageChange(item)}
                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium transition-colors ${safeCurrentPage === item
                                        ? 'bg-primary text-white'
                                        : 'text-stone-500 hover:bg-stone-50'
                                        }`}
                                >
                                    {item}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => onPageChange(Math.min(safeTotalPages, safeCurrentPage + 1))}
                            disabled={safeCurrentPage === safeTotalPages}
                            className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <span className="sr-only">Next</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    );
}

export function Input({ className, ...props }) {
    return (
        <input
            className={cn(
                'w-full rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-stone-900 outline-none transition-all placeholder:text-stone-400 focus:border-primary/50 focus:bg-white focus:ring-4 focus:ring-primary/10',
                className
            )}
            {...props}
        />
    );
}
